// ============================================================
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