/* Landing page: language, offline support, and the looping coach animation. */
I18n.apply();
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

(() => {
  const NS = "http://www.w3.org/2000/svg";
  const FLOOR = 248;
  const S = 0.88;                     // figure scale: ~170 units tall ≈ a 175 cm person
  const CM_PER_UNIT = 175 / 170;
  const LEN = { torso: 58, neck: 16, head: 10, ua: 30, fa: 28, th: 42, sh: 42 };

  // Side-view poses. Angles are segment directions: 0 = down, 90 = forward, 180 = up.
  // N = near (hitting) side, F = far side. Poses without `lift` stand on the floor.
  const POSES = {
    ready:       { hx: 70,  torso: 172, uaN: 10,  faN: 25,  uaF: -5,   faF: 10,   thN: 8,   shN: -4,  thF: -6,  shF: -8 },
    step1:       { hx: 115, torso: 165, uaN: -25, faN: -5,  uaF: 30,   faF: 50,   thN: 28,  shN: 0,   thF: -18, shF: -40 },
    step2:       { hx: 170, torso: 157, uaN: -60, faN: -45, uaF: -50,  faF: -30,  thN: -25, shN: -50, thF: 38,  shF: 8 },
    plant:       { hx: 215, torso: 140, uaN: -115, faN: -125, uaF: -108, faF: -118, thN: 55, shN: -22, thF: 45, shF: -28 },
    takeoff:     { hx: 238, torso: 170, uaN: 150, faN: 165, uaF: 145,  faF: 160,  thN: 8,   shN: -12, thF: 2,   shF: -15 },
    cock:        { hx: 255, lift: 118, torso: 188, uaN: 242, faN: 172, uaF: 165, faF: 172, thN: 25, shN: -35, thF: 12, shF: -30 },
    contactBad:  { hx: 265, lift: 126, torso: 170, uaN: 128, faN: 110, uaF: 30,  faF: 70,  thN: 20, shN: -25, thF: 10, shF: -20 },
    contactGood: { hx: 265, lift: 126, torso: 170, uaN: 165, faN: 172, uaF: 30,  faF: 70,  thN: 20, shN: -25, thF: 10, shF: -20 },
    follow:      { hx: 285, lift: 100, torso: 150, uaN: 55,  faN: 35,  uaF: 0,   faF: 25,  thN: 18, shN: -8,  thF: 28, shF: 0 },
    land:        { hx: 300, torso: 152, uaN: 25,  faN: 45,  uaF: 10,   faF: 35,   thN: 48,  shN: -18, thF: 38,  shF: -22 },
    recover:     { hx: 305, torso: 168, uaN: 8,   faN: 20,  uaF: -4,   faF: 10,   thN: 10,  shN: -4,  thF: 2,   shF: -8 },
  };

  const vec = (deg, len) => {
    const r = deg * Math.PI / 180;
    return [Math.sin(r) * len * S, Math.cos(r) * len * S];
  };
  const add = (p, d) => [p[0] + d[0], p[1] + d[1]];

  for (const k of Object.values(POSES)) {
    if (k.lift === undefined) {
      const dropN = vec(k.thN, LEN.th)[1] + vec(k.shN, LEN.sh)[1];
      const dropF = vec(k.thF, LEN.th)[1] + vec(k.shF, LEN.sh)[1];
      k.hy = FLOOR - Math.max(dropN, dropF);
    } else {
      k.hy = FLOOR - k.lift * S;
    }
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

  const mix = (a, b, t) => {
    const out = {};
    for (const key in a) out[key] = a[key] + (b[key] - a[key]) * t;
    return out;
  };
  const ease = t => 0.5 - Math.cos(Math.PI * t) / 2;

  // Build the skeleton once; far limbs first so near limbs draw on top.
  const fig = document.getElementById("figure");
  const make = (tag, cls) => {
    const n = document.createElementNS(NS, tag);
    n.setAttribute("class", cls);
    fig.appendChild(n);
    return n;
  };
  const BONES = [
    ["sh", "elbowF", "far"], ["elbowF", "wristF", "far"], ["hip", "kneeF", "far"], ["kneeF", "ankleF", "far"],
    ["hip", "sh"], ["sh", "neck"], ["hip", "kneeN"], ["kneeN", "ankleN"], ["sh", "elbowN"], ["elbowN", "wristN"],
  ].map(([a, b, far]) => [a, b, make("line", far ? "bone far" : "bone")]);
  const JOINTS = ["elbowF", "wristF", "kneeF", "ankleF", "hip", "sh", "kneeN", "ankleN", "elbowN", "wristN"]
    .map(name => [name, make("circle", name.endsWith("F") ? "joint far" : "joint")]);
  JOINTS.forEach(([, c]) => c.setAttribute("r", 3.2));
  const head = make("circle", "head");
  head.setAttribute("r", LEN.head * S);

  const set = (node, attrs) => { for (const a in attrs) node.setAttribute(a, attrs[a].toFixed ? attrs[a].toFixed(1) : attrs[a]); };

  function draw(j) {
    for (const [a, b, line] of BONES) set(line, { x1: j[a][0], y1: j[a][1], x2: j[b][0], y2: j[b][1] });
    for (const [name, c] of JOINTS) set(c, { cx: j[name][0], cy: j[name][1] });
    set(head, { cx: j.head[0], cy: j.head[1] });
  }

  // The coaching overlay compares the low contact with full reach.
  const bad = solve(POSES.contactBad);
  const good = solve(POSES.contactGood);
  const ballAt = add(good.wristN, [3, -9]);
  const reachCm = Math.round((bad.wristN[1] - good.wristN[1]) / S * CM_PER_UNIT);

  document.getElementById("ghostArm").setAttribute("d",
    `M ${good.sh.join(" ")} L ${good.elbowN.join(" ")} L ${good.wristN.join(" ")}`);
  const shorten = (from, to, by) => {
    const dx = to[0] - from[0], dy = to[1] - from[1], d = Math.hypot(dx, dy);
    return [from[0] + dx / d * by, from[1] + dy / d * by];
  };
  const a0 = shorten(bad.wristN, good.wristN, 6), a1 = shorten(good.wristN, bad.wristN, 7);
  set(document.getElementById("arrow"), { x1: a0[0], y1: a0[1], x2: a1[0], y2: a1[1] });

  const fix = document.getElementById("fix");
  const ball = document.getElementById("ball");
  const pulse = document.getElementById("pulse");
  const bubble = document.getElementById("bubble");
  const BUBBLE = {
    warn: { icon: "↑", title: I18n.t("landing.warnTitle"), text: I18n.t("landing.warnText", { cm: reachCm }) },
    good: { icon: "✓", title: I18n.t("landing.goodTitle"), text: I18n.t("landing.goodText") },
  };
  function say(state) {
    if (!state) { bubble.classList.remove("show"); return; }
    if (bubble.dataset.state !== state) {
      bubble.dataset.state = state;
      document.getElementById("bubbleIcon").textContent = BUBBLE[state].icon;
      document.getElementById("bubbleTitle").textContent = BUBBLE[state].title;
      document.getElementById("bubbleText").textContent = BUBBLE[state].text;
    }
    bubble.classList.add("show");
  }
  const placeBall = p => ball.setAttribute("transform", `translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})`);

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    draw(bad);
    placeBall(ballAt);
    ball.setAttribute("opacity", 1);
    fix.setAttribute("opacity", 1);
    say("warn");
    return;
  }

  // [pose, ms to reach it, ms to hold it]
  const STEPS = goodRep => [
    ["ready", 0, 500], ["step1", 360, 0], ["step2", 300, 0], ["plant", 260, 60],
    ["takeoff", 170, 0], ["cock", 230, 0], [goodRep ? "contactGood" : "contactBad", 140, 2000],
    ["follow", 220, 0], ["land", 240, 0], ["recover", 420, 700],
  ];
  function timeline(goodRep) {
    const segs = [];
    let t = 0, prev = null, contact = null, takeoff = null;
    for (const [name, move, hold] of STEPS(goodRep)) {
      if (prev) { segs.push({ a: POSES[prev], b: POSES[name], t0: t, t1: t + move }); t += move; }
      if (name === "takeoff") takeoff = t;
      if (name.startsWith("contact")) contact = [t, t + hold];
      if (hold) { segs.push({ a: POSES[name], b: POSES[name], t0: t, t1: t + hold }); t += hold; }
      prev = name;
    }
    return { segs, total: t, contact, takeoff };
  }
  const REPS = [timeline(false), timeline(true)];
  const CYCLE = REPS[0].total + REPS[1].total;

  const start = performance.now();
  function frame(now) {
    const inCycle = (now - start) % CYCLE;
    const isGood = inCycle >= REPS[0].total;
    const rep = REPS[isGood ? 1 : 0];
    const t = isGood ? inCycle - REPS[0].total : inCycle;

    const seg = rep.segs.find(s => t < s.t1) || rep.segs[rep.segs.length - 1];
    const k = seg.t1 > seg.t0 ? ease(Math.min(1, (t - seg.t0) / (seg.t1 - seg.t0))) : 1;
    draw(solve(mix(seg.a, seg.b, k)));

    const fade = Math.min(1, t / 250, (rep.total - t) / 300);
    fig.setAttribute("opacity", fade.toFixed(2));

    const [c0, c1] = rep.contact;

    // ball: imagined until it's hit, then spiked to the floor
    let ballOpacity = t >= rep.takeoff ? Math.min(1, (t - rep.takeoff) / 200) * fade : 0;
    ball.classList.toggle("hit", isGood && t >= c0);
    if (isGood && t >= c1) {
      const f = Math.min(1, (t - c1) / 300);
      placeBall([ballAt[0] + (400 - ballAt[0]) * f, ballAt[1] + (240 - ballAt[1]) * f * f]);
      ballOpacity *= 1 - Math.max(0, (t - c1 - 300) / 150);
    } else {
      placeBall(ballAt);
    }
    ball.setAttribute("opacity", Math.max(0, ballOpacity).toFixed(2));

    if (isGood && t >= c0 && t < c0 + 500) {
      const p = (t - c0) / 500;
      set(pulse, { cx: ballAt[0], cy: ballAt[1], r: 8 + 14 * p, opacity: 1 - p });
    } else {
      pulse.setAttribute("opacity", 0);
    }

    fix.setAttribute("opacity", !isGood && t >= c0 && t < c1 ? 1 : 0);
    say(t >= c0 && t < rep.total - 350 ? (isGood ? "good" : "warn") : null);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
