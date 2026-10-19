import Image from "next/image";
import Link from "next/link";
import CountUp from "@/components/CountUp";
import TypedHeading from "@/components/TypedHeading";
import FeatureCards from "@/components/FeatureCards";
import JourneyBlueprint from "@/components/JourneyBlueprint";
import { learningCycle } from "@/lib/site";
import { curriculum } from "@/lib/curriculum";

const highlights = [
  ["QA fundamentals", "SDLC, Agile, requirements, scenarios and test cases."],
  ["Functional testing", "UI, exploratory testing, defects and regression."],
  ["API and database", "REST, HTTP, integration and SQL validation."],
  ["Automation", "Strategy, frameworks, reusable tests, maintenance."],
  ["Git, CI/CD, production", "Source control, pipelines and failure investigation."],
  ["AI and career", "AI-assisted QA, responsible use, CV and interviews."],
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="w">
          <div style={{ flex: "1 1 480px" }}>
            <div className="eb">Industry-Ready QA &amp; Software Testing Programme</div>
            <TypedHeading
              lines={[
                [{ text: "Don’t just learn testing. " }, { text: "Do the work.", className: "accent" }],
                [{ text: "Think like a QA engineer. " }, { text: "Test like one.", className: "accent" }],
              ]}
            />
            <p className="sub">Learn software quality assurance on realistic project scenarios, using the workflows professional QA teams follow.</p>
            <div className="actions">
              <Link className="btn y" href="/enrol">Enrol Now</Link>
              <Link className="btn b" href="/programme">Explore the Programme</Link>
            </div>
            <div className="tagline">Learn the theory. Experience the work. Build confidence. Become job-ready.</div>
          </div>
          <div style={{ flex: "1 1 440px" }}>
            <div className="ticket">
              <div className="dots" aria-hidden="true">
                <i style={{ background: "#FF6B6B" }} /><i style={{ background: "#FFC83D" }} /><i style={{ background: "#4ADE80" }} />
              </div>
              <div className="k">YOUR FIRST TICKET</div>
              <div className="t">Customer charged twice after payment retry</div>
              <div className="tags"><span className="tag y">High severity</span><span className="tag n">Checkout</span></div>
              <div className="q"><b>What would you do first?</b><br />Reproduce it. Check the API response. Look at the order record in the database.</div>
              <div className="tags" style={{ marginTop: 20 }}>
                {["Cart", "Login", "Coupon"].map((t) => <span key={t} className="tag n2">{t}</span>)}
                <span className="tag y">Payment</span>
                <span className="tag n2">Order</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ paddingBottom: 70 }}>
        <div className="w">
          <div style={{ textAlign: "center" }}>
            <div className="eb">Two ways we work</div>
            <h2>We Test Software. We Develop QA Talent.</h2>
          </div>
          <div className="g" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", marginTop: 32 }}>
            <div className="card">
              <div className="eb">For businesses</div>
              <h3 style={{ marginTop: 12 }}>QA Testing Services</h3>
              <p>Offshore software testing for businesses, delivered by a dedicated QA team.</p>
              <p style={{ marginTop: 16 }}><Link href="/contact" style={{ fontWeight: 800, textDecoration: "none" }}>Request a Consultation →</Link></p>
            </div>
            <div className="card">
              <div className="eb">For learners</div>
              <h3 style={{ marginTop: 12 }}>Industry-Ready QA Programme</h3>
              <p>Practical, project-based learning for your first QA role.</p>
              <p style={{ marginTop: 16 }}><Link href="/programme" style={{ fontWeight: 800, textDecoration: "none" }}>Explore the QA Programme →</Link></p>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-sec">
        <div className="w stats">
          <div><b><CountUp value={curriculum.length} /></b><p>programme parts</p></div>
          <div><b><CountUp value={1} /></b><p>continuous real-world project</p></div>
          <div><b><CountUp value={learningCycle.length} /></b><p>step learning cycle</p></div>
          <div><b><CountUp value={3} /></b><p>levels of confidence</p></div>
        </div>
      </section>

      <section className="sec">
        <div className="w">
          <div className="sec-head">
            <div style={{ maxWidth: 760 }}>
              <div className="eb">Why Genix Solutions</div>
              <h2>Practical QA training, <span className="accent">shaped by real testing work.</span></h2>
              <p className="lead">Genix Solutions delivers offshore software testing services and brings that practical perspective into the scenarios in the programme.</p>
            </div>
            <Link href="/programme" className="sec-link">Explore the programme <i aria-hidden="true">↗</i></Link>
          </div>
          <FeatureCards />
        </div>
      </section>

      <section className="sec dark">
        <div className="w">
          <div className="sec-head">
            <div style={{ maxWidth: 680 }}>
              <div className="eb">The learning cycle</div>
              <h2>Learn by doing, not just watching.</h2>
              <p className="lead">Each major topic starts with a practical situation and gives learners the opportunity to think, investigate, perform, discuss and reflect.</p>
            </div>
            <Link href="/approach" className="sec-link on-dark">How the approach works <i aria-hidden="true">↗</i></Link>
          </div>
          {/* step cards after the DeCharge "How it works" reference: light visual panel on top, numbered title below */}
          <ol className="lc-grid">
            {learningCycle.map((s, i) => (
              <li key={s.title} className={`lc-card${s.title === "Do" ? " hl" : ""}`}>
                <div className="lc-art">
                  <Image src={`/illustrations/${s.art}.svg`} alt="" width={500} height={500} unoptimized />
                </div>
                <div className="lc-text">
                  <span className="lc-num">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="journey">
            <div className="journey-head">
              <h3>Follow one customer journey</h3>
              <p>Every module comes back to the same e-commerce flow, tested across each layer.</p>
            </div>
            <JourneyBlueprint />
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="w">
          <div style={{ maxWidth: 760 }}>
            <div className="eb">Programme highlights</div>
            <h2>One programme. A complete QA learning journey.</h2>
          </div>
          <div className="g">{highlights.map(([t, d]) => <div className="card" key={t}><h3>{t}</h3><p>{d}</p></div>)}</div>
          <p style={{ marginTop: 40 }}><Link className="btn y" href="/programme#curriculum">View Full Curriculum</Link></p>
        </div>
      </section>

      <section className="tint" style={{ padding: "88px 0" }}>
        <div className="w row" style={{ alignItems: "center" }}>
          <div>
            <div className="eb">Who can join?</div>
            <h2>Start your journey in software testing.</h2>
            <p className="lead">Designed for graduates, freshers, career changers and learners who want to strengthen their QA process knowledge. Prerequisites are listed in the programme details.</p>
            <p style={{ marginTop: 28 }}><Link className="btn b" href="/programme#logistics">Check Programme Details</Link></p>
          </div>
          <div className="card">
            <div className="eb">Prepare for your next step</div>
            <ul className="list-lines">
              <li>Scenario-based interview practice</li>
              <li>API, SQL and automation interview topics</li>
              <li>QA CV and professional profile guidance</li>
              <li>ISTQB structure and preparation guidance</li>
              <li>Junior QA to QA Lead and SDET career paths</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="cta" style={{ padding: "100px 0" }}>
        <div className="w">
          <div className="kick">LEARN | BUILD | GROW</div>
          <h2 style={{ fontSize: 50 }}>Take the first step towards your QA career.</h2>
          <p>Explore a practical approach to learning software testing.</p>
          <Link className="btn y" href="/enrol">Enquire About Enrolment</Link>
          <p className="alt">Business? <Link href="/contact" style={{ color: "#fff", fontWeight: 700 }}>Request a testing consultation →</Link></p>
        </div>
      </section>
    </>
  );
}
