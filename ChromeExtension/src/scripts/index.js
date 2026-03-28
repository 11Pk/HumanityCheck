// const hostname = window.location.hostname;

// if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
//   import("./twitterProfile.js").then(({ runProfileAnalysis }) => {
//     chrome.runtime.onMessage.addListener((msg) => {
//       if (msg.action === "START") runProfileAnalysis();
//     });
//   });
// }

// if (hostname.includes("web.telegram.org")) {
//   import("./chat.js");
// }

// if (
//   hostname.includes("meet.google.com") ||
//   hostname.includes("leetcode.com") ||
//   hostname.includes("hackerrank.com")
// ) {
//   Promise.all([import("./layer3.js"), import("./layer4.js")])
//     .then(([{ startLayer3 }, { startLayer4 }]) => {
//       let isLayer3Running = false;
//       let isLayer4Running = false;

//       function isMeetCall() {
//         return /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/.test(window.location.href);
//       }
//       function isInMeetingUI() {
//         return document.querySelector('[aria-label="Leave call"]') !== null;
//       }
//       function isLeetCodeContest() {
//         return /leetcode\.com\/contest\//.test(window.location.href);
//       }
//       function isHackerRankContest() {
//         return /hackerrank\.com\/contests\//.test(window.location.href);
//       }

//       async function startMonitoring() {
//         if (!isLayer3Running) {
//           isLayer3Running = true;
//           await startLayer3();
//         }
//         if (!isLayer4Running) {
//           isLayer4Running = true;
//           startLayer4();
//           setInterval(() => startLayer4(), 120000);
//         }
//       }

//       function detectPlatform() {
//         if (isMeetCall() && isInMeetingUI()) { startMonitoring(); return; }
//         if (isLeetCodeContest())             { startMonitoring(); return; }
//         if (isHackerRankContest())           { startMonitoring(); return; }
//       }

//       setInterval(detectPlatform, 2000);
//     });
// }
const hostname = window.location.hostname;

if (
  hostname.includes("meet.google.com") ||
  hostname.includes("leetcode.com") ||
  hostname.includes("hackerrank.com")
) {
  Promise.all([import("./layer3.js"), import("./layer4.js")])
    .then(([{ startLayer3 }, { startLayer4 }]) => {
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
        if (!isLayer3Running) { isLayer3Running = true; await startLayer3(); }
        if (!isLayer4Running) {
          isLayer4Running = true;
          startLayer4();
          setInterval(() => startLayer4(), 120000);
        }
      }

      function detectPlatform() {
        if (isMeetCall() && isInMeetingUI()) { startMonitoring(); return; }
        if (isLeetCodeContest())             { startMonitoring(); return; }
        if (isHackerRankContest())           { startMonitoring(); return; }
      }

      setInterval(detectPlatform, 2000);
    });
}