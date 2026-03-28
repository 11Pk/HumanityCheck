// import { useState, useEffect } from 'react'
// import './App.css'

// function App() {
// const [status, setStatus]   = useState("Idle");
//   const [result, setResult]   = useState(null);   // score result from twitterProfile.js
//   const [data,   setData]     = useState(null);   // raw scraped data
//   const [page,   setPage]     = useState("other"); // "twitter" | "telegram" | "other"

//   // ── Detect which page the user is on ──
//   useEffect(() => {
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       if (!tabs.length) return;
//       const url = tabs[0].url || "";
//       if (url.includes("twitter.com") || url.includes("x.com")) setPage("twitter");
//       else if (url.includes("web.telegram.org"))                  setPage("telegram");
//       else                                                         setPage("other");
//     });
//   }, []);

//   // ── Listen for PROFILE_RESULT message from twitterProfile.js ──
//   useEffect(() => {
//     const handler = (msg) => {
//       if (msg.action === "PROFILE_RESULT") {
//         setResult(msg.result);
//         setData(msg.data);
//         setStatus("Done");
//       }
//     };
//     chrome.runtime.onMessage.addListener(handler);
//     return () => chrome.runtime.onMessage.removeListener(handler);
//   }, []);

//   // ── Send START to content script ──
//   const handleStart = () => {
//     setStatus("Analyzing...");
//     setResult(null);
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       if (!tabs.length) return;
//       chrome.tabs.sendMessage(tabs[0].id, { action: "START" });
//     });
//   };

//   const scoreColor = result
//     ? (result.score >= 70 ? "#00ba7c" : result.score >= 40 ? "#ffad1f" : "#e0245e")
//     : "#888";

//   return (
//     <div style={{ width: 280, padding: "16px", fontFamily: "-apple-system, sans-serif", fontSize: 13 }}>

//       {/* Header */}
//       <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
//         HumanityCheck
//         <span style={{ fontSize: 11, fontWeight: 400, color: "#888", marginLeft: 8 }}>
//           {page === "twitter" ? "Twitter / X" : page === "telegram" ? "Telegram" : ""}
//         </span>
//       </div>

//       {/* Start button */}
//       <button
//         onClick={handleStart}
//         style={{
//           width: "100%", padding: "9px 0", marginBottom: 14,
//           background: "#1d9bf0", color: "#fff", border: "none",
//           borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13,
//         }}
//       >
//         {status === "Analyzing..." ? "Analyzing..." : "Analyze Now"}
//       </button>

//       {/* Status line */}
//       {!result && (
//         <div style={{ color: "#888", fontSize: 12, textAlign: "center" }}>
//           {status === "Idle"
//             ? (page === "twitter"
//                 ? "Go to a Twitter profile, then click Analyze"
//                 : "Navigate to a supported page")
//             : status}
//         </div>
//       )}

//       {/* Result card */}
//       {result && data && (
//         <div style={{ background: "#f7f9f9", borderRadius: 12, padding: 14 }}>

//           {/* Score */}
//           <div style={{ textAlign: "center", marginBottom: 12 }}>
//             <div style={{ fontSize: 24 }}>{result.emoji}</div>
//             <div style={{ fontSize: 17, fontWeight: 700, color: scoreColor }}>{result.label}</div>
//             <div style={{ fontSize: 28, fontWeight: 700, color: scoreColor }}>
//               {result.score}<span style={{ fontSize: 14, fontWeight: 400 }}>/100</span>
//             </div>
//           </div>

//           {/* Score bar */}
//           <div style={{ background: "#e1e8ed", borderRadius: 6, height: 7, marginBottom: 12, overflow: "hidden" }}>
//             <div style={{
//               height: "100%", width: `${result.score}%`,
//               background: scoreColor, borderRadius: 6,
//               transition: "width 0.5s ease"
//             }} />
//           </div>

//           {/* Stats */}
//           <div style={{ fontSize: 12, lineHeight: 1.9, marginBottom: 10 }}>
//             <div>👥 Followers: <b>{data.followers.toLocaleString()}</b></div>
//             <div>➡️ Following: <b>{data.following.toLocaleString()}</b></div>
//             <div>📊 Ratio: <b>{data.ratio}</b></div>
//             {data.accountAgeDays !== null && <div>📅 Age: <b>{data.accountAgeDays} days</b></div>}
//             <div>✏️ Bio: <b>{data.hasBio ? "Set" : "Missing"}</b></div>
//             <div>🖼 Photo: <b>{data.hasDefaultPhoto ? "Default ⚠️" : "Custom ✓"}</b></div>
//             <div>📋 Completeness: <b>{data.completeness}%</b></div>
//           </div>

//           {/* Positives */}
//           {result.positives.length > 0 && (
//             <div style={{ fontSize: 12, lineHeight: 1.8, marginBottom: 6 }}>
//               {result.positives.map((p, i) => (
//                 <div key={i} style={{ color: "#00ba7c" }}>✓ {p}</div>
//               ))}
//             </div>
//           )}

//           {/* Flags */}
//           {result.flags.length > 0 && (
//             <div style={{ fontSize: 12, lineHeight: 1.8 }}>
//               {result.flags.map((f, i) => (
//                 <div key={i} style={{ color: "#e0245e" }}>⚑ {f}</div>
//               ))}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// export default App;

import { useState, useEffect } from 'react'
import logoLarge from './assets/icon128.png'
import logoMedium from './assets/icon48.png'
import './App.css'

// ── Onboarding Screen ──
function OnboardingScreen({ onDone }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      image: true,
      title: "Welcome to HumanityCheck!",
      desc: "Your personal AI-powered bot detector for Twitter / X."
    },
    {
      emoji: "🧠",
      title: "How It Works",
      desc: (
        <>
          Humanity Check verifies real human presence across platforms - analyzing Twitter profiles, Telegram chats, and Google Meet video calls with precision.
          <br />
          Powered by AI, it detects bots, fake accounts, and impersonators in real-time, ensuring authentic human interactions everywhere.
        </>
      )
    },
    {
      emoji: "🎯",
      title: "What the Score Means",
      desc: (
        <div style={{ textAlign: "left", lineHeight: 2 }}>
          <div><span style={{ color: "#00ba7c", fontWeight: 700 }}>✅ 70–100</span> → Likely Human</div>
          <div><span style={{ color: "#ffad1f", fontWeight: 700 }}>⚠️ 40–69</span> → Suspicious</div>
          <div><span style={{ color: "#e0245e", fontWeight: 700 }}>🤖 0–39</span>  → Likely Bot</div>
        </div>
      )
    }
  ];

  const current = steps[step];
  const isLast  = step === steps.length - 1;

  return (
    <div style={{
      width: 300,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize: 13,
      color: "#0f1419"
    }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1d9bf0, #0d6ebd)",
        padding: "24px 20px",
        textAlign: "center",
        color: "#fff",
        borderRadius: "0 0 24px 24px"
      }}>
        {current.image ? (
          <img
            src={logoLarge}
            alt="HumanityCheck Logo"
            style={{
              width: 80, height: 80,
              borderRadius: "50%",
              marginBottom: 10,
              border: "3px solid rgba(255,255,255,0.4)",
              objectFit: "cover"
            }}
          />
        ) : (
          <div style={{ fontSize: 44, marginBottom: 8 }}>{current.emoji}</div>
        )}
        <div style={{ fontWeight: 700, fontSize: 17 }}>{current.title}</div>
      </div>

      {/* Step dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, margin: "16px 0 4px" }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 20 : 7, height: 7,
            borderRadius: 4,
            background: i === step ? "#1d9bf0" : "#e1e8ed",
            transition: "all 0.3s ease"
          }} />
        ))}
      </div>

      {/* Description */}
      <div style={{
        padding: "16px 20px 20px",
        color: "#536471", lineHeight: 1.7,
        fontSize: 13, textAlign: "center", minHeight: 90
      }}>
        {current.desc}
      </div>

      {/* Buttons */}
      <div style={{ padding: "0 20px 20px", display: "flex", gap: 8 }}>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            style={{
              flex: 1, padding: "9px 0",
              background: "#f7f9f9", color: "#536471",
              border: "1.5px solid #e1e8ed", borderRadius: 8,
              cursor: "pointer", fontWeight: 600, fontSize: 13
            }}>
            Back
          </button>
        )}
        <button onClick={() => isLast ? onDone() : setStep(s => s + 1)}
          style={{
            flex: 2, padding: "9px 0",
            background: "#1d9bf0", color: "#fff",
            border: "none", borderRadius: 8,
            cursor: "pointer", fontWeight: 700, fontSize: 13
          }}>
          {isLast ? "Get Started" : "Next →"}
        </button>
      </div>

      {/* Skip */}
      {!isLast && (
        <div onClick={onDone} style={{
          textAlign: "center", color: "#8b98a5",
          fontSize: 11, cursor: "pointer",
          paddingBottom: 14, textDecoration: "underline"
        }}>
          Skip intro
        </div>
      )}
    </div>
  );
}

// ── Main App ──
function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [result, setResult] = useState(null);
  const [data,   setData]   = useState(null);
  const [page,   setPage]   = useState("other");

  // Check first install
  useEffect(() => {
    chrome.storage.local.get("firstInstall", (res) => {
      if (res.firstInstall) setShowOnboarding(true);
    });
  }, []);

  const handleOnboardingDone = () => {
    chrome.storage.local.remove("firstInstall");
    setShowOnboarding(false);
  };

  // Detect page
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs.length) return;
      const url = tabs[0].url || "";
      if (url.includes("twitter.com") || url.includes("x.com")) setPage("twitter");
      else if (url.includes("web.telegram.org"))                  setPage("telegram");
      else                                                         setPage("other");
    });
  }, []);

  // Listen for result
  useEffect(() => {
    const handler = (msg) => {
      if (msg.action === "PROFILE_RESULT") {
        setResult(msg.result);
        setData(msg.data);
        setStatus("Done");
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  // const handleStart = () => {
  //   setStatus("Analyzing...");
  //   setResult(null);
  //   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  //     if (!tabs.length) return;
  //     chrome.tabs.sendMessage(tabs[0].id, { action: "START" });
  //   });
  // };

  const scoreColor = result
    ? (result.score >= 70 ? "#00ba7c" : result.score >= 40 ? "#ffad1f" : "#e0245e")
    : "#888";

  // Show onboarding on first install
  if (showOnboarding) return <OnboardingScreen onDone={handleOnboardingDone} />;

  // Normal popup
  return (
    <div style={{ width: 280, padding: "16px", fontFamily: "-apple-system, sans-serif", fontSize: 13 }}>

      {/* Header with logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <img
          src={logoMedium}
          alt="logo"
          style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
        />
        <div style={{ fontWeight: 700, fontSize: 16 }}>
          HumanityCheck
          <span style={{ fontSize: 11, fontWeight: 400, color: "#888", marginLeft: 6 }}>
            {page === "twitter" ? "Twitter / X" : page === "telegram" ? "Telegram" : ""}
          </span>
        </div>
      </div>

      {/* Start button */}
      {/* <button
        onClick={handleStart}
        style={{
          width: "100%", padding: "9px 0", marginBottom: 14,
          background: "#1d9bf0", color: "#fff", border: "none",
          borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13,
        }}
      >
        {status === "Analyzing..." ? "Analyzing..." : "Analyze Now"}
      </button> */}

      {/* Status line */}
      {/* {!result && (
        <div style={{ color: "#888", fontSize: 12, textAlign: "center" }}>
          {status === "Idle"
            ? (page === "twitter"
                ? "Go to a Twitter profile, then click Analyze"
                : "Navigate to a supported page")
            : status}
        </div>
      )} */}

      {/* Result card */}
      {result && data && (
        <div style={{ background: "#f7f9f9", borderRadius: 12, padding: 14 }}>

          {/* Score */}
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 24 }}>{result.emoji}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: scoreColor }}>{result.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: scoreColor }}>
              {result.score}<span style={{ fontSize: 14, fontWeight: 400 }}>/100</span>
            </div>
          </div>

          {/* Score bar */}
          <div style={{ background: "#e1e8ed", borderRadius: 6, height: 7, marginBottom: 12, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${result.score}%`,
              background: scoreColor, borderRadius: 6,
              transition: "width 0.5s ease"
            }} />
          </div>

          {/* Stats — from original code */}
          <div style={{ fontSize: 12, lineHeight: 1.9, marginBottom: 10 }}>
            <div>👥 Followers: <b>{data.followers.toLocaleString()}</b></div>
            <div>➡️ Following: <b>{data.following.toLocaleString()}</b></div>
            <div>📊 Ratio: <b>{data.ratio}</b></div>
            {data.accountAgeDays !== null && <div>📅 Age: <b>{data.accountAgeDays} days</b></div>}
            <div>✏️ Bio: <b>{data.hasBio ? "Set" : "Missing"}</b></div>
            <div>🖼 Photo: <b>{data.hasDefaultPhoto ? "Default ⚠️" : "Custom ✓"}</b></div>
            <div>📋 Completeness: <b>{data.completeness}%</b></div>
          </div>

          {/* Positives */}
          {result.positives.length > 0 && (
            <div style={{ fontSize: 12, lineHeight: 1.8, marginBottom: 6 }}>
              {result.positives.map((p, i) => (
                <div key={i} style={{ color: "#00ba7c" }}>✓ {p}</div>
              ))}
            </div>
          )}

          {/* Flags */}
          {result.flags.length > 0 && (
            <div style={{ fontSize: 12, lineHeight: 1.8 }}>
              {result.flags.map((f, i) => (
                <div key={i} style={{ color: "#e0245e" }}>⚑ {f}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;