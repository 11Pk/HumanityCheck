// ─────────────────────────────────────────────────────────────────────────────
// background.js
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

  // ── DEBUG BRIDGE ──────────────────────────────────────────────────────────
  if (message.action === "LOG") {
    const prefix = "[OFFSCREEN]";
    if (message.level === "error") console.error(prefix, ...message.args);
    else if (message.level === "warn") console.warn(prefix, ...message.args);
    else console.log(prefix, ...message.args);
    return;
  }

  // ── Offscreen ready signal ────────────────────────────────────────────────
  if (message.action === "OFFSCREEN_READY") {
    console.log("✅ Offscreen is ready");
    offscreenReady = true;
    return;
  }

  // ── START AUDIO CAPTURE ───────────────────────────────────────────────────
  if (message.action === "START_AUDIO_CAPTURE") {

    console.log("🎯 START_AUDIO_CAPTURE from tab:", sender.tab?.id);

    const tabId = sender.tab.id;
    const duration = message.duration;

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

      // STEP 2 ── Create offscreen
      await createOffscreen();

      // STEP 3 ── Wait for offscreen ready
      await new Promise(resolve => {
        if (offscreenReady) {
          resolve();
          return;
        }

        const poll = setInterval(() => {
          if (offscreenReady) {
            clearInterval(poll);
            resolve();
          }
        }, 50);

        setTimeout(() => {
          clearInterval(poll);
          resolve();
        }, 3000);
      });

      console.log("📨 Sending RECORD_AUDIO to offscreen...");

      // STEP 4 ── Send to offscreen
      chrome.runtime.sendMessage({
        action: "RECORD_AUDIO",
        streamId: streamId,
        duration: duration
      }).catch(err => {
        console.error("❌ Could not reach offscreen:", err.message);
      });
    });
  }  // ✅ FIXED: properly closed START_AUDIO_CAPTURE block
});   // ✅ FIXED: properly closed listener


// ─────────────────────────────────────────────────────────────────────────────
// SECOND PART (UNCHANGED)
// ─────────────────────────────────────────────────────────────────────────────

let offscreenCreated = false;

async function ensureOffscreen() {
  if (offscreenCreated) return;

  const url = chrome.runtime.getURL("src/offscreen/offscreen.html");
  console.log("Creating offscreen at:", url);

  try {
    await chrome.offscreen.createDocument({
      url: url,
      reasons: ["USER_MEDIA"],
      justification: "MediaPipe face analysis for humanity check"
    });
    offscreenCreated = true;
    console.log("Offscreen created ");
  } catch (err) {
    if (err.message?.includes("Only a single offscreen")) {
      offscreenCreated = true;
      console.log("Offscreen already exists ");
    } else {
      console.error("Offscreen FAILED:", err.message);
    }
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (
    msg.action === "RUN_LIVENESS" ||
    msg.action === "RUN_CHALLENGE" ||
    msg.action === "IS_READY" ||
    msg.action === "PROCESS_LIVENESS_FRAME" ||
    msg.action === "PROCESS_CHALLENGE_FRAME" ||
    msg.action === "GET_LIVENESS_SCORE" ||
    msg.action === "GET_CHALLENGE_SCORE"
  ) {

    console.log("Background received:", msg.action);

    ensureOffscreen().then(() => {
      chrome.runtime.sendMessage(msg)
        .then(sendResponse)
        .catch(err => console.error("Forward failed:", err.message));
    });

    return true;
  }
});