/* Progress saved on this device: profile, XP, streak, drill progress. */
const Store = (() => {
  "use strict";

  const KEY = "spikeCoach.v1";
  const XP_PER_REP = 10;
  const XP_DRILL_DONE = 20;
  const REPS_TO_UNLOCK = 3;

  const blank = () => ({ profile: null, xp: 0, streak: { count: 0, last: null }, drills: {}, history: [] });

  // Rebuild saved progress field by field, so a corrupted or edited save can't smuggle in
  // unexpected values or keys.
  function load() {
    const s = blank();
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { /* unreadable: start fresh */ }
    if (!raw || typeof raw !== "object") return s;
    const num = (v, fallback, min, max) => (Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback);
    const str = v => (typeof v === "string" && v.length < 40 ? v : null);
    const p = raw.profile;
    if (p && typeof p === "object") {
      s.profile = {
        hand: p.hand === "left" ? "left" : "right",
        heightCm: num(p.heightCm, 175, 120, 220),
        onboarded: p.onboarded === true,
      };
      if (str(p.lang)) s.profile.lang = p.lang;
    }
    s.xp = num(raw.xp, 0, 0, 1e7);
    if (raw.streak && typeof raw.streak === "object") {
      s.streak = { count: num(raw.streak.count, 0, 0, 1e5), last: str(raw.streak.last) };
    }
    if (raw.drills && typeof raw.drills === "object") {
      for (const [id, d] of Object.entries(raw.drills)) {
        if (!/^[a-z-]{1,30}$/.test(id) || !d || typeof d !== "object") continue;
        s.drills[id] = {
          reps: num(d.reps, 0, 0, 1e6), done: d.done === true,
          bestJump: num(d.bestJump, 0, 0, 200), xp: num(d.xp, 0, 0, 1e7),
        };
      }
    }
    if (Array.isArray(raw.history)) {
      s.history = raw.history.slice(-300).filter(h => h && typeof h === "object").map(h => ({
        day: str(h.day), ts: num(h.ts, null, 0, 1e14), drill: str(h.drill), perfect: h.perfect === true,
        jumpCm: num(h.jumpCm, 0, 0, 200), reachMissCm: num(h.reachMissCm, null, 0, 300), fix: str(h.fix),
      }));
    }
    return s;
  }

  let state = load();
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode: keep it in memory */ }
  };

  const dayKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const today = () => dayKey(new Date());
  const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return dayKey(d); };

  return {
    get: () => state,

    setProfile(p) {
      state.profile = Object.assign({}, state.profile, p);
      save();
    },

    drill: id => state.drills[id] || { reps: 0, done: false, bestJump: 0, xp: 0 },

    // The streak only counts if they practiced today or yesterday.
    streak: () => (state.streak.last === today() || state.streak.last === daysAgo(1) ? state.streak.count : 0),
    practicedToday: () => state.streak.last === today(),

    // Days practiced this week, Monday first: [true, false, ...].
    week() {
      const days = new Set(state.history.map(h => h.day));
      const now = new Date();
      const monday = (now.getDay() + 6) % 7;
      return Array.from({ length: 7 }, (_, k) => days.has(daysAgo(monday - k)));
    },

    // rep: { focusPass, perfect, jumpCm, reachMissCm, fix }. Returns what changed, plus the
    // previous rep of this drill and the best jump so far, for "better than last time" notes.
    recordRep(drillId, rep) {
      const prev = state.history.slice().reverse().find(h => h.drill === drillId) || null;
      const prevBestJump = state.history.reduce((m, h) => Math.max(m, h.jumpCm || 0), 0);
      const firstToday = state.streak.last !== today();
      if (firstToday) {
        state.streak.count = state.streak.last === daysAgo(1) ? state.streak.count + 1 : 1;
        state.streak.last = today();
      }
      const d = state.drills[drillId] = Object.assign({ reps: 0, done: false, bestJump: 0, xp: 0 }, state.drills[drillId]);
      d.reps += 1;
      d.bestJump = Math.max(d.bestJump, rep.jumpCm || 0);
      let xp = XP_PER_REP;
      const newlyDone = !d.done && (rep.focusPass || d.reps >= REPS_TO_UNLOCK);
      if (newlyDone) {
        d.done = true;
        xp += XP_DRILL_DONE;
      }
      d.xp += xp;
      state.xp += xp;
      state.history.push({
        day: today(), ts: Date.now(), drill: drillId, perfect: !!rep.perfect,
        jumpCm: rep.jumpCm || 0, reachMissCm: rep.reachMissCm ?? null, fix: rep.fix || null,
      });
      if (state.history.length > 300) state.history = state.history.slice(-300);
      save();
      return { xp, newlyDone, firstToday, streak: state.streak.count, prev, prevBestJump };
    },

    stats() {
      const h = state.history;
      return {
        reps: h.length,
        bestJump: h.reduce((m, x) => Math.max(m, x.jumpCm || 0), 0),
        jumps: h.filter(x => x.jumpCm > 0).slice(-12),
      };
    },

    reset() {
      state = blank();
      save();
    },
  };
})();
