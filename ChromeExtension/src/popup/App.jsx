
import { useState, useEffect } from 'react'
import './App.css'

function ScoreBar({ value, color }) {
  return (
    <div style={{ background: "#e1e8ed", borderRadius: 6, height: 6, overflow: "hidden", marginTop: 4 }}>
      <div style={{
        height: "100%",
        width: value != null ? `${Math.round(value * 100)}%` : "0%",
        background: color,
        borderRadius: 6,
        transition: "width 0.6s ease",
      }} />
    </div>
  );
}

function MeetScoreRow({ label, value }) {
  const pct = value != null ? Math.round(value * 100) : null;
  const color =
    pct == null ? "#aaa" :
    pct >= 75   ? "#00ba7c" :
    pct >= 45   ? "#ffad1f" : "#e0245e";

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#555" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>
          {pct != null ? `${pct}%` : "—"}
        </span>
      </div>
      <ScoreBar value={value} color={color} />
    </div>
  );
}

function App() {
  const [status,  setStatus]  = useState("Idle");
  const [result,  setResult]  = useState(null);
  const [data,    setData]    = useState(null);
  const [page,    setPage]    = useState("other");
  const [status1, setStatus1] = useState("Idle");

  // ── Meet scores ──
  const [meetScores, setMeetScores] = useState({ layer3: null, layer4: null });

  // ── Detect which page the user is on ──
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs.length) return;
      const url = tabs[0].url || "";
      if (url.includes("twitter.com") || url.includes("x.com"))           setPage("twitter");
      else if (url.includes("web.telegram.org"))                            setPage("telegram");
      else if (/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/.test(url)) setPage("meet");
      else                                                                   setPage("other");
    });
  }, []);
// ── Listen for pushed score updates from index.js ──
useEffect(() => {
  const handler = (msg) => {
    if (msg.action === "SCORE_UPDATE") {
      setMeetScores({
        layer3: msg.layer3 ?? null,
        layer4: msg.layer4 ?? null,
      });
    }
  };
  chrome.runtime.onMessage.addListener(handler);
  return () => chrome.runtime.onMessage.removeListener(handler);
}, []);
  // ── Poll content script for Meet scores every 4s ──
  useEffect(() => {
    if (page !== "meet") return;

    const poll = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs.length) return;
        chrome.tabs.sendMessage(tabs[0].id, { action: "GET_SCORES" }, (res) => {
          if (chrome.runtime.lastError) return; // content script not ready yet
          if (res) setMeetScores({ layer3: res.layer3 ?? null, layer4: res.layer4 ?? null });
        });
      });
    };

    poll();
    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
  }, [page]);

  // ── Listen for PROFILE_RESULT from twitterProfile.js ──
  useEffect(() => {
    const handler = (msg) => {
      if (msg.action === "PROFILE_RESULT") {
        setResult(msg.result);
        setData(msg.profileData);
        setStatus("Done");
      }
    };

    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  // 🔵 Twitter Profile Analysis
  const handleStart = () => {
    setStatus("Analyzing...");
    setResult(null);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs.length) return;

      chrome.tabs.sendMessage(tabs[0].id, {
        action: "START_PROFILE", // 🔥 FIXED
      });
    });
  };

  // Telegram Chat Detection
  const startTelegramDetection = () => {
    setStatus1("Starting...");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs.length) return;

      chrome.tabs.sendMessage(tabs[0].id, {
        action: "START_CHAT", //FIXED
      });

      setStatus1("Detection Started");
    });
  };

  // const handleStart = () => {
  //   setStatus("Analyzing...");
  //   setResult(null);
  //   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  //     if (!tabs.length) return;
  //     chrome.tabs.sendMessage(tabs[0].id, { action: "START" });
  //   });
  // };

  const scoreColor = result
    ? result.score >= 70
      ? "#00ba7c"
      : result.score >= 40
      ? "#ffad1f"
      : "#e0245e"
    : "#888";

  const combined =
    meetScores.layer3 != null && meetScores.layer4 != null
      ? meetScores.layer3 * 0.5 + meetScores.layer4 * 0.5
      : meetScores.layer3 ?? meetScores.layer4 ?? null;

  const combinedPct   = combined != null ? Math.round(combined * 100) : null;
  const combinedColor =
    combinedPct == null ? "#aaa" :
    combinedPct >= 75   ? "#00ba7c" :
    combinedPct >= 45   ? "#ffad1f" : "#e0245e";

  return (
    <div style={{ width: 280, padding: 16, fontFamily: "-apple-system", fontSize: 13 }}>
      
      {/* HEADER */}
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
        HumanityCheck
        <span style={{ fontSize: 11, fontWeight: 400, color: "#888", marginLeft: 8 }}>
          {page === "twitter"  ? "Twitter / X"  :
           page === "telegram" ? "Telegram"      :
           page === "meet"     ? "Google Meet"   : ""}
        </span>
      </div>

      {/* ── MEET PAGE ── */}
      {page === "meet" && (
        <div style={{ background: "#f7f9f9", borderRadius: 12, padding: 14 }}>

          {/* Combined score header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: "#aaa", letterSpacing: "0.08em", marginBottom: 2 }}>
                HUMANITY SCORE
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: combinedColor, lineHeight: 1 }}>
                {combinedPct != null ? `${combinedPct}%` : "—"}
              </div>
            </div>
            {/* Pulsing status dot */}
            <div style={{ position: "relative", width: 12, height: 12 }}>
              <div style={{
                width: 12, height: 12, borderRadius: "50%",
                background: combinedColor,
                transition: "background 0.5s",
              }} />
            </div>
          </div>

          <ScoreBar value={combined} color={combinedColor} />

          <div style={{ marginTop: 14 }}>
            <MeetScoreRow label="Liveness (Layer 3)"  value={meetScores.layer3} />
            <MeetScoreRow label="Challenge (Layer 4)" value={meetScores.layer4} />
          </div>

          <div style={{ fontSize: 11, color: "#bbb", marginTop: 4, textAlign: "right" }}>
            {combined == null ? "Waiting for data..." : "Refreshes every 4s"}
          </div>
        </div>
      )}

      {/* ── TWITTER + OTHER PAGES ── */}
      {page !== "meet" && (
        <>
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

          {!result && (
            <div style={{ color: "#888", textAlign: "center" }}>
              {status === "Idle"
                ? "Go to a Twitter profile"
                : status}
            </div>
          )}

          {result && data && (
            <div style={{ background: "#f7f9f9", borderRadius: 12, padding: 14 }}>
              
              <div style={{ textAlign: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 24 }}>{result.emoji}</div>
                <div style={{ fontWeight: 700, color: scoreColor }}>
                  {result.label}
                </div>
                <div style={{ fontSize: 26, color: scoreColor }}>
                  {result.score}/100
                </div>
              </div>

              {/* <div style={{ fontSize: 12 }}> */}
                {/* <div>👥 Followers: {data.followers}</div>
                <div>➡️ Following: {data.following}</div>
                <div>📊 Ratio: {data.ratio?.toFixed(2)}</div>  */}
                {/* <div>📊 Ratio: {data.followerFollowingRatio?.toFixed(2)}</div>  3*/}
                {/* <div>📅 Age: {data.accountAgeDays} days</div> */}
              {/* </div> */}
            </div>
          )}
        </>
      )}

      {/* ================= TELEGRAM UI ================= */}
      {page === "telegram" && (
        <div style={{ marginTop: 10 }}>
          <button
            onClick={startTelegramDetection}
            style={{
              width: "100%",
              padding: 10,
              background: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Start Chat Detection
          </button>

          <p style={{ marginTop: 10 }}>Status: {status1}</p>
        </div>
      )}

      {/* ================= OTHER ================= */}
      {page === "other" && (
        <div style={{ textAlign: "center", color: "#888" }}>
          Open Twitter or Telegram
        </div>
      )}
    </div>
  );
}

export default App;