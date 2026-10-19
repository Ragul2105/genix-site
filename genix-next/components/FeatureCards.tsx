"use client";
import Link from "next/link";
import { useState } from "react";
import { CareerArt, ProjectArt, ScenarioArt, WorkflowArt } from "./FeatureIllustrations";

const cards = [
  { title: "Scenario-based learning", text: "Every topic starts with a real situation, not a slide of definitions.", href: "/approach", Art: ScenarioArt },
  { title: "One continuous project", text: "An e-commerce application ties requirements, APIs, databases and automation together.", href: "/approach#project", Art: ProjectArt },
  { title: "Professional workflows", text: "Sprints, defects, regression, releases and production support.", href: "/programme#curriculum", Art: WorkflowArt },
  { title: "Career preparation", text: "Interviews, CV guidance, career paths and ISTQB guidance.", href: "/careers", Art: CareerArt },
];

const Arrow = ({ diagonal }: { diagonal?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path d={diagonal ? "M4.5 11.5 L11.5 4.5 M5.5 4.5 H11.5 V10.5" : "M2.5 8 H13 M9 4 L13 8 L9 12"} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Expanding card row, after the reference: hovering or focusing a card widens it and swaps it from
 * the tinted "collapsed" look to the neutral "open" look with description, illustration and a filled
 * arrow button. The last card you touched stays open. Below 900px every card is shown open, stacked.
 */
export default function FeatureCards() {
  const [active, setActive] = useState(0);
  return (
    <div className="fcards">
      {cards.map(({ title, text, href, Art }, i) => (
        <div key={title} className="fslot" data-active={active === i || undefined} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)}>
          <article className="fcard">
            <div className="fcard-body">
              <h3>{title}</h3>
              <p>{text}</p>
              <Link href={href} className="fcard-link">
                <span>Read more<span className="sr-only"> about {title.toLowerCase()}</span></span>
                <i className="fcard-btn"><Arrow diagonal /><Arrow /></i>
              </Link>
            </div>
            <div className="fcard-art"><Art /></div>
            <span className="fcard-rings" aria-hidden="true" />
          </article>
        </div>
      ))}
    </div>
  );
}
