console.log("Telegram content script loaded");

// ------------------ CONFIG ------------------
const MESSAGE_THRESHOLD = 6;

// ------------------ STATE ------------------
let isActive = false;
let debounceTimer = null;

// ------------------ START DETECTION ------------------
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "START_CHAT") {
        isActive = true;
        console.log("Detection started");
        processChat(); // run immediately
    }
});

// ------------------ EXTRACT MESSAGE TEXT ------------------
function getMessageText(msg) {
    // 🟢 RECEIVED MESSAGE
    const received = msg.querySelector(".translatable-message");

    if (received) {
        return received.innerText.trim();
    }

    // 🔵 SENT MESSAGE
    let clone = msg.cloneNode(true);

    // remove time / extra UI
    const time = clone.querySelector(".time");
    if (time) time.remove();

    return clone.innerText.trim();
}

// ------------------ DETECT SENDER ------------------
function isMyMessage(msg) {
    // If NO translatable span → it's sent by user
    return !msg.querySelector(".translatable-message");
}

// ------------------ MAIN PROCESS ------------------
function processChat() {
    const messages = document.querySelectorAll(".message.spoilers-container");

    if (!messages.length) {
        console.log("No messages found");
        return;
    }

    let chat = [];

    messages.forEach((msg) => {
        const text = getMessageText(msg);

        if (text && text.length > 1) {
            chat.push({
                text: text.replace(/\n/g, " "),
                sender: isMyMessage(msg) ? "me" : "other",
                time: Date.now()
            });
        }
    });

    console.log("Total messages:", chat.length);

    // ------------------ THRESHOLD CHECK ------------------
    if (chat.length < MESSAGE_THRESHOLD) {
        showResult({ status: "collecting", count: chat.length });
        return;
    }

    // ------------------ TAKE LAST 6 ------------------
    const lastMessages = chat.slice(-MESSAGE_THRESHOLD);

    console.log("Sending:", lastMessages);

    sendChatData(lastMessages);
}

// ------------------ SEND TO BACKEND ------------------
async function sendChatData(chat) {
    try {
        const response = await fetch("http://localhost:3000/chat-check", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ chat })
        });

        const result = await response.json();

        console.log("Bot Score:", result.score);

        showResult(result);

    } catch (error) {
        console.error("Backend error:", error);
    }
}

// ------------------ UI OVERLAY ------------------
function showResult(result) {
    let overlay = document.getElementById("ai-detector-overlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "ai-detector-overlay";

        overlay.style.position = "fixed";
        overlay.style.top = "10px";
        overlay.style.right = "10px";
        overlay.style.background = "#000";
        overlay.style.color = "#fff";
        overlay.style.padding = "10px";
        overlay.style.zIndex = "9999";
        overlay.style.borderRadius = "8px";
        overlay.style.fontSize = "12px";

        document.body.appendChild(overlay);
    }

    if (result.status === "collecting") {
        overlay.innerText = `Collecting data... (${result.count}/${MESSAGE_THRESHOLD})`;
    } else {
        overlay.innerText = `AI Probability: ${result.score}`;
    }
}

// ------------------ OPTIMIZED OBSERVER ------------------
const observer = new MutationObserver(() => {
    if (!isActive) return;

    // 🔥 Debounce to avoid multiple triggers
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
        processChat();
    }, 800); // wait for DOM to settle
});

// ------------------ START OBSERVING ------------------
observer.observe(document.body, {
    childList: true,
    subtree: true
});


