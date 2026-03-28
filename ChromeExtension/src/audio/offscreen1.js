// ─────────────────────────────────────────────────────────────────────────────
// offscreen.js
// ALL logs forwarded to background service worker console via LOG bridge
// Open: chrome://extensions → your extension → "service worker" → inspect
// ─────────────────────────────────────────────────────────────────────────────

function log(...args)  { console.log(...args);   chrome.runtime.sendMessage({ action: "LOG", level: "log",   args: args.map(String) }).catch(()=>{}); }
function warn(...args) { console.warn(...args);  chrome.runtime.sendMessage({ action: "LOG", level: "warn",  args: args.map(String) }).catch(()=>{}); }
function err(...args)  { console.error(...args); chrome.runtime.sendMessage({ action: "LOG", level: "error", args: args.map(String) }).catch(()=>{}); }

log("✅ Offscreen script executing");

chrome.runtime.sendMessage({ action: "OFFSCREEN_READY" }).catch(() => {});

chrome.runtime.onMessage.addListener((msg) => {

  if (msg.action !== "RECORD_AUDIO") return;

  log("🎤 RECORD_AUDIO received | streamId:", msg.streamId, "| duration:", msg.duration);

  if (!msg.streamId) {
    err("❌ No streamId in message — cannot record");
    return;
  }

  (async () => {
    try {

      log("🎙️ Calling getUserMedia...");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource:   "tab",
            chromeMediaSourceId: msg.streamId
          }
        },
        video: false
      });

      log("✅ getUserMedia succeeded, tracks:", stream.getAudioTracks().length);

      const recorder = new MediaRecorder(stream);
      const chunks   = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
          log("📦 Chunk received:", e.data.size, "bytes | total chunks:", chunks.length);
        }
      };

      recorder.onerror = (e) => {
        err("❌ MediaRecorder error:", e.error?.message || e);
      };

      recorder.onstop = async () => {
        log("🛑 Recorder stopped | total chunks:", chunks.length);

        if (chunks.length === 0) {
          err("❌ No audio chunks — blob will be empty");
          return;
        }

        const blob = new Blob(chunks, { type: "audio/webm" });
        log("🎧 Blob created | size:", blob.size, "bytes");

        if (blob.size < 100) {
          err("❌ Blob too small — audio silent or not captured");
          return;
        }

        const formData = new FormData();
        formData.append("file", blob, "audio.webm");

        log("📡 POSTing to http://127.0.0.1:8000/analyze-audio ...");

        try {
          // 30s timeout so fetch never hangs silently
          const controller = new AbortController();
          const timeoutId  = setTimeout(() => controller.abort(), 30000);

          const res = await fetch("http://127.0.0.1:8000/analyze-audio", {
            method: "POST",
            body:   formData,
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          log("📬 Backend responded | HTTP status:", res.status, res.statusText);

          // Read raw text first — always visible even if JSON parse fails
          const rawText = await res.text();
          log("📄 Raw response:", rawText);

          if (!res.ok) {
            err("❌ Backend returned error:", res.status, rawText);
            return;
          }

          const data = JSON.parse(rawText);

          log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          log("🤖 AI Probability :", data.aiProbability + "%");
          log("🏷️  Label          :", data.label);
          log("🚩 Flags          :", (data.flags || []).join(", ") || "none");
          log("📊 pitchVar       :", data.features?.pitchVariance);
          log("📊 energyVar      :", data.features?.energyVariance);
          log("📊 mfccVar        :", data.features?.mfccVar);
          log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        } catch (fetchErr) {
          if (fetchErr.name === "AbortError") {
            err("❌ fetch() timed out after 30s — backend is hanging or too slow");
          } else {
            err("❌ fetch() failed:", fetchErr.message, "— Is backend running at 127.0.0.1:8000?");
          }
        }
      };

      recorder.start(1000);
      log("▶️ Recording started for", msg.duration, "ms");

      setTimeout(() => {
        if (recorder.state !== "inactive") {
          log("⏱️ Duration reached — stopping recorder");
          recorder.stop();
        }
        stream.getTracks().forEach(t => t.stop());
      }, msg.duration);

    } catch (e) {
      err("❌ getUserMedia failed:", e.name, "-", e.message);
      if (e.name === "NotAllowedError")      err("   → tabCapture permission denied");
      else if (e.name === "NotFoundError")   err("   → streamId invalid or tab closed");
      else if (e.name === "OverconstrainedError") err("   → chromeMediaSourceId constraint failed — streamId stale");
    }
  })();
});