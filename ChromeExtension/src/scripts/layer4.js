
import { captureFrame } from "./layer3.js";

let isLayer4Active = false;

function showChallengeUI(task, onStart) {
  const overlay = document.createElement("div");
  overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;
    background:rgba(0,0,0,0.7);z-index:999999;display:flex;
    justify-content:center;align-items:center;pointer-events:auto;`;
  const box = document.createElement("div");
  box.style.cssText = "background:#fff;padding:20px;border-radius:10px;";
  box.innerHTML = `<h3>Humanity Check</h3><p>${task}</p><button id="startTest">Start</button>`;
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  document.getElementById("startTest").onclick = () => { overlay.remove(); onStart(); };
}

function createChallengeFromTask(task) {
  if (task === "Blink your eyes")      return { blink: 1, direction: "CENTER" };
  if (task === "Turn your head left")  return { blink: 0, direction: "LEFT" };
  if (task === "Turn your head right") return { blink: 0, direction: "RIGHT" };
  return { blink: 0, direction: "CENTER" };
}

async function runSingleChallenge(task, challenge) {
  return new Promise((resolve) => {
    showChallengeUI(task, async () => {

      // Capture frames for 10s and send to offscreen
      const interval = setInterval(async () => {
        const frame = captureFrame();
        await chrome.runtime.sendMessage({
          action: "PROCESS_CHALLENGE_FRAME",
          imageData: { data: Array.from(frame.data), width: frame.width, height: frame.height }
        });
      },200);

      setTimeout(async () => {
        clearInterval(interval);
        const response = await chrome.runtime.sendMessage({
          action: "GET_CHALLENGE_SCORE",
          challenge
        });
        resolve(response?.score ?? 0);
      }, 10000);
    });
  });
}

export async function startLayer4() {
  if (isLayer4Active) return null;
  isLayer4Active = true;

  try {
    const tasks = ["Blink your eyes", "Turn your head left", "Turn your head right"];
    let score = 0;
    for (const task of tasks) {
      score += await runSingleChallenge(task, createChallengeFromTask(task));
    }
    score = score / 3;
    console.log("Layer 4 score:", score);
    return score;
  } finally {
    isLayer4Active = false; //  always resets, even on error
  }
}