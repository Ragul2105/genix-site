import type { Metadata } from "next";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = { title: "Terms & Conditions" };

const tbc = (t: string) => <span className="tbc">{t}</span>;

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms & Conditions">Draft structure for review.</PageHero>
      <section className="sec">
        <div className="w legal">
          <p className="draft">DRAFT: have a qualified professional review and complete this before launch.</p>
          <h3>About these terms</h3><p>{tbc("To be completed: legal company name.")}</p>
          <h3>Programme information</h3><p>Descriptions of the programme are for information. {tbc("Confirm duration, fees, delivery and eligibility.")}</p>
          <h3>No guarantees</h3><p>We do not guarantee employment, placement, salary or certification outcomes.</p>
          <h3>Intellectual property</h3><p>{tbc("To be completed: ownership of course materials and permitted use.")}</p>
          <h3>Governing law</h3><p>{tbc("To be completed: jurisdiction.")}</p>
        </div>
      </section>
    </>
  );
}
