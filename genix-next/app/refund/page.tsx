import type { Metadata } from "next";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = { title: "Refund Policy" };

const tbc = (t: string) => <span className="tbc">{t}</span>;

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Refund Policy">Draft structure for review.</PageHero>
      <section className="sec">
        <div className="w legal">
          <p className="draft">DRAFT: have a qualified professional review and complete this before launch.</p>
          <h3>Fees</h3><p>{tbc("To be completed: confirm whether fees are collected and how.")}</p>
          <h3>Refunds and cancellations</h3><p>{tbc("To be completed: conditions, deadlines and process.")}</p>
          <h3>Contact</h3><p>{tbc("To be completed: contact email for refund requests.")}</p>
        </div>
      </section>
    </>
  );
}
