import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import CtaBand from "@/components/CtaBand";
import Flow from "@/components/Flow";
import { journey, layers, learningCycle } from "@/lib/site";

export const metadata: Metadata = { title: "Our Approach" };

export default function Approach() {
  return (
    <>
      <PageHero eyebrow="Our approach" title="Learn by Doing, Not Just Watching.">
        Each major topic starts with a practical situation and gives learners the opportunity to think, investigate, perform, discuss and reflect.
      </PageHero>
      <section className="sec">
        <div className="w">
          <div className="eb">The learning cycle</div>
          <h2>Eight steps in every major topic.</h2>
          <div className="g" style={{ marginTop: 40 }}>
            {learningCycle.map((s, i) => <div className="card" key={s.title}><h3>{i + 1}. {s.title}</h3><p>{s.text}</p></div>)}
          </div>
        </div>
      </section>
      <section className="sec dark" id="project">
        <div className="w">
          <div className="eb">The continuous project</div>
          <h2>Follow one application. Understand the entire QA process.</h2>
          <p className="lead">When learners study APIs, they investigate what happens behind the cart. With databases, they validate order information. With automation, they automate regression scenarios. With CI/CD, those tests become part of a pipeline.</p>
          <Flow items={journey} />
          <div className="layers">{layers.map((l) => <span key={l} className="tag">{l}</span>)}</div>
        </div>
      </section>
      <section className="sec">
        <div className="w">
          <div className="eb">Beyond e-commerce</div>
          <h2>The same principles apply across industries.</h2>
          <p className="lead">Examples from banking, travel and SaaS show how QA principles transfer between domains.</p>
          <p style={{ marginTop: 20, fontSize: 14 }}>Client applications or client-derived materials are used for training only where the necessary permissions, confidentiality protections and data safeguards are in place.</p>
        </div>
      </section>
      <CtaBand title="See the full curriculum" text="Browse every part and topic of the programme." href="/programme#curriculum" label="View Full Curriculum" />
    </>
  );
}
