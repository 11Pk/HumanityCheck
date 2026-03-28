// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import { crx } from '@crxjs/vite-plugin'
// import manifest from './manifest.json'
// import { viteStaticCopy } from "vite-plugin-static-copy";

// // https://vite.dev/config/
// export default defineConfig({
//    build: {
//     rollupOptions: {
//       input: {
//         offscreen: "src/offscreen/offscreen.html",  // ← add this
//       }
//     }
//   },
//   plugins: [react()  ,
//     crx({ manifest }),  viteStaticCopy({
//       targets: [{
//         src: "node_modules/@mediapipe/tasks-vision/wasm/*",
//         dest: "mediapipe-wasm"
//       }]
//     })],
    
// })
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'
import { viteStaticCopy } from "vite-plugin-static-copy"

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
    viteStaticCopy({
      targets: [{
        src: "node_modules/@mediapipe/tasks-vision/wasm/*.{js,wasm}",
        dest: "mediapipe-wasm"
      }]
    })
  ],
  build: {
    rollupOptions: {
      input: {
        offscreen: "src/offscreen/offscreen.html"
      }
    }
  }
})
