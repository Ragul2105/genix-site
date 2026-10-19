"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import { activeLenis } from "./SmoothScroll";
import { nav } from "@/lib/site";

export default function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [openedOn, setOpenedOn] = useState(path);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // Close whenever the route changes (adjusting state during render, not in an effect).
  if (open && openedOn !== path) setOpen(false);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.classList.add("menu-open");
    activeLenis?.stop();
    panel.current?.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });
    const btn = toggle.current;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      // keep Tab inside the bar + panel while open
      if (e.key !== "Tab" || !panel.current || !btn) return;
      const items = [btn, ...panel.current.querySelectorAll<HTMLElement>("a")];
      const i = items.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i === items.length - 1 ? 0 : i + 1);
      e.preventDefault();
      items[next].focus();
    };
    const onResize = () => { if (window.innerWidth > 1100) setOpen(false); };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      root.classList.remove("menu-open");
      activeLenis?.start();
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      btn?.focus({ preventScroll: true });
    };
  }, [open]);

  const links = nav.map((n, i) => (
    <Link key={n.href} href={n.href} aria-current={path === n.href ? "page" : undefined} style={{ "--i": i + 1 } as React.CSSProperties}>
      {n.label}
    </Link>
  ));

  return (
    <header className={`site-header${open ? " is-open" : ""}`}>
      <div className="w">
        <Link href="/" className="logo" aria-label="Genix Solutions home">
          <Logo />
          <span><b>Genix</b><small>SOLUTIONS</small></span>
        </Link>
        <nav className="nav" aria-label="Main">{links}</nav>
        <div className="hdr-actions">
          <Link className="btn y sm" href="/enrol" style={{ "--i": nav.length + 1 } as React.CSSProperties}>Enrol Now</Link>
          <button
            ref={toggle}
            type="button"
            className="menu-btn"
            style={{ "--i": nav.length + 2 } as React.CSSProperties}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => { setOpenedOn(path); setOpen((o) => !o); }}
          >
            <span /><span />
          </button>
        </div>
      </div>
      <div id="mobile-menu" ref={panel} className="mobile-menu" hidden={!open}>
        <nav aria-label="Main mobile">{links}</nav>
      </div>
    </header>
  );
}
