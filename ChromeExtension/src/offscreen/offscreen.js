
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// State 
let faceLandmarker = null;

// Liveness state
let blinkCount = 0, prevEAR = 1;
let headMovements = [], expressionChanges = 0;
let prevHead = "CENTER", prevSmile = false;

// Challenge state
let blinkCount2 = 0, prevEAR2 = 1;
let headDirection = "CENTER", headDirectionEverReached = "CENTER";

// ── EAR Calculation
function computeEAR(landmarks) {
  const eye = [33, 160, 158, 133, 153, 144];
  return Math.abs(landmarks[eye[1]].y - landmarks[eye[5]].y) /
         Math.abs(landmarks[eye[0]].x - landmarks[eye[3]].x);
}

// SETUP 
async function setup() {
  try {
    console.log("Loading MediaPipe WASM...");
    const vision = await FilesetResolver.forVisionTasks(
      chrome.runtime.getURL("mediapipe-wasm")
    );
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      },
      runningMode: "IMAGE", // ← IMAGE mode since we send frames manually
      numFaces: 1,
    });
    console.log("FaceLandmarker ready ✅");
  } catch (err) {
    console.error("Setup failed:", err);
  }
}

// ── HELPER — convert raw message data to OffscreenCanvas 
function imageDataToCanvas(raw) {
  const uint8 = new Uint8ClampedArray(raw.data);
  const imageData = new ImageData(uint8, raw.width, raw.height);
  const canvas = new OffscreenCanvas(raw.width, raw.height);
  canvas.getContext("2d").putImageData(imageData, 0, 0);
  return canvas;
}

// Livenes Frame
function processLivenessFrame(landmarks) {
  // Blink
  const ear = computeEAR(landmarks);
  if (prevEAR > 0.15 && ear < prevEAR * 0.7) blinkCount++;
  prevEAR = ear;

  // Head — swapped LEFT/RIGHT + wider thresholds
  const nose = landmarks[1];
  const current = nose.x > 0.50 ? "LEFT" : nose.x < 0.42 ? "RIGHT" : "CENTER";
  if (current !== prevHead) headMovements.push(current);
  prevHead = current;

  // Expression
  const width = Math.abs(landmarks[61].x - landmarks[291].x);
  const isSmile = width > 0.05;
  if (isSmile !== prevSmile) expressionChanges++;
  prevSmile = isSmile;
}

// CHALLENGE frame processing
function processChallengeFrame(landmarks) {
  // Blink
  const ear = computeEAR(landmarks);
  if (prevEAR2 > 0.15 && ear < prevEAR2 * 0.7) blinkCount2++;
  prevEAR2 = ear;

  // Head — swapped LEFT/RIGHT + wider thresholds + debug log
  const nose = landmarks[1];
  console.log("Nose X:", nose.x); // ← remove after confirming it works
  
  headDirection = nose.x > 0.50 ? "LEFT" : nose.x < 0.42 ? "RIGHT" : "CENTER";
  if (headDirection !== "CENTER") headDirectionEverReached = headDirection;
  
}

// MESSAGE LISTENER 
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.action === "IS_READY") {
    sendResponse({ ready: faceLandmarker !== null });
    return true;
  }

  if (msg.action === "PROCESS_LIVENESS_FRAME") {
    if (!faceLandmarker) { sendResponse({}); return true; }
    try {
      const canvas = imageDataToCanvas(msg.imageData);
      const results = faceLandmarker.detect(canvas); // OffscreenCanvas works
      if (results.faceLandmarks?.length) {
        processLivenessFrame(results.faceLandmarks[0]);
      }
    } catch (e) {
      console.error("Liveness frame error:", e.message);
    }
    sendResponse({});
    return true;
  }

  if (msg.action === "PROCESS_CHALLENGE_FRAME") {
    if (!faceLandmarker) { sendResponse({}); return true; }
    try {
      const canvas = imageDataToCanvas(msg.imageData);
      const results = faceLandmarker.detect(canvas); // OffscreenCanvas works
      if (results.faceLandmarks?.length) {
        processChallengeFrame(results.faceLandmarks[0]);
      }
    } catch (e) {
      console.error("Challenge frame error:", e.message);
    }
    sendResponse({});
    return true;
  }

  if (msg.action === "GET_LIVENESS_SCORE") {
    const blinkScore      = blinkCount >= 2 ? 1 : 0;
    const headScore       = new Set(headMovements).size >= 2 ? 1 : 0;
    const expressionScore = expressionChanges >= 2 ? 1 : 0;
    const score = 0.4 * blinkScore + 0.3 * headScore + 0.3 * expressionScore;
    console.log("Liveness score:", score);
    // Reset
    blinkCount = 0; prevEAR = 1; headMovements = [];
    expressionChanges = 0; prevHead = "CENTER"; prevSmile = false;
    sendResponse({ score });
    return true;
  }

  if (msg.action === "GET_CHALLENGE_SCORE") {
    const blinkCorrect = blinkCount2 >= msg.challenge.blink;
    const headCorrect  = headDirectionEverReached === msg.challenge.direction;
    const score = (blinkCorrect ? 0.5 : 0) + (headCorrect ? 0.5 : 0);
    console.log("Challenge score:", score);
    // Reset
    blinkCount2 = 0; prevEAR2 = 1;
    headDirection = "CENTER"; headDirectionEverReached = "CENTER";
    sendResponse({ score });
    return true;
  }
});

// INIT 
document.addEventListener("DOMContentLoaded", () => {
  setup();
});