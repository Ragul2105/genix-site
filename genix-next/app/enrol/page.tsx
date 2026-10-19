import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import EnquiryForm from "@/components/EnquiryForm";

export const metadata: Metadata = { title: "Enrol Now" };

export default function Enrol() {
  return (
    <>
      <PageHero eyebrow="Enrol now" title="Enquire About Enrolment">
        Tell us a little about yourself and we will follow up with programme details.
      </PageHero>
      <section className="sec">
        <div className="w" style={{ maxWidth: 720 }}><EnquiryForm variant="enrol" /></div>
      </section>
    </>
  );
}
