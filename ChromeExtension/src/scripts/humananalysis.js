// // Load MediaPipe
// import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// // GLOBAL VARIABLES
// let blinkCount2 = 0;
// let prevEAR2 = 1;

// let headDirection = "CENTER";
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

//     if (prevEAR2 > 0.03 && ear < 0.02) {
//         blinkCount2++;
//         console.log("Blink:", blinkCount2);
//     }

//     prevEAR2 = ear;
// }

// // HEAD MOVEMENT 

// function detectHeadMovement(landmarks) {

//     const nose = landmarks[1];

//     if (nose.x > 0.6) {
//         headDirection = "RIGHT";
//     } else if (nose.x < 0.4) {
//         headDirection = "LEFT";
//     } else {
//         headDirection = "CENTER";
//     }

//     console.log("Head:", headDirection);
// }

// // MEDIAPIPE SETUP

// function setupFaceMesh() {

//   const faceMesh = new FaceMesh({
//     locateFile: (file) =>
//       `/node_modules/@mediapipe/face_mesh/${file}`
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
//     });

//     return faceMesh;
// }


// // FRAME LOOP

// async function processFrames(video, faceMesh) {
//     await faceMesh.send({ image: video });
//     requestAnimationFrame(() => processFrames(video, faceMesh));
// }


// // VALIDATE CHALLENGE

// function evaluateChallenge(challenge) {

//     let blinkCorrect = blinkCount2 >= challenge.blink;
//     let headCorrect = headDirection === challenge.direction;

//      let score = 0;

//   if (blinkCorrect) score += 0.5;
//   if (headCorrect) score += 0.5;

//  return(score);

   
// }

// export async function startLayer(video,challenge) {

  
//     const faceMesh = setupFaceMesh();

//     processFrames(video, faceMesh);

//     setTimeout(() => {
//         evaluateChallenge(challenge);
//     }, 10000);
// }

import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// GLOBAL VARIABLES
let blinkCount2 = 0;
let prevEAR2 = 1;
let headDirection = "CENTER";
let faceLandmarker = null;

// EAR CALCULATION
function computeEAR(landmarks) {
  const eye = [33, 160, 158, 133, 153, 144];
  let vertical = Math.abs(landmarks[eye[1]].y - landmarks[eye[5]].y);
  let horizontal = Math.abs(landmarks[eye[0]].x - landmarks[eye[3]].x);
  return vertical / horizontal;
}

// BLINK DETECTION
function detectBlink(landmarks) {
  let ear = computeEAR(landmarks);
  if (prevEAR2 > 0.03 && ear < 0.02) {
    blinkCount2++;
    console.log("Blink:", blinkCount2);
  }
  prevEAR2 = ear;
}

// HEAD MOVEMENT
function detectHeadMovement(landmarks) {
  const nose = landmarks[1];
  if (nose.x > 0.6)      headDirection = "RIGHT";
  else if (nose.x < 0.4) headDirection = "LEFT";
  else                    headDirection = "CENTER";
  console.log("Head:", headDirection);
}

// MEDIAPIPE SETUP
async function setupFaceLandmarker() {
    if (faceLandmarker) return;
//   const vision = await FilesetResolver.forVisionTasks(
//     "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
//   );
  const vision = await FilesetResolver.forVisionTasks(
  chrome.runtime.getURL("mediapipe-wasm") // loads from extension bundle, no CDN
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
  }

  requestAnimationFrame(() => processFrames(video));
}

// VALIDATE CHALLENGE
function evaluateChallenge(challenge) {
  let blinkCorrect = blinkCount2 >= challenge.blink;
  let headCorrect  = headDirection === challenge.direction;

  let score = 0;
  if (blinkCorrect) score += 0.5;
  if (headCorrect)  score += 0.5;

  return score;
}

export async function startLayer(video, challenge) {
  // Reset counters for this challenge
  blinkCount2   = 0;
  prevEAR2      = 1;
  headDirection = "CENTER";

  if (!faceLandmarker) {
    await setupFaceLandmarker();
  }

  processFrames(video);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(evaluateChallenge(challenge));
    }, 10000);
  });
}
