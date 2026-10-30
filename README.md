# Spike Coach

Learn to spike at home. Film yourself on your phone and Bo, the AI coach, gives you one thing to fix.
Body tracking runs on the phone (MediaPipe in the browser), so videos are never uploaded.

## Run it

No build step, but it must be served over http(s): browsers won't run the coach from a file opened on disk
(the app says so if you try).

- **On your laptop:** in this folder run `python -m http.server 8000 --bind 127.0.0.1`, then open
  `http://127.0.0.1:8000`. `--bind 127.0.0.1` keeps it reachable from your laptop only.
- **On your phone:** publish it (GitHub Pages, below). Over HTTPS it can be installed to the home screen and
  works offline after the first analysis. The first analysis downloads about 20 MB, all from this site.

### Publish on GitHub Pages

Repo → Settings → Pages → "Deploy from a branch" → `main`, folder `/ (root)`. The site appears at
`https://<user>.github.io/<repo>/` within a minute or two.

## Security and privacy

- **Videos never leave the phone.** Body tracking runs in the browser; there is no server, upload, account,
  analytics or ads.
- **No code from other sites.** The AI library, model and font are bundled in `vendor/` (see below), so a
  compromised CDN can't change what runs. The MediaPipe package was checked against npm's published SHA-512
  before bundling; `vendor/SHA256SUMS` lists every vendored file's hash.
- **Strict Content-Security-Policy** on both pages: only this site's own scripts, styles, fonts and
  connections; no inline scripts, no `eval`; WebAssembly is allowed because the coach needs it.
  `no-referrer` on every request. Tested with zero violations.
- **Saved progress is validated** field by field when loaded, and all text shown on screen is inserted as
  text, not HTML.
- `_headers` adds `frame-ancestors 'none'`, `nosniff` and a Permissions-Policy on hosts that support it
  (Netlify, Cloudflare Pages). GitHub Pages can't set headers; the meta CSP still applies there.
- `.gitignore` keeps videos out of the repo, so nobody's practice clips get committed by accident.

To re-check the vendored files, compare `vendor/SHA256SUMS` with `sha256sum` of each file. To update
MediaPipe, download the new npm tarball, verify its `integrity`, and replace `vendor/mediapipe/`.

## Third-party code and assets

| What | Where | License |
|---|---|---|
| MediaPipe Tasks Vision 0.10.14 (JS + WebAssembly) | `vendor/mediapipe/` | Apache-2.0 (`vendor/mediapipe/LICENSE`) |
| Pose Landmarker (full) model | `vendor/models/` | From Google's MediaPipe model storage; see Google's model card for its terms |
| Nunito font | `vendor/fonts/` | SIL Open Font License 1.1 (`vendor/fonts/OFL.txt`) |

## What's in the app

| Screen | What it does |
|---|---|
| Onboarding | Bo says hi, asks hitting hand and height, shows how to film |
| Path | 5 drills: Arm swing → Point and swing → Jump and reach → Approach steps → Full spike |
| Drill | Animated demo, 3 steps, "Film my rep" (opens the camera) or "Upload a video" |
| Analyzing | Shows the video with the tracked skeleton while it works |
| Result | Freezes on the key moment, lights up the limb to fix, one tip, slow-motion replay, progress notes ("New best!", "9 cm higher"), Share button |
| Drill complete / Streak | XP, reps, best jump; day streak with the week view |
| Profile | Streak, XP, reps, best jump, a chart of recent jumps; hitting hand, height, language |

- **English and Romanian.** Picked from the phone's language, switchable in Profile. All words are in
  `js/i18n.js`; a test checks Romanian has every English line.
- **Share card.** A 1080×1350 image (Instagram portrait) with Bo, the frozen moment, the verdict, stats and
  streak; it opens the phone's share sheet, or downloads on desktop. When hosted, it shows the site address.
- **Installable and offline.** `manifest.webmanifest`, icons in `icons/`, and `sw.js` cache the app and the
  coach. App files load network-first, so changes show up right away.

A drill unlocks the next one when its main check passes, or after 3 reps. Progress, XP and the streak are
saved in the browser on that device (`localStorage`).

## How the coaching works

`js/analyzer.js` turns the tracked body points into checks (thresholds are in `LIMIT` at the top):

| Check | What it measures |
|---|---|
| `reach` | How far the top of the swing is below a straight arm (cm, using your height for scale) |
| `elbowBack` | Bow-and-arrow windup: elbow back, high and bent before the swing |
| `offArmUp` | Other hand points up before the swing |
| `armsBack` | Both arms swing back before the jump |
| `jump` | Hip rise (cm); under 10 cm doesn't count as a jump |
| `timing` | Contact vs. the top of the jump (early / late) |
| `travel` | Approach distance before the jump |

Each drill in `js/drills.js` lists its checks in priority order; the first one that fails is the one fix shown.

It also refuses bad clips with a friendly message: nobody in frame, feet cut off, too far away, no swing,
probably the other hand. It ignores one-frame tracking glitches and camera cuts.

## Files

```
index.html             landing page (css/landing.css, js/landing.js)
app.html               the app (all screens)
manifest.webmanifest   install info; icons/ holds the app icons
sw.js                  offline cache (this site's files only)
_headers               extra security headers for Netlify/Cloudflare Pages
vendor/                bundled MediaPipe, pose model and Nunito font, with licenses and SHA256SUMS
css/fonts.css          the bundled font
css/app.css            app styles (light + dark)
js/app.js              screens, onboarding, path, results, profile, chart
js/analyzer.js         pose frames → measurements and checks (no DOM, testable)
js/drills.js           drills and which checks each one runs
js/i18n.js             every word in English and Romanian
js/pose.js             MediaPipe loading and frame-by-frame tracking
js/share.js            the share card image
js/skeleton.js         stick-figure poses and animations (demos + test data)
js/store.js            XP, streak, history and progress on the device
js/mascot.js           Bo
tests/analyzer.html    open in a browser: runs the analyzer and language tests
```

When you add a file the app needs offline, add it to `APP_FILES` in `sw.js` and bump `APP_CACHE`.

## Tests

Open `tests/analyzer.html`. It builds fake tracking data from the stick figure (good spike, a "pushing"
low-reach spike, late timing, a mirrored left-hander, a standing swing, a camera cut, a tracking glitch,
bad clips) and checks the analyzer's verdicts, plus Romanian completeness and plural rules. All 45 pass.

End to end, the real app was run in headless Edge on two CC-licensed volleyball serve videos from
Wikimedia Commons, in English and Romanian: tracking, the freeze frame, feedback, progress notes, the share
card, the drill-complete and streak screens, and the offline cache (including the 9 MB model) all worked.

## Not done yet / known limits

- **Not tested with real spike videos yet.** The thresholds in `LIMIT` are first guesses; tune them with
  10–20 clips of real beginners and coaches' opinions.
- **Not tested on real phones yet.** Android Chrome is the main target; ask a friend with an iPhone to try
  it once. Long 4K clips may analyze slowly (it samples up to 200 frames).
- With no ball, "contact" is the top of the forward swing; a beginner who raises a straight arm and then
  pushes can occasionally look better than they are.
- The Romanian copy was written by me, not a native speaker; have a Romanian player read it once.
- Progress lives on one device; there are no accounts.
