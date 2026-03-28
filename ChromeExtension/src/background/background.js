chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Just set the flag — onboarding shows inside the popup itself
    chrome.storage.local.set({ firstInstall: true });
  }
});