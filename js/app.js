/* Spike Coach: screens, onboarding, the skill path, filming, feedback and progress. */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const t = I18n.t;
  const esc = s => String(s).replace(/[&<>"']/g, ch => `&#${ch.charCodeAt(0)};`);

  const ICONS = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5c1.3-3.6 4.2-5.5 7.5-5.5s6.2 1.9 7.5 5.5"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 12.5V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6.5"/></svg>',
    flame: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c.6 3.2 2.6 4.9 4.3 6.8C18 10.7 19 12.6 19 15a7 7 0 0 1-14 0c0-2.3 1-4.2 2.6-5.6.2 1.6.9 2.8 2.1 3.4C9.4 9.4 10.2 5.3 12 2z"/><path d="M12 13c1.6 1.4 2.8 2.6 2.8 4.2a2.8 2.8 0 0 1-5.6 0c0-1 .5-1.9 1.3-2.6.1.7.4 1.2 1 1.5-.2-1.1 0-2.1.5-3.1z" fill="#fff" opacity=".55"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 2 4.5 13.5h6L9.5 22l9-11.5h-6L13.5 2z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.3l6.6-.8L12 2.5z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10V7.5a5 5 0 0 1 10 0V10h.5A1.5 1.5 0 0 1 19 11.5v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-8A1.5 1.5 0 0 1 6.5 10H7zm2.5 0h5V7.5a2.5 2.5 0 0 0-5 0V10z"/></svg>',
    ball: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 3c-1.5 4-.5 7.5 3 9.5M21 12.5c-4-1.2-7.5 0-9.5 3.5M6.5 19.3c.2-4 2-6.6 5.5-7.8M3.4 9.5c3.4-.2 6.3 1 8.6 2.5"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="M15.5 10.5l6-3.5v10l-6-3.5z"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.9l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4.5" height="14" rx="1.2"/><rect x="13.5" y="5" width="4.5" height="14" rx="1.2"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="2.5" y="7" width="19" height="10" rx="2.5"/><path d="M18.5 12h.01" stroke-width="3"/></svg>',
    distance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M6.5 8.5 3 12l3.5 3.5M17.5 8.5 21 12l-3.5 3.5"/></svg>',
    body: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4.5" r="2"/><path d="M12 7.5v6.5M12 14l-3 7M12 14l3 7M6.5 10.5 12 8.5l5.5 2"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>',
    timer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M9.5 2.5h5"/></svg>',
  };

  const TIPS = [["phone", "tips.phone"], ["distance", "tips.distance"], ["body", "tips.side"], ["sun", "tips.light"], ["timer", "tips.short"]];

  // MediaPipe landmark indices, as [left, right].
  const SH = [11, 12], EL = [13, 14], WR = [15, 16], HIP = [23, 24], KNEE = [25, 26], ANK = [27, 28];
  const CONNECTIONS = [
    [11, 12], [11, 23], [12, 24], [23, 24], [11, 13], [13, 15], [12, 14], [14, 16],
    [23, 25], [25, 27], [24, 26], [26, 28],
  ];
  const JOINTS = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
  const DRAW = { bone: "#4C7BFF", good: "#2FD06B", fix: "#FF8A1F", outline: "rgba(255, 255, 255, 0.95)" };

  let session = { drill: null };   // the drill being practiced and its latest result
  let clip = null;                 // { video, frames, W, H } of the latest analyzed video
  let stopDemo = () => {};
  let runId = 0;

  // ---- screens --------------------------------------------------------

  function show(name) {
    if (name !== "drill") { stopDemo(); stopDemo = () => {}; }
    if (name !== "result") stopReplay(false);
    if (name === "home" || name === "onboarding") releaseClip();
    $$("[data-screen]").forEach(s => { s.hidden = s.dataset.screen !== name; });
    window.scrollTo(0, 0);
  }

  const fillIcons = (root = document) =>
    $$("[data-icon]", root).forEach(el => { el.innerHTML = ICONS[el.dataset.icon] || ""; });

  // ---- onboarding -----------------------------------------------------

  const ONBOARDING = [
    { id: "hello", mood: "happy", say: "onb.hello" },
    { id: "hand", mood: "normal", say: "onb.hand" },
    { id: "height", mood: "normal", say: "onb.height" },
    { id: "film", mood: "happy", say: "onb.film" },
  ];
  let onbStep = 0;
  let draft = { hand: null, heightCm: 175 };

  function renderOnboarding() {
    const step = ONBOARDING[onbStep];
    const body = $("#onbBody");
    const next = $("#onbNext");
    $("#onbProgress").style.width = `${((onbStep + 1) / ONBOARDING.length) * 100}%`;

    if (step.id === "hello") {
      body.innerHTML = `<div class="onb-hero"><div class="mascot mascot-xl bounce">${Mascot.svg(step.mood)}</div><p class="bubble"></p></div>`;
    } else {
      body.innerHTML = `<div class="say"><div class="mascot mascot-sm">${Mascot.svg(step.mood)}</div><p class="bubble"></p></div><div class="onb-content"></div>`;
      const content = $(".onb-content", body);
      if (step.id === "hand") handOptions(content, draft.hand, hand => { draft.hand = hand; renderOnboarding(); });
      if (step.id === "height") heightControl(content, draft.heightCm, cm => { draft.heightCm = cm; });
      if (step.id === "film") content.appendChild(tipsList());
    }
    $(".bubble", body).textContent = t(step.say);

    next.disabled = step.id === "hand" && !draft.hand;
    next.textContent = onbStep === ONBOARDING.length - 1 ? t("onb.go") : t("continue");
  }

  $("#onbNext").addEventListener("click", () => {
    if (onbStep < ONBOARDING.length - 1) {
      onbStep += 1;
      renderOnboarding();
      return;
    }
    Store.setProfile({ hand: draft.hand, heightCm: draft.heightCm, lang: I18n.lang, onboarded: true });
    renderHome();
    show("home");
  });

  // A list of big option cards; options are [value, badge, label].
  function optionCards(container, options, value, onPick) {
    container.innerHTML = '<div class="options"></div>';
    const list = $(".options", container);
    options.forEach(([key, badge, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "option";
      b.setAttribute("aria-pressed", String(value === key));
      b.innerHTML = `<span class="option-badge">${esc(badge)}</span><span>${esc(label)}</span>`;
      b.addEventListener("click", () => onPick(key));
      list.appendChild(b);
    });
  }

  const handOptions = (container, value, onPick) => optionCards(container, [
    ["right", t("hand.rightBadge"), t("hand.right")],
    ["left", t("hand.leftBadge"), t("hand.left")],
  ], value, onPick);

  function heightControl(container, value, onChange) {
    const MIN = 120, MAX = 220;
    container.innerHTML = `
      <div class="height">
        <div class="height-value"><span></span> <small>cm</small></div>
        <div class="height-row">
          <button class="round-btn" type="button">−</button>
          <input type="range" min="${MIN}" max="${MAX}" step="1">
          <button class="round-btn" type="button">+</button>
        </div>
      </div>`;
    const out = $(".height-value span", container);
    const range = $("input", container);
    const [minus, plus] = $$(".round-btn", container);
    minus.setAttribute("aria-label", t("height.shorter"));
    plus.setAttribute("aria-label", t("height.taller"));
    range.setAttribute("aria-label", t("height.label"));
    const set = v => {
      const cm = Math.max(MIN, Math.min(MAX, Math.round(v)));
      range.value = cm;
      out.textContent = cm;
      onChange(cm);
    };
    range.addEventListener("input", () => set(Number(range.value)));
    minus.addEventListener("click", () => set(Number(range.value) - 1));
    plus.addEventListener("click", () => set(Number(range.value) + 1));
    range.value = value;
    out.textContent = value;
  }

  function tipsList() {
    const ol = document.createElement("ol");
    ol.className = "tips-list";
    TIPS.forEach(([icon, key]) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="tip-icon">${ICONS[icon]}</span><span></span>`;
      li.lastChild.textContent = t(key);
      ol.appendChild(li);
    });
    return ol;
  }

  function openTips() {
    $("#tipsList").replaceWith(Object.assign(tipsList(), { id: "tipsList" }));
    const dialog = $("#tipsDialog");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  // ---- home: the skill path -------------------------------------------

  const OFFSETS = [0, 56, 76, 56, 0, -56, -76, -56];

  function renderHome() {
    $("#streakCount").textContent = Store.streak();
    $("#streakStat").classList.toggle("is-on", Store.practicedToday());
    $("#xpCount").textContent = Store.get().xp;

    const path = $("#path");
    path.innerHTML = "";
    const firstOpen = Drills.DRILLS.findIndex(d => !Store.drill(d.id).done);
    Drills.DRILLS.forEach((d, k) => {
      const state = Store.drill(d.id).done ? "done" : k === firstOpen ? "current" : "locked";
      const icon = state === "done" ? "check" : state === "locked" ? "lock" : d.icon === "ball" ? "ball" : "star";
      const li = document.createElement("li");
      li.style.setProperty("--x", `${OFFSETS[k % OFFSETS.length]}px`);
      li.innerHTML = `
        ${state === "current" ? `<span class="start-tag" aria-hidden="true">${esc(t("path.start"))}</span>` : ""}
        <button class="node" type="button" data-state="${state}" aria-expanded="false">${ICONS[icon]}</button>
        <span class="node-label"></span>`;
      $(".node-label", li).textContent = d.title;
      const node = $(".node", li);
      node.setAttribute("aria-label", `${d.title}, ${t(`path.${state}`)}`);
      node.addEventListener("click", e => { e.stopPropagation(); togglePop(li, d, state); });
      path.appendChild(li);
    });
  }

  function closePop() {
    $$(".path .pop").forEach(p => p.remove());
    $$(".path li.is-open").forEach(li => {
      li.classList.remove("is-open");
      $(".node", li).setAttribute("aria-expanded", "false");
    });
  }

  function togglePop(li, drill, state) {
    const wasOpen = li.classList.contains("is-open");
    closePop();
    if (wasOpen) return;
    const pop = document.createElement("div");
    pop.className = "pop";
    pop.dataset.state = state;
    pop.innerHTML = '<h3></h3><p></p><button class="btn" type="button"></button>';
    $("h3", pop).textContent = drill.title;
    $("p", pop).textContent = state === "locked" ? t("pop.locked")
      : state === "done" ? t("pop.done", { n: Store.drill(drill.id).reps }) : drill.intro;
    const btn = $("button", pop);
    btn.textContent = t(state === "locked" ? "pop.btnLocked" : state === "done" ? "pop.btnAgain" : "pop.btnStart");
    btn.disabled = state === "locked";
    btn.addEventListener("click", e => { e.stopPropagation(); openDrill(drill); });
    li.appendChild(pop);
    li.classList.add("is-open");
    $(".node", li).setAttribute("aria-expanded", "true");
    if (!btn.disabled) btn.focus({ preventScroll: true });
  }

  document.addEventListener("click", e => { if (!e.target.closest(".path li")) closePop(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closePop(); });

  // ---- drill ----------------------------------------------------------

  function openDrill(drill) {
    session = { drill };
    $("#drillTitle").textContent = drill.title;
    $("#drillIntro").textContent = drill.intro;
    const steps = $("#drillSteps");
    steps.innerHTML = "";
    drill.steps.forEach(s => {
      const li = document.createElement("li");
      li.textContent = s;
      steps.appendChild(li);
    });
    show("drill");
    stopDemo = Skeleton.play($("#drillDemo"), drill.demo, { highlight: drill.highlight });
    Pose.load().catch(() => {});   // start downloading the coach while they read
  }

  ["#filmInput", "#uploadInput"].forEach(sel => {
    const input = $(sel);
    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      input.value = "";
      if (file && session.drill) analyzeClip(file);
    });
  });

  // ---- analysis -------------------------------------------------------

  function releaseClip() {
    stopReplay(false);
    if (clip) Pose.release(clip.video);
    clip = null;
  }

  async function analyzeClip(file) {
    const id = ++runId;
    releaseClip();
    show("analyzing");
    const bar = $("#scanProgress");
    const status = $("#scanStatus");
    const canvas = $("#scanCanvas");
    bar.style.width = "3%";
    status.textContent = t("scan.ready");
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    let tracked;
    try {
      tracked = await Pose.track(file, ({ video, frame, progress }) => {
        if (id !== runId) throw new Error("cancelled");
        drawFrame(canvas, video, frame.lm);
        bar.style.width = `${Math.max(3, progress * 100)}%`;
        status.textContent = t(progress < 0.35 ? "scan.find" : progress < 0.7 ? "scan.arm" : "scan.jump");
      });
    } catch (err) {
      if (id !== runId || err.message === "cancelled") return;
      showGate(["offline", "tooShort", "needsServer"].includes(err.message) ? err.message : "cantRead");
      return;
    }
    if (id !== runId) { Pose.release(tracked.video); return; }
    clip = tracked;

    const profile = Store.get().profile;
    const result = Analyzer.analyze(clip.frames, {
      hand: profile.hand, heightCm: profile.heightCm, frameHeight: clip.H,
    });
    if (!result.ok) { showGate(result.gate); return; }

    const drill = session.drill;
    const ev = Drills.evaluate(result, drill);
    const rec = Store.recordRep(drill.id, {
      focusPass: ev.focusPass,
      perfect: ev.perfect,
      fix: ev.fix,
      jumpCm: result.jumped ? result.metrics.jumpCm : 0,
      reachMissCm: result.metrics.reachMissCm,
    });
    Object.assign(session, {
      result, ev, rec, fb: Drills.feedback(result, drill, ev),
      celebrated: false, streakShown: false, shareBlob: null,
    });
    renderResult();
  }

  // ---- result ---------------------------------------------------------

  function renderResult() {
    const { drill, result, ev, rec, fb } = session;
    $("#resultTitle").textContent = drill.title;
    $("#xpPill").hidden = false;
    $("#xpPill").textContent = t("result.xp", { xp: rec.xp });
    $("#shareBtn").hidden = true;
    $("#resultViewer").hidden = false;
    $("#gateArt").hidden = true;
    session.tiles = resultTiles(result, rec);
    $("#tiles").innerHTML = session.tiles.map(tileHtml).join("");
    setFeedback({
      tone: fb.tone,
      icon: ev.fix ? "bulb" : "check",
      title: fb.title,
      text: fb.text,
      tip: fb.tip,
      primary: ev.fix ? ["result.filmAgain", "film"] : ["continue", "continue"],
      secondary: ev.fix ? ["continue", "continue"] : ["result.filmAgain", "film"],
    });
    show("result");
    paintKeyFrame().then(prepareShare);
  }

  function showGate(gate) {
    const g = Drills.gate(gate);
    $("#resultTitle").textContent = session.drill ? session.drill.title : "";
    $("#xpPill").hidden = true;
    $("#shareBtn").hidden = true;
    $("#resultViewer").hidden = true;
    $("#gateArt").hidden = false;
    $("#tiles").innerHTML = "";
    setFeedback({
      tone: "fix",
      icon: "camera",
      title: g.title,
      text: g.text,
      tip: "",
      primary: ["result.filmAgain", "film"],
      secondary: gate === "wrongHand" ? ["result.settings", "profile"] : ["result.tips", "tips"],
    });
    show("result");
  }

  function setFeedback({ tone, icon, title, text, tip, primary, secondary }) {
    $("#feedback").dataset.tone = tone;
    $("#fbIcon").innerHTML = ICONS[icon];
    $("#fbTitle").textContent = title;
    $("#fbText").textContent = text;
    const tipEl = $("#fbTip");
    tipEl.hidden = !tip;
    tipEl.innerHTML = tip ? `<strong>${esc(t("result.tryThis"))}</strong> ` : "";
    if (tip) tipEl.append(tip);
    const p = $("#fbPrimary"), s = $("#fbSecondary");
    p.className = `btn ${tone === "good" ? "btn-good" : "btn-fix"}`;
    p.textContent = t(primary[0]);
    p.dataset.action = primary[1];
    s.textContent = t(secondary[0]);
    s.dataset.action = secondary[1];
  }

  // Tiles: [label, value, tone, note]. Notes celebrate improvement over the last rep.
  function resultTiles(result, rec) {
    const m = result.metrics, c = result.checks, prev = rec.prev;
    const tiles = [];
    if (result.jumped) {
      let note = "";
      if (rec.prevBestJump > 0 && m.jumpCm > rec.prevBestJump) note = t("tile.newBest");
      else if (prev && prev.jumpCm > 0 && m.jumpCm > prev.jumpCm) note = t("tile.moreJump", { cm: m.jumpCm - prev.jumpCm });
      tiles.push([t("tile.jump"), `${m.jumpCm} cm`, "blue", note]);
    }
    const gained = prev && prev.reachMissCm != null ? prev.reachMissCm - m.reachMissCm : 0;
    tiles.push([
      t("tile.reach"),
      c.reach.pass ? t("tile.full") : `−${m.reachMissCm} cm`,
      c.reach.pass ? "green" : "orange",
      gained >= 3 ? t("tile.higher", { cm: gained }) : "",
    ]);
    if (!c.timing.unknown) {
      tiles.push([t("tile.timing"), t(c.timing.pass ? "tile.onTime" : c.timing.early ? "tile.early" : "tile.late"), c.timing.pass ? "green" : "orange", ""]);
    } else {
      tiles.push([t("tile.elbow"), t(c.elbowBack.pass ? "tile.high" : "tile.low"), c.elbowBack.pass ? "green" : "orange", ""]);
    }
    return tiles;
  }

  const tileHtml = ([label, value, tone, note]) =>
    `<div class="tile" data-tone="${tone}"><div class="tile-label">${esc(label)}</div>` +
    `<div class="tile-value">${esc(value)}${note ? `<small class="tile-note">${esc(note)}</small>` : ""}</div></div>`;

  // Freeze on the moment that shows the fix, with that limb lit up.
  async function paintKeyFrame() {
    if (!clip || !session.result) return;
    const { result, ev } = session;
    const view = Drills.SHOW[ev.fix] || { frame: "contact", limbs: ["hitArm"] };
    const frame = clip.frames[result.frames[view.frame]];
    await Pose.seek(clip.video, frame.t);
    if (!clip) return;
    const side = Store.get().profile.hand === "left" ? 0 : 1;
    drawFrame($("#resultCanvas"), clip.video, frame.lm, {
      highlight: limbKeys(view.limbs, side),
      tone: ev.fix ? "fix" : "good",
      ghost: view.ghost ? { sh: result.ideal.sh, to: result.ideal.wr, from: frame.lm[WR[side]] } : null,
    });
  }

  function limbKeys(limbs, side) {
    const other = 1 - side;
    const key = (a, b) => `${Math.min(a, b)}-${Math.max(a, b)}`;
    const map = {
      hitArm: [key(SH[side], EL[side]), key(EL[side], WR[side])],
      hitUpperArm: [key(SH[side], EL[side])],
      offArm: [key(SH[other], EL[other]), key(EL[other], WR[other])],
      legs: [0, 1].flatMap(s => [key(HIP[s], KNEE[s]), key(KNEE[s], ANK[s])]),
    };
    return limbs.flatMap(l => map[l] || []);
  }

  function drawFrame(canvas, video, lm, opts = {}) {
    const scale = Math.min(1, 720 / video.videoWidth);
    const w = Math.round(video.videoWidth * scale), h = Math.round(video.videoHeight * scale);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);
    if (!lm) return;

    ctx.fillStyle = "rgba(14, 22, 38, 0.25)";
    ctx.fillRect(0, 0, w, h);
    const lw = Math.max(3, w / 170);
    const P = k => ({ x: lm[k].x * scale, y: lm[k].y * scale, v: lm[k].v });
    const S = p => ({ x: p.x * scale, y: p.y * scale });
    const hot = new Set(opts.highlight || []);
    const line = (a, b, width, color, dash) => {
      ctx.setLineDash(dash || []);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };

    for (const [a, b] of CONNECTIONS) {
      const p = P(a), q = P(b);
      if (p.v < 0.2 || q.v < 0.2) continue;
      line(p, q, lw + 3, DRAW.outline);
      line(p, q, lw, hot.has(`${a}-${b}`) ? DRAW[opts.tone || "fix"] : DRAW.bone);
    }
    ctx.setLineDash([]);
    for (const k of JOINTS) {
      const p = P(k);
      if (p.v < 0.2) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, lw * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.lineWidth = lw * 0.6;
      ctx.strokeStyle = DRAW.bone;
      ctx.stroke();
    }
    const nose = P(0);
    if (nose.v >= 0.2) {
      ctx.beginPath();
      ctx.arc(nose.x, nose.y, lw * 2.4, 0, Math.PI * 2);
      ctx.lineWidth = lw * 0.9;
      ctx.strokeStyle = DRAW.bone;
      ctx.stroke();
    }

    if (opts.ghost) {
      // The straight arm they should reach for, and an arrow from where their hand was.
      const sh = S(opts.ghost.sh), to = S(opts.ghost.to), from = S(opts.ghost.from);
      const dash = [lw * 2, lw * 1.6];
      line(sh, to, lw + 3, DRAW.outline, dash);
      line(sh, to, lw, DRAW.good, dash);
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(to.x, to.y, lw * 2.2, 0, Math.PI * 2);
      ctx.lineWidth = lw * 0.8;
      ctx.strokeStyle = DRAW.good;
      ctx.stroke();
      const dx = to.x - from.x, dy = to.y - from.y, d = Math.hypot(dx, dy);
      if (d > lw * 6) {
        const ux = dx / d, uy = dy / d;
        const start = { x: from.x + ux * lw * 2, y: from.y + uy * lw * 2 };
        const tip = { x: to.x - ux * lw * 3, y: to.y - uy * lw * 3 };
        line(start, tip, lw + 3, DRAW.outline);
        line(start, tip, lw * 0.8, DRAW.good);
        const head = lw * 2.4;
        ctx.beginPath();
        ctx.moveTo(tip.x + ux * head * 0.6, tip.y + uy * head * 0.6);
        ctx.lineTo(tip.x - ux * head - uy * head * 0.7, tip.y - uy * head + ux * head * 0.7);
        ctx.lineTo(tip.x - ux * head + uy * head * 0.7, tip.y - uy * head - ux * head * 0.7);
        ctx.closePath();
        ctx.fillStyle = DRAW.good;
        ctx.fill();
      }
    }
  }

  // ---- sharing --------------------------------------------------------

  // Built ahead of time so tapping Share can open the share sheet right away.
  async function prepareShare() {
    const { result, fb, drill, tiles } = session;
    if (!result || !clip) return;
    const live = $("#resultCanvas");
    const frame = document.createElement("canvas");
    frame.width = live.width;
    frame.height = live.height;
    frame.getContext("2d").drawImage(live, 0, 0);
    try {
      const blob = await ShareCard.make({
        frame,
        tone: fb.tone,
        title: fb.title,
        text: fb.text,
        tiles: tiles.map(([label, value, tone]) => [label, value, tone]),
        streak: Store.streak(),
        subtitle: drill.title,
        tagline: t("share.tagline"),
        link: /^https?:$/.test(location.protocol) ? location.host : "",
      });
      if (session.result === result && blob) {
        session.shareBlob = blob;
        $("#shareBtn").hidden = false;
      }
    } catch (e) {
      // Sharing is a bonus; the result screen works without it.
    }
  }

  $("#shareBtn").addEventListener("click", () => {
    if (session.shareBlob) ShareCard.share(session.shareBlob, t("share.text"));
  });

  // ---- slow-motion replay ---------------------------------------------

  let replayRaf = 0;

  function nearestFrame(time) {
    let best = clip.frames[0];
    for (const f of clip.frames) if (Math.abs(f.t - time) < Math.abs(best.t - time)) best = f;
    return best;
  }

  function startReplay() {
    const video = clip.video;
    const canvas = $("#resultCanvas");
    video.loop = true;
    video.playbackRate = 0.5;
    video.currentTime = 0;
    const playing = video.play();
    if (playing) playing.catch(() => stopReplay(true));
    const btn = $("#replayBtn");
    btn.innerHTML = ICONS.pause;
    btn.setAttribute("aria-label", t("result.pause"));
    const tick = () => {
      drawFrame(canvas, video, nearestFrame(video.currentTime).lm);
      replayRaf = requestAnimationFrame(tick);
    };
    tick();
  }

  function stopReplay(repaint) {
    if (!replayRaf && !(repaint && clip)) return;
    cancelAnimationFrame(replayRaf);
    replayRaf = 0;
    if (clip) clip.video.pause();
    const btn = $("#replayBtn");
    btn.innerHTML = ICONS.play;
    btn.setAttribute("aria-label", t("result.replay"));
    if (repaint) paintKeyFrame();
  }

  $("#replayBtn").addEventListener("click", () => {
    if (!clip) return;
    if (replayRaf) stopReplay(true);
    else startReplay();
  });

  // ---- after a rep: drill complete, streak, home ----------------------

  function afterRep() {
    if (session.rec && session.rec.newlyDone && !session.celebrated) {
      session.celebrated = true;
      renderComplete();
      show("complete");
      return;
    }
    afterComplete();
  }

  function afterComplete() {
    if (session.rec && session.rec.firstToday && !session.streakShown) {
      session.streakShown = true;
      renderStreak();
      show("streak");
      return;
    }
    renderHome();
    show("home");
  }

  function renderComplete() {
    const d = session.drill;
    const progress = Store.drill(d.id);
    const next = Drills.DRILLS[Drills.DRILLS.indexOf(d) + 1];
    $("#completeText").textContent = next ? t("complete.unlocked", { next: next.title }) : t("complete.finished");
    const tiles = [[t("tile.totalXp"), `+${progress.xp}`, "yellow"], [t("tile.reps"), String(progress.reps), "blue"]];
    if (progress.bestJump) tiles.push([t("tile.bestJump"), `${progress.bestJump} cm`, "green"]);
    $("#completeTiles").innerHTML = tiles.map(tileHtml).join("");
  }

  function renderStreak() {
    const n = Store.streak();
    $("#streakBig").textContent = n;
    $("#streakLabel").textContent = t("streak.label", { n });
    const week = Store.week();
    const today = (new Date().getDay() + 6) % 7;
    $("#week").innerHTML = t("streak.days").split("").map((day, k) =>
      `<li class="${week[k] ? "on" : ""} ${k === today ? "today" : ""}"><span>${esc(day)}</span><span class="dot">${week[k] ? ICONS.check : ""}</span></li>`
    ).join("");
  }

  // ---- profile: stats, jump chart, settings ---------------------------

  function renderProfile() {
    const p = Store.get().profile;
    const s = Store.stats();
    $("#profileTiles").innerHTML = [
      [t("tile.streak"), String(Store.streak()), "orange"],
      [t("tile.totalXp"), String(Store.get().xp), "yellow"],
      [t("tile.reps"), String(s.reps), "blue"],
      [t("tile.bestJump"), s.bestJump ? `${s.bestJump} cm` : "—", "green"],
    ].map(tileHtml).join("");
    renderJumpChart($("#jumpChart"), s.jumps);
    handOptions($("#settingsHand"), p.hand, hand => { Store.setProfile({ hand }); renderProfile(); });
    heightControl($("#settingsHeight"), p.heightCm, heightCm => Store.setProfile({ heightCm }));
    optionCards($("#settingsLang"), Object.entries(I18n.LANGS).map(([code, name]) => [code, code.toUpperCase(), name]),
      I18n.lang, setLanguage);
  }

  function setLanguage(code) {
    I18n.set(code);
    Store.setProfile({ lang: code });
    I18n.apply();
    renderProfile();
  }

  // Column chart of recent jumps: latest column in the accent, earlier ones muted,
  // labels only on the latest and the best, a tooltip per column, and a table for screen readers.
  function renderJumpChart(el, jumps) {
    if (!jumps.length) {
      el.innerHTML = '<p class="chart-empty"></p>';
      el.firstChild.textContent = t("profile.jumpEmpty");
      return;
    }
    const W = 340, H = 190, L = 34, R = 10, T = 30, B = 10;
    const pw = W - L - R, ph = H - T - B, base = T + ph;
    const values = jumps.map(j => j.jumpCm);
    const best = Math.max(...values);
    const top = Math.max(20, Math.ceil((best * 1.15) / 10) * 10);
    const y = v => base - (v / top) * ph;
    const band = pw / jumps.length;
    const bw = Math.min(24, band * 0.6);
    const latest = jumps.length - 1;
    const bestIdx = values.lastIndexOf(best);
    const cx = k => L + band * k + band / 2;
    const when = j => (j.ts
      ? new Date(j.ts).toLocaleDateString(I18n.lang === "ro" ? "ro-RO" : "en-GB", { day: "numeric", month: "short" })
      : j.day);
    const describe = (j, k) => `${t("chart.rep", { n: k + 1 })} · ${j.jumpCm} cm · ${when(j)}`;

    const grid = [0, top / 2, top].map(v =>
      `<line class="chart-grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/>` +
      `<text class="chart-tick" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join("");
    const hits = jumps.map((j, k) =>
      `<rect class="chart-hit" x="${L + band * k}" y="${T}" width="${band}" height="${ph}" tabindex="0" data-k="${k}" aria-label="${esc(describe(j, k))}"/>`).join("");
    const bars = jumps.map((j, k) => {
      const x = cx(k) - bw / 2, yt = y(j.jumpCm), r = Math.min(4, (base - yt) / 2);
      return `<path class="chart-bar${k === latest ? " is-latest" : ""}" d="M${x} ${base}V${yt + r}Q${x} ${yt} ${x + r} ${yt}H${x + bw - r}Q${x + bw} ${yt} ${x + bw} ${yt + r}V${base}Z"/>`;
    }).join("");

    // Label the latest and the best; skip the best's label if it would collide.
    const labelText = k => (k === bestIdx ? `${t("chart.best")} · ${values[k]} cm` : `${values[k]} cm`);
    const labelW = k => labelText(k).length * 6.4;
    const shown = [latest];
    if (bestIdx !== latest && Math.abs(cx(bestIdx) - cx(latest)) > (labelW(bestIdx) + labelW(latest)) / 2 + 6) shown.push(bestIdx);
    const labels = shown.map(k => {
      const x = Math.min(W - R - labelW(k) / 2, Math.max(L + labelW(k) / 2, cx(k)));
      return `<text class="chart-label" x="${x}" y="${y(values[k]) - 8}" text-anchor="middle">${esc(labelText(k))}</text>`;
    }).join("");

    const rows = jumps.map((j, k) => `<tr><td>${esc(t("chart.rep", { n: k + 1 }))}</td><td>${esc(when(j))}</td><td>${j.jumpCm} cm</td></tr>`).join("");
    el.innerHTML = `
      <div class="chart-wrap">
        <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="jumpChartCap">${grid}${hits}${bars}${labels}</svg>
        <div class="chart-tip" hidden></div>
      </div>
      <p class="chart-cap" id="jumpChartCap">${esc(t("chart.caption", { n: jumps.length }))}</p>
      <table class="sr-only"><caption>${esc(t("profile.jump"))}</caption><tbody>${rows}</tbody></table>`;

    const tip = $(".chart-tip", el);
    const showTip = k => {
      tip.textContent = describe(jumps[k], k);
      tip.style.left = `${(cx(k) / W) * 100}%`;
      tip.style.top = `${(y(values[k]) / H) * 100}%`;
      tip.hidden = false;
    };
    $$(".chart-hit", el).forEach(hit => {
      const k = Number(hit.dataset.k);
      ["pointerenter", "focus", "click"].forEach(ev => hit.addEventListener(ev, () => showTip(k)));
      ["pointerleave", "blur"].forEach(ev => hit.addEventListener(ev, () => { tip.hidden = true; }));
    });
  }

  // ---- actions --------------------------------------------------------

  const ACTIONS = {
    home: () => { renderHome(); show("home"); },
    profile: () => { renderProfile(); show("profile"); },
    tips: openTips,
    film: () => $("#filmInput").click(),
    upload: () => $("#uploadInput").click(),
    cancel: () => { runId += 1; openDrill(session.drill); },
    continue: afterRep,
    "after-complete": afterComplete,
    "onb-back": () => {
      if (onbStep > 0) { onbStep -= 1; renderOnboarding(); }
      else location.href = "index.html";
    },
    reset: () => {
      if (!confirm(t("profile.resetConfirm"))) return;
      Store.reset();
      onbStep = 0;
      draft = { hand: null, heightCm: 175 };
      renderOnboarding();
      show("onboarding");
    },
  };

  document.addEventListener("click", e => {
    const el = e.target.closest("[data-action]");
    if (el && ACTIONS[el.dataset.action]) ACTIONS[el.dataset.action](el);
  });

  // ---- start ----------------------------------------------------------

  const profile = Store.get().profile;
  if (profile && profile.lang) I18n.set(profile.lang);
  I18n.apply();
  fillIcons();
  Mascot.mount();
  if (profile && profile.onboarded) {
    renderHome();
    show("home");
  } else {
    renderOnboarding();
    show("onboarding");
  }

  // Installable and usable offline once loaded over http(s).
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
