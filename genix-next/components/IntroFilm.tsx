"use client";
import { useEffect, useRef, useState } from "react";

/** Chapter starts in seconds, matching 3d/intro_titles.py. */
const CHAPTERS = [
  { t: 0, label: "Genix" },
  { t: 5, label: "Foundation" },
  { t: 13, label: "Advanced" },
  { t: 21, label: "The project" },
  { t: 30, label: "Services" },
  { t: 37, label: "Quality" },
];
const LENGTH = 42;

/**
 * The hero film: muted autoplay only while on screen (never for reduced-motion or data-saver visitors),
 * a pause control, and a chapter rail that shows progress and jumps to a chapter on click.
 */
export default function IntroFilm() {
  const video = useRef<HTMLVideoElement>(null);
  const rail = useRef<HTMLOListElement>(null);
  const [playing, setPlaying] = useState(false);
  const [chapter, setChapter] = useState(0);
  const userPaused = useRef(false);

  useEffect(() => {
    const v = video.current!;
    const quiet = matchMedia("(prefers-reduced-motion: reduce)").matches ||
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    let raf = 0;

    const paint = () => {
      const t = v.currentTime;
      const items = rail.current?.children;
      if (items) {
        CHAPTERS.forEach((c, i) => {
          const end = CHAPTERS[i + 1]?.t ?? LENGTH;
          const f = Math.min(1, Math.max(0, (t - c.t) / (end - c.t)));
          (items[i] as HTMLElement).style.setProperty("--p", String(f));
        });
      }
      let idx = 0;
      CHAPTERS.forEach((c, i) => { if (t >= c.t) idx = i; });
      setChapter(idx);
      if (!v.paused) raf = requestAnimationFrame(paint);
    };
    const onPlay = () => { setPlaying(true); cancelAnimationFrame(raf); raf = requestAnimationFrame(paint); };
    const onPause = () => { setPlaying(false); paint(); };
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("seeked", paint);

    const io = new IntersectionObserver(([e]) => {
      if (quiet || userPaused.current) return;
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }, { threshold: 0.35 });
    io.observe(v);
    return () => { io.disconnect(); cancelAnimationFrame(raf); v.removeEventListener("play", onPlay); v.removeEventListener("pause", onPause); v.removeEventListener("seeked", paint); };
  }, []);

  const toggle = () => {
    const v = video.current!;
    userPaused.current = !v.paused;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };
  const jump = (t: number) => {
    const v = video.current!;
    userPaused.current = false;
    v.currentTime = t + 0.01;
    v.play().catch(() => {});
  };
  const full = () => {
    const v = video.current! as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    if (v.requestFullscreen) v.requestFullscreen().then(() => v.play()).catch(() => {});
    else v.webkitEnterFullscreen?.();
  };

  return (
    <figure className="film">
      <div className="film-frame">
        <video
          ref={video}
          muted
          playsInline
          loop
          preload="metadata"
          poster="/video/genix-intro-poster.jpg"
          onClick={toggle}
          aria-label="Genix Solutions introduction: screens of an e-commerce app travel along a quality line through manual testing, automation and an end-to-end check, then the line forms the Genix logo."
        >
          <source src="/video/genix-intro.mp4" type="video/mp4" />
        </video>
        <div className="film-ui">
          <button type="button" className="film-btn" onClick={toggle} aria-label={playing ? "Pause the film" : "Play the film"}>
            {playing ? (
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor" /></svg>
            )}
          </button>
          <span className="film-now">{CHAPTERS[chapter].label}</span>
          <button type="button" className="film-btn" onClick={full} aria-label="Watch full screen">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
          </button>
        </div>
      </div>
      <figcaption className="sr">A 42-second introduction to Genix Solutions’ QA training and testing services.</figcaption>
      <ol className="film-rail" ref={rail} aria-label="Film chapters">
        {CHAPTERS.map((c, i) => (
          <li key={c.label} style={{ flexGrow: (CHAPTERS[i + 1]?.t ?? LENGTH) - c.t }} className={i === chapter ? "is-on" : undefined}>
            <button type="button" onClick={() => jump(c.t)}>
              <span className="film-bar" aria-hidden="true"><i /></span>
              <span className="film-label">{c.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </figure>
  );
}
