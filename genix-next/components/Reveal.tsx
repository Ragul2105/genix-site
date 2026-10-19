"use client";
import { useEffect } from "react";
import { MAX_STAGGER_STEPS, REVEAL_SELECTOR, SPLIT_SELECTOR, STAGGER_MS } from "@/lib/reveal";

declare global {
  interface Window { __revealReady?: boolean }
}

/**
 * Reveals elements in batches as they reach 75% of the viewport (Bettr Academy's trigger point).
 * Everything that enters in the same frame is one batch, staggered in document order, so a page
 * load or a fast scroll cascades instead of popping in all at once.
 */
export default function Reveal() {
  useEffect(() => {
    const root = document.documentElement;
    window.__revealReady = true;
    if (!root.classList.contains("js-reveal")) return;

    const selector = `${REVEAL_SELECTOR}, ${SPLIT_SELECTOR}`;
    const pending = new Set<Element>();

    const show = (els: Element[]) => {
      els
        .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
        .forEach((el, i) => {
          io.unobserve(el);
          pending.delete(el);
          (el as HTMLElement).style.setProperty("--d", `${Math.min(i, MAX_STAGGER_STEPS) * STAGGER_MS}ms`);
          el.classList.add("is-in");
        });
    };

    const io = new IntersectionObserver(
      (entries) => show(entries.filter((e) => e.isIntersecting).map((e) => e.target)),
      { rootMargin: "0px 0px -25% 0px" },
    );

    const scan = () => {
      document.querySelectorAll(selector).forEach((el) => {
        if (el.classList.contains("is-in") || pending.has(el)) return;
        pending.add(el);
        io.observe(el);
      });
    };

    // Items in the last 25% of the page can never cross the 75% line; reveal them at the bottom.
    const atBottom = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) show([...pending]);
    };

    scan();
    atBottom();
    const mo = new MutationObserver(() => { scan(); atBottom(); }); // client-side page changes
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", atBottom, { passive: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("scroll", atBottom);
    };
  }, []);

  return null;
}
