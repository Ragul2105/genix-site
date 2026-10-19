import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import CtaBand from "@/components/CtaBand";

export const metadata: Metadata = { title: "About Us" };

const principles = [
  ["No concept without context", "Every idea is introduced through a situation learners could meet on a real team."],
  ["No tool without a reason", "Tools are taught when the work calls for them, not in isolation."],
  ["No exercise without a realistic scenario", "Practice mirrors real project work."],
  ["Interview confidence from understanding", "Interview readiness comes from practical understanding, not memorisation."],
];

export default function About() {
  return (
    <>
      <PageHero eyebrow="About us" title="Practical Learning for Real-World QA">
        Genix Solutions is focused on helping learners connect software testing knowledge with the practical work of a QA professional.
      </PageHero>
      <section className="sec">
        <div className="w row">
          <div>
            <div className="eb">Our approach</div>
            <h2>Built around real project work.</h2>
            <p className="lead">Our programme is designed around realistic scenarios, a continuous reference project and the workflows that connect requirements, testing, defects, automation and release decisions.</p>
            <p className="lead" style={{ marginTop: 16 }}>The goal is not simply to teach students how to answer testing questions. It is to help them understand what to do when they join a real QA team.</p>
          </div>
          <div className="card">
            <div className="eb">Two business areas</div>
            <h3 style={{ marginTop: 12 }}>Services and training, together</h3>
            <p>Genix Solutions delivers offshore software testing services to businesses and develops practical QA skills through an industry-focused training programme. Our testing experience informs the practical scenarios in training.</p>
          </div>
        </div>
      </section>
      <section className="sec tint">
        <div className="w">
          <div className="eb">Teaching principles</div>
          <h2>How we teach</h2>
          <div className="g" style={{ marginTop: 40 }}>{principles.map(([t, d]) => <div className="card" key={t}><h3>{t}</h3><p>{d}</p></div>)}</div>
        </div>
      </section>
      <CtaBand title="Want to learn more?" text="Explore the programme or get in touch with our team." href="/programme" label="Explore the QA Programme" />
    </>
  );
}
