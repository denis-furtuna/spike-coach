/* Body tracking with MediaPipe Pose Landmarker, run on the device.
   The video is read from a local file and never uploaded anywhere. The library and model are
   bundled in vendor/ (see vendor/SHA256SUMS), so nothing is loaded from other sites. */
const Pose = (() => {
  "use strict";

  const here = path => new URL(path, document.baseURI).href;
  const BUNDLE = here("vendor/mediapipe/vision_bundle.mjs");
  const WASM = here("vendor/mediapipe/wasm");
  const MODEL = here("vendor/models/pose_landmarker_full.task");
  const MAX_SECONDS = 30;
  const MAX_FRAMES = 200;

  let loading = null;
  let clock = 0;   // detectForVideo needs ever-increasing timestamps, across videos too

  function load() {
    // Browsers won't load the coach's modules from a page opened as a file.
    if (location.protocol === "file:") return Promise.reject(new Error("needsServer"));
    if (!loading) {
      loading = (async () => {
        const { FilesetResolver, PoseLandmarker } = await import(BUNDLE);
        const files = await FilesetResolver.forVisionTasks(WASM);
        const options = delegate => ({
          baseOptions: { modelAssetPath: MODEL, delegate },
          runningMode: "VIDEO",
          numPoses: 1,
        });
        try {
          return await PoseLandmarker.createFromOptions(files, options("GPU"));
        } catch (gpuError) {
          return await PoseLandmarker.createFromOptions(files, options("CPU"));
        }
      })().catch(() => {
        loading = null;
        throw new Error("offline");
      });
    }
    return loading;
  }

  function openVideo(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      video.setAttribute("playsinline", "");
      video.className = "offscreen-video";   // some mobile browsers only decode videos in the page
      document.body.appendChild(video);
      const fail = () => { release(video); reject(new Error("cantRead")); };
      const timer = setTimeout(fail, 20000);
      video.onloadeddata = () => { clearTimeout(timer); resolve(video); };
      video.onerror = () => { clearTimeout(timer); fail(); };
      video.src = URL.createObjectURL(file);
    });
  }

  function release(video) {
    if (!video) return;
    video.pause();
    URL.revokeObjectURL(video.src);
    video.removeAttribute("src");
    video.remove();
  }

  function seek(video, t) {
    return new Promise(resolve => {
      const done = () => {
        clearTimeout(timer);
        video.removeEventListener("seeked", done);
        resolve();
      };
      const timer = setTimeout(done, 3000);
      video.addEventListener("seeked", done);
      video.currentTime = t;
    });
  }

  async function durationOf(video) {
    if (isFinite(video.duration)) return video.duration;
    // Recorded webm files can report Infinity until we seek past the end.
    await seek(video, 1e7);
    const d = isFinite(video.duration) ? video.duration : video.currentTime;
    await seek(video, 0);
    return d;
  }

  const nextPaint = () => new Promise(r => requestAnimationFrame(() => r()));

  // Tracks the body through the clip. onFrame({ video, frame, progress }) fires after each frame.
  async function track(file, onFrame) {
    const landmarker = await load();
    const video = await openVideo(file);
    try {
      const W = video.videoWidth, H = video.videoHeight;
      if (!W || !H) throw new Error("cantRead");
      const total = await durationOf(video);
      if (!(total >= 0.8)) throw new Error("tooShort");
      const end = Math.min(total, MAX_SECONDS);
      const fps = Math.min(15, Math.max(8, MAX_FRAMES / end));

      const frames = [];
      clock += 10000;
      for (let t = 0; t < end; t += 1 / fps) {
        await seek(video, t);
        clock += Math.round(1000 / fps);
        const res = landmarker.detectForVideo(video, clock);
        const raw = res.landmarks && res.landmarks[0];
        // Some builds report visibility as 0 for every point; treat that as "unknown, assume seen".
        const hasVis = raw && raw.some(p => p.visibility > 0);
        const lm = raw ? raw.map(p => ({ x: p.x * W, y: p.y * H, v: hasVis ? p.visibility : 1 })) : null;
        const frame = { t, lm };
        frames.push(frame);
        if (onFrame) onFrame({ video, frame, progress: Math.min(1, (t + 1 / fps) / end) });
        await nextPaint();
      }
      return { video, frames, W, H, truncated: total > MAX_SECONDS };
    } catch (err) {
      release(video);
      throw err;
    }
  }

  return { load, track, seek, release };
})();
