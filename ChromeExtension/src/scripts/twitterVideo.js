// console.log("Deepfake detector loaded");

// // Observe DOM for videos
// const observer = new MutationObserver(() => {
//     const videos = document.querySelectorAll("video");

//     videos.forEach(video => {
//         if (!video.dataset.processed) {
//             video.dataset.processed = "true";

//             //WAIT until video is ready
//             waitForVideo(video).then(() => {
//                 processVideo(video);
//             });
//         }
//     });
// });

// observer.observe(document.body, {
//     childList: true,
//     subtree: true
// });


// function waitForVideo(video) {
//     return new Promise(resolve => {
//         if (video.readyState >= 2 && video.videoWidth > 0) {
//             resolve();
//         } else {
//             video.addEventListener("loadeddata", () => resolve(), { once: true });
//         }
//     });
// }

// // MAIN FUNCTION
// async function processVideo(video) {
//     console.log("Video detected");

//     let frames = [];

//     // Capture 5 frames
//     for (let i = 0; i < 5; i++) {
//         await sleep(1000);

//         if (video.videoWidth === 0) {
//             console.log("Skipping frame (video not ready)");
//             continue;
//         }

//         let canvas = document.createElement("canvas");
//         canvas.width = video.videoWidth;
//         canvas.height = video.videoHeight;

//         let ctx = canvas.getContext("2d");
//         ctx.drawImage(video, 0, 0);

//         let base64 = canvas.toDataURL("image/jpeg", 0.6);
//         frames.push(base64);
//     }

//     console.log("Frames captured:", frames.length);

//     // if no frames → stop
//     if (frames.length === 0) {
//         console.log("No frames captured");
//         return;
//     }

//     showLoading(video);

//     try {
//         console.log("Sending to backend...");

//         let response = await fetch("http://127.0.0.1:8000/analyze-video", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({ frames })
//         });

//         let result = await response.json();
//         console.log("Backend result:", result);

//         showResult(video, result);

//     } catch (err) {
//         console.error("Backend error:", err);
//         showError(video);
//     }
// }

// // ---------------- UI ----------------

// function showLoading(video) {
//     createBadge(video, "Analyzing...", "black");
// }

// function showError(video) {
//     createBadge(video, "Error", "gray");
// }

// function showResult(video, result) {
//     removeBadge(video);

//     if (!result || result.real_confidence === undefined) {
//         console.log("Invalid result:", result);
//         showError(video);
//         return;
//     }

//     const realConfidence = result.real_confidence;
//     const fakeConfidence = 1 - realConfidence;

//     const isFake = fakeConfidence > 0.5;

//     const label = isFake ? "⚠️AI-Generated" : "✅Authentic";
//     const confidence = isFake ? fakeConfidence : realConfidence;

//     const content = `
//         <div class="title">${label}</div>
//         <div class="confidence">
//             Confidence: ${(confidence * 100).toFixed(2)}%
//         </div>
//         <div class="bar">
//             <div class="fill" style="width:${confidence * 100}%"></div>
//         </div>
//     `;

//     createBadge(video, content, isFake ? "red" : "green", true);
// }

// // ---------------- HELPERS ----------------
// function createBadge(video, content, color, isHTML = false) {
//     removeBadge(video);

//     let badge = document.createElement("div");
//     badge.className = "deepfake-badge " + color;

//     if (isHTML) {
//         badge.innerHTML = content;
//     } else {
//         badge.innerText = content;
//     }

//     // ✅ Find correct container (Twitter video wrapper)
//     const container = video.closest("div[data-testid='videoPlayer']") 
//                    || video.parentElement;

//     // ✅ Ensure positioning works
//     container.style.position = "relative";

//     // ✅ STRONG UI FIX
//     badge.style.position = "absolute";
//     badge.style.top = "10px";
//     badge.style.right = "10px";   // 👈 move to top-right corner
//     badge.style.zIndex = "999999"; // 👈 ensure always visible

//     container.appendChild(badge);
// }

// function removeBadge(video) {
//     const old = video.parentElement.querySelector(".deepfake-badge");
//     if (old) old.remove();
// }

// function sleep(ms) {
//     return new Promise(r => setTimeout(r, ms));
// }


// // // console.log("Deepfake detector loaded");

// // // // detect videos dynamically
// // // const observer = new MutationObserver(() => {
// // //     const videos = document.querySelectorAll("video");

// // //     videos.forEach(video => {
// // //         if (!video.dataset.checked) {
// // //             video.dataset.checked = "true";
// // //             processVideo(video);
// // //         }
// // //     });
// // // });

// // // observer.observe(document.body, { childList: true, subtree: true });

// // // async function processVideo(video) {
// // //     console.log("Video detected");

// // //     // capture frames
// // //     let frames = [];

// // //     for (let i = 0; i < 5; i++) {
// // //         await new Promise(r => setTimeout(r, 1000));

// // //         let canvas = document.createElement("canvas");
// // //         canvas.width = video.videoWidth;
// // //         canvas.height = video.videoHeight;

// // //         let ctx = canvas.getContext("2d");
// // //         ctx.drawImage(video, 0, 0);

// // //         let base64 = canvas.toDataURL("image/jpeg");
// // //         frames.push(base64);
// // //     }

// // //     // send to backend
// // //     let response = await fetch("http://127.0.0.1:8000/analyze-video", {
// // //         method: "POST",
// // //         headers: {
// // //             "Content-Type": "application/json"
// // //         },
// // //         body: JSON.stringify({ frames: frames })
// // //     });

// // //     let result = await response.json();
// // //     console.log(result);

// // //     showResult(video, result);
// // // }

// // // function showResult(video, result) {
// // //     // Remove old badge if exists
// // //     const oldBadge = video.parentElement.querySelector(".deepfake-badge");
// // //     if (oldBadge) oldBadge.remove();

// // //     const fakeScore = result.fake_prob;
// // //     const realScore = 1 - fakeScore;
// // //     const isFake = fakeScore > 0.5;

// // //     let badge = document.createElement("div");
// // //     badge.className = "deepfake-badge";

// // //     badge.innerHTML = `
// // //         <div style="font-weight:600;">
// // //             ${isFake ? "⚠️ Deepfake" : "✅ Real"}
// // //         </div>
// // //         <div style="font-size:11px; margin-top:4px;">
// // //             Fake Score: ${(fakeScore * 100).toFixed(2)}%
// // //         </div>
// // //         <div style="font-size:11px; opacity:0.8;">
// // //             Real Score: ${(realScore * 100).toFixed(2)}%
// // //         </div>
// // //     `;

// // //     // Styling
// // //     badge.style.position = "absolute";
// // //     badge.style.top = "10px";
// // //     badge.style.left = "10px";
// // //     badge.style.background = isFake ? "rgba(200,0,0,0.9)" : "rgba(0,150,0,0.9)";
// // //     badge.style.color = "white";
// // //     badge.style.padding = "10px 12px";
// // //     badge.style.borderRadius = "10px";
// // //     badge.style.fontSize = "12px";
// // //     badge.style.fontFamily = "Arial, sans-serif";
// // //     badge.style.zIndex = "9999";
// // //     badge.style.boxShadow = "0 3px 10px rgba(0,0,0,0.4)";
// // //     badge.style.lineHeight = "1.4";

// // //     // Ensure parent is positioned
// // //     const parent = video.parentElement;
// // //     if (getComputedStyle(parent).position === "static") {
// // //         parent.style.position = "relative";
// // //     }

// // //     parent.appendChild(badge);
// // // }

// // // // function showResult(video, result) {
// // // //     // Remove old badge if exists
// // // //     const oldBadge = video.parentElement.querySelector(".deepfake-badge");
// // // //     if (oldBadge) oldBadge.remove();

// // // //     // ⚠️ IMPORTANT FIX HERE
// // // //     const realScore = result.fake_prob;       // model output
// // // //     const fakeScore = 1 - realScore;          // derived

// // // //     const isFake = fakeScore > 0.5;

// // // //     let badge = document.createElement("div");
// // // //     badge.className = "deepfake-badge";

// // // //     badge.innerHTML = `
// // // //         <div style="font-weight:600;">
// // // //             ${isFake ? "⚠️ Deepfake" : "✅ Real"}
// // // //         </div>
// // // //         <div style="font-size:11px; margin-top:4px;">
// // // //             Fake Score: ${(fakeScore * 100).toFixed(2)}%
// // // //         </div>
// // // //         <div style="font-size:11px; opacity:0.8;">
// // // //             Real Score: ${(realScore * 100).toFixed(2)}%
// // // //         </div>

// // // //         <div style="margin-top:6px; background:#ffffff33; height:4px; border-radius:4px;">
// // // //             <div style="
// // // //                 width:${fakeScore * 100}%;
// // // //                 height:100%;
// // // //                 background:white;
// // // //                 border-radius:4px;
// // // //             "></div>
// // // //         </div>
// // // //     `;

// // // //     // Styling
// // // //     badge.style.position = "absolute";
// // // //     badge.style.top = "10px";
// // // //     badge.style.left = "10px";
// // // //     badge.style.background = isFake ? "rgba(200,0,0,0.9)" : "rgba(0,150,0,0.9)";
// // // //     badge.style.color = "white";
// // // //     badge.style.padding = "10px 12px";
// // // //     badge.style.borderRadius = "10px";
// // // //     badge.style.fontSize = "12px";
// // // //     badge.style.fontFamily = "Arial, sans-serif";
// // // //     badge.style.zIndex = "9999";
// // // //     badge.style.boxShadow = "0 3px 10px rgba(0,0,0,0.4)";
// // // //     badge.style.lineHeight = "1.4";

// // // //     // Ensure parent is positioned
// // // //     const parent = video.parentElement;
// // // //     if (getComputedStyle(parent).position === "static") {
// // // //         parent.style.position = "relative";
// // // //     }

// // // //     parent.appendChild(badge);
// // // // }


// // console.log("Deepfake detector loaded");

// // const observer = new MutationObserver(() => {
// //     const videos = document.querySelectorAll("video");
// //     videos.forEach(video => {
// //         if (!video.dataset.checked) {
// //             video.dataset.checked = "true";
// //             processVideo(video);
// //         }
// //     });
// // });

// // observer.observe(document.body, { childList: true, subtree: true });

// // async function processVideo(video) {
// //     console.log("Video detected, capturing frames...");
// //     let frameDataUrls = [];

// //     // Capture 5 frames with 1-second intervals
// //     for (let i = 0; i < 5; i++) {
// //         await new Promise(r => setTimeout(r, 1000));

// //         let canvas = document.createElement("canvas");
// //         canvas.width = video.videoWidth;
// //         canvas.height = video.videoHeight;

// //         let ctx = canvas.getContext("2d");
// //         ctx.drawImage(video, 0, 0);

// //         // Convert to Base64 to send to backend
// //         let base64 = canvas.toDataURL("image/jpeg");
// //         frameDataUrls.push(base64);
// //     }

// //     try {
// //         let response = await fetch("http://127.0.0.1:8000/analyze-video", {
// //             method: "POST",
// //             headers: { "Content-Type": "application/json" },
// //             body: JSON.stringify({ frames: frameDataUrls })
// //         });

// //         let result = await response.json();
// //         // Backend should return { "avg_probability": float }
// //         updateVideoUI(video, result.avg_probability);
// //     } catch (error) {
// //         console.error("Backend communication error:", error);
// //     }
// // }

// // function updateVideoUI(video, modelOutputScore) {
// //     const oldBadge = video.parentElement.querySelector(".deepfake-badge");
// //     if (oldBadge) oldBadge.remove();

// //     /**
// //      * LOGIC REFINEMENT:
// //      * MesoNet typically outputs ~1.0 for Real and ~0.0 for Deepfake.
// //      */
// //     const realProbability = modelOutputScore;
// //     const deepfakeProbability = 1 - modelOutputScore;

// //     // Classification threshold
// //     const isDeepfake = deepfakeProbability > 0.5;

// //     let badge = document.createElement("div");
// //     badge.className = "deepfake-badge";

// //     // Build UI with explicit labeling
// //     badge.innerHTML = `
// //         <div style="font-weight:bold; font-size:14px; margin-bottom:5px;">
// //             ${isDeepfake ? "⚠️ DEEPFAKE DETECTED" : "✅ VERIFIED HUMAN"}
// //         </div>
// //         <div style="display: flex; flex-direction: column; gap: 2px; font-family: monospace;">
// //             <span>Deepfake Score: ${(deepfakeProbability * 100).toFixed(2)}%</span>
// //             <span>Real Human Score: ${(realProbability * 100).toFixed(2)}%</span>
// //         </div>
// //         <div style="margin-top:8px; background:rgba(255,255,255,0.2); height:6px; border-radius:3px; overflow:hidden;">
// //             <div style="
// //                 width: ${isDeepfake ? (deepfakeProbability * 100) : (realProbability * 100)}%;
// //                 height: 100%;
// //                 background: ${isDeepfake ? '#ff4b2b' : '#00f2fe'};
// //                 transition: width 0.5s ease;
// //             "></div>
// //         </div>
// //     `;

// //     // Apply styles
// //     Object.assign(badge.style, {
// //         position: "absolute",
// //         top: "15px",
// //         left: "15px",
// //         backgroundColor: isDeepfake ? "rgba(180, 0, 0, 0.9)" : "rgba(0, 100, 0, 0.9)",
// //         color: "white",
// //         padding: "12px 16px",
// //         borderRadius: "8px",
// //         zIndex: "10000",
// //         boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
// //         minWidth: "180px",
// //         pointerEvents: "none" // Don't block clicks on the video
// //     });

// //     // Ensure parent can contain the absolute badge
// //     const parent = video.parentElement;
// //     if (window.getComputedStyle(parent).position === "static") {
// //         parent.style.position = "relative";
// //     }

// //     parent.appendChild(badge);
// // }



console.log("🚀 Deepfake detector loaded");

// ---------------- OBSERVER ----------------
const observer = new MutationObserver(() => {
    const videos = document.querySelectorAll("video");

    videos.forEach(video => {
        if (!video.dataset.processed) {
            video.dataset.processed = "true";

            waitForVideo(video).then(() => {
                processVideo(video);
            });
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// ---------------- WAIT FOR VIDEO ----------------
function waitForVideo(video) {
    return new Promise(resolve => {
        if (video.readyState >= 2 && video.videoWidth > 0) {
            resolve();
        } else {
            video.addEventListener("loadeddata", () => resolve(), { once: true });
        }
    });
}

// ---------------- MAIN FUNCTION ----------------
async function processVideo(video) {
    if (video.dataset.analyzed) return; // prevent duplicate calls
    video.dataset.analyzed = "true";

    console.log("🎥 Video detected");

    let frames = [];

    for (let i = 0; i < 5; i++) {
        await sleep(1000);

        if (video.videoWidth === 0) continue;

        let canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        let ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);

        let base64 = canvas.toDataURL("image/jpeg", 0.6);
        frames.push(base64);
    }

    console.log("✅ Frames captured:", frames.length);

    if (frames.length === 0) return;

    showLoading(video);

    try {
        console.log("🚀 Sending to backend...");

        let response = await fetch("http://127.0.0.1:8000/analyze-video", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ frames })
        });

        let result = await response.json();
        console.log("✅ Backend result:", result);

        showResult(video, result);

    } catch (err) {
        console.error("❌ Backend error:", err);
        showError(video);
    }
}

// ---------------- UI ----------------

function showLoading(video) {
    createBadge(video, "Analyzing...", false);
}

function showError(video) {
    createBadge(video, "Error analyzing video", false);
}

function showResult(video, result) {
    removeBadge(video);

    if (!result || result.real_confidence === undefined) {
        console.log("❌ Invalid result:", result);
        showError(video);
        return;
    }

    const realConfidence = result.real_confidence;
    const fakeConfidence = 1 - realConfidence;
    const isFake = fakeConfidence > 0.5;

    const label = isFake ? "AI-Generated" : "Authentic";
    const confidence = isFake ? fakeConfidence : realConfidence;
    const accent = isFake ? "#ff4d4f" : "#00d26a";

    const content = `
        <div style="
            font-weight:600;
            font-size:13px;
            display:flex;
            align-items:center;
            gap:6px;
        ">
            <span style="
                width:8px;
                height:8px;
                border-radius:50%;
                background:${accent};
                box-shadow:0 0 6px ${accent};
            "></span>
            ${label}
        </div>

        
        </div>
    `;

    createBadge(video, content, true);
}

// ---------------- BADGE CREATION ----------------

function createBadge(video, content, isHTML = false) {
    removeBadge(video);

    let badge = document.createElement("div");
    badge.className = "deepfake-badge";

    if (isHTML) {
        badge.innerHTML = content;
    } else {
        badge.innerText = content;
    }

    const container =
        video.closest("div[data-testid='videoPlayer']") ||
        video.parentElement;

    container.style.position = "relative";

    // 🌑 BLACK GLASS UI
    badge.style.position = "absolute";
    badge.style.top = "12px";
    badge.style.right = "12px";
    badge.style.zIndex = "999999";

    badge.style.background =
        "linear-gradient(135deg, rgba(0,0,0,0.85), rgba(20,20,20,0.75))";

    badge.style.backdropFilter = "blur(10px)";
    badge.style.webkitBackdropFilter = "blur(10px)";

    badge.style.color = "#ffffff";
    badge.style.padding = "12px 14px";
    badge.style.borderRadius = "14px";

    badge.style.fontSize = "12px";
    badge.style.fontFamily = "system-ui, -apple-system, sans-serif";
    badge.style.lineHeight = "1.4";

    badge.style.boxShadow = `
        0 0 0 1px rgba(255,255,255,0.1),
        0 6px 20px rgba(0,0,0,0.6)
    `;

    badge.style.border = "1px solid rgba(255,255,255,0.15)";
    badge.style.minWidth = "160px";

    badge.style.pointerEvents = "none";

    // ✨ ENTRY ANIMATION
    badge.style.opacity = "0";
    badge.style.transform = "translateY(-8px)";

    setTimeout(() => {
        badge.style.transition = "all 0.3s ease";
        badge.style.opacity = "1";
        badge.style.transform = "translateY(0)";
    }, 10);

    container.appendChild(badge);
}

// ---------------- HELPERS ----------------

function removeBadge(video) {
    const container =
        video.closest("div[data-testid='videoPlayer']") ||
        video.parentElement;

    const old = container.querySelector(".deepfake-badge");
    if (old) old.remove();
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}