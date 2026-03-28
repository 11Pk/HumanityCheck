// // Load MediaPipe
// import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// // GLOBAL VARIABLES

// let blinkCount = 0;
// let prevEAR = 1;

// let headMovements = [];
// let expressionChanges = 0;

// let prevHead = "CENTER";
// let prevSmile = false;


// // EAR CALCULATION

// function computeEAR(landmarks) {

//     const eye = [33, 160, 158, 133, 153, 144];

//     let vertical = Math.abs(
//         landmarks[eye[1]].y - landmarks[eye[5]].y
//     );

//     let horizontal = Math.abs(
//         landmarks[eye[0]].x - landmarks[eye[3]].x
//     );

//     return vertical / horizontal;
// }

// // BLINK DETECTION 

// function detectBlink(landmarks) {

//     let ear = computeEAR(landmarks);

//     // detect blink (open → closed)
//     if (prevEAR > 0.03 && ear < 0.02) {
//         blinkCount++;
//     }

//     prevEAR = ear;
// }


// // HEAD MOVEMENT TRACKING

// function detectHeadMovement(landmarks) {

//     const nose = landmarks[1];

//     let current;

//     if (nose.x > 0.6) current = "RIGHT";
//     else if (nose.x < 0.4) current = "LEFT";
//     else current = "CENTER";

//     // track changes
//     if (current !== prevHead) {
//         headMovements.push(current);
//     }

//     prevHead = current;
// }

// // FACIAL EXPRESSION TRACKING

// function detectExpression(landmarks) {

//     const leftMouth = landmarks[61];
//     const rightMouth = landmarks[291];

//     let width = Math.abs(leftMouth.x - rightMouth.x);

//     let isSmile = width > 0.05;

//     if (isSmile !== prevSmile) {
//         expressionChanges++;
//     }

//     prevSmile = isSmile;
// }


// // MEDIAPIPE SETUP
// function setupFaceMesh() {

//   const faceMesh = new FaceMesh({
//     locateFile: (file) =>
//       `/node_modules/@mediapipe/face_mesh/${file}` // ✅ local path
//   });

//     faceMesh.setOptions({
//         maxNumFaces: 1,
//         refineLandmarks: true
//     });

//     faceMesh.onResults(results => {

//         if (!results.multiFaceLandmarks) return;

//         const landmarks = results.multiFaceLandmarks[0];

//         detectBlink(landmarks);
//         detectHeadMovement(landmarks);
//         detectExpression(landmarks);
//     });

//     return faceMesh;
// }

// // FRAME LOOP

// async function processFrames(video, faceMesh) {
//     await faceMesh.send({ image: video });
//     requestAnimationFrame(() => processFrames(video, faceMesh));
// }

// // FINAL EVALUATION
// function evaluateLiveness() {

//     // Blink frequency (per 10 sec)
//     let blinkScore = blinkCount >= 2 ? 1 : 0;

//     // Head movement diversity
//     let uniqueMoves = new Set(headMovements).size;
//     let headScore = uniqueMoves >= 2 ? 1 : 0;

//     // Expression variability
//     let expressionScore = expressionChanges >= 2 ? 1 : 0;

//     let finalScore = (
//         0.4 * blinkScore +
//         0.3 * headScore +
//         0.3 * expressionScore
//     );

//    return(finalScore);
// }


// export async function startLiveness(video) {

   
//     // await loadMediaPipe();
//     const faceMesh = setupFaceMesh();

//     processFrames(video, faceMesh);

  
//      let score=evaluateLiveness();
//      return(score);
    
// }

import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// GLOBAL VARIABLES
let blinkCount      = 0;
let prevEAR         = 1;
let headMovements   = [];
let expressionChanges = 0;
let prevHead        = "CENTER";
let prevSmile       = false;
let faceLandmarker  = null;

// EAR CALCULATION
function computeEAR(landmarks) {
  const eye = [33, 160, 158, 133, 153, 144];
  let vertical   = Math.abs(landmarks[eye[1]].y - landmarks[eye[5]].y);
  let horizontal = Math.abs(landmarks[eye[0]].x - landmarks[eye[3]].x);
  return vertical / horizontal;
}

// BLINK DETECTION
function detectBlink(landmarks) {
  let ear = computeEAR(landmarks);
  if (prevEAR > 0.03 && ear < 0.02) {
    blinkCount++;
  }
  prevEAR = ear;
}

// HEAD MOVEMENT TRACKING
function detectHeadMovement(landmarks) {
  const nose = landmarks[1];
  let current;

  if (nose.x > 0.6)      current = "RIGHT";
  else if (nose.x < 0.4) current = "LEFT";
  else                    current = "CENTER";

  if (current !== prevHead) {
    headMovements.push(current);
  }
  prevHead = current;
}

// FACIAL EXPRESSION TRACKING
function detectExpression(landmarks) {
  const leftMouth  = landmarks[61];
  const rightMouth = landmarks[291];
  let width   = Math.abs(leftMouth.x - rightMouth.x);
  let isSmile = width > 0.05;

  if (isSmile !== prevSmile) {
    expressionChanges++;
  }
  prevSmile = isSmile;
}

// MEDIAPIPE SETUP
async function setupFaceLandmarker() {
//   const vision = await FilesetResolver.forVisionTasks(
//     "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
//   );
const vision = await FilesetResolver.forVisionTasks(
  chrome.runtime.getURL("mediapipe-wasm") // ✅ loads from extension bundle, no CDN
);

//   faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
//     baseOptions: {
//       modelAssetPath:
//         "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
//     },
//     runningMode: "VIDEO",
//     numFaces: 1,
//   });

  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: chrome.runtime.getURL("face_landmarker.task"), // ✅ FIXED
    },
    runningMode: "VIDEO",
    numFaces: 1,
  });
}

// FRAME LOOP
function processFrames(video) {
  if (!faceLandmarker) {
    requestAnimationFrame(() => processFrames(video));
    return;
  }

  const results = faceLandmarker.detectForVideo(video, performance.now());

  if (results.faceLandmarks?.length) {
    const landmarks = results.faceLandmarks[0];
    detectBlink(landmarks);
    detectHeadMovement(landmarks);
    detectExpression(landmarks);
  }

  requestAnimationFrame(() => processFrames(video));
}

// FINAL EVALUATION
function evaluateLiveness() {
  let blinkScore      = blinkCount >= 2 ? 1 : 0;
  let uniqueMoves     = new Set(headMovements).size;
  let headScore       = uniqueMoves >= 2 ? 1 : 0;
  let expressionScore = expressionChanges >= 2 ? 1 : 0;

  return (
    0.4 * blinkScore +
    0.3 * headScore  +
    0.3 * expressionScore
  );
}

export async function startLiveness(video) {
  // Reset all counters
  blinkCount        = 0;
  prevEAR           = 1;
  headMovements     = [];
  expressionChanges = 0;
  prevHead          = "CENTER";
  prevSmile         = false;

  await setupFaceLandmarker();

  processFrames(video);

  // Wait 10s for observation window before scoring
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(evaluateLiveness());
    }, 10000);
  });
}
