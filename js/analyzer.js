/* Turns pose-tracking frames from one video into spike measurements and pass/fail checks.
   Pure functions with no DOM, so the same code runs in the app and in the tests.

   Input: frames = [{ t: seconds, lm: [33 × { x, y, v }] | null }], with x/y in video pixels
   and v = visibility (0..1), in MediaPipe pose landmark order.
   The person is filmed from the side; "forward" is the way they face. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Analyzer = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // MediaPipe landmark indices, as [left, right].
  const NOSE = 0, EARS = [7, 8];
  const SH = [11, 12], EL = [13, 14], WR = [15, 16], HIP = [23, 24], KNEE = [25, 26], ANK = [27, 28];

  const LIMIT = {
    jumpCm: 10,         // a smaller hip rise doesn't count as a jump
    reachMissCm: 12,    // the top of the swing may sit this far below full reach
    reachTilt: 12,      // full reach: straight arm, this many degrees in front of vertical
    earlyS: -0.12,      // contact this long before the top of the jump is early
    lateS: 0.2,         // contact this long after the top of the jump is late
    armsBack: -0.4,     // wrist behind the shoulder before takeoff, in arm lengths
    elbowBack: -0.2,    // elbow behind the shoulder in the windup, in upper-arm lengths
    elbowLevel: 0.15,   // ...and no lower than this below the shoulder
    elbowBent: 145,     // ...with the elbow bent at least this much (degrees), hand up by the head
    travel: 0.35,       // approach distance before the jump, in body heights
  };
  const SHOULDER_TO_ANKLE = 0.78;   // share of standing height

  const quantile = (a, q) => {
    const s = [...a].sort((x, y) => x - y);
    return s[Math.round(q * (s.length - 1))];
  };
  const median = a => quantile(a, 0.5);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, v: Math.min(a.v, b.v) });

  function angleAt(a, b, c) {
    const ux = a.x - b.x, uy = a.y - b.y, wx = c.x - b.x, wy = c.y - b.y;
    const cos = (ux * wx + uy * wy) / (Math.hypot(ux, uy) * Math.hypot(wx, wy) || 1);
    return Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI;
  }

  // Light smoothing for the hip height, so one jittery frame doesn't fake a jump.
  // Arms are left raw: smoothing would shave the top off a fast swing.
  const smooth = ys => ys.map((y, i) => ((ys[i - 1] ?? y) + 2 * y + (ys[i + 1] ?? y)) / 4);

  // Keeps the longest stretch where the body moves continuously. Drops one-frame tracking
  // glitches, and splits where the body jumps across the picture (a camera cut, someone else
  // in the shot) or tracking is lost for a while.
  function steadyStretch(tracked) {
    const hipOf = f => mid(f.lm[HIP[0]], f.lm[HIP[1]]);
    const torso = f => dist(mid(f.lm[SH[0]], f.lm[SH[1]]), hipOf(f));
    const usualTorso = median(tracked.map(torso));

    const steady = tracked.filter((f, k) => {
      const near = tracked.slice(Math.max(0, k - 3), k).concat(tracked.slice(k + 1, k + 4));
      if (near.length < 2) return true;
      const here = hipOf(f);
      const around = { x: median(near.map(g => hipOf(g).x)), y: median(near.map(g => hipOf(g).y)) };
      const size = torso(f) / usualTorso;
      return dist(here, around) < 1.2 * usualTorso && size > 0.6 && size < 1.6;
    });

    const runs = [];
    steady.forEach((f, k) => {
      const prev = steady[k - 1];
      const dt = prev ? f.t - prev.t : Infinity;
      const leap = prev ? dist(hipOf(f), hipOf(prev)) : Infinity;
      if (!prev || dt > 0.5 || leap > usualTorso * (0.6 + 8 * dt)) runs.push([]);
      runs[runs.length - 1].push(f);
    });
    return runs.reduce((a, b) => (b.length > a.length ? b : a), []);
  }

  function analyze(frames, opts = {}) {
    const side = opts.hand === "left" ? 0 : 1, other = 1 - side;
    const heightCm = opts.heightCm || 175;

    if (frames.length < 6) return { ok: false, gate: "tooShort" };

    const tracked = frames
      .map((f, i) => ({ i, t: f.t, lm: f.lm }))
      .filter(f => f.lm
        && Math.max(f.lm[SH[0]].v, f.lm[SH[1]].v) > 0.3
        && Math.max(f.lm[HIP[0]].v, f.lm[HIP[1]].v) > 0.3);
    if (tracked.length < Math.max(6, frames.length * 0.5)) return { ok: false, gate: "noPerson" };

    const seen = steadyStretch(tracked);
    if (seen.length < 6) return { ok: false, gate: "noPerson" };

    const fs = seen.map(f => ({
      i: f.i, t: f.t, lm: f.lm,
      nose: f.lm[NOSE],
      ear: mid(f.lm[EARS[0]], f.lm[EARS[1]]),
      sh: f.lm[SH[side]], el: f.lm[EL[side]], wr: f.lm[WR[side]],
      offWr: f.lm[WR[other]],
      hip: mid(f.lm[HIP[0]], f.lm[HIP[1]]),
    }));

    // Scale: segment lengths barely change with pose, so shoulder→hip→knee→ankle gives body size.
    const legs = fs.map(f => {
      const s = f.lm[ANK[0]].v + f.lm[KNEE[0]].v > f.lm[ANK[1]].v + f.lm[KNEE[1]].v ? 0 : 1;
      if (f.lm[ANK[s]].v < 0.4) return null;
      return dist(f.lm[SH[s]], f.lm[HIP[s]]) + dist(f.lm[HIP[s]], f.lm[KNEE[s]]) + dist(f.lm[KNEE[s]], f.lm[ANK[s]]);
    }).filter(Boolean);
    if (legs.length < fs.length * 0.3) return { ok: false, gate: "feetOut" };
    const bodyPx = quantile(legs, 0.75) / SHOULDER_TO_ANKLE;
    if (opts.frameHeight && bodyPx < opts.frameHeight * 0.2) return { ok: false, gate: "tooFar" };
    const cmPerPx = heightCm / bodyPx;

    const armFrames = fs.filter(f => f.wr.v > 0.2 && f.el.v > 0.2);
    if (!armFrames.length) return { ok: false, gate: "noSwing" };
    const armLen = quantile(armFrames.map(f => dist(f.sh, f.el) + dist(f.el, f.wr)), 0.75);
    const upperArm = quantile(armFrames.map(f => dist(f.sh, f.el)), 0.75);

    // Facing: the nose sits in front of the ears. Fall back to the direction they travel.
    const votes = fs.reduce((n, f) => n + Math.sign(f.nose.x - f.ear.x), 0);
    const travelX = fs[fs.length - 1].hip.x - fs[0].hip.x;
    const dir = Math.abs(votes) >= fs.length * 0.3 ? Math.sign(votes) : (Math.sign(travelX) || 1);
    const fwd = (p, ref) => dir * (p.x - ref.x);          // + means in front of ref

    // Jump: how far the hips rise above their usual height.
    const hipY = smooth(fs.map(f => f.hip.y));
    const standY = median(hipY);
    let peak = 0;
    hipY.forEach((y, k) => { if (y < hipY[peak]) peak = k; });
    const P = fs[peak];
    const jumpCm = Math.max(0, (standY - hipY[peak]) * cmPerPx);
    const jumped = jumpCm >= LIMIT.jumpCm;

    // Did the hitting arm ever get above the head?
    const aboveHead = wr => f => (f[wr].v > 0.2 ? (f.nose.y - f[wr].y) / armLen : -Infinity);
    if (Math.max(...fs.map(aboveHead("wr"))) < 0.05) {
      const offUp = Math.max(...fs.map(aboveHead("offWr")));
      return { ok: false, gate: offUp > 0.3 ? "wrongHand" : "noSwing" };
    }

    // Contact: with no ball, it's the top of the forward swing. Prefer frames that follow
    // a windup (wrist behind the head) so arms rising on takeoff don't count.
    const inWindow = jumped ? (f => f.t >= P.t - 0.2 && f.t <= P.t + 0.4) : (() => true);
    const behind = f => fwd(f.wr, f.nose) < -0.2 * armLen;
    const inFront = f => fwd(f.wr, f.nose) >= -0.1 * armLen;
    let best = -1, inFrontBest = -1, anyBest = -1;
    const higher = (k, j) => j < 0 || fs[k].wr.y < fs[j].wr.y;
    fs.forEach((f, k) => {
      if (!inWindow(f) || f.wr.v < 0.2) return;
      if (higher(k, anyBest)) anyBest = k;
      if (!inFront(f)) return;
      if (higher(k, inFrontBest)) inFrontBest = k;
      const afterWindup = fs.some(g => g.t < f.t && g.t >= f.t - 0.8 && behind(g));
      if (afterWindup && higher(k, best)) best = k;
    });
    const c = best >= 0 ? best : inFrontBest >= 0 ? inFrontBest : anyBest;
    if (c < 0) return { ok: false, gate: "noSwing" };
    const C = fs[c];

    // Reach: how far the hand topped out below a straight arm.
    const tilt = LIMIT.reachTilt * Math.PI / 180;
    const ideal = { x: C.sh.x + dir * armLen * Math.sin(tilt), y: C.sh.y - armLen * Math.cos(tilt) };
    const reachMissCm = Math.max(0, Math.round((C.wr.y - ideal.y) * cmPerPx));
    const elbowAngle = Math.round(angleAt(C.sh, C.el, C.wr));

    // Windup: elbow back and high, bent, hand up by the head (bow and arrow) before the swing.
    // The bend and the raised hand tell it apart from arms swinging back before a jump.
    const windup = fs.filter(f => f.t >= C.t - 0.8 && f.t < C.t);
    const cocked = windup.filter(f =>
      f.el.y <= f.sh.y + LIMIT.elbowLevel * upperArm
      && fwd(f.el, f.sh) <= LIMIT.elbowBack * upperArm
      && angleAt(f.sh, f.el, f.wr) <= LIMIT.elbowBent
      && f.wr.y < f.sh.y);
    const cockF = cocked.reduce((b, f) => (!b || fwd(f.el, f.sh) < fwd(b.el, b.sh) ? f : b), null);
    const nearest = t => fs.reduce((b, f) => (Math.abs(f.t - t) < Math.abs(b.t - t) ? f : b), fs[0]);

    // Off arm: points up at the ball before the swing (null when we can't see it).
    const offSeen = fs.filter(f => f.t >= C.t - 0.8 && f.t <= C.t && f.offWr.v > 0.3);
    const offArmUp = offSeen.length ? offSeen.some(f => f.offWr.y < f.nose.y) : null;

    // Arms swing back before takeoff.
    const anchor = jumped ? P.t : C.t;
    const load = fs.filter(f => f.t >= anchor - 1.3 && f.t <= anchor - 0.12 && f.wr.v > 0.2);
    const loadF = load.reduce((b, f) => (!b || fwd(f.wr, f.sh) < fwd(b.wr, b.sh) ? f : b), null);
    const armsBack = loadF ? fwd(loadF.wr, loadF.sh) / armLen : null;

    const timingS = jumped ? C.t - P.t : null;
    const travelPx = fwd(P.hip, fs[0].hip);

    const checks = {
      reach: { pass: reachMissCm <= LIMIT.reachMissCm, missCm: reachMissCm, elbowAngle },
      elbowBack: { pass: cocked.length > 0 },
      offArmUp: { pass: offArmUp !== false, unknown: offArmUp === null },
      armsBack: { pass: armsBack === null || armsBack <= LIMIT.armsBack, unknown: armsBack === null },
      jump: { pass: jumped, cm: Math.round(jumpCm) },
      timing: timingS === null
        ? { pass: false, unknown: true }
        : { pass: timingS >= LIMIT.earlyS && timingS <= LIMIT.lateS,
            early: timingS < LIMIT.earlyS, late: timingS > LIMIT.lateS, ms: Math.round(timingS * 1000) },
      travel: { pass: travelPx / bodyPx >= LIMIT.travel, cm: Math.round(travelPx * cmPerPx) },
    };

    return {
      ok: true,
      dir,
      jumped,
      frames: {                         // indexes into the input frames, for drawing
        contact: C.i,
        windup: (cockF || nearest(C.t - 0.25)).i,
        load: (loadF || C).i,
        peak: P.i,
      },
      ideal: { sh: { x: C.sh.x, y: C.sh.y }, wr: ideal },
      metrics: {
        jumpCm: Math.round(jumpCm),
        reachMissCm,
        elbowAngle,
        timingMs: timingS === null ? null : Math.round(timingS * 1000),
        travelCm: Math.round(travelPx * cmPerPx),
      },
      checks,
      warnings: fs.filter(f => f.wr.v < 0.5).length > fs.length * 0.5 ? ["farSide"] : [],
    };
  }

  return { analyze, LIMIT };
});
