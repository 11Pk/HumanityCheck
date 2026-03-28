function showChallengeUI(task, onStart) {
    console.log("Showing Layer 4 popup");
  const overlay = document.createElement("div");

  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.7)";
  overlay.style.zIndex = "999999";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
overlay.style.position = "fixed";
overlay.style.pointerEvents = "auto";
overlay.style.visibility = "visible";
overlay.style.opacity = "1";

  const box = document.createElement("div");
  box.style.background = "#fff";
  box.style.padding = "20px";
  box.style.borderRadius = "10px";

  box.innerHTML = `
    <h3>Humanity Check</h3>
    <p>${task}</p>
    <button id="startTest">Start</button>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  document.getElementById("startTest").onclick = () => {
    overlay.remove();
    onStart();
  };
}

async function getTemporaryVideo(duration = 3000) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });

    const video = document.createElement("video");
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;

  
    video.style.position = "fixed";
    video.style.bottom = "10px";
    video.style.right = "10px";
    video.style.width = "200px";
    video.style.zIndex = "10000";
    // video.style.display = "none";
    document.body.appendChild(video);

    // Wait for video to be ready
    await new Promise((res) => {
      video.onloadedmetadata = () => res();
    });

    return new Promise((resolve) => {
      setTimeout(() => {
        // Stop camera
        stream.getTracks().forEach(track => track.stop());

        // Remove from DOM
        video.remove();

        resolve(video); // return video element
      }, duration);
    });

  } catch (err) {
    console.error("Camera error:", err);
    return null;
  }
}

async function runSingleChallenge(task) {
  return new Promise((resolve) => {
    showChallengeUI(task, async () => {
      const video = await getTemporaryVideo(3000);

      if (video) {
        const interval = setInterval(() => {
          console.log("Processing:", task);
          // processFrame(video);
        }, 200);

        setTimeout(() => {
          clearInterval(interval);
          resolve(); 
        }, 3000);
      } else {
        resolve();
      }
    });
  });
}


export async function startLayer4() {
  const tasks = [
    "Blink your eyes",
    "Turn your head left",
    "Turn your head right"
  ];

  for (const task of tasks) {
    await runSingleChallenge(task);
  }

  console.log("All Layer 4 challenges completed");
}