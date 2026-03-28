export let sharedVideoElement = null;
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });

    const video = document.createElement("video");
    video.srcObject = stream;
    video.autoplay = true;

   
    video.style.position = "fixed";
    video.style.bottom = "10px";
    video.style.right = "10px";
    video.style.width = "200px";
    video.style.zIndex = "9999";
    video.style.display = "none";
    document.body.appendChild(video);
    
    return video;

  } catch (err) {
    console.error("Camera error:", err);
    return null;
  }
}
function showPermissionDialog(onAccept) {
  const overlay = document.createElement("div");

  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.6)";
  overlay.style.zIndex = "9999";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";

  const box = document.createElement("div");
  box.style.background = "#fff";
  box.style.padding = "20px";
  box.style.borderRadius = "10px";
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
// export async function startLayer3() {
//   showPermissionDialog(async () => {
//     const video = await startCamera();
//     if(video)
//         sharedVideoElement=video;
//     //prcoess frames
//     // if (video) startFrameStreaming(video);
//   });
// }
export function startLayer3() {
  return new Promise((resolve) => {
    showPermissionDialog(async () => {
      const video = await startCamera();

      if (video) {
        sharedVideoElement = video;
        console.log("Camera initialized ");
      }

      resolve(); 
    });
  });
}