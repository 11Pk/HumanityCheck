// ============================================================
//  HumanityCheck — twitterProfile.js
//  Pure frontend bot detector — no backend needed
//  Called from index.js when user is on twitter.com / x.com
// ============================================================

let lastUrl = "";

// ─────────────────────────────────────────────────────────────
//  HELPER — convert "12.4K" / "1.2M" → real number
// ─────────────────────────────────────────────────────────────
function parseCount(str) {
  if (!str) return 0;
  str = str.replace(/,/g, "").trim();
  if (str.endsWith("K") || str.endsWith("k"))
    return Math.round(parseFloat(str) * 1000);
  if (str.endsWith("M") || str.endsWith("m"))
    return Math.round(parseFloat(str) * 1000000);
  if (str.endsWith("B") || str.endsWith("b"))
    return Math.round(parseFloat(str) * 1000000000);
  return parseInt(str) || 0;
}

// ─────────────────────────────────────────────────────────────
//  STEP 1 — SCRAPE : read every signal from the page DOM
// ─────────────────────────────────────────────────────────────
function scrapeProfileData() {
  const d = {};

  // Display name
  const nameEl = document.querySelector('[data-testid="UserName"] span span');
  d.displayName = nameEl?.innerText?.trim() || null;

  // Bio
  const bioEl = document.querySelector('[data-testid="UserDescription"]');
  d.bio = bioEl?.innerText?.trim() || null;
  d.hasBio = !!d.bio;

  // Location
  const locEl = document.querySelector('[data-testid="UserLocation"]');
  d.hasLocation = !!locEl?.innerText?.trim();

  // Website
  const urlEl = document.querySelector('[data-testid="UserUrl"]');
  d.hasWebsite = !!urlEl?.innerText?.trim();

  // Join date → account age in days
  const joinEl = document.querySelector('[data-testid="UserJoinDate"]');
  d.joinDateText = joinEl?.innerText?.trim() || null;
  d.accountAgeDays = null;
  if (d.joinDateText) {
    const match = d.joinDateText.match(/Joined\s+(.+)/i);
    if (match) {
      const parsed = new Date(match[1]);
      if (!isNaN(parsed)) {
        d.accountAgeDays = Math.floor(
          (Date.now() - parsed.getTime()) / 86400000,
        );
      }
    }
  }

  // Followers & following
  const followersEl = document.querySelector(
    'a[href$="/verified_followers"] span span, a[href$="/followers"] span span',
  );
  const followingEl = document.querySelector('a[href$="/following"] span span');
  d.followersRaw = followersEl?.innerText?.trim() || "0";
  d.followingRaw = followingEl?.innerText?.trim() || "0";
  d.followers = parseCount(d.followersRaw);
  d.following = parseCount(d.followingRaw);
  d.ratio =
    d.following > 0
      ? parseFloat((d.followers / d.following).toFixed(2))
      : d.followers > 0
        ? 999
        : 0;

  // Profile photo — default photo URL contains "default_profile"
  const photoEl = document.querySelector(
    '[data-testid^="UserAvatar-Container"] img',
  );
  const photoSrc = photoEl?.src || "";
  d.hasDefaultPhoto = photoSrc === "" || photoSrc.includes("default_profile");

  // Header / banner image
  const headerEl = document.querySelector(
    'a[href$="/photo"] img, [style*="profile_banners"]',
  );
  d.hasHeaderImage = !!headerEl;

  // Verified blue tick
  const verifiedEl = document.querySelector('[data-testid="icon-verified"]');
  d.isVerified = !!verifiedEl;

  // Pinned tweet
  const pinnedEl = document.querySelector('[data-testid="socialContext"]');
  d.hasPinnedTweet =
    pinnedEl?.innerText?.toLowerCase().includes("pinned") || false;

  // Visible tweets (up to 10) for repetition check
  const tweetEls = document.querySelectorAll('[data-testid="tweetText"]');
  d.visibleTweets = Array.from(tweetEls)
    .slice(0, 10)
    .map((el) => el.innerText.trim());
  d.tweetCount = d.visibleTweets.length;
  const uniqueSet = new Set(d.visibleTweets);
  d.repetitionRatio =
    d.tweetCount > 0
      ? parseFloat(((d.tweetCount - uniqueSet.size) / d.tweetCount).toFixed(2))
      : 0;

  // Profile completeness (0–100)
  let completeness = 0;
  if (d.displayName) completeness += 15;
  if (d.hasBio) completeness += 25;
  if (d.hasLocation) completeness += 10;
  if (d.hasWebsite) completeness += 10;
  if (!d.hasDefaultPhoto) completeness += 25;
  if (d.hasHeaderImage) completeness += 10;
  if (d.hasPinnedTweet) completeness += 5;
  d.completeness = completeness;

  return d;
}

// ─────────────────────────────────────────────────────────────
//  STEP 2 — SCORE : 11 signals → 0-100 human probability score
// ─────────────────────────────────────────────────────────────
function scoreProfile(d) {
  let score = 35; // 4
  const flags = [];
  const positives = [];

  // Signal 1 — Verified badge
  if (d.isVerified) {
    score += 20;
    positives.push("Verified account");
  }

  // Signal 2 — Profile completeness
  if (d.completeness >= 70) {
    score += 12;
    positives.push("Complete profile");
  } else if (d.completeness >= 40) {
    score += 4;
  } else if (d.completeness < 25) {
    score -= 20;
    flags.push("Very incomplete profile");
  }

  // Signal 3 — Bio
  if (!d.hasBio) {
    score -= 10;
    flags.push("No bio set");
  } else {
    score += 8;
    if (d.bio && d.bio.length < 10) {
      score -= 4;
      flags.push("Bio too short");
    }
  }

  // Signal 4 — Profile photo
  if (d.hasDefaultPhoto) {
    score -= 18;
    flags.push("No profile photo");
  } else {
    score += 8;
  }

  // Signal 5 — Account age
  if (d.accountAgeDays !== null) {
    if (d.accountAgeDays < 7) {
      score -= 25;
      flags.push("Account under 7 days old");
    } else if (d.accountAgeDays < 30) {
      score -= 18;
      flags.push("Account under 30 days old");
    } else if (d.accountAgeDays < 90) {
      score -= 8;
      flags.push("Account under 3 months old");
    } else if (d.accountAgeDays > 730) {
      score += 15;
      positives.push("Account over 2 years old");
    } else if (d.accountAgeDays > 365) {
      score += 10;
      positives.push("Account over 1 year old");
    }
  }

  // Signal 6 — Follower / following ratio
  if (d.following > 500 && d.ratio < 0.05) {
    score -= 22;
    flags.push("Mass following, very few followers");
  } else if (d.following > 1000 && d.ratio < 0.1) {
    score -= 15;
    flags.push("High following, low follower ratio");
  } else if (d.ratio >= 1.0) {
    score += 10;
    positives.push("Good follower ratio");
  } else if (d.ratio >= 0.3) {
    score += 5;
  }

  // Signal 7 — Absolute follower count
  if (d.followers < 5 && (d.accountAgeDays || 0) > 90) {
    score -= 12;
    flags.push("Very few followers for account age");
  }

  // Signal 8 — Tweet repetition
  if (d.repetitionRatio > 0.5 && d.tweetCount >= 5) {
    score -= 20;
    flags.push("Highly repetitive tweets");
  } else if (d.repetitionRatio > 0.3 && d.tweetCount >= 5) {
    score -= 10;
    flags.push("Some repetitive tweets");
  }

  // Signal 9 — Header image
  if (!d.hasHeaderImage) {
    score -= 5;
    flags.push("No header image");
  } else {
    score += 4;
  }

  // Signal 10 — Location & website
  if (d.hasLocation) score += 4;
  if (d.hasWebsite) score += 4;

  // Signal 11 — Pinned tweet
  if (d.hasPinnedTweet) {
    score += 5;
    positives.push("Has pinned tweet");
  }

  // Signal 12 — Numeric/random username suffix (e.g. Bots1362769, User48271)
  const usernameEl = document.querySelector(
    '[data-testid="UserName"] div[dir] span',
  );
  const username = usernameEl?.innerText?.trim() || "";
  if (/\d{4,}$/.test(username)) {
    score -= 20;
    flags.push("Username ends in long number string");
  }

  // Signal 13 — Zero or very few posts
  const postsEl =
    document.querySelector(
      '[data-testid="primaryColumn"] [href$="/with_replies"]',
    ) || document.querySelector('a[href$="/media"]');
  // Better: grab from the header "X posts" text
  const headerPostsEl = Array.from(
    document.querySelectorAll('[data-testid="UserName"] ~ * span'),
  ).find((el) => /^\d+\s+post/i.test(el.innerText));
  const postCount = headerPostsEl ? parseInt(headerPostsEl.innerText) : null;
  if (postCount !== null && postCount === 0) {
    score -= 25;
    flags.push("Zero posts");
  } else if (postCount !== null && postCount < 5) {
    score -= 15;
    flags.push("Fewer than 5 posts");
  }

  // Signal 14 — Twitter itself flagged this account as restricted
  const restrictedEl = document.querySelector(
    '[data-testid="empty_state_header_text"], [href*="unusual_activity"]',
  );
  const pageText = document.body.innerText;
  if (
    pageText.includes("temporarily restricted") ||
    pageText.includes("unusual activity from this account")
  ) {
    score -= 30;
    flags.push("Account flagged by Twitter for unusual activity");
  }

  // Signal 15 — Zero followers AND zero following (ghost account)
  if (d.followers === 0 && d.following === 0 && (d.accountAgeDays || 0) > 7) {
    score -= 20;
    flags.push("Zero followers and following");
  }

  // Clamp 0–100
  score = Math.max(0, Math.min(100, Math.round(score)));

  let label, color, emoji;
  if (score >= 70) {
    label = "Likely Human";
    color = "#00ba7c";
    emoji = "✅";
  } else if (score >= 40) {
    label = "Suspicious";
    color = "#ffad1f";
    emoji = "⚠️";
  } else {
    label = "Likely Bot";
    color = "#e0245e";
    emoji = "🤖";
  }

  return { score, label, color, emoji, flags, positives };
}

// ─────────────────────────────────────────────────────────────
//  STEP 3 — DISPLAY : inject floating overlay card on the page
// ─────────────────────────────────────────────────────────────
function showOverlay(result, d) {
  document.getElementById("hc-overlay")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "hc-overlay";
  overlay.style.cssText = `
    position:absolute;top:70px;right:16px;z-index:99999;
    width:264px;background:#fff;border:1.5px solid #e1e8ed;
    border-radius:16px;padding:16px;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    font-size:13px;color:#0f1419;
    box-shadow:0 2px 12px rgba(0,0,0,0.10);
  `;

  const flagsHtml = result.flags
    .map((f) => `<div style="color:#e0245e;margin:2px 0">⚑ ${f}</div>`)
    .join("");

  const posHtml = result.positives
    .map((p) => `<div style="color:#00ba7c;margin:2px 0">✓ ${p}</div>`)
    .join("");

  const ageLine =
    d.accountAgeDays !== null
      ? `<div>📅 Age: <b>${d.accountAgeDays} days</b></div>`
      : "";

  overlay.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <span style="font-weight:600;font-size:14px">HumanityCheck</span>
      <span id="hc-close" style="cursor:pointer;color:#8b98a5;font-size:18px;line-height:1">✕</span>
    </div>
    <div style="text-align:center;padding:8px 0 10px">
      <div style="font-size:26px;margin-bottom:4px">${result.emoji}</div>
      <div style="font-size:19px;font-weight:700;color:${result.color}">${result.label}</div>
      <div style="font-size:30px;font-weight:700;color:${result.color};line-height:1.2">
        ${result.score}<span style="font-size:15px;font-weight:400">/100</span>
      </div>
    </div>
    <div style="background:#f7f9f9;border-radius:8px;height:8px;margin:8px 0 14px;overflow:hidden">
      <div style="height:100%;width:${result.score}%;background:${result.color};
                  border-radius:8px;transition:width 0.6s ease"></div>
    </div>
  
    <div style="font-size:11px;color:#8b98a5;text-align:center">
      HumanityCheck · ${new Date().toLocaleTimeString()}
    </div>
  `;

  const anchor =
    document.querySelector('[data-testid="primaryColumn"]') || document.body;
  anchor.style.position = "relative";
  anchor.appendChild(overlay);

  document
    .getElementById("hc-close")
    .addEventListener("click", () => overlay.remove());

  // Notify popup
  chrome.runtime.sendMessage({
    action: "PROFILE_RESULT",
    result,
    profileData: d,
  }); //2
  // chrome.runtime.sendMessage({ action: "PROFILE_RESULT", result, data: d });
}

// ─────────────────────────────────────────────────────────────
//  MAIN — scrape → score → display
// ─────────────────────────────────────────────────────────────
export function runProfileAnalysis() {
  console.log("[HumanityCheck] Analyzing Twitter profile...");
  const data = scrapeProfileData();
  const result = scoreProfile(data);
  console.log("[HumanityCheck] Score:", result.score, result.label);
  showOverlay(result, data);
}

// ─────────────────────────────────────────────────────────────
//  AUTO-DETECT — watch for Twitter SPA navigation
// ─────────────────────────────────────────────────────────────
const NON_PROFILE = new Set([
  "home",
  "explore",
  "notifications",
  "messages",
  "search",
  "settings",
  "i",
  "compose",
  "lists",
  "bookmarks",
]);

function isProfilePage(path) {
  const first = path.split("/")[1];
  return (
    first &&
    first.length > 0 &&
    !NON_PROFILE.has(first) &&
    !path.includes("/status/")
  );
}

function checkNavigation() {
  const current = window.location.href;
  if (current === lastUrl) return;
  lastUrl = current;
  if (isProfilePage(window.location.pathname)) {
    setTimeout(runProfileAnalysis, 4000);
  }
}

const navObserver = new MutationObserver(checkNavigation);
navObserver.observe(document.body, { childList: true, subtree: true });
checkNavigation();
