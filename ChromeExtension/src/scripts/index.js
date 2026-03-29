

import { startLayer3 } from "./layer3.js";
import { startLayer4 } from "./layer4.js";
 
export const humanityScores = { layer3: null, layer4: null };
 
// ── Respond to popup polling ──
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "GET_SCORES") {
    sendResponse({ layer3: humanityScores.layer3, layer4: humanityScores.layer4 });
  }
  return true;
});
 
// ── Platform detection ──
function isMeetCall() {
  return /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/.test(window.location.href);
}
function isInMeetingUI() {
  return document.querySelector('[aria-label="Leave call"]') !== null;
}
function isLeetCodeContest() {
  return /leetcode\.com\/contest\//.test(window.location.href);
}
function isHackerRankContest() {
  return /hackerrank\.com\/contests\//.test(window.location.href);
}
 
let monitoringStarted = false;
 
async function startMonitoring() {
  if (monitoringStarted) return;
  monitoringStarted = true;

  // ── Step 1: Run Layer 3 FIRST (camera permission + initial liveness)
  // Layer 4 waits until camera is ready
  console.log("Starting Layer 3...");
  const l3score = await startLayer3(); // wait for permission + camera init
  humanityScores.layer3 = l3score;
  console.log("Layer 3 score:", l3score);
  notifyScoreUpdate();

  // ── Step 2: Now start Layer 4 (camera already running, no conflict)
  console.log("Starting Layer 4...");
  const l4score = await startLayer4();
  humanityScores.layer4 = l4score;
  console.log("Layer 4 score:", l4score);
  notifyScoreUpdate();

  // ── Step 3: Keep BOTH running independently on intervals ──
  // Layer 3 re-evaluates every 2 min silently (no dialog, camera already open)
  setInterval(async () => {
    console.log("Layer 3 re-run...");
    const score = await startLayer3Silent(); // silent re-run, no permission dialog
    if (score !== null) {
      humanityScores.layer3 = score;
      notifyScoreUpdate();
    }
  }, 120000);

  // Layer 4 re-runs every 2 min AFTER layer 3 interval to avoid overlap
  setInterval(async () => {
    console.log("Layer 4 re-run...");
    const score = await startLayer4();
    if (score !== null) {
      humanityScores.layer4 = score;
      notifyScoreUpdate();
    }
  }, 150000); // offset by 30s so they don't overlap
}
 
// Push score updates to the popup without waiting for it to poll
function notifyScoreUpdate() {
  chrome.runtime.sendMessage({
    action: "SCORE_UPDATE",
    layer3: humanityScores.layer3,
    layer4: humanityScores.layer4,
  }).catch(() => {}); // popup may not be open — ignore error
}
 
export function detectPlatform() {
  if (isMeetCall() && isInMeetingUI()) {
    console.log("Meet call detected");
    startMonitoring();
    return;
  }
  if (isLeetCodeContest()) {
    console.log("LeetCode contest detected");
    startMonitoring();
    return;
  }
  if (isHackerRankContest()) {
    console.log("HackerRank contest detected");
    startMonitoring();
    return;
  }
}

setInterval(detectPlatform, 2000);

const hostname = window.location.hostname;
 
// ── Twitter / X ──
if (hostname.includes("twitter.com") || hostname.includes("x.com")) {

  // Profile logic
  import("./twitterProfile.js").then(({ runProfileAnalysis }) => {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.action === "START") runProfileAnalysis();
    });
  });

   import("./twitterVideo.js").then(() => {
    console.log("Twitter video module loaded");
  });
  import("./twitteraudio.js");
}



// ── Telegram ──
if (hostname.includes("web.telegram.org")) {
  import("./chat.js");
}