import type { Metadata } from "next";
import CtaBand from "@/components/CtaBand";
import Icon from "@/components/Icon";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = { title: "Careers & Certification" };

const kit: [string, string, string][] = [
  ["chat", "Scenario-based interviews", "Manual testing and real-project scenario questions."],
  ["pipeline", "API, SQL and automation", "Technical interview topics practised in context."],
  ["route", "Agile, CI/CD and real projects", "Discuss sprints, pipelines and team workflows."],
  ["file", "CV and professional profile", "Describe project experience, tools and achievements professionally."],
  ["user", "Mock interviews", "Practise before the real thing."],
  ["list", "Career roadmap", "A structured path from course completion to first-job readiness."],
];

/** Example questions, drawn from the programme's own scenarios and interview-preparation topics. */
const mock: { who: "q" | "a"; text: string }[] = [
  { who: "q", text: "A customer was charged twice after a payment retry. What would you check first?" },
  { who: "a", text: "Reproduce it, check the API response, then look at the order record in the database." },
  { who: "q", text: "What should and shouldn’t be automated?" },
  { who: "q", text: "Walk me through a defect you raised and how you worked with the developer." },
];

const istqb = ["Syllabus structure", "Terminology", "Study planning", "Practice questions", "Mock exams", "Connected back to the real project"];

export default function Careers() {
  return (
    <>
      <PageHero eyebrow="Careers & Certification" title="Prepare for Your Next Step in QA.">
        Connect practical project experience with interview preparation, professional communication, CV development and certification awareness.
      </PageHero>

      {/* interview kit: what an interview round feels like, then everything that prepares you for it */}
      <section className="sec">
        <div className="w cr-kit">
          <div>
            <div className="eb">Interview &amp; profile</div>
            <h2>Be ready to explain what you have done.</h2>
            <p className="lead">Interviews ask about real situations. Because you have worked through them on the project, you answer from experience instead of memory.</p>
            <ul className="cr-list">
              {kit.map(([ic, t, d]) => (
                <li key={t}><span className="cr-ic"><Icon name={ic} size={20} /></span><div><h3>{t}</h3><p>{d}</p></div></li>
              ))}
            </ul>
          </div>
          <div className="cr-mock" aria-label="Example mock interview questions">
            <div className="cr-mock-top">
              <span className="cr-dot" aria-hidden="true" />
              <b>Mock interview</b>
              <span>Example questions</span>
            </div>
            <ol>
              {mock.map((m, i) => (
                <li key={i} className={m.who === "a" ? "is-a" : undefined}>
                  <span className="cr-who">{m.who === "q" ? "Interviewer" : "You"}</span>
                  <p>{m.text}</p>
                </li>
              ))}
            </ol>
            <p className="cr-mock-foot">Drawn from the programme&rsquo;s scenarios and interview-preparation topics.</p>
          </div>
        </div>
      </section>

      {/* career paths as a branching route */}
      <section className="sec tint">
        <div className="w">
          <div className="eb">Career paths</div>
          <h2>Where QA can take you.</h2>
          <p className="lead">Junior QA, Senior QA and QA Lead, plus technical paths such as Automation/SDET.</p>
          <div className="cr-paths" role="img" aria-label="Career paths: Junior QA leads to Senior QA and then QA Lead; a technical branch leads to Automation and SDET.">
            <div className="cr-track">
              <span className="cr-track-name">Quality &amp; leadership</span>
              <div className="cr-line">
                <div className="cr-node is-start"><span className="cr-here">The programme prepares you for</span><b>Junior QA</b></div>
                <div className="cr-edge" />
                <div className="cr-node"><b>Senior QA</b></div>
                <div className="cr-edge" />
                <div className="cr-node is-lead"><b>QA Lead</b></div>
              </div>
            </div>
            <div className="cr-track is-tech">
              <span className="cr-track-name">Technical</span>
              <div className="cr-line">
                <span className="cr-branch" aria-hidden="true" />
                <div className="cr-node"><b>Automation</b></div>
                <div className="cr-edge" />
                <div className="cr-node"><b>SDET</b></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ISTQB guidance */}
      <section className="sec">
        <div className="w cr-istqb">
          <div>
            <div className="eb">ISTQB guidance</div>
            <h2>Understand the certification.</h2>
            <p className="lead">Guidance on syllabus structure, terminology, study planning, practice questions and mock exams, connected back to the real project.</p>
            <span className="cr-badge"><Icon name="shield" size={16} /> Preparation guidance · not an accredited certification</span>
          </div>
          <ul className="cr-checks">
            {istqb.map((t) => <li key={t}><span><Icon name="check" size={18} /></span>{t}</li>)}
          </ul>
        </div>
        <div className="w">
          <div className="card note" style={{ marginTop: 56 }}><b>Please note:</b> Genix Solutions does not guarantee jobs, placement or salary, and the programme does not award an accredited certification. ISTQB content is preparation guidance only.</div>
        </div>
      </section>

      <CtaBand title="Take the next step" text="Ask us about the programme and how it prepares you for QA interviews." href="/enrol" label="Enquire About Enrolment" />
    </>
  );
}
