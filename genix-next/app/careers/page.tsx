import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import CtaBand from "@/components/CtaBand";

export const metadata: Metadata = { title: "Careers & Certification" };

const items = [
  ["Scenario-based interviews", "Manual testing and real-project scenario questions."],
  ["API, SQL and automation", "Technical interview topics practised in context."],
  ["Agile, CI/CD and real projects", "Discuss sprints, pipelines and team workflows."],
  ["CV and professional profile", "Describe project experience, tools and achievements professionally."],
  ["Mock interviews", "Practise before the real thing."],
  ["Career roadmap", "A structured path from course completion to first-job readiness."],
];

export default function Careers() {
  return (
    <>
      <PageHero eyebrow="Careers & Certification" title="Prepare for Your Next Step in QA.">
        Connect practical project experience with interview preparation, professional communication, CV development and certification awareness.
      </PageHero>
      <section className="sec">
        <div className="w">
          <div className="eb">Interview &amp; profile</div>
          <h2>Be ready to explain what you have done.</h2>
          <div className="g" style={{ marginTop: 40 }}>{items.map(([t, d]) => <div className="card" key={t}><h3>{t}</h3><p>{d}</p></div>)}</div>
        </div>
      </section>
      <section className="sec tint">
        <div className="w row">
          <div>
            <div className="eb">Career paths</div>
            <h2>Where QA can take you.</h2>
            <p className="lead">Junior QA, Senior QA and QA Lead, plus technical paths such as Automation/SDET.</p>
          </div>
          <div>
            <div className="eb">ISTQB guidance</div>
            <h2>Understand the certification.</h2>
            <p className="lead">Guidance on syllabus structure, terminology, study planning, practice questions and mock exams, connected back to the real project.</p>
          </div>
        </div>
      </section>
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="w"><div className="card note"><b>Please note:</b> Genix Solutions does not guarantee jobs, placement or salary, and the programme does not award an accredited certification. ISTQB content is preparation guidance only.</div></div>
      </section>
      <CtaBand title="Take the next step" text="Ask us about the programme and how it prepares you for QA interviews." href="/enrol" label="Enquire About Enrolment" />
    </>
  );
}
