"use client";
/*
 * Curriculum roadmap ("Release Archipelago"). Interaction after The Ride to Rio (Awwwards nominee): the world is
 * pinned while you scroll, the camera rides the route, a chapter index sits left, the stop's story sits right,
 * a progress strip runs along the bottom, and "View as list" is always one click away.
 */
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ACTS, curriculum } from "@/lib/curriculum";
import { activeLenis } from "@/components/SmoothScroll";
import type { Layout } from "./RoadmapCanvas";

const RoadmapCanvas = dynamic(() => import("./RoadmapCanvas"), { ssr: false });

const N = curriculum.length;
const TITLES = curriculum.map((p) => p.title);
const actOf = (part: number) => ACTS.find((a) => part >= a.from && part <= a.to)!;

const STOP_VH = 70; // scroll length per stop
const STOPS = N + 1; // overview + 18 islands

/** Scroll fraction → travel value (-1 = overview, 0..17 = islands), holding still around each stop. */
function dwell(raw: number) {
  const x = raw * (STOPS - 1) - 1;
  const k = Math.floor(x);
  const f = x - k;
  const hold = 0.22;
  const e = f < hold ? 0 : f > 1 - hold ? 1 : (f - hold) / (1 - 2 * hold);
  return Math.min(N - 1, k + e * e * (3 - 2 * e));
}

function canUseWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function Roadmap() {
  const section = useRef<HTMLElement>(null);
  const travelRef = useRef(-1);
  const activeRef = useRef(-1);
  const [stop, setStop] = useState(-1); // -1 overview, else 0-based part
  const [view, setView] = useState<"map" | "list">("map");
  const [support, setSupport] = useState<"unknown" | "3d" | "none">("unknown");
  const [near, setNear] = useState(false);
  const [inView, setInView] = useState(false);
  const [ready, setReady] = useState(false);
  const [layout, setLayout] = useState<Layout>("wide");
  const [quality, setQuality] = useState<"high" | "low">("high");

  // capability + preference checks (client only)
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = canUseWebGL();
    const small = window.matchMedia("(max-width: 900px)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    queueMicrotask(() => {
      setSupport(gl ? "3d" : "none");
      if (!gl || reduce) setView("list");
      setLayout(small ? "narrow" : "wide");
      setQuality(small || coarse || (navigator.hardwareConcurrency ?? 8) < 6 ? "low" : "high");
    });
    const mq = window.matchMedia("(max-width: 900px)");
    const onMq = () => setLayout(mq.matches ? "narrow" : "wide");
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  // load the 3D world shortly before it scrolls in; pause rendering while off screen
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const pre = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "100% 0px" });
    const vis = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    pre.observe(el);
    vis.observe(el);
    return () => { pre.disconnect(); vis.disconnect(); };
  }, [view]);

  // scroll → travel
  useEffect(() => {
    if (view !== "map") return;
    let raf = 0;
    const tick = () => {
      const el = section.current;
      if (el) {
        const r = el.getBoundingClientRect();
        const span = r.height - window.innerHeight;
        const raw = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
        const tr = dwell(raw);
        travelRef.current = tr;
        const s = Math.round(tr);
        setStop((prev) => (prev === s ? prev : s));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [view]);

  const go = useCallback((s: number) => {
    const el = section.current;
    if (!el) return;
    const target = Math.max(-1, Math.min(N - 1, s));
    const span = el.offsetHeight - window.innerHeight;
    const y = el.getBoundingClientRect().top + window.scrollY + ((target + 1) / (STOPS - 1)) * span;
    if (activeLenis) activeLenis.scrollTo(y, { duration: 1.6 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  }, []);

  // keyboard: ←/→ between stops while the map is on screen
  useEffect(() => {
    if (view !== "map" || !inView) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") { e.preventDefault(); go(stop + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(stop - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, inView, stop, go]);

  const onReady = useCallback(() => setReady(true), []);
  const part = stop >= 0 ? curriculum[stop] : null;
  const act = stop >= 0 ? actOf(stop + 1) : null;

  const head = (
    <div className="rm-head">
      <div className="eb">Full curriculum</div>
      <h2>{N} parts, from first day to first job search.</h2>
      {support === "3d" && (
        <div className="rm-toggle" role="group" aria-label="Curriculum view">
          <button type="button" aria-pressed={view === "map"} onClick={() => setView("map")}>Roadmap</button>
          <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>List</button>
        </div>
      )}
    </div>
  );

  if (view === "list" || support === "none") {
    return (
      <section className="sec tint rm-list" id="curriculum" ref={section}>
        <div className="w">
          {head}
          <p className="lead" style={{ marginBottom: 36 }}>Select a part to see its topics.</p>
          {curriculum.map((p, i) => (
            <details className="acc" key={p.title}>
              <summary>Part {i + 1}: {p.title}</summary>
              <ul>{p.topics.map((t) => <li key={t}>{t}</li>)}</ul>
            </details>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rm" id="curriculum" ref={section} style={{ height: `calc(100vh + ${STOPS * STOP_VH}vh)` }}
      aria-label="Curriculum roadmap">
      <div className={`rm-stage${ready ? " is-ready" : ""}`}>
        <div className="rm-poster" aria-hidden="true" />
        {support === "3d" && near && (
          <div className="rm-canvas" aria-hidden="true">
            <RoadmapCanvas travelRef={travelRef} activeRef={activeRef} layout={layout} running={inView}
              quality={quality} onReady={onReady} stop={stop} onSelect={go} titles={TITLES} />
          </div>
        )}
        <div className="rm-shade" aria-hidden="true" />

        <div className="rm-ui w">
          {head}

          <nav className="rm-index" aria-label="Curriculum parts">
            {ACTS.map((a) => (
              <div key={a.name} className={`rm-act${act?.name === a.name ? " on" : ""}`}>
                <span className="rm-act-name">{a.name}</span>
                <ol>
                  {curriculum.slice(a.from - 1, a.to).map((p, j) => {
                    const i = a.from - 1 + j;
                    return (
                      <li key={p.title}>
                        <button type="button" aria-current={i === stop ? "step" : undefined} onClick={() => go(i)}>
                          <b>{String(i + 1).padStart(2, "0")}</b> {p.title}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </nav>

          <article className="rm-card" key={stop} aria-live="polite" data-lenis-prevent>
            {part && act ? (
              <>
                <div className="rm-card-top">
                  <span className="rm-chip">Part {String(stop + 1).padStart(2, "0")} / {N}</span>
                  <span className="rm-act-label">{act.name}</span>
                </div>
                <h3>{part.title}</h3>
                <p className="rm-count">{part.topics.length} topics</p>
                <ul>
                  {part.topics.map((t, k) => <li key={t} style={{ ["--k" as string]: k }}>{t}</li>)}
                </ul>
                {stop === N - 1 && (
                  <Link className="btn y sm rm-cta" href="/enrol">You made it. Enquire about enrolment →</Link>
                )}
                <div className="rm-nav">
                  <button type="button" onClick={() => go(stop - 1)} aria-label="Previous part">←</button>
                  <button type="button" onClick={() => go(stop + 1)} disabled={stop === N - 1} aria-label="Next part">→</button>
                </div>
              </>
            ) : (
              <>
                <div className="rm-card-top"><span className="rm-chip">The route</span></div>
                <h3>Eighteen islands. One release.</h3>
                <p className="rm-intro">Scroll to travel the programme part by part, from your first day on a QA team to your first job search. Every island is a part of the curriculum.</p>
                <button type="button" className="btn y sm" onClick={() => go(0)}>Start the journey ↓</button>
              </>
            )}
          </article>

          <ol className="rm-strip" aria-label="Progress">
            {curriculum.map((p, i) => (
              <li key={p.title} className={i < stop ? "done" : i === stop ? "on" : undefined}>
                <button type="button" onClick={() => go(i)} aria-label={`Part ${i + 1}: ${p.title}`}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
