"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { pathwayIntro, programmes, schedule, type Programme } from "@/lib/programmes";

type Id = Programme["id"];
const TAB_LABEL: Record<Id, string> = { foundation: "Foundation", advanced: "Advanced", pathway: "Complete Pathway" };
const TITLE: Record<Id, string> = {
  foundation: "Foundation QA Programme",
  advanced: "Advanced QA Programme",
  pathway: "Complete QA Learning Pathway",
};
const byId = (id: Id) => programmes.find((p) => p.id === id)!;
/** Keep "e-commerce" on one line: a non-breaking hyphen for display only. */
const nb = (s: string) => s.replace(/e-commerce/g, "e\u2011commerce");
const CHIP: Partial<Record<Id, string>> = { pathway: "Foundation + Advanced" };
const AUDIENCE: Partial<Record<Id, string>> = { pathway: "For beginners through to career growth" };
const fromHash = (): Id | null => {
  const m = typeof window !== "undefined" && window.location.hash.match(/^#curriculum-(foundation|advanced|pathway)$/);
  return m ? (m[1] as Id) : null;
};

function Topics({ items, start = 1 }: { items: string[]; start?: number }) {
  return (
    <ol className="cc-topics">
      {items.map((t, i) => <li key={t}><b>{String(start + i).padStart(2, "0")}</b>{nb(t)}</li>)}
    </ol>
  );
}

/**
 * Course-wise curriculum: one tab per course. The home page's "View Detailed Curriculum" links point at
 * #curriculum-<id>, which scrolls here and opens that tab.
 */
export default function CourseCurriculum() {
  const [tab, setTab] = useState<Id>("foundation");
  const tabs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const sync = () => { const id = fromHash(); if (id) setTab(id); };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const ids = programmes.map((p) => p.id);
  const onKey = (e: React.KeyboardEvent) => {
    const i = ids.indexOf(tab);
    const next = e.key === "ArrowRight" ? ids[(i + 1) % ids.length] : e.key === "ArrowLeft" ? ids[(i + ids.length - 1) % ids.length] : null;
    if (!next) return;
    e.preventDefault();
    setTab(next);
    tabs.current[next]?.focus();
  };

  const p = byId(tab);
  const foundation = byId("foundation");
  const advanced = byId("advanced");

  return (
    <section className="sec cc" id="course-curriculum">
      {ids.map((id) => <span key={id} id={`curriculum-${id}`} className="cc-anchor" aria-hidden="true" />)}
      <div className="w">
        <div className="eb">Course curriculum</div>
        <h2>What each course covers.</h2>
        <p className="lead">Choose a course to see its topics. Every course is taught in live online classes and uses the same sample e&#8209;commerce application.</p>

        <div className="cc-tabs" role="tablist" aria-label="Courses" onKeyDown={onKey}>
          {ids.map((id) => (
            <button key={id} ref={(el) => { tabs.current[id] = el; }} type="button" role="tab" id={`cc-tab-${id}`}
              aria-selected={tab === id} aria-controls="cc-panel" tabIndex={tab === id ? 0 : -1}
              className={`cc-tab cc-${id}`} onClick={() => setTab(id)}>
              {TAB_LABEL[id]}
              <small>{byId(id).months} months · {byId(id).hours} hrs</small>
            </button>
          ))}
        </div>

        <div className={`cc-panel cc-${tab}`} id="cc-panel" role="tabpanel" aria-labelledby={`cc-tab-${tab}`}>
          <aside className="cc-side">
            <span className="cc-chip">{CHIP[tab] ?? p.chip}</span>
            <h3>{TITLE[tab]}</h3>
            <p className="cc-len"><b>{p.months} months</b><i aria-hidden="true">|</i><b>{p.hours} hours</b></p>
            <ul className="cc-facts">
              <li><Icon name="calendar" size={18} />{schedule.perWeek} live online classes a week</li>
              <li><Icon name="clock" size={18} />{schedule.hoursPerClass} hour per class</li>
              <li><Icon name="users" size={18} />{AUDIENCE[tab] ?? p.audience}</li>
            </ul>
            <Link className="cc-enrol" href={`/enrol?interest=${p.id}`}>Enrol in this course <Icon name="arrow" size={16} /></Link>
          </aside>

          {tab === "pathway" ? (
            <div className="cc-main">
              <p className="cc-intro">{nb(pathwayIntro)}</p>
              <div className="cc-split">
                <div>
                  <h4><span>Months 1–3</span>Foundation · {foundation.hours} hours</h4>
                  <Topics items={foundation.curriculum!} />
                </div>
                <div>
                  <h4><span>Months 4–6</span>Advanced · {advanced.hours} hours</h4>
                  <Topics items={advanced.curriculum!} />
                </div>
              </div>
            </div>
          ) : (
            <div className="cc-main">
              <Topics items={p.curriculum!} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
