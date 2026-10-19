"use client";
import { useEffect, useRef } from "react";
import { REVEAL_SELECTOR } from "@/lib/reveal";

/**
 * Counts from 0 to `value`. Starts when its tile is revealed (see components/Reveal.tsx), after the
 * tile's stagger delay plus a short lead-in, so the whole climb happens while the number is visible.
 * Renders `value` on the server, so it is correct without JS.
 */
export default function CountUp({ value, duration = 1800, suffix = "" }: { value: number; duration?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    el.textContent = "0" + suffix;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout>;

    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic: steady climb, gentle landing
        el.textContent = Math.round(value * eased) + suffix;
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    // Tile that fades in; wait for it rather than using a separate trigger.
    const tile = document.documentElement.classList.contains("js-reveal") ? el.closest(REVEAL_SELECTOR) : null;
    let mo: MutationObserver | undefined;
    let io: IntersectionObserver | undefined;

    if (tile) {
      const startAfterReveal = () => {
        if (!tile.classList.contains("is-in")) return;
        mo?.disconnect();
        const stagger = parseFloat(getComputedStyle(tile).getPropertyValue("--d")) || 0;
        timer = setTimeout(run, stagger + 250); // by then the tile is ~80% opaque
      };
      mo = new MutationObserver(startAfterReveal);
      mo.observe(tile, { attributes: true, attributeFilter: ["class"] });
      startAfterReveal();
    } else {
      io = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        io?.disconnect();
        run();
      }, { threshold: 0.6 });
      io.observe(el);
    }

    return () => {
      mo?.disconnect();
      io?.disconnect();
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      el.textContent = value + suffix;
    };
  }, [value, duration, suffix]);

  return <span ref={ref}>{value}{suffix}</span>;
}
