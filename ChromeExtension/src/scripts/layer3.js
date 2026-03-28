
let cameraStream = null;
let cameraVideo  = null;

async function startCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    cameraVideo  = document.createElement("video");
    cameraVideo.srcObject = cameraStream;
    cameraVideo.autoplay  = true;
    cameraVideo.style.cssText = "position:fixed;bottom:10px;right:10px;width:200px;z-index:9999;";
    document.body.appendChild(cameraVideo);
    await new Promise(res => cameraVideo.onloadedmetadata = res);
    console.log("Camera started ✅");
    return true;
  } catch (err) {
    console.error("Camera failed:", err);
    return false;
  }
}

function captureFrame() {
  const canvas = document.createElement("canvas");
  canvas.width  = cameraVideo.videoWidth  || 640;
  canvas.height = cameraVideo.videoHeight || 480;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(cameraVideo, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return {
    data: Array.from(imageData.data), // ← serializable
    width: canvas.width,
    height: canvas.height
  };
}

function showPermissionDialog(onAccept) {
  const overlay = document.createElement("div");
  overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;
    background:rgba(0,0,0,0.6);z-index:9999;display:flex;
    justify-content:center;align-items:center;`;
  const box = document.createElement("div");
  box.style.cssText = "background:#fff;padding:20px;border-radius:10px;";
  box.innerHTML = `
    <h3>HumanityCheck</h3>
    <p>This extension needs camera access for verification.</p>
    <button id="allowBtn">Allow</button>
  `;
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  document.getElementById("allowBtn").onclick = () => {
    overlay.remove();
    onAccept();
  };
}

export { cameraVideo, captureFrame };
// layer3.js — add this function
export async function startLayer3Silent() {
  if (!cameraVideo) return null; // camera not initialized

  // directly run liveness on existing video, no dialog
  const interval = setInterval(async () => {
    const frame = captureFrame();
    await chrome.runtime.sendMessage({
      action: "PROCESS_LIVENESS_FRAME",
      imageData: { data: Array.from(frame.data), width: frame.width, height: frame.height }
    });
  }, 200);

  return new Promise((resolve) => {
    setTimeout(async () => {
      clearInterval(interval);
      const response = await chrome.runtime.sendMessage({ action: "GET_LIVENESS_SCORE" });
      resolve(response?.score ?? null);
    }, 10000);
  });
}
export function startLayer3() {
  return new Promise((resolve) => {
    showPermissionDialog(async () => {
      const ok = await startCamera();
      if (!ok) { resolve(null); return; }

      // Wait for offscreen MediaPipe to be ready
      await waitForOffscreen();

      // Capture frames for 10 seconds and send to offscreen
      const interval = setInterval(async () => {
        const frame = captureFrame();
        await chrome.runtime.sendMessage({
          action: "PROCESS_LIVENESS_FRAME",
          imageData: { data: Array.from(frame.data), width: frame.width, height: frame.height }
        });
      }, 200); // 5fps

      setTimeout(async () => {
        clearInterval(interval);
        const response = await chrome.runtime.sendMessage({ action: "GET_LIVENESS_SCORE" });
        resolve(response?.score ?? null);
      }, 10000);
    });
  });
}

async function waitForOffscreen() {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await chrome.runtime.sendMessage({ action: "IS_READY" });
      if (res?.ready) return;
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  console.warn("Offscreen never became ready");
}