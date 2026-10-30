/* The skill path: drills, what each one checks, and what the coach says (words live in i18n.js). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./i18n.js"));
  else root.Drills = factory(root.I18n);
})(typeof self !== "undefined" ? self : this, function (I18n) {
  "use strict";

  const t = I18n.t;

  // `checks` run in priority order: the first one that fails is the one fix we show.
  // A drill is done once its `focus` check passes ("all" = every check), or after 3 reps.
  const DRILLS = [
    {
      id: "arm-swing", icon: "swing", demo: "armSwing", highlight: ["armN"], needsJump: false,
      focus: "reach", checks: ["elbowBack", "reach"],
    },
    {
      id: "point-swing", icon: "point", demo: "armSwing", highlight: ["armF"], needsJump: false,
      focus: "offArmUp", checks: ["offArmUp", "elbowBack", "reach"],
    },
    {
      id: "jump-reach", icon: "jump", demo: "jumpReach", highlight: ["legs"], needsJump: true,
      focus: "timing", checks: ["jump", "armsBack", "timing", "reach"],
    },
    {
      id: "approach", icon: "steps", demo: "approach", highlight: ["legs"], needsJump: true,
      focus: "travel", checks: ["travel", "jump", "armsBack"],
    },
    {
      id: "full-spike", icon: "ball", demo: "fullSpike", highlight: [], needsJump: true,
      focus: "all", checks: ["travel", "jump", "armsBack", "elbowBack", "timing", "reach"],
    },
  ].map(d => Object.defineProperties(d, {
    title: { get: () => t(`drill.${d.id}.title`) },
    intro: { get: () => t(`drill.${d.id}.intro`) },
    steps: { get: () => [1, 2, 3].map(n => t(`drill.${d.id}.step${n}`)) },
  }));

  const fixCopy = (key, vars) => ({
    title: t(`fix.${key}.title`), text: t(`fix.${key}.text`, vars), tip: t(`fix.${key}.tip`),
  });

  const FIX = {
    reach: r => fixCopy("reach", { cm: r.checks.reach.missCm }),
    elbowBack: () => fixCopy("elbowBack"),
    offArmUp: () => fixCopy("offArmUp"),
    armsBack: () => fixCopy("armsBack"),
    jump: () => fixCopy("jump"),
    timing: r => fixCopy(r.checks.timing.early ? "early" : "late"),
    travel: () => fixCopy("travel"),
  };

  const PRAISE = {
    reach: r => t(r.checks.reach.elbowAngle >= 160 ? "praise.reachStraight" : "praise.reach"),
    offArmUp: () => t("praise.offArmUp"),
    timing: () => t("praise.timing"),
    travel: r => t("praise.travel", { cm: r.metrics.travelCm }),
    all: () => t("praise.all"),
  };

  const GATES = ["noPerson", "feetOut", "tooFar", "tooShort", "noSwing", "wrongHand", "cantRead", "offline", "needsServer"];
  const gate = name => {
    const key = GATES.includes(name) ? name : "cantRead";
    return { title: t(`gate.${key}.title`), text: t(`gate.${key}.text`) };
  };

  // Which frame to freeze on, and which limbs to light up, for each fix.
  const SHOW = {
    reach: { frame: "contact", limbs: ["hitArm"], ghost: true },
    timing: { frame: "contact", limbs: ["hitArm"] },
    elbowBack: { frame: "windup", limbs: ["hitUpperArm"] },
    offArmUp: { frame: "windup", limbs: ["offArm"] },
    armsBack: { frame: "load", limbs: ["hitArm", "offArm"] },
    jump: { frame: "peak", limbs: ["legs"] },
    travel: { frame: "peak", limbs: ["legs"] },
  };

  function evaluate(result, drill) {
    const fix = drill.checks.find(name => !result.checks[name].pass) || null;
    const focusPass = drill.focus === "all" ? !fix : result.checks[drill.focus].pass;
    return { fix, focusPass, perfect: !fix };
  }

  function feedback(result, drill, ev) {
    if (ev.fix) return Object.assign({ tone: "fix" }, FIX[ev.fix](result));
    const praise = PRAISE[drill.focus] || PRAISE.all;
    return { tone: "good", title: t("praise.title"), text: praise(result), tip: t("praise.tip") };
  }

  const byId = id => DRILLS.find(d => d.id === id);

  return { DRILLS, SHOW, evaluate, feedback, gate, byId };
});
