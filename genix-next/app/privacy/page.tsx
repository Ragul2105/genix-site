import type { Metadata } from "next";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = { title: "Privacy Policy" };

const tbc = (t: string) => <span className="tbc">{t}</span>;

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Policy">Draft structure for review.</PageHero>
      <section className="sec">
        <div className="w legal">
          <p className="draft">DRAFT: have a qualified professional review and complete this before launch.</p>
          <h3>Who we are</h3><p>{tbc("To be completed: legal company name and address.")}</p>
          <h3>Information we collect</h3><p>Details you submit through our enquiry, enrolment and contact forms: name, email, phone, location, education and experience, and your message.</p>
          <h3>How we use it</h3><p>To respond to enquiries and provide programme information. {tbc("Confirm purposes.")}</p>
          <h3>Retention and sharing</h3><p>{tbc("To be completed: retention period, processors and recipients.")}</p>
          <h3>Your rights</h3><p>{tbc("To be completed: rights and how to exercise them, for your users’ jurisdictions.")}</p>
          <h3>Cookies and analytics</h3><p>{tbc("To be completed: agree approach before enabling analytics.")}</p>
          <h3>Contact</h3><p>{tbc("To be completed: privacy contact email.")}</p>
        </div>
      </section>
    </>
  );
}
