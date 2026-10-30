/* Bo, the coach: a volleyball with a headband. Moods: normal, happy, thinking, oops. */
const Mascot = (() => {
  "use strict";

  const INK = "#1F2A44";
  let uid = 0;

  const EYES = {
    normal: `
      <ellipse cx="37" cy="57" rx="8.5" ry="9.5" fill="#fff" stroke="${INK}" stroke-width="2.5"/>
      <ellipse cx="63" cy="57" rx="8.5" ry="9.5" fill="#fff" stroke="${INK}" stroke-width="2.5"/>
      <circle cx="39" cy="59" r="4.3" fill="${INK}"/><circle cx="65" cy="59" r="4.3" fill="${INK}"/>
      <circle cx="40.6" cy="57.3" r="1.4" fill="#fff"/><circle cx="66.6" cy="57.3" r="1.4" fill="#fff"/>`,
    happy: `
      <path d="M29 60 Q37 49 45 60" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M55 60 Q63 49 71 60" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`,
    thinking: `
      <ellipse cx="37" cy="57" rx="8.5" ry="9.5" fill="#fff" stroke="${INK}" stroke-width="2.5"/>
      <ellipse cx="63" cy="57" rx="8.5" ry="9.5" fill="#fff" stroke="${INK}" stroke-width="2.5"/>
      <circle cx="40" cy="53.5" r="4.3" fill="${INK}"/><circle cx="66" cy="53.5" r="4.3" fill="${INK}"/>`,
    oops: `
      <path d="M29 48 L44 44" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <path d="M71 48 L56 44" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="37" cy="58" rx="7.5" ry="8.5" fill="#fff" stroke="${INK}" stroke-width="2.5"/>
      <ellipse cx="63" cy="58" rx="7.5" ry="8.5" fill="#fff" stroke="${INK}" stroke-width="2.5"/>
      <circle cx="37.5" cy="59.5" r="3.6" fill="${INK}"/><circle cx="63.5" cy="59.5" r="3.6" fill="${INK}"/>`,
  };

  const MOUTH = {
    normal: `<path d="M42 72 Q50 79 58 72" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    happy: `<path d="M37 69 Q50 88 63 69 Z" fill="${INK}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
            <path d="M43 77 Q50 84 57 77 Q50 74 43 77 Z" fill="#FF7A7A"/>`,
    thinking: `<path d="M45 75 Q50 73 55 75" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    oops: `<path d="M41 76 Q45.5 71 50 76 Q54.5 81 59 76" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  };

  function svg(mood = "normal") {
    const id = `bo-clip-${++uid}`;
    const m = EYES[mood] ? mood : "normal";
    return `
      <svg class="bo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <defs><clipPath id="${id}"><circle cx="50" cy="52" r="40"/></clipPath></defs>
        <ellipse class="bo-shadow" cx="50" cy="96" rx="26" ry="3.5" fill="#000" fill-opacity="0.1"/>
        <circle cx="50" cy="52" r="40" fill="#F2B705"/>
        <g clip-path="url(#${id})">
          <path d="M0 18 C30 28 70 28 100 18 L100 33 C70 43 30 43 0 33 Z" fill="#2B59E8"/>
          <path d="M6 86 C28 76 72 76 94 86" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="4"/>
          <path d="M14 30 C10 48 12 66 22 82" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="3"/>
        </g>
        <circle cx="50" cy="52" r="40" fill="none" stroke="${INK}" stroke-width="3"/>
        <circle cx="26" cy="69" r="5" fill="#FF8A65" opacity="0.45"/>
        <circle cx="74" cy="69" r="5" fill="#FF8A65" opacity="0.45"/>
        ${EYES[m]}
        ${MOUTH[m]}
      </svg>`;
  }

  // Fills every [data-mascot="mood"] element under root.
  function mount(root = document) {
    root.querySelectorAll("[data-mascot]").forEach(el => { el.innerHTML = svg(el.dataset.mascot); });
  }

  return { svg, mount };
})();
