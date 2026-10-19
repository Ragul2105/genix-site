/*
 * Reveal system. Timing and easing come from live award-site references:
 *  - lenis.dev (darkroom.engineering): cubic-bezier(0.19, 1, 0.22, 1) on every reveal, ~75–80ms stagger.
 *  - Bettr Academy (Awwwards nominee): masked words rise 120% → 0, 0.96s, 80ms stagger; trigger at 75% of viewport.
 *  - Orizon (Awwwards nominee): headings from blur(6px) + 28px, grid items revealed as one staggered batch.
 */

export const EASE = "cubic-bezier(0.19, 1, 0.22, 1)";
export const STAGGER_MS = 80;
export const MAX_STAGGER_STEPS = 9;

// Containers that reveal as one unit; their children must not animate separately.
const units = ".card, .fcard, .lc-card, .journey, .ticket, form, table, .acc";
const notInUnit = `:not(:is(${units}) *)`;

/** Plain blocks: fade + rise. */
const blocks = [
  "main .eb", "main .lead", "main .sub", "main .tagline", "main .actions > *",
  "main .ticket", "main .card", "main .fcard", "main .lc-card", "main .journey", "main .sec-link", "main .step", "main .flow", "main .layers",
  "main table", "main .acc", "main .stats > div", "main form", "main .w > p",
  "main .cta .btn", "main .cta .kick", "footer .cols > *", "footer .copy",
].map((s) => s + notInUnit);

/** Headings: same, plus a short blur (Orizon). */
const headings = ["main h2"].map((s) => s + notInUnit);

export const REVEAL_SELECTOR = [...blocks, ...headings].join(", ");
export const SPLIT_SELECTOR = "[data-split]";

/** CSS for the hidden + revealed states, scoped to html.js-reveal so no-JS visitors see everything. */
export const revealCss = `
.js-reveal :is(${blocks.join(", ")}):not(.is-in){opacity:0;transform:translate3d(0,24px,0)}
.js-reveal :is(${headings.join(", ")}):not(.is-in){opacity:0;transform:translate3d(0,28px,0);filter:blur(6px)}
.js-reveal :is(${[...blocks, ...headings].join(", ")}){
  transition:opacity .9s ${EASE} var(--d,0ms),transform 1.1s ${EASE} var(--d,0ms),filter .9s ${EASE} var(--d,0ms);
}
`;

/** Runs in <head> before first paint. Skips motion for reduced-motion users; never leaves content hidden if JS stalls. */
export const revealBootScript = `(function(){try{
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var h=document.documentElement;h.classList.add('js-reveal','intro');
setTimeout(function(){h.classList.remove('intro')},2500);
setTimeout(function(){if(!window.__revealReady)h.classList.remove('js-reveal')},3500);
}catch(e){}})();`;
