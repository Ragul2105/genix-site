import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/Icon";
import TypedHeading from "@/components/TypedHeading";
import IntroFilm, { WatchIntroButton } from "@/components/IntroFilm";
import { inr, programmes, schedule, trialIncludes } from "@/lib/programmes";

const proof: [string, string][] = [
  ["graduate", "Practical hands-on learning"],
  ["chart", "Real-world project experience"],
  ["users", "Industry-relevant skills"],
  ["badge", "Quality-driven testing services"],
];

const facts: [string, string, string][] = [
  ["book", "2 Training Programmes", "Foundation & Advanced"],
  ["cart", "1 Continuous Project", "Real e-commerce application"],
  ["calendar", "3 Classes Per Week", "1 hour per class"],
  ["video", "Live Online Classes", "Interactive & hands-on"],
  ["chart", "Industry-focused", "Career-ready skills"],
];

const projectSteps: [string, string][] = [
  ["search", "Product Search and Filters"],
  ["cart", "Add to Cart and Checkout"],
  ["card", "Payment Processing"],
  ["database", "API and Database Validation"],
  ["list", "End-to-end Testing and Reporting"],
];

const services = [
  { id: "svc-manual", icon: "cog", title: "Manual Testing Services", photo: "manual", alt: "A tester reviewing an application at his desk",
    items: ["Functional Testing", "Regression Testing", "API and Integration Testing", "Database Testing"] },
  { id: "svc-automation", icon: "code", title: "Test Automation Services", photo: "automation", alt: "Automation code on a monitor in an office",
    items: ["Automated Functional Tests", "Automated Regression Suites", "Test Execution and Reporting", "Automation Maintenance"] },
  { id: "svc-support", icon: "users", title: "End-to-End QA Support", photo: "support", alt: "A QA team working together on laptops",
    items: ["Test Planning & Preparation", "Test Execution", "Defect Management", "Retesting & Release Support"] },
  { id: "svc-engage", icon: "hands", title: "Flexible Engagement", photo: "engage", alt: "A team meeting with a presenter",
    items: ["Dedicated QA Support", "Scalable Teams", "Clear Communication", "Meaningful Testing Insights"] },
];

const reasons: [string, string, string][] = [
  ["laptop", "Practical Learning", "with real projects"],
  ["chart", "Industry-focused", "curriculum"],
  ["users", "Experienced", "trainers"],
  ["calendar", "Flexible", "learning options"],
  ["bulb", "Career Guidance", "and support"],
  ["badge", "Trusted by", "individuals and businesses"],
];

const trialIcons = ["video", "list", "laptop", "chat"];

export default function Home() {
  return (
    <>
      {/* hero: dark, the promise left, the company film right */}
      <section className="h2o">
        <div className="w h2o-grid">
          <div className="h2o-copy">
            <div className="eb">Practical QA Training <i aria-hidden="true">|</i> Reliable Testing Services</div>
            <TypedHeading
              lines={[
                [{ text: "Build QA Skills. " }, { text: "Deliver Better Software.", className: "accent" }],
                [{ text: "Think like a QA engineer. " }, { text: "Test like one.", className: "accent" }],
              ]}
            />
            <p className="sub">Genix Solutions provides industry-focused QA training for individuals and reliable offshore software testing services for businesses.</p>
            <div className="actions">
              <WatchIntroButton className="btn wh" />
              <Link className="btn bl" href="/enrol?interest=trial">Book a Free Trial Session <Icon name="arrow" size={18} /></Link>
            </div>
            <ul className="h2o-proof">
              {proof.map(([ic, t]) => <li key={t}><Icon name={ic} size={26} /><span>{t}</span></li>)}
            </ul>
          </div>
          <div className="h2o-media">
            <IntroFilm />
          </div>
        </div>
      </section>

      {/* key facts strip, overlapping the hero */}
      <section className="facts">
        <div className="w">
          <ul className="facts-row">
            {facts.map(([ic, t, d]) => (
              <li key={t}><span className="facts-ic"><Icon name={ic} size={26} /></span><div><b>{t}</b><span>{d}</span></div></li>
            ))}
          </ul>
        </div>
      </section>

      {/* programmes: three cards, as in the reference */}
      <section className="sec progs" id="programmes">
        <div className="w">
          <div className="sec-head">
            <div>
              <h2>Our QA Training Programmes</h2>
              <p className="lead">Two levels. One continuous practical project. Choose the path that fits your goal.</p>
            </div>
            <Link href="/programme" className="txt-link">Compare Programmes <Icon name="arrow" size={18} /></Link>
          </div>
          <div className="pcards">
            {programmes.map((p) => (
              <article key={p.id} id={p.id} className={`pc pc-${p.id}`}>
                <div className="pc-head">
                  <div className="pc-chips">
                    <span className="pc-level">{p.chip}</span>
                    <span className="pc-aud">{p.audience}</span>
                  </div>
                  <h3>{p.name}</h3>
                  <p>{p.summary}</p>
                  <div className="pc-photo"><Image src={p.photo} alt={p.photoAlt} width={1200} height={800} sizes="(max-width: 900px) 40vw, 180px" /></div>
                </div>
                <ul className="pc-list">
                  {p.topics.map((t) => <li key={t}><span><Icon name="check" size={14} /></span>{t}</li>)}
                </ul>
                <dl className="pc-meta">
                  <div><Icon name="calendar" size={20} /><dt className="sr">Duration</dt><dd><b>{p.months} Months</b></dd></div>
                  <div><Icon name="users" size={20} /><dt className="sr">Schedule</dt><dd><b>{schedule.perWeek} Classes/Week</b><span>{schedule.mode}</span></dd></div>
                  <div><Icon name="clock" size={20} /><dt className="sr">Class length</dt><dd><b>{schedule.hoursPerClass} Hour/Class</b><span>{p.classes} Classes ({p.classes} Hours)</span></dd></div>
                </dl>
                <div className="pc-price">
                  <b>{inr(p.price)}</b>
                  {p.was && <s aria-label={`was ${inr(p.was)}`}>{inr(p.was)}</s>}
                  {p.offer && <i>{p.offer}</i>}
                  {p.priceNote && <small>{p.priceNote}</small>}
                </div>
                <div className="pc-actions">
                  <Link className="pc-more" href="/programme#curriculum">{p.id === "pathway" ? "View Full Pathway" : "View Detailed Curriculum"} <Icon name="arrow" size={16} /></Link>
                  <Link className="pc-enrol" href={`/enrol?interest=${p.id}`}>Enrol Now</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* one project, five stops */}
      <section className="proj">
        <div className="w">
          <div className="proj-panel">
            <div className="proj-copy">
              <h2>One Real E-commerce Project Throughout Your Learning Journey</h2>
              <p>Gain hands-on experience by working on a complete e-commerce application from start to finish, covering manual testing, API testing, database testing, automation and CI/CD.</p>
            </div>
            <ol className="proj-flow">
              {projectSteps.map(([ic, t], i) => (
                <li key={t}>
                  <span className="proj-tile"><Icon name={ic} size={30} /><i>{String(i + 1).padStart(2, "0")}</i></span>
                  <span className="proj-label">{t}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* services */}
      <section className="sec svcs" id="services">
        <div className="w">
          <div className="sec-head">
            <div>
              <h2>Offshore Software Testing Services</h2>
              <p className="lead">Flexible and cost-effective manual and automation testing services to improve software quality and accelerate releases.</p>
            </div>
            <Link href="/contact#business" className="btn ob">Discuss Your Requirements <Icon name="arrow" size={18} /></Link>
          </div>
          <div className="svc-grid">
            {services.map((s) => (
              <article key={s.id} id={s.id} className="svc">
                <div className="svc-photo"><Image src={`/photos/${s.photo}.webp`} alt={s.alt} width={1200} height={800} sizes="(max-width: 900px) 50vw, 280px" /></div>
                <div className="svc-body">
                  <h3><span className="svc-ic"><Icon name={s.icon} size={20} /></span>{s.title}</h3>
                  <ul>{s.items.map((it) => <li key={it}><span><Icon name="check" size={13} /></span>{it}</li>)}</ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* why Genix */}
      <section className="why2">
        <div className="w">
          <div className="sec-head">
            <h2>Why Choose Genix Solutions?</h2>
            <Link href="/approach" className="txt-link">Our Approach <Icon name="arrow" size={18} /></Link>
          </div>
          <ul className="why2-row">
            {reasons.map(([ic, a, b]) => (
              <li key={a}><span className="why2-ic"><Icon name={ic} size={28} /></span><span><b>{a}</b>{b}</span></li>
            ))}
          </ul>
        </div>
      </section>

      {/* free trial band */}
      <section className="trial2">
        <div className="w trial2-grid">
          <div className="trial2-copy">
            <h2>Start Your QA Journey Today</h2>
            <p>Book a free trial session and experience our training approach. Get your questions answered by our trainer.</p>
            <div className="actions">
              <Link className="btn wh" href="/enrol?interest=trial">Book a Free Trial Session <Icon name="arrow" size={18} /></Link>
              <Link className="btn ol" href="/programme">View Course Details</Link>
            </div>
          </div>
          <div className="trial2-photo"><Image src="/photos/trial.webp" alt="A learner with headphones studying at her laptop" width={1200} height={800} sizes="360px" /></div>
          <ul className="trial2-list">
            {trialIncludes.map((t, i) => <li key={t}><Icon name={trialIcons[i]} size={20} />{t}</li>)}
          </ul>
        </div>
      </section>
    </>
  );
}
