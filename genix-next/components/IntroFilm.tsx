"use client";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";

const PLAY_EVENT = "genix:play-intro";

/** "Watch Company Introduction": asks the hero film to start (it lives in the same hero). */
export function WatchIntroButton({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(PLAY_EVENT))}>
      <span className="wi-ic" aria-hidden="true"><Icon name="play" size={14} /></span>
      Watch Company Introduction
    </button>
  );
}

/**
 * The company introduction as a card (as in the client's reference): poster, play button, title and
 * running time. Once started it plays inline with a thin progress line; click toggles pause.
 */
export default function IntroFilm() {
  const video = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = video.current!;
    let raf = 0;
    const tick = () => {
      if (bar.current && v.duration) bar.current.style.transform = `scaleX(${v.currentTime / v.duration})`;
      if (!v.paused) raf = requestAnimationFrame(tick);
    };
    const onPlay = () => { setStarted(true); setPlaying(true); raf = requestAnimationFrame(tick); };
    const onPause = () => { setPlaying(false); cancelAnimationFrame(raf); tick(); };
    const fromButton = () => {
      v.closest(".film")?.scrollIntoView({ behavior: "smooth", block: "center" });
      v.play().catch(() => {});
    };
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onPause);
    window.addEventListener(PLAY_EVENT, fromButton);
    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onPause);
      window.removeEventListener(PLAY_EVENT, fromButton);
    };
  }, []);

  const toggle = () => {
    const v = video.current!;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };
  const full = () => {
    const v = video.current! as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    if (v.requestFullscreen) v.requestFullscreen().then(() => v.play()).catch(() => {});
    else v.webkitEnterFullscreen?.();
  };

  return (
    // play state lives on the frame: the figure's class list belongs to the reveal system (it adds is-in)
    <figure className="film">
      <div className={`film-frame${started ? " is-started" : ""}${playing ? " is-playing" : ""}`}>
        <video
          ref={video}
          muted
          playsInline
          preload="metadata"
          poster="/video/genix-intro-poster.jpg"
          onClick={toggle}
          aria-label="Genix Solutions company introduction, 42 seconds, no narration."
        >
          <source src="/video/genix-intro.mp4" type="video/mp4" />
        </video>
        <button type="button" className="film-play" onClick={toggle} aria-label={playing ? "Pause the introduction" : "Play the introduction"}>
          {playing ? (
            <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
          )}
        </button>
        <figcaption className="film-cap">
          <span className="film-title">Genix Solutions<br />Company Introduction</span>
          <span className="film-meta">
            <span>0:42</span>
            <button type="button" onClick={full} aria-label="Watch full screen"><Icon name="expand" size={18} /></button>
          </span>
        </figcaption>
        <span className="film-progress" aria-hidden="true"><span ref={bar} /></span>
      </div>
    </figure>
  );
}
