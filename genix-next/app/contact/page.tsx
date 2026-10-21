import type { Metadata } from "next";
import Link from "next/link";
import EnquiryForm from "@/components/EnquiryForm";
import Icon from "@/components/Icon";
import PageHero from "@/components/PageHero";
import { contact } from "@/lib/site";

export const metadata: Metadata = { title: "Contact Us" };

/** Answers use only what the site already states elsewhere. */
const faqs: [string, React.ReactNode][] = [
  ["Who is the programme for?", "Graduates, freshers, career changers and learners who want to strengthen their QA process knowledge."],
  ["How long is it, and what does it cost?", <>Duration, schedule, fees and batch dates are being finalised. <Link href="/enrol">Send an enquiry</Link> and we will share them once confirmed.</>],
  ["Do I need experience or specific tools?", <>Prerequisites and the tools covered are being confirmed and will be listed in the <Link href="/programme#logistics">programme details</Link>.</>],
  ["Do you guarantee a job?", "No. Genix Solutions does not guarantee jobs, placement or salary. The programme gives realistic project exposure to make the move into a QA role smoother."],
  ["Will I get a certification?", "The programme does not award an accredited certification. ISTQB content is preparation guidance: syllabus structure, terminology, study planning, practice questions and mock exams."],
  ["Is the work based on real projects?", "You work on a continuous, realistic e-commerce project. Client applications or client-derived materials are used only with the necessary permissions, confidentiality protections and data safeguards."],
  ["Do you also test software for businesses?", <>Yes. Genix Solutions delivers offshore software testing services. <Link href="#business">Request a consultation</Link> using the form below.</>],
];

export default function Contact() {
  const details = [
    contact.email && { icon: "message", label: "Email", value: <a href={`mailto:${contact.email}`}>{contact.email}</a> },
    contact.phone && { icon: "chat", label: "Phone", value: <a href={`tel:${contact.phone}`}>{contact.phone}</a> },
    contact.address && { icon: "route", label: "Address", value: contact.address },
    contact.hours && { icon: "clock", label: "Hours", value: contact.hours },
  ].filter(Boolean) as { icon: string; label: string; value: React.ReactNode }[];

  return (
    <>
      <PageHero eyebrow="Contact us" title="Let’s talk.">
        Whether you are a learner or a business, send us a message and we will respond.
      </PageHero>

      {/* route people by intent (after Untitled UI's contact page) */}
      <section className="sec ct-intents-sec">
        <div className="w">
          <div className="ct-intents">
            <Link href="/enrol" className="ct-intent">
              <span className="ct-ic"><Icon name="graduate" size={22} /></span>
              <h3>I want to learn QA</h3>
              <p>Ask about the programme, the next batch and whether it suits you.</p>
              <span className="ct-go">Enquire about enrolment <Icon name="arrow" size={16} /></span>
            </Link>
            <a href="#business" className="ct-intent">
              <span className="ct-ic"><Icon name="briefcase" size={22} /></span>
              <h3>I need software tested</h3>
              <p>Talk to us about offshore testing services for your product.</p>
              <span className="ct-go">Request a consultation <Icon name="arrow" size={16} /></span>
            </a>
            <a href="#message" className="ct-intent">
              <span className="ct-ic"><Icon name="chat" size={22} /></span>
              <h3>Something else</h3>
              <p>Questions, partnerships or anything we haven&rsquo;t covered here.</p>
              <span className="ct-go">Send a message <Icon name="arrow" size={16} /></span>
            </a>
            {details.map((d) => (
              <div key={d.label} className="ct-intent is-detail">
                <span className="ct-ic"><Icon name={d.icon} size={22} /></span>
                <h3>{d.label}</h3>
                <p>{d.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* the form, with what happens after you send it */}
      <section className="sec tint" id="message">
        <div className="w ct-form">
          <div className="ct-next">
            <div className="eb">What happens next</div>
            <h2>One message is all it takes.</h2>
            <ol>
              <li><b>1</b><div><h3>Send your message</h3><p>Tell us whether you are a learner or a business, and what you need.</p></div></li>
              <li><b>2</b><div><h3>We read it and reply</h3><p>Every enquiry gets a response from the team.</p></div></li>
              <li><b>3</b><div><h3>We take it from there</h3><p>Learners get programme details. Businesses can arrange a testing consultation.</p></div></li>
            </ol>
          </div>
          <div id="consultation" className="ct-card"><span id="business" className="ct-anchor" /><EnquiryForm variant="contact" /></div>
        </div>
      </section>

      {/* FAQ */}
      <section className="sec">
        <div className="w ct-faq">
          <div>
            <div className="eb">Questions</div>
            <h2>Frequently asked.</h2>
            <p className="lead">The short answers. Anything else, just ask.</p>
          </div>
          <div>
            {faqs.map(([q, a]) => (
              <details className="acc" key={q}>
                <summary>{q}</summary>
                <p className="ct-a">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
