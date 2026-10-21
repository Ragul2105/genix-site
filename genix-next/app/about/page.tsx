import type { Metadata } from "next";
import Link from "next/link";
import CtaBand from "@/components/CtaBand";
import Icon from "@/components/Icon";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = { title: "About Us" };

/** "No X without Y": the rule is split so the second half can carry the emphasis. */
const principles: [string, string, string][] = [
  ["No concept", "without context", "Every idea is introduced through a situation learners could meet on a real team."],
  ["No tool", "without a reason", "Tools are taught when the work calls for them, not in isolation."],
  ["No exercise", "without a realistic scenario", "Practice mirrors real project work."],
  ["Interview confidence", "from understanding", "Interview readiness comes from practical understanding, not memorisation."],
];

/** Statements the site already makes elsewhere, gathered in one place. */
const promises = [
  "We do not guarantee jobs, placement or salary.",
  "The programme does not award an accredited certification. ISTQB content is preparation guidance only.",
  "Completing the course does not make you an experienced employee. It is designed to make the move into a QA role smoother.",
  "Client applications or client-derived materials are used for training only with the necessary permissions, confidentiality protections and data safeguards.",
];

export default function About() {
  return (
    <>
      <PageHero eyebrow="About us" title="Practical Learning for Real-World QA">
        Genix Solutions is focused on helping learners connect software testing knowledge with the practical work of a QA professional.
      </PageHero>

      {/* what we do, and how the two halves feed each other */}
      <section className="sec">
        <div className="w ab-split">
          <div>
            <div className="eb">Our approach</div>
            <h2>Built around real project work.</h2>
            <p className="lead">Our programme is designed around realistic scenarios, a continuous reference project and the workflows that connect requirements, testing, defects, automation and release decisions.</p>
            <p className="lead" style={{ marginTop: 16 }}>The goal is not simply to teach students how to answer testing questions. It is to help them understand what to do when they join a real QA team.</p>
          </div>
          <div className="ab-loop" aria-label="Genix Solutions has two business areas: testing services and QA training. Testing experience informs the training scenarios.">
            <div className="ab-node">
              <span className="ab-ic"><Icon name="briefcase" size={24} /></span>
              <span className="eb">For businesses</span>
              <h3>QA Testing Services</h3>
              <p>Offshore software testing for businesses, delivered by a dedicated QA team.</p>
            </div>
            <div className="ab-flow" aria-hidden="true">
              <svg viewBox="0 0 60 120" preserveAspectRatio="none"><path d="M30 4 V108" /><path d="M20 98 L30 112 L40 98" /></svg>
              <span>Testing experience informs the practical scenarios in training</span>
            </div>
            <div className="ab-node is-train">
              <span className="ab-ic"><Icon name="graduate" size={24} /></span>
              <span className="eb">For learners</span>
              <h3>Industry-Ready QA Programme</h3>
              <p>Practical, project-based learning for your first QA role.</p>
            </div>
          </div>
        </div>
      </section>

      {/* teaching principles as rules */}
      <section className="sec tint">
        <div className="w">
          <div className="eb">Teaching principles</div>
          <h2>Four rules we teach by.</h2>
          <ol className="ab-rules">
            {principles.map(([a, b, d], i) => (
              <li key={a}>
                <span className="ab-rule-n">{String(i + 1).padStart(2, "0")}</span>
                <h3>{a} <em>{b}</em></h3>
                <p>{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* honest by design */}
      <section className="sec">
        <div className="w ab-honest">
          <div>
            <div className="eb">Honest by design</div>
            <h2>What we won&rsquo;t promise.</h2>
            <p className="lead">Training only works if you know exactly what you are getting. These are the lines we hold, everywhere on this site.</p>
          </div>
          <ul>
            {promises.map((p) => <li key={p}><span><Icon name="shield" size={20} /></span>{p}</li>)}
          </ul>
        </div>
        <div className="w">
          <p className="ab-more">Looking for the team behind the programme? Trainer details will be published with the programme details. <Link href="/contact">Ask us in the meantime →</Link></p>
        </div>
      </section>

      <CtaBand title="Want to learn more?" text="Explore the programme or get in touch with our team." href="/programme" label="Explore the QA Programme" />
    </>
  );
}
