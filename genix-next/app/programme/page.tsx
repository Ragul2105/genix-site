import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Roadmap from "@/components/roadmap/Roadmap";
import CtaBand from "@/components/CtaBand";
import Flow from "@/components/Flow";
import { journey, layers, logistics } from "@/lib/site";

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
      <section className="sec">
        <div className="w">
          <div className="eb">The project</div>
          <h2>One e-commerce application, used throughout.</h2>
          <div style={{ color: "var(--ink2)", fontSize: 18 }}><Flow items={journey} /></div>
          <div className="layers">{layers.map((l) => <span key={l} className="tag" style={{ background: "var(--tint)", color: "var(--navy)" }}>{l}</span>)}</div>
          <p style={{ marginTop: 20 }}><Link href="/approach" style={{ fontWeight: 800 }}>See how the approach works →</Link></p>
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
