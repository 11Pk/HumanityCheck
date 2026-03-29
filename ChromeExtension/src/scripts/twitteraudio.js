console.log("Twitter audio script loaded");

let lastVideoSrc = "";
let cooldown = false;

function getCurrentVideo() {
  return document.querySelector("video");
}

function isPlaying(video) {
  return video && !video.paused && video.currentTime > 1;
}

setInterval(() => {
  const video = getCurrentVideo();

  if (!video) return;

  const src = video.currentSrc;

  // 🔥 Detect NEW video (scroll case)
  if (src !== lastVideoSrc) {
    console.log(" New video detected");

    lastVideoSrc = src;
    cooldown = false;
  }

  // 🔥 If playing and not processed
  if (isPlaying(video) && !cooldown) {
    console.log("🎤 Recording 10 sec for this video");

    chrome.runtime.sendMessage({
      action: "START_AUDIO_CAPTURE",
      duration: 10000 // 10 sec
    });

    cooldown = true; // prevent duplicate recording
  }

}, 2000);