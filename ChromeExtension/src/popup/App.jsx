import { useState } from 'react'
import './App.css'

function App() {
const [status, setStatus]   = useState("Idle");
  const [result, setResult]   = useState(null);   // score result from twitterProfile.js
  const [data,   setData]     = useState(null);   // raw scraped data
  const [page,   setPage]     = useState("other"); // "twitter" | "telegram" | "other
   const [status1, setStatus1] = useState("Idle");

  // ── Detect which page the user is on ──
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs.length) return;
      const url = tabs[0].url || "";
      if (url.includes("twitter.com") || url.includes("x.com")) setPage("twitter");
      else if (url.includes("web.telegram.org"))                  setPage("telegram");
      else                                                         setPage("other");
    });
  }, []);

  // ── Listen for PROFILE_RESULT message from twitterProfile.js ──
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

    const startDetection = () => {
    setStatus1("Starting...");

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs.length) return;

      chrome.tabs.sendMessage(tabs[0].id, { action: "START" });

      setStatus1("Detection Started");
    });
  };
  // ── Send START to content script ──
  const handleStart = () => {
    setStatus("Analyzing...");
    setResult(null);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs.length) return;
      chrome.tabs.sendMessage(tabs[0].id, { action: "START" });
    });
  };

  const scoreColor = result
    ? (result.score >= 70 ? "#00ba7c" : result.score >= 40 ? "#ffad1f" : "#e0245e")
    : "#888";

  return (
    <div style={{ width: 280, padding: "16px", fontFamily: "-apple-system, sans-serif", fontSize: 13 }}>

      {/* Header */}
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
        HumanityCheck
        <span style={{ fontSize: 11, fontWeight: 400, color: "#888", marginLeft: 8 }}>
          {page === "twitter" ? "Twitter / X" : page === "telegram" ? "Telegram" : ""}
        </span>
      </div>

      {/* Start button */}
      <button
        onClick={handleStart}
        style={{
          width: "100%", padding: "9px 0", marginBottom: 14,
          background: "#1d9bf0", color: "#fff", border: "none",
          borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13,
        }}
      >
        {status === "Analyzing..." ? "Analyzing..." : "Analyze Now"}
      </button>

      {/* Status line */}
      {!result && (
        <div style={{ color: "#888", fontSize: 12, textAlign: "center" }}>
          {status === "Idle"
            ? (page === "twitter"
                ? "Go to a Twitter profile, then click Analyze"
                : "Navigate to a supported page")
            : status}
        </div>
      )}

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

          {/* Stats */}
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

      <div style={{ padding: "20px", width: "250px" }}>
      <h3>AI Chat Detector</h3>

      <button
        onClick={startDetection}
        style={{
          padding: "10px",
          width: "100%",
          background: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        Start Detection
      </button>

      <p style={{ marginTop: "10px" }}>
        Status: {status1}
      </p>
    </div>
    </div>
  );
}

export default App;