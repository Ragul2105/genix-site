import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Roadmap from "@/components/roadmap/Roadmap";
import AppStack from "@/components/AppStack";
import { curriculum } from "@/lib/curriculum";
import { crossCutting, stackLayers } from "@/lib/project";
import CtaBand from "@/components/CtaBand";
import { journey, logistics } from "@/lib/site";

export const metadata: Metadata = { title: "QA Programme" };

const outcomes = [
  ["Knowledge confidence", "Understand testing concepts, terminology, tools and professional practices."],
  ["Interview confidence", "Answer practical and scenario-based questions because you have worked through similar situations."],
  ["Job confidence", "Understand the workflow of a real QA project and contribute sooner after joining a company."],
];

export default function Programme() {
  return (
    <>
      <PageHero eyebrow="QA Programme" title="Industry-Ready QA & Software Testing Programme">
        Learn the theory. Experience the work. Build confidence. Become job-ready.
      </PageHero>
      <section className="sec">
        <div className="w row">
          <div>
            <div className="eb">Overview</div>
            <h2>Bridge the gap between training and real QA work.</h2>
            <p className="lead">The programme connects testing concepts, tools and exercises to a continuous production-style project, so learners see how skills fit together in a commercial software team.</p>
          </div>
          <div className="card">
            <div className="eb">What makes it different</div>
            <p style={{ marginTop: 12 }}><b>Traditional:</b> concept, tool, exercise, interview preparation.</p>
            <p style={{ marginTop: 12 }}><b>Genix:</b> real scenario, think, learn, see professional practice, perform, discuss, interview, reflect.</p>
          </div>
        </div>
      </section>
      <Roadmap />
      <section className="sec ps" id="project">
        <div className="w">
          <div className="sec-head">
            <div style={{ maxWidth: 720 }}>
              <div className="eb">The project</div>
              <h2>One e-commerce application, used throughout.</h2>
              <p className="lead">Every part of the programme works on the same practice store. Here is what is inside it, and where in the curriculum you test each layer.</p>
            </div>
            <Link href="/approach#project" className="sec-link">How the approach works <i aria-hidden="true">↗</i></Link>
          </div>
          <ol className="ps-journey" aria-label="The customer journey you test">
            {journey.map((j, i) => <li key={j} className={j === "Payment" ? "hl" : undefined}><b>{String(i + 1).padStart(2, "0")}</b>{j}</li>)}
          </ol>
          <div className="ps-grid">
            <AppStack />
            <div>
              <ol className="ps-layers">
                {stackLayers.map((l, i) => (
                  <li key={l.key} style={{ ["--c" as string]: l.color }}>
                    <span className="ps-num">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <h3>{l.name}</h3>
                      <p>{l.what}</p>
                      <p className="ps-tests"><b>You test:</b> {l.tests}</p>
                      <div className="ps-parts">{l.parts.map((p) => <Link key={p} href="#curriculum">Part {String(p).padStart(2, "0")} · {curriculum[p - 1].title}</Link>)}</div>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="ps-cross">
                <span>Across every layer</span>
                {crossCutting.map((c) => <Link key={c.name} href="#curriculum"><b>{c.name}</b> Part {String(c.part).padStart(2, "0")}</Link>)}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="sec tint">
        <div className="w">
          <div className="eb">Learning outcomes</div>
          <h2>Three levels of confidence.</h2>
          <div className="g" style={{ marginTop: 40 }}>{outcomes.map(([t, d]) => <div className="card" key={t}><h3>{t}</h3><p>{d}</p></div>)}</div>
          <p style={{ marginTop: 28 }}>The programme gives realistic project exposure to make the transition into a QA role smoother. It does not claim that completing a course makes you an experienced employee.</p>
        </div>
      </section>
      <section className="sec" id="logistics">
        <div className="w">
          <div className="eb">Programme details</div>
          <h2>Logistics</h2>
          <table>
            <tbody>
              {logistics.map((l) => <tr key={l}><th scope="row">{l}</th><td className="tbc">To be confirmed</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>
      <CtaBand title="Ready to find out more?" text="Send an enquiry and we will get back to you with programme details." href="/enrol" label="Enquire About Enrolment" />
    </>
  );
}
