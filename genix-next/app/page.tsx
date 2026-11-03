import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/Icon";
import CountUp from "@/components/CountUp";
import TypedHeading from "@/components/TypedHeading";
import IntroFilm from "@/components/IntroFilm";
import ProgrammePicker from "@/components/ProgrammePicker";
import { trialIncludes } from "@/lib/programmes";

/** The project, stop by stop (clay screens rendered from the intro film's scene: 3d/build_intro.py --tiles). */
const projectStops = [
  { art: "search", title: "Product search and filters", text: "Check that results, filters and sorting return the right products." },
  { art: "cart", title: "Add to cart and checkout", text: "Cover quantities, coupons and every path into checkout." },
  { art: "payment", title: "Payment processing", text: "Test approvals, failures and retries, including the double-charge case." },
  { art: "database", title: "API and database validation", text: "Compare what the screen shows with the API response and the order record." },
  { art: "order", title: "End-to-end testing and reporting", text: "Run the whole journey, then report defects and results clearly." },
];

const services = {
  manual: ["Functional testing", "Regression testing", "API and integration testing", "Database testing"],
  automation: ["Automated functional tests", "Automated regression suites", "Test execution and reporting", "Automation maintenance"],
  support: ["Test planning and preparation", "Test execution", "Defect management", "Retesting and release support"],
  engagement: ["Dedicated QA support", "Teams that scale with your release plan", "Clear communication", "Testing insights you can act on"],
};

const reasons = [
  ["Practical learning on a real project", "Every topic is practised on one continuous e-commerce application, not on isolated exercises."],
  ["An industry-focused curriculum", "From the SDLC and test cases to API, SQL, automation, Git and CI/CD."],
  ["Shaped by real testing work", "Genix also delivers testing services for businesses, and that experience shapes the training scenarios."],
  ["Choose your level", "Start with Foundation, go straight to Advanced if you already test manually, or take the complete pathway."],
  ["Career guidance and support", "Interview practice, CV and profile guidance, and ISTQB preparation guidance."],
];

const trialIcons = ["monitor", "list", "laptop", "chat"];

export default function Home() {
  return (
    <>
      {/* hero: the promise on the left, the film on the right */}
      <section className="hx">
        <div className="w hx-grid">
          <div className="hx-copy">
            <div className="eb">Practical QA training · Reliable testing services</div>
            <TypedHeading
              lines={[
                [{ text: "Build QA skills. " }, { text: "Deliver better software.", className: "accent" }],
                [{ text: "Think like a QA engineer. " }, { text: "Test like one.", className: "accent" }],
              ]}
            />
            <p className="sub">Genix Solutions provides industry-focused QA training for individuals and reliable offshore software testing services for businesses.</p>
            <div className="actions">
              <Link className="btn y" href="/enrol?interest=trial">Book a Free Trial Session</Link>
              <Link className="btn b" href="#programmes">Compare Programmes</Link>
            </div>
            <Link className="hx-biz" href="/contact#business">
              <Icon name="briefcase" size={18} /> Need software tested? <b>Talk to our testing team</b> <Icon name="arrow" size={16} />
            </Link>
          </div>
          <IntroFilm />
        </div>
      </section>

      {/* the numbers the client gave us, as oversized numerals */}
      <section className="stats-sec hx-facts">
        <div className="w stats">
          <div><b><CountUp value={2} /></b><p>training programmes</p><small>Foundation and Advanced</small></div>
          <div><b><CountUp value={1} /></b><p>continuous project</p><small>a real e-commerce application</small></div>
          <div><b><CountUp value={3} /></b><p>live classes a week</p><small>1 hour per class, online</small></div>
          <div><b><CountUp value={72} /></b><p>classes in the full pathway</p><small>over 6 months</small></div>
        </div>
      </section>

      {/* programmes: one selector instead of three look-alike cards */}
      <section className="sec" id="programmes">
        <div className="w">
          <div className="sec-head">
            <div style={{ maxWidth: 720 }}>
              <div className="eb">QA training programmes</div>
              <h2>Two levels. <span className="accent">One continuous project.</span></h2>
              <p className="lead">Start with the fundamentals, go straight to advanced skills, or take both as one six-month pathway.</p>
            </div>
            <Link href="/programme" className="sec-link">Programme details <i aria-hidden="true">↗</i></Link>
          </div>
          <ProgrammePicker />
        </div>
      </section>

      {/* the project as one thread through five stops */}
      <section className="sec dark pj">
        <div className="w">
          <div className="sec-head">
            <div style={{ maxWidth: 760 }}>
              <div className="eb">One real project</div>
              <h2>One e-commerce app, from the first search to the final report.</h2>
              <p className="lead">Every module comes back to the same application, so you test it the way a QA team would: screen by screen, then across the API and the database.</p>
            </div>
            <Link href="/approach" className="sec-link on-dark">How the approach works <i aria-hidden="true">↗</i></Link>
          </div>
          <ol className="pj-thread">
            {projectStops.map((s, i) => (
              <li key={s.art}>
                <div className="pj-art"><Image src={`/illustrations/tile-${s.art}.webp`} alt="" width={640} height={640} /></div>
                <span className="pj-n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* services as a bento: two offers, the process, and how we engage */}
      <section className="sec tint" id="services">
        <div className="w">
          <div className="sec-head">
            <div style={{ maxWidth: 720 }}>
              <div className="eb">Offshore software testing services</div>
              <h2>Testing support for <span className="accent">your product.</span></h2>
              <p className="lead">Flexible, cost-effective manual and automation testing to improve software quality and help you release with confidence.</p>
            </div>
            <Link href="/contact#business" className="sec-link">Discuss your requirements <i aria-hidden="true">↗</i></Link>
          </div>
          <div className="sv">
            <article className="sv-card">
              <span className="sv-ic"><Icon name="check" /></span>
              <h3>Manual testing</h3>
              <ul>{services.manual.map((s) => <li key={s}>{s}</li>)}</ul>
            </article>
            <article className="sv-card">
              <span className="sv-ic"><Icon name="pipeline" /></span>
              <h3>Test automation</h3>
              <ul>{services.automation.map((s) => <li key={s}>{s}</li>)}</ul>
            </article>
            <article className="sv-engage">
              <span className="eb">Flexible engagement</span>
              <h3>A QA team that fits how you ship.</h3>
              <ul>{services.engagement.map((s) => <li key={s}><Icon name="check" size={18} />{s}</li>)}</ul>
              <Link className="btn y" href="/contact#business">Request a Consultation</Link>
            </article>
            <article className="sv-flow">
              <h3>End-to-end QA support</h3>
              <ol>
                {services.support.map((s, i) => (
                  <li key={s}><span>{String(i + 1).padStart(2, "0")}</span>{s}</li>
                ))}
              </ol>
            </article>
          </div>
        </div>
      </section>

      {/* why Genix: heading left, reasons right (after Educore's "why choose us") */}
      <section className="sec">
        <div className="w why">
          <div className="why-side">
            <div className="eb">Why Genix Solutions</div>
            <h2>Training shaped by real testing work.</h2>
            <p className="lead">We test software for businesses and teach people how to do it. Each side keeps the other honest.</p>
            <Link href="/approach" className="sec-link">Our approach <i aria-hidden="true">↗</i></Link>
          </div>
          <ol className="why-list">
            {reasons.map(([t, d], i) => (
              <li key={t}>
                <span className="why-n">{String(i + 1).padStart(2, "0")}</span>
                <div><h3>{t}</h3><p>{d}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* free trial */}
      <section className="trial">
        <div className="w trial-grid">
          <div>
            <div className="kick">Free trial session</div>
            <h2>Start your QA journey today.</h2>
            <p>Book a free trial session to experience how we teach, and get your questions answered by our trainer.</p>
            <div className="actions">
              <Link className="btn y" href="/enrol?interest=trial">Book a Free Trial Session</Link>
              <Link className="btn ol" href="/programme">View Course Details</Link>
            </div>
          </div>
          <div className="trial-card">
            <span className="trial-k">In the trial session</span>
            <ul>
              {trialIncludes.map((t, i) => <li key={t}><span><Icon name={trialIcons[i]} size={20} /></span>{t}</li>)}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
