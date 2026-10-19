import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import EnquiryForm from "@/components/EnquiryForm";
import { contact } from "@/lib/site";

export const metadata: Metadata = { title: "Contact Us" };

export default function Contact() {
  const details = [
    contact.email && ["Email", <a key="e" href={`mailto:${contact.email}`}>{contact.email}</a>],
    contact.phone && ["Phone", <a key="p" href={`tel:${contact.phone}`}>{contact.phone}</a>],
    contact.address && ["Address", contact.address],
    contact.hours && ["Hours", contact.hours],
    ...contact.social.map((s) => ["Social", <a key={s.href} href={s.href}>{s.label}</a>]),
  ].filter(Boolean) as [string, React.ReactNode][];

  return (
    <>
      <PageHero eyebrow="Contact us" title="Let’s talk.">
        Whether you are a learner or a business, send us a message and we will respond.
      </PageHero>
      <section className="sec">
        <div className="w row">
          <div id="consultation"><EnquiryForm variant="contact" /></div>
          {details.length > 0 && (
            <div className="card">
              <div className="eb">Contact details</div>
              <p style={{ marginTop: 14, lineHeight: 2 }}>
                {details.map(([k, v], i) => <span key={i}>{k}: {v}<br /></span>)}
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
