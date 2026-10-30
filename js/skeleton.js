/* Side-view stick figure: poses, timelines and an SVG player.
   The app uses it for drill demos; the tests use it to fake pose-tracking data. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Skeleton = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const FLOOR = 248;
  const S = 0.88;                     // figure scale: ~170 units tall ≈ a 175 cm person
  const LEN = { torso: 58, neck: 16, head: 10, ua: 30, fa: 28, th: 42, sh: 42 };

  // Segment directions in degrees: 0 = down, 90 = forward, 180 = up.
  // N = near (hitting) side, F = far side. Poses without `lift` stand on the floor.
  const POSES = {
    stand:       { torso: 172, uaN: 10,   faN: 25,   uaF: -5,   faF: 10,   thN: 8,   shN: -4,  thF: -6,  shF: -8 },
    armsUp:      { torso: 176, uaN: 160,  faN: 170,  uaF: 165,  faF: 172,  thN: 6,   shN: -4,  thF: -4,  shF: -8 },
    cockStand:   { torso: 186, uaN: 242,  faN: 172,  uaF: 165,  faF: 175,  thN: 10,  shN: -8,  thF: -4,  shF: -10 },
    hitStand:    { torso: 168, uaN: 165,  faN: 172,  uaF: 30,   faF: 70,   thN: 8,   shN: -4,  thF: -6,  shF: -8 },
    followStand: { torso: 150, uaN: 55,   faN: 35,   uaF: 0,    faF: 25,   thN: 14,  shN: -6,  thF: -2,  shF: -10 },
    step1:       { torso: 165, uaN: -25,  faN: -5,   uaF: 30,   faF: 50,   thN: 28,  shN: 0,   thF: -18, shF: -40 },
    step2:       { torso: 157, uaN: -60,  faN: -45,  uaF: -50,  faF: -30,  thN: -25, shN: -50, thF: 38,  shF: 8 },
    plant:       { torso: 140, uaN: -115, faN: -125, uaF: -108, faF: -118, thN: 55,  shN: -22, thF: 45,  shF: -28 },
    crouch:      { torso: 145, uaN: -115, faN: -125, uaF: -108, faF: -118, thN: 50,  shN: -25, thF: 46,  shF: -28 },
    takeoff:     { torso: 170, uaN: 150,  faN: 165,  uaF: 145,  faF: 160,  thN: 8,   shN: -12, thF: 2,   shF: -15 },
    cock:        { lift: 118, torso: 188, uaN: 242, faN: 172, uaF: 165, faF: 172, thN: 25, shN: -35, thF: 12, shF: -30 },
    hit:         { lift: 126, torso: 170, uaN: 165, faN: 172, uaF: 30,  faF: 70,  thN: 20, shN: -25, thF: 10, shF: -20 },
    reachUp:     { lift: 122, torso: 176, uaN: 170, faN: 175, uaF: 165, faF: 172, thN: 20, shN: -25, thF: 10, shF: -20 },
    follow:      { lift: 100, torso: 150, uaN: 55,  faN: 35,  uaF: 0,   faF: 25,  thN: 18, shN: -8,  thF: 28, shF: 0 },
    land:        { torso: 152, uaN: 25,   faN: 45,   uaF: 10,   faF: 35,   thN: 48,  shN: -18, thF: 38,  shF: -22 },
  };

  // [pose, hip x, ms to reach it, ms to hold it]
  const SEQUENCES = {
    armSwing: [
      ["stand", 220, 0, 500], ["armsUp", 220, 450, 150], ["cockStand", 220, 380, 250],
      ["hitStand", 222, 170, 350], ["followStand", 224, 260, 200], ["stand", 220, 500, 300],
    ],
    jumpReach: [
      ["stand", 215, 0, 500], ["crouch", 215, 380, 100], ["takeoff", 218, 170, 0], ["cock", 221, 230, 0],
      ["hit", 224, 150, 350], ["follow", 227, 230, 0], ["land", 230, 250, 0], ["stand", 230, 450, 300],
    ],
    approach: [
      ["stand", 70, 0, 500], ["step1", 115, 360, 0], ["step2", 170, 300, 0], ["plant", 215, 260, 80],
      ["takeoff", 238, 170, 0], ["reachUp", 255, 280, 250], ["land", 280, 320, 0], ["stand", 285, 450, 300],
    ],
    fullSpike: [
      ["stand", 70, 0, 500], ["step1", 115, 360, 0], ["step2", 170, 300, 0], ["plant", 215, 260, 60],
      ["takeoff", 238, 170, 0], ["cock", 255, 230, 0], ["hit", 265, 140, 350], ["follow", 285, 220, 0],
      ["land", 300, 240, 0], ["stand", 305, 420, 300],
    ],
  };

  // Crop each demo to where the figure moves, so in-place drills show a bigger figure.
  const VIEWBOX = {
    armSwing: "95 60 250 196",
    jumpReach: "80 24 290 236",
  };
  const FULL_VIEW = "24 4 392 258";

  const vec = (deg, len) => {
    const r = deg * Math.PI / 180;
    return [Math.sin(r) * len * S, Math.cos(r) * len * S];
  };
  const add = (p, d) => [p[0] + d[0], p[1] + d[1]];

  function hipY(k) {
    if (k.lift !== undefined) return FLOOR - k.lift * S;
    const dropN = vec(k.thN, LEN.th)[1] + vec(k.shN, LEN.sh)[1];
    const dropF = vec(k.thF, LEN.th)[1] + vec(k.shF, LEN.sh)[1];
    return FLOOR - Math.max(dropN, dropF);
  }

  // Steps may name a pose or pass a pose object.
  function timeline(steps) {
    const keys = [], segs = [];
    let t = 0;
    steps.forEach(([pose, hx, move, hold], i) => {
      const k = Object.assign({}, typeof pose === "string" ? POSES[pose] : pose, { hx });
      k.hy = hipY(k);
      delete k.lift;
      if (i > 0) { segs.push({ a: keys[keys.length - 1], b: k, t0: t, t1: t + move }); t += move; }
      if (hold) { segs.push({ a: k, b: k, t0: t, t1: t + hold }); t += hold; }
      keys.push(k);
    });
    return { segs, total: t, travels: steps[0][1] !== steps[steps.length - 1][1] };
  }

  const ease = t => 0.5 - Math.cos(Math.PI * t) / 2;

  function poseAt(tl, t) {
    const seg = tl.segs.find(s => t < s.t1) || tl.segs[tl.segs.length - 1];
    const k = seg.t1 > seg.t0 ? ease(Math.min(1, Math.max(0, (t - seg.t0) / (seg.t1 - seg.t0)))) : 1;
    const out = {};
    for (const key in seg.a) out[key] = seg.a[key] + (seg.b[key] - seg.a[key]) * k;
    return out;
  }

  function solve(k) {
    const hip = [k.hx, k.hy];
    const sh = add(hip, vec(k.torso, LEN.torso));
    const elbowN = add(sh, vec(k.uaN, LEN.ua));
    const elbowF = add(sh, vec(k.uaF, LEN.ua));
    const kneeN = add(hip, vec(k.thN, LEN.th));
    const kneeF = add(hip, vec(k.thF, LEN.th));
    return {
      hip, sh, elbowN, elbowF, kneeN, kneeF,
      neck: add(sh, vec(k.torso, LEN.neck)),
      head: add(sh, vec(k.torso, LEN.neck + LEN.head)),
      wristN: add(elbowN, vec(k.faN, LEN.fa)),
      wristF: add(elbowF, vec(k.faF, LEN.fa)),
      ankleN: add(kneeN, vec(k.shN, LEN.sh)),
      ankleF: add(kneeF, vec(k.shF, LEN.sh)),
    };
  }

  // ---- SVG player -------------------------------------------------------

  const NS = "http://www.w3.org/2000/svg";
  const BONES = [
    ["sh", "elbowF"], ["elbowF", "wristF"], ["hip", "kneeF"], ["kneeF", "ankleF"],
    ["hip", "sh"], ["sh", "neck"], ["hip", "kneeN"], ["kneeN", "ankleN"], ["sh", "elbowN"], ["elbowN", "wristN"],
  ];
  const JOINTS = ["elbowF", "wristF", "kneeF", "ankleF", "hip", "sh", "kneeN", "ankleN", "elbowN", "wristN"];
  const LIMBS = {
    armN: ["sh-elbowN", "elbowN-wristN"],
    armF: ["sh-elbowF", "elbowF-wristF"],
    legs: ["hip-kneeN", "kneeN-ankleN", "hip-kneeF", "kneeF-ankleF"],
  };
  const isFar = name => name.endsWith("F");

  // Loops a sequence in an <svg>. Returns a function that stops it.
  function play(svg, name, opts = {}) {
    const speed = opts.speed || 0.8;
    const hot = new Set((opts.highlight || []).flatMap(limb => LIMBS[limb] || []));
    svg.setAttribute("viewBox", VIEWBOX[name] || FULL_VIEW);
    svg.innerHTML = '<ellipse class="sk-floor" cx="220" cy="248" rx="190" ry="12"/>';
    const fig = document.createElementNS(NS, "g");
    svg.appendChild(fig);
    const make = (tag, cls) => {
      const n = document.createElementNS(NS, tag);
      n.setAttribute("class", cls);
      fig.appendChild(n);
      return n;
    };
    const bones = BONES.map(([a, b]) => {
      const cls = ["sk-bone", isFar(b) ? "sk-far" : "", hot.has(`${a}-${b}`) ? "sk-hl" : ""].join(" ").trim();
      return [a, b, make("line", cls)];
    });
    const joints = JOINTS.map(n => [n, make("circle", isFar(n) ? "sk-joint sk-far" : "sk-joint")]);
    joints.forEach(([, c]) => c.setAttribute("r", 3.2));
    const head = make("circle", "sk-head");
    head.setAttribute("r", LEN.head * S);

    const set = (node, attrs) => { for (const a in attrs) node.setAttribute(a, attrs[a].toFixed(1)); };
    const draw = j => {
      for (const [a, b, line] of bones) set(line, { x1: j[a][0], y1: j[a][1], x2: j[b][0], y2: j[b][1] });
      for (const [n, c] of joints) set(c, { cx: j[n][0], cy: j[n][1] });
      set(head, { cx: j.head[0], cy: j.head[1] });
    };

    const steps = SEQUENCES[name];
    const tl = timeline(steps);

    if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Show the pose the sequence lingers on longest (the key moment).
      const key = steps.slice(1, -1).reduce((best, s) => (s[3] > best[3] ? s : best), steps[1]);
      draw(solve(poseAt(timeline([key, key]), 0)));
      return () => {};
    }

    let raf = 0;
    const start = performance.now();
    const frame = now => {
      const t = ((now - start) * speed) % tl.total;
      draw(solve(poseAt(tl, t)));
      if (tl.travels) fig.setAttribute("opacity", Math.max(0, Math.min(1, t / 250, (tl.total - t) / 300)).toFixed(2));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }

  return { FLOOR, S, LEN, POSES, SEQUENCES, timeline, poseAt, solve, play };
});
