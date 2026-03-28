let lastUrl = "";

function parseCount(str) {
  if (!str) return 0;
  str = str.replace(/,/g, "").trim();
  if (str.endsWith("K") || str.endsWith("k")) return Math.round(parseFloat(str) * 1000);
  if (str.endsWith("M") || str.endsWith("m")) return Math.round(parseFloat(str) * 1000000);
  if (str.endsWith("B") || str.endsWith("b")) return Math.round(parseFloat(str) * 1000000000);
  return parseInt(str) || 0;
}
function scrapeProfileData() {
  const d = {};

  // Display name
  const nameEl = document.querySelector('[data-testid="UserName"] span span');
  d.displayName = nameEl?.innerText?.trim() || null;

  // Bio
  const bioEl = document.querySelector('[data-testid="UserDescription"]');
  d.bio    = bioEl?.innerText?.trim() || null;
  d.hasBio = !!d.bio;

  // Location
  const locEl = document.querySelector('[data-testid="UserLocation"]');
  d.hasLocation = !!(locEl?.innerText?.trim());

  // Website
  const urlEl = document.querySelector('[data-testid="UserUrl"]');
  d.hasWebsite = !!(urlEl?.innerText?.trim());

  // Join date → account age in days
  const joinEl = document.querySelector('[data-testid="UserJoinDate"]');
  d.joinDateText   = joinEl?.innerText?.trim() || null;
  d.accountAgeDays = null;
  if (d.joinDateText) {
    const match = d.joinDateText.match(/Joined\s+(.+)/i);
    if (match) {
      const parsed = new Date(match[1]);
      if (!isNaN(parsed)) {
        d.accountAgeDays = Math.floor((Date.now() - parsed.getTime()) / 86400000);
      }
    }
  }

  // Followers & following
  const followersEl = document.querySelector('a[href$="/verified_followers"] span span, a[href$="/followers"] span span');
  const followingEl = document.querySelector('a[href$="/following"] span span');
  d.followersRaw = followersEl?.innerText?.trim() || "0";
  d.followingRaw = followingEl?.innerText?.trim() || "0";
  d.followers    = parseCount(d.followersRaw);
  d.following    = parseCount(d.followingRaw);
  d.ratio        = d.following > 0
    ? parseFloat((d.followers / d.following).toFixed(2))
    : (d.followers > 0 ? 999 : 0);

  // Profile photo
  const photoEl  = document.querySelector('[data-testid^="UserAvatar-Container"] img');
  const photoSrc = photoEl?.src || "";
  d.hasDefaultPhoto = photoSrc === "" || photoSrc.includes("default_profile");

  // Header image
  const headerEl = document.querySelector('a[href$="/photo"] img, [style*="profile_banners"]');
  d.hasHeaderImage = !!headerEl;

  // Verified 
  const userNameBlock  = document.querySelector('[data-testid="UserName"]');
  const verifiedEl     = userNameBlock?.querySelector('[data-testid="icon-verified"], svg[aria-label*="erified"]');
  const verifiedByLabel = document.querySelector(
    '[data-testid="UserName"] [aria-label="Verified account"], ' +
    '[data-testid="UserName"] [aria-label="Blue Verified"]'
  );
  d.isVerified = !!(verifiedEl || verifiedByLabel);

  // Pinned tweet
  const pinnedEl = document.querySelector('[data-testid="socialContext"]');
  d.hasPinnedTweet = pinnedEl?.innerText?.toLowerCase().includes("pinned") || false;

  // Visible tweets
  const tweetEls = document.querySelectorAll('[data-testid="tweetText"]');
  d.visibleTweets   = Array.from(tweetEls).slice(0, 10).map(el => el.innerText.trim());
  d.tweetCount      = d.visibleTweets.length;
  const uniqueSet   = new Set(d.visibleTweets);
  d.repetitionRatio = d.tweetCount > 0
    ? parseFloat(((d.tweetCount - uniqueSet.size) / d.tweetCount).toFixed(2))
    : 0;

  // Profile completeness
  let completeness = 0;
  if (d.displayName)      completeness += 15;
  if (d.hasBio)           completeness += 25;
  if (d.hasLocation)      completeness += 10;
  if (d.hasWebsite)       completeness += 10;
  if (!d.hasDefaultPhoto) completeness += 25;
  if (d.hasHeaderImage)   completeness += 10;
  if (d.hasPinnedTweet)   completeness += 5;
  d.completeness = completeness;

  // Username pattern
  const usernameEl = document.querySelector('[data-testid="UserName"] div + div span');
  d.username = usernameEl?.innerText?.trim() || "";
  const usernameClean = d.username.replace("@", "");
  d.hasNumbersInUsername = /\d{4,}/.test(usernameClean);
  d.hasRandomUsername    = /[_]{2,}|[0-9]{4,}/.test(usernameClean);

  // Tweet timestamps
  const timeEls    = document.querySelectorAll('article time');
  const timestamps = Array.from(timeEls)
    .slice(0, 10)
    .map(el => new Date(el.getAttribute('datetime')).getTime())
    .filter(Boolean);
  d.timestamps = timestamps;

  if (timestamps.length >= 3) {
    const gaps = [];
    for (let i = 1; i < timestamps.length; i++) {
      gaps.push(Math.abs(timestamps[i - 1] - timestamps[i]));
    }
    const avgGap   = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const variance = gaps.reduce((a, b) => a + Math.pow(b - avgGap, 2), 0) / gaps.length;
    d.postingVariance  = variance;
    d.isRoboticPosting = variance < 60000 && gaps.length >= 3;
  } else {
    d.postingVariance  = null;
    d.isRoboticPosting = false;
  }

  // Bio keywords
  const botBioKeywords = [
    "ai", "bot", "automated", "crypto", "nft", "trading signals",
    "dm for promo", "follow back", "not financial advice", "web3",
    "📈", "🚀", "💰", "buying followers", "get rich"
  ];
  d.bioHasBotKeywords = d.bio
    ? botBioKeywords.some(k => d.bio.toLowerCase().includes(k))
    : false;

  // Hashtag repetition
  const tweetTexts     = d.visibleTweets.join(" ").toLowerCase();
  const hashtags       = tweetTexts.match(/#\w+/g) || [];
  const uniqueHashtags = new Set(hashtags);
  d.hashtagRepetitionRatio = hashtags.length > 0
    ? parseFloat(((hashtags.length - uniqueHashtags.size) / hashtags.length).toFixed(2))
    : 0;

  // Post count vs followers
  const headerText = document.querySelector('[data-testid="primaryColumn"] h2')?.closest('div')?.innerText || "";
  const postMatch  = headerText.match(/([\d,.KMBkmb]+)\s*[Pp]osts?/);
  d.postCount      = postMatch ? parseCount(postMatch[1]) : null;
  d.highPostLowFollower = d.postCount !== null && d.postCount > 5000 && d.followers < 500;

  // Name vs username mismatch
  const displayNameClean    = (d.displayName || "").toLowerCase().replace(/\s/g, "");
  const usernameOnlyLetters = usernameClean.toLowerCase().replace(/[^a-z]/g, "");
  d.nameMismatch = displayNameClean.length > 0
    && usernameOnlyLetters.length > 0
    && !displayNameClean.includes(usernameOnlyLetters.slice(0, 4))
    && !usernameOnlyLetters.includes(displayNameClean.slice(0, 4));

  return d;
}

function scoreProfile(d) {
  let score       = 50;
  const flags     = [];
  const positives = [];

  //  Verified badge
  if (d.isVerified) { score += 20; positives.push("Verified account"); }

  // Profile completeness
  if      (d.completeness >= 70) { score += 12; positives.push("Complete profile"); }
  else if (d.completeness >= 40) { score += 4; }
  else if (d.completeness <  25) { score -= 20; flags.push("Very incomplete profile"); }

  //  Bio
  if (!d.hasBio) {
    score -= 10; flags.push("No bio set");
  } else {
    score += 8;
    if (d.bio && d.bio.length < 10) { score -= 4; flags.push("Bio too short"); }
  }

  //  Profile photo
  if (d.hasDefaultPhoto) { score -= 18; flags.push("No profile photo"); }
  else                   { score += 8; }

  //  Account age
  if (d.accountAgeDays !== null) {
    if      (d.accountAgeDays < 7)   { score -= 25; flags.push("Account under 7 days old"); }
    else if (d.accountAgeDays < 30)  { score -= 18; flags.push("Account under 30 days old"); }
    else if (d.accountAgeDays < 90)  { score -= 8;  flags.push("Account under 3 months old"); }
    else if (d.accountAgeDays > 730) { score += 15; positives.push("Account over 2 years old"); }
    else if (d.accountAgeDays > 365) { score += 10; positives.push("Account over 1 year old"); }
  }

  //  Follower / following ratio
  if      (d.following > 500  && d.ratio < 0.05) { score -= 22; flags.push("Mass following, very few followers"); }
  else if (d.following > 1000 && d.ratio < 0.1)  { score -= 15; flags.push("High following, low follower ratio"); }
  else if (d.ratio >= 1.0) { score += 10; positives.push("Good follower ratio"); }
  else if (d.ratio >= 0.3) { score += 5; }

  // Absolute follower count
  if (d.followers < 5 && (d.accountAgeDays || 0) > 90) {
    score -= 12; flags.push("Very few followers for account age");
  }

  // Tweet repetition
  if      (d.repetitionRatio > 0.5 && d.tweetCount >= 5) { score -= 20; flags.push("Highly repetitive tweets"); }
  else if (d.repetitionRatio > 0.3 && d.tweetCount >= 5) { score -= 10; flags.push("Some repetitive tweets"); }

  // Header image
  if (!d.hasHeaderImage) { score -= 5; flags.push("No header image"); }
  else                   { score += 4; }

  // Location & website
  if (d.hasLocation) score += 4;
  if (d.hasWebsite)  score += 4;

  // Pinned tweet
  if (d.hasPinnedTweet) { score += 5; positives.push("Has pinned tweet"); }

  // Username numbers
  if (d.hasNumbersInUsername) { score -= 10; flags.push("Username contains many numbers"); }

  //  Robotic posting
  if (d.isRoboticPosting) {
    score -= 20; flags.push("Tweets posted at robotic intervals");
  } else if (d.timestamps.length >= 3) {
    score += 5; positives.push("Natural posting intervals");
  }

  //  Bot keywords in bio
  if (d.bioHasBotKeywords) { score -= 15; flags.push("Bio contains bot/spam keywords"); }

  //  Hashtag spam
  if      (d.hashtagRepetitionRatio > 0.6) { score -= 15; flags.push("Repetitive hashtag usage"); }
  else if (d.hashtagRepetitionRatio > 0.4) { score -= 7;  flags.push("Some hashtag repetition"); }

  //  High posts, low followers
  if (d.highPostLowFollower) { score -= 18; flags.push("Thousands of posts but very few followers"); }

  //  Name/username mismatch
  if (d.nameMismatch && d.hasNumbersInUsername) { score -= 8; flags.push("Display name doesn't match username"); }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let label, color, emoji;
  if      (score >= 70) { label = "Likely Human"; color = "#00ba7c"; emoji = "✅"; }
  else if (score >= 40) { label = "Suspicious";   color = "#ffad1f"; emoji = "⚠️"; }
  else                  { label = "Likely Bot";   color = "#e0245e"; emoji = "🤖"; }

  return { score, label, color, emoji, flags, positives };
}

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

  const flagsHtml = result.flags.map(f =>
    `<div style="color:#e0245e;margin:2px 0">⚑ ${f}</div>`).join("");

  const posHtml = result.positives.map(p =>
    `<div style="color:#00ba7c;margin:2px 0">✓ ${p}</div>`).join("");

  const ageLine = d.accountAgeDays !== null
    ? `<div>📅 Age: <b>${d.accountAgeDays} days</b></div>` : "";

  const postCountLine = d.postCount !== null
    ? `<div>📝 Posts: <b>${d.postCount.toLocaleString()}</b></div>` : "";

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
    ${posHtml || flagsHtml ? `
    <div style="font-size:12px;line-height:1.8;padding:0 2px;margin-bottom:8px">
      ${posHtml}${flagsHtml}
    </div>` : ""}
    <div style="font-size:11px;color:#8b98a5;text-align:center">
      HumanityCheck · ${new Date().toLocaleTimeString()}
    </div>
  `;

  const anchor = document.querySelector('[data-testid="primaryColumn"]') || document.body;
  anchor.style.position = "relative";
  anchor.appendChild(overlay);

  document.getElementById("hc-close").addEventListener("click", () => overlay.remove());

  chrome.runtime.sendMessage({ action: "PROFILE_RESULT", result, data: d });
}

function runProfileAnalysis() {
  console.log("[HumanityCheck] Analyzing Twitter profile...");
  const data   = scrapeProfileData();
  const result = scoreProfile(data);
  console.log("[HumanityCheck] Score:", result.score, result.label);
  showOverlay(result, data);
}

const NON_PROFILE = new Set([
  "home","explore","notifications","messages",
  "search","settings","i","compose","lists","bookmarks"
]);

function isProfilePage(path) {
  const first = path.split("/")[1];
  return first && first.length > 0 && !NON_PROFILE.has(first) && !path.includes("/status/");
}

function waitAndRun(retries = 10) {
  const nameEl = document.querySelector('[data-testid="UserName"]');
  if (nameEl) {
    runProfileAnalysis();
  } else if (retries > 0) {
    setTimeout(() => waitAndRun(retries - 1), 800);
  }
  }

function checkNavigation() {
  const current = window.location.href;
  if (current === lastUrl) return;
  lastUrl = current;
  if (isProfilePage(window.location.pathname)) {
          waitAndRun();
  }
}

const navObserver = new MutationObserver(checkNavigation);
navObserver.observe(document.body, { childList: true, subtree: true });
checkNavigation();