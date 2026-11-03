"use client";
import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/Icon";
import { inr, programmes, schedule } from "@/lib/programmes";

/**
 * Plans as one radio list with a single "what's included" panel beside it (after the Enjooy pricing selector),
 * instead of three near-identical cards: the three options are tiers of one programme, so they are compared, not browsed.
 */
export default function ProgrammePicker() {
  const [id, setId] = useState<(typeof programmes)[number]["id"]>("pathway");
  const p = programmes.find((x) => x.id === id)!;

  return (
    <div className="pp">
      <fieldset className="pp-list">
        <legend className="sr">Choose a programme</legend>
        {programmes.map((x) => (
          <label key={x.id} className={`pp-opt${x.id === id ? " is-on" : ""}`}>
            <input type="radio" name="programme" value={x.id} checked={x.id === id} onChange={() => setId(x.id)} />
            <span className="pp-dot" aria-hidden="true" />
            <span className="pp-name">
              <small>{x.level}</small>
              <b>{x.name}</b>
              <em>{x.months} months · {x.classes} live classes</em>
            </span>
            <span className="pp-price">
              {x.chip && <i>{x.chip}</i>}
              <b>{inr(x.price)}</b>
              {x.was && <s aria-label={`was ${inr(x.was)}`}>{inr(x.was)}</s>}
            </span>
          </label>
        ))}
        <p className="pp-same">
          Every programme: {schedule.mode.toLowerCase()}, {schedule.perWeek} classes a week, {schedule.hoursPerClass} hour per class.
        </p>
      </fieldset>

      <div className="pp-panel" aria-live="polite">
        <div className="pp-panel-in" key={p.id}>
          <div className="pp-head">
            <span className="pp-for">{p.forWho}</span>
            <h3>{p.name}</h3>
            <p>{p.summary}</p>
          </div>
          <dl className="pp-facts">
            <div><dt>Duration</dt><dd>{p.months} months</dd></div>
            <div><dt>Classes</dt><dd>{p.classes} × 1 hour</dd></div>
            <div><dt>Per week</dt><dd>{schedule.perWeek} classes</dd></div>
            <div><dt>Fee</dt><dd>{inr(p.price)}</dd></div>
          </dl>
          <span className="pp-k">What you cover</span>
          <ul className="pp-topics">
            {p.topics.map((t) => <li key={t}><Icon name="check" size={18} />{t}</li>)}
          </ul>
          <div className="pp-cta">
            <Link className="btn y" href={`/enrol?interest=${p.id}`}>Enrol in {p.id === "pathway" ? "the pathway" : p.level}</Link>
            <Link className="pp-more" href="/programme#curriculum">View detailed curriculum <Icon name="arrow" size={18} /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
