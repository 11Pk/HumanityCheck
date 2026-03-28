let offscreenCreated = false;

async function ensureOffscreen() {
  if (offscreenCreated) return;

  const url = chrome.runtime.getURL("src/offscreen/offscreen.html");
  console.log("Creating offscreen at:", url); // ← check this URL is correct

  try {
    await chrome.offscreen.createDocument({
      url: url,
      reasons: ["USER_MEDIA"],
      justification: "MediaPipe face analysis for humanity check"
    });
    offscreenCreated = true;
    console.log("Offscreen created ✅");
  } catch (err) {
    if (err.message?.includes("Only a single offscreen")) {
      offscreenCreated = true;
      console.log("Offscreen already exists ✅");
    } else {
      console.error("Offscreen FAILED:", err.message); // ← exact error
    }
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "RUN_LIVENESS" || msg.action === "RUN_CHALLENGE" || 
      msg.action === "IS_READY" || msg.action === "PROCESS_LIVENESS_FRAME" || 
      msg.action === "PROCESS_CHALLENGE_FRAME" || msg.action === "GET_LIVENESS_SCORE" || 
      msg.action === "GET_CHALLENGE_SCORE") {
    
    console.log("Background received:", msg.action);
    ensureOffscreen().then(() => {
      chrome.runtime.sendMessage(msg)
        .then(sendResponse)
        .catch(err => console.error("Forward failed:", err.message));
    });
    return true;
  }
});