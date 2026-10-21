"use client";
import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** The running instance, so overlays (the mobile menu) can pause page scrolling. */
export let activeLenis: Lenis | null = null;

export default function SmoothScroll() {
  const lenis = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const instance = new Lenis({ lerp: 0.1 });
    lenis.current = instance;
    activeLenis = instance;
    let raf = requestAnimationFrame(function loop(time) {
      instance.raf(time);
      raf = requestAnimationFrame(loop);
    });
    // Same-page #anchor links: animate through Lenis instead of the native jump.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element).closest("a");
      if (!link || link.target) return;
      const url = new URL(link.href, window.location.href);
      if (!url.hash || url.pathname !== window.location.pathname) return;
      const target = document.querySelector(url.hash);
      if (!target) return;
      e.preventDefault();
      history.pushState(null, "", url.hash);
      window.dispatchEvent(new HashChangeEvent("hashchange")); // pushState doesn't fire it; listeners (e.g. the enquiry form) rely on it
      instance.scrollTo(target as HTMLElement, { offset: -90 });
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(raf);
      instance.destroy();
      lenis.current = null;
      activeLenis = null;
    };
  }, []);

  // New page: jump to top (or to the #hash target) without animating.
  useEffect(() => {
    const hash = window.location.hash;
    const target = hash ? document.querySelector(hash) : null;
    if (lenis.current) {
      if (target instanceof HTMLElement) lenis.current.scrollTo(target, { immediate: true, offset: -90 });
      else lenis.current.scrollTo(0, { immediate: true });
    }
  }, [pathname]);

  return null;
}
