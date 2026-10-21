import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/Icon";
import stepAnchors from "@/public/illustrations/confidence-steps.json";
import PageHero from "@/components/PageHero";
import Roadmap from "@/components/roadmap/Roadmap";
import AppStack from "@/components/AppStack";
import { curriculum } from "@/lib/curriculum";
import { crossCutting, stackLayers } from "@/lib/project";
import CtaBand from "@/components/CtaBand";
import { journey, logistics } from "@/lib/site";

export const metadata: Metadata = { title: "QA Programme" };

const stepColours = ["#6EA8FF", "#2563EB", "#E0A800"]; // the risers' colours in the render
const logisticIcons = ["clock", "calendar", "monitor", "wallet", "list", "route", "user", "tools"];

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
      {/* three levels of confidence, as a staircase (rendered in Blender: 3d/build_steps.py) */}
      <section className="sec tint">
        <div className="w">
          <div className="eb">Learning outcomes</div>
          <h2>Three levels of confidence.</h2>
          <p className="lead">Each level builds on the one below it: first you understand the work, then you can talk about it, then you can do it on a team.</p>
          <figure className="po-steps">
            <Image src="/illustrations/confidence-steps.webp" width={1800} height={1000} sizes="(max-width: 900px) 94vw, 1100px"
              alt="A staircase of three steps: books for knowledge, speech bubbles for interviews, and a laptop with a team ID badge for the job." />
            {outcomes.map(([t], i) => {
              const [x, y] = (stepAnchors as unknown as Record<string, [number, number]>)[String(i)];
              return <span key={t} className="po-tag" style={{ left: `${x * 100}%`, top: `${y * 100}%`, ["--c" as string]: stepColours[i] }}><b>{i + 1}</b>{t}</span>;
            })}
          </figure>
          <ol className="po-levels">
            {outcomes.map(([t, d], i) => (
              <li key={t} style={{ ["--c" as string]: stepColours[i] }}>
                <span className="po-lv">Level {i + 1}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </li>
            ))}
          </ol>
          <p className="po-note">The programme gives realistic project exposure to make the transition into a QA role smoother. It does not claim that completing a course makes you an experienced employee.</p>
        </div>
      </section>

      {/* programme details: an honest spec sheet */}
      <section className="sec" id="logistics">
        <div className="w po-spec">
          <div>
            <div className="eb">Programme details</div>
            <h2>Logistics</h2>
            <p className="lead">The next batch is being finalised. Ask us and we will send the details as soon as they are confirmed.</p>
            <Link className="btn y" href="/enrol" style={{ marginTop: 28 }}>Ask About the Next Batch</Link>
          </div>
          <dl className="po-grid">
            {logistics.map((l, i) => (
              <div key={l}>
                <span className="po-ic"><Icon name={logisticIcons[i]} size={20} /></span>
                <dt>{l}</dt>
                <dd>To be confirmed</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <CtaBand title="Ready to find out more?" text="Send an enquiry and we will get back to you with programme details." href="/enrol" label="Enquire About Enrolment" />
    </>
  );
}
