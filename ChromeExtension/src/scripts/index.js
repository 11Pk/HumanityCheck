import { startLayer3 } from "./layer3.js";
import {startLayer4} from  "./layer4.js";

let isLayer3Running = false;
let isLayer4Running = false;
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
async function startMonitoring() {
  // Layer 3 → start once
  if (!isLayer3Running) {
    isLayer3Running = true;
    console.log("Starting Layer 3...");
     await  startLayer3();
  }

  // Layer 4 → interval once
  if (!isLayer4Running) {
    isLayer4Running = true;

    console.log("Starting Layer 4 interval...");

    //  run immediately
    startLayer4();

    setInterval(() => {
      console.log("Triggering Layer 4...");
      startLayer4();
    }, 120000);
  }
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

setInterval(detectPlatform, 2000);// ============================================================
//  index.js — content script entry point
//  Chrome injects this file into every matched page.
//  It figures out WHICH site we're on and loads the right module.
// ============================================================

const hostname = window.location.hostname;

// ── Twitter / X ──
if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
  import("./twitterProfile.js").then(({ runProfileAnalysis }) => {
    // Module auto-starts via its own MutationObserver + checkNavigation()
    // But also listen for manual START from popup
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.action === "START") runProfileAnalysis();
    });
  });
}

// ── Telegram ──
if (hostname.includes("web.telegram.org")) {
  import("./chat.js");
}

// ── Google Meet (future) ──
// if (hostname.includes("meet.google.com")) {
//   import("./googleMeet.js");
// }