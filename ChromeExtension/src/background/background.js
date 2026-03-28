// ─────────────────────────────────────────────────────────────────────────────
// background.js
//
// FLOW:
//   content script → START_AUDIO_CAPTURE
//     → background gets streamId via tabCapture   (ONLY works in background)
//     → background creates offscreen doc
//     → offscreen signals OFFSCREEN_READY
//     → background sends RECORD_AUDIO + streamId to offscreen
//     → offscreen records and POSTs to backend
//     → offscreen sends LOG messages back so everything shows in THIS console
// ─────────────────────────────────────────────────────────────────────────────

let offscreenReady = false;

async function createOffscreen() {
  const exists = await chrome.offscreen.hasDocument();
  if (!exists) {
    offscreenReady = false;
    await chrome.offscreen.createDocument({
      url: "src/audio/offscreen1.html",
      reasons: ["AUDIO_PLAYBACK"],
      justification: "Recording tab audio"
    });
  }
}

chrome.runtime.onMessage.addListener((message, sender) => {

  // ── DEBUG BRIDGE: pipe all offscreen logs into background console ──────────
  // offscreen.js sends {action:"LOG", level, args} for every console call
  // so you can see everything in ONE place (the service worker console)
  if (message.action === "LOG") {
    const prefix = "[OFFSCREEN]";
    if      (message.level === "error") console.error(prefix, ...message.args);
    else if (message.level === "warn")  console.warn (prefix, ...message.args);
    else                                console.log  (prefix, ...message.args);
    return; // no return true needed
  }

  // ── Offscreen signals it is fully loaded and listening ────────────────────
  if (message.action === "OFFSCREEN_READY") {
    console.log("✅ Offscreen is ready");
    offscreenReady = true;
    return;
  }

  // ── Main: content script asks us to capture audio ─────────────────────────
  if (message.action === "START_AUDIO_CAPTURE") {

    console.log("🎯 START_AUDIO_CAPTURE from tab:", sender.tab?.id);

    const tabId    = sender.tab.id;
    const duration = message.duration;

    // STEP 1 ── Get streamId in background (the ONLY context where this works)
    chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, async (streamId) => {

      if (chrome.runtime.lastError) {
        console.error("❌ tabCapture error:", chrome.runtime.lastError.message);
        return;
      }
      if (!streamId) {
        console.error("❌ tabCapture returned empty streamId");
        return;
      }

      console.log("🎧 streamId obtained:", streamId);

      // STEP 2 ── Create offscreen document if not already open
      await createOffscreen();

      // STEP 3 ── Wait for offscreen to signal it is ready (no blind timeouts)
      await new Promise(resolve => {
        if (offscreenReady) { resolve(); return; }
        const poll = setInterval(() => {
          if (offscreenReady) { clearInterval(poll); resolve(); }
        }, 50);
        setTimeout(() => { clearInterval(poll); resolve(); }, 3000); // 3s hard cap
      });

      console.log("📨 Sending RECORD_AUDIO to offscreen...");

      // STEP 4 ── Send streamId to offscreen so it can call getUserMedia
      chrome.runtime.sendMessage({
        action:   "RECORD_AUDIO",
        streamId: streamId,
        duration: duration
      }).catch(err => {
        console.error("❌ Could not reach offscreen:", err.message);
      });
    });

    // intentionally no return true — we never call sendResponse()
  }
});