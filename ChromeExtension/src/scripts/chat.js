

console.log("Content script loaded");

// ------------------ CONFIG ------------------
const MESSAGE_THRESHOLD = 5;

// ------------------ STATE ------------------
let lastMessageCount = 0;
let totalMessages = 0;
let isActive = false;

// ------------------ START DETECTION ON CLICK ------------------
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "START") {
        isActive = true;
        console.log("Detection started");
    }
});
function getMessageText(msg) {
    let span = msg.querySelector("span");

    //  RECEIVED MESSAGE
    if (span && span.innerText.trim() !== "") {
        return span.innerText.trim();
    }

    //  SENT MESSAGE
    // Extract only direct text (ignore span)
    let text = "";

    msg.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent;
        }
    });

    return text.trim();
}

function isMyMessage(msg) {
    return msg.closest(".message-out") !== null;
}

// ------------------ EXTRACT ONLY NEW MESSAGES ------------------
function extractNewMessages() {
    const messages = document.querySelectorAll(".message-spoiler-container");

    let newMessages = [];

    for (let i = lastMessageCount; i < messages.length; i++) {
        let msg = messages[i];

        let text = getMessageText(msg);

        if (text !== "") {
            let sender = isMyMessage(msg) ? "me" : "other";

            newMessages.push({
                text: text,
                sender: sender,
                time: Date.now()
            });
        }
    }

    lastMessageCount = messages.length;
    totalMessages = messages.length;

    return newMessages;
}

// ------------------ SEND DATA TO BACKEND ------------------
async function sendChatData(newChat) {
    try {
        let response = await fetch("http://localhost:3000/chat-check", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ chat: newChat })
        });

        let result = await response.json();

        console.log("Bot Score:", result.score);

        showResult(result);

    } catch (error) {
        console.error("Error sending data:", error);
    }
}

// ------------------ UI OVERLAY ------------------
function showResult(result) {
    let existing = document.getElementById("ai-detector-overlay");

    if (!existing) {
        let div = document.createElement("div");
        div.id = "ai-detector-overlay";

        div.style.position = "fixed";
        div.style.top = "10px";
        div.style.right = "10px";
        div.style.background = "#000";
        div.style.color = "#fff";
        div.style.padding = "10px";
        div.style.zIndex = "9999";
        div.style.borderRadius = "8px";

        document.body.appendChild(div);
        existing = div;
    }

    if (totalMessages < MESSAGE_THRESHOLD) {
        existing.innerText = `Collecting data... (${totalMessages}/${MESSAGE_THRESHOLD})`;
    } else {
        existing.innerText = `AI Probability: ${result.score}`;
    }
}

// ------------------ OBSERVER (REAL-TIME DETECTION) ------------------
const observer = new MutationObserver(() => {

    //  Only run after user clicks START
    if (!isActive) return;

    let newMessages = extractNewMessages();

    //  If no new messages → do nothing
    if (newMessages.length === 0) return;

    console.log("New messages:", newMessages);

    //  Threshold check
    if (totalMessages < MESSAGE_THRESHOLD) {
        showResult({ status: "collecting" });
        return;
    }

    //  Send only NEW messages
    sendChatData(newMessages);
});

// ------------------ START OBSERVING ------------------
observer.observe(document.body, {
    childList: true,
    subtree: true
});