console.log("Meet audio module loaded");

let hasRecorded = false;

function isMeetAudioActive() {
  const videos = document.querySelectorAll("video");

  for (let v of videos) {
    if (!v.paused && v.currentTime > 1 && !v.muted) {
      return true;
    }
  }
  return false;
}

const interval = setInterval(() => {

  if (hasRecorded) {
    clearInterval(interval);
    return;
  }

  if (isMeetAudioActive()) {
    console.log(" Meet audio detected → recording once");

    hasRecorded = true;

    chrome.runtime.sendMessage({
      action: "START_AUDIO_CAPTURE",
      duration: 10000 // 10 sec
    });

    clearInterval(interval);
  }

}, 3000);