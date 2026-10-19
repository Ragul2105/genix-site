"use client";
import { useEffect, useRef } from "react";

type Segment = { text: string; className?: string };
type Line = Segment[];

const plain = (line: Line) => line.map((s) => s.text).join("");

/**
 * Hero heading that types a line, holds it, erases it, then types the next, in a loop.
 * All lines are stacked in one grid cell, so the heading is always as tall as its longest line
 * and nothing below it moves. The first line is server-rendered (SEO, no-JS) and is what
 * screen readers get; the cycling text is visual only.
 */
export default function TypedHeading({
  lines,
  typeSpeed = 55,
  eraseSpeed = 28,
  hold = 2600,
  delay = 350,
}: {
  lines: Line[];
  typeSpeed?: number;
  eraseSpeed?: number;
  hold?: number;
  delay?: number;
}) {
  const root = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lineEls = Array.from(el.querySelectorAll<HTMLElement>(".typed-line"));
    const charsOf = lineEls.map((l) => Array.from(l.querySelectorAll<HTMLElement>(".ch")));
    charsOf.flat().forEach((c) => c.classList.add("ch-hide"));

    let line = 0;
    let shown = 0;
    let timer: ReturnType<typeof setTimeout>;

    // Caret sits after the last visible char, or before the first one when the line is empty.
    const placeCaret = () => {
      el.querySelectorAll(".ch-cur, .ch-pre").forEach((c) => c.classList.remove("ch-cur", "ch-pre"));
      const chars = charsOf[line];
      if (shown > 0) chars[shown - 1].classList.add("ch-cur");
      else chars[0]?.classList.add("ch-pre");
    };
    // Solid caret while typing/erasing, blinking while idle (how real text cursors behave).
    const busy = (on: boolean) => el.classList.toggle("is-typing", on);

    const type = () => {
      const chars = charsOf[line];
      if (shown >= chars.length) {
        busy(false);
        timer = setTimeout(erase, hold);
        return;
      }
      busy(true);
      chars[shown].classList.remove("ch-hide");
      shown++;
      placeCaret();
      const pause = /[.,]/.test(chars[shown - 1].textContent ?? "") ? typeSpeed * 5 : typeSpeed;
      timer = setTimeout(type, pause);
    };

    const erase = () => {
      if (shown === 0) {
        busy(false);
        lineEls[line].classList.remove("on");
        line = (line + 1) % lineEls.length;
        lineEls[line].classList.add("on");
        placeCaret();
        timer = setTimeout(type, 450);
        return;
      }
      busy(true);
      shown--;
      charsOf[line][shown].classList.add("ch-hide");
      placeCaret();
      timer = setTimeout(erase, eraseSpeed);
    };

    placeCaret();
    timer = setTimeout(type, delay);
    return () => {
      clearTimeout(timer);
      el.classList.remove("is-typing");
      lineEls.forEach((l, i) => l.classList.toggle("on", i === 0));
      charsOf.flat().forEach((c) => c.classList.remove("ch-hide", "ch-cur", "ch-pre"));
    };
  }, [typeSpeed, eraseSpeed, hold, delay]);

  return (
    <h1 ref={root} className="typed" aria-label={plain(lines[0])}>
      {lines.map((line, li) => (
        <span key={li} className={`typed-line${li === 0 ? " on" : ""}`} aria-hidden="true">
          {line.map((seg, si) => {
            const words = seg.text.split(" ");
            return (
              <span key={si} className={seg.className}>
                {words.map((w, wi) => (
                  <span key={wi}>
                    <span className="word">
                      {Array.from(w).map((c, ci) => <span key={ci} className="ch">{c}</span>)}
                    </span>
                    {wi < words.length - 1 ? " " : ""}
                  </span>
                ))}
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}
