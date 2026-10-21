import type { Metadata } from "next";
import AppStack from "@/components/AppStack";
import CtaBand from "@/components/CtaBand";
import PageHero from "@/components/PageHero";
import { industries, industryPatterns, projectProgression, ticketWalkthrough, traditionalPath } from "@/lib/approach";
import { stackLayers } from "@/lib/project";
import { learningCycle } from "@/lib/site";

export const metadata: Metadata = { title: "Our Approach" };

const layerOf = (key: string) => stackLayers.find((l) => l.key === key);

export default function Approach() {
  return (
    <>
      <PageHero eyebrow="Our approach" title="Learn by Doing, Not Just Watching.">
        Each major topic starts with a practical situation and gives learners the opportunity to think, investigate, perform, discuss and reflect.
      </PageHero>

      {/* 1 · the order of learning, side by side */}
      <section className="sec">
        <div className="w">
          <div className="eb">What makes it different</div>
          <h2>Same topics. A different order.</h2>
          <p className="lead">Most courses explain a concept, show a tool, then set an exercise. Here you meet the problem first, so every concept arrives with a reason.</p>
          <div className="ap-paths">
            <div className="ap-path">
              <span className="ap-path-label">A typical course</span>
              <ol>{traditionalPath.map((s) => <li key={s}>{s}</li>)}</ol>
            </div>
            <div className="ap-path is-genix">
              <span className="ap-path-label">The Genix programme</span>
              <ol>{learningCycle.map((s, i) => <li key={s.title} className={i === 0 ? "start" : undefined}>{s.title}</li>)}</ol>
              <span className="ap-note">Starts with a real situation, ends by reflecting on the job</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2 · one ticket through the eight steps */}
      <section className="sec tint">
        <div className="w ap-cycle">
          <div className="ap-cycle-side">
            <div className="eb">The learning cycle</div>
            <h2>One ticket, eight steps.</h2>
            <p className="lead">Every major topic runs the same cycle. Here it is with one real-world ticket, start to finish.</p>
            <div className="ap-ticket" aria-label="Example ticket">
              <div className="ap-ticket-dots" aria-hidden="true"><i /><i /><i /></div>
              <span className="ap-ticket-k">Example ticket · BUG-142</span>
              <strong>Customer charged twice after payment retry</strong>
              <div className="ap-ticket-tags"><span className="hi">High severity</span><span>Checkout</span><span>Payment</span></div>
            </div>
          </div>
          <ol className="ap-steps">
            {learningCycle.map((s, i) => (
              <li key={s.title} className={s.title === "Do" ? "is-do" : undefined}>
                <span className="ap-step-n">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{s.title} <small>{s.text}</small></h3>
                  <p>{ticketWalkthrough[i]}</p>
                </div>
              </li>
            ))}
            <li className="ap-loop" aria-hidden="true"><span className="ap-step-n">↺</span><p>Then the next scenario begins.</p></li>
          </ol>
        </div>
      </section>

      {/* 3 · the continuous project */}
      <section className="sec" id="project">
        <div className="w">
          <div className="eb">The continuous project</div>
          <h2>Follow one application. Understand the entire QA process.</h2>
          <p className="lead">The same e-commerce app is used from the first week to the final simulation. As the course goes deeper, so do you: from what the customer sees to the systems underneath.</p>
          <div className="ps-grid ap-project">
            <AppStack />
            <ol className="ap-prog">
              {projectProgression.map((p, i) => {
                const l = layerOf(p.layer);
                return (
                  <li key={i} style={{ ["--c" as string]: l?.color ?? "#2563EB" }}>
                    <span className="ap-prog-tag">{l ? l.name : "Every layer"}</span>
                    <p>{p.text}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* 4 · beyond e-commerce */}
      <section className="sec tint">
        <div className="w">
          <div className="eb">Beyond e-commerce</div>
          <h2>The same principles apply across industries.</h2>
          <p className="lead">The screens change from one domain to another. The questions a tester asks don&rsquo;t: is the data right, what happens when a step fails or retries, and what reaches the external system?</p>
          <div className="ap-table-wrap" data-lenis-prevent>
            <table className="ap-table">
              <caption className="sr-only">The same five-step pattern in e-commerce, banking, travel and SaaS</caption>
              <thead>
                <tr><th scope="col">Pattern</th>{industries.map((d, i) => <th key={d} scope="col" className={i === 0 ? "here" : undefined}>{d}</th>)}</tr>
              </thead>
              <tbody>
                {industryPatterns.map(([pattern, cells]) => (
                  <tr key={pattern}>
                    <th scope="row">{pattern}</th>
                    {cells.map((c, i) => <td key={c} className={i === 0 ? "here" : undefined}>{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="ap-small">Examples from banking, travel and SaaS are illustrations of how QA principles transfer between domains. Client applications or client-derived materials are used for training only where the necessary permissions, confidentiality protections and data safeguards are in place.</p>
        </div>
      </section>

      <CtaBand title="See the full curriculum" text="Browse every part and topic of the programme." href="/programme#curriculum" label="View Full Curriculum" />
    </>
  );
}
