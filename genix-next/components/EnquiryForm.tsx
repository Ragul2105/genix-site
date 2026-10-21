"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Variant = "contact" | "enrol";
type State = { status: "idle" | "sending" | "ok" | "error"; message?: string };

export default function EnquiryForm({ variant }: { variant: Variant }) {
  const [state, setState] = useState<State>({ status: "idle" });
  const enrol = variant === "enrol";
  const typeRef = useRef<HTMLSelectElement>(null);

  // links to #business (home page, contact tiles, FAQ) pre-select a business enquiry
  useEffect(() => {
    const pick = () => {
      if (typeRef.current && window.location.hash === "#business") typeRef.current.value = "business";
    };
    pick();
    window.addEventListener("hashchange", pick);
    return () => window.removeEventListener("hashchange", pick);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setState({ status: "sending" });
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, source: variant }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Something went wrong. Please try again.");
      form.reset();
      setState({
        status: "ok",
        message: enrol
          ? "Thank you. We have received your enquiry and will be in touch."
          : "Thank you. Your message has been received.",
      });
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : "Something went wrong." });
    }
  }

  return (
    <form onSubmit={onSubmit} method="post" action="/api/enquiry">
      {!enrol && (
        <>
          <div className="eb">Send an enquiry</div>
          <label htmlFor="type">I am enquiring as</label>
          <select id="type" name="type" defaultValue="learner" ref={typeRef}>
            <option value="learner">A learner (QA programme)</option>
            <option value="business">A business (testing services consultation)</option>
            <option value="other">Other</option>
          </select>
        </>
      )}
      <label htmlFor="name">Full name *</label>
      <input id="name" name="name" type="text" required autoComplete="name" />
      <label htmlFor="email">Email address *</label>
      <input id="email" name="email" type="email" required autoComplete="email" />
      <label htmlFor="phone">{enrol ? "Phone number with country code *" : "Phone (with country code)"}</label>
      <input id="phone" name="phone" type="tel" required={enrol} autoComplete="tel" />
      {enrol && (
        <>
          <label htmlFor="loc">Current location / country</label>
          <input id="loc" name="loc" type="text" />
          <label htmlFor="edu">Education / qualification</label>
          <input id="edu" name="edu" type="text" />
          <label htmlFor="role">Current role or experience level</label>
          <input id="role" name="role" type="text" />
        </>
      )}
      <label htmlFor="msg">{enrol ? "Questions or message" : "Message"}</label>
      <textarea id="msg" name="msg" rows={enrol ? 4 : 5} />
      {/* honeypot: real users never see or fill this */}
      <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <p style={{ marginTop: 18 }}>
        <label className="ck">
          <input type="checkbox" name="consent" required />
          <span>I agree to the processing of my details as described in the <Link href="/privacy">Privacy Policy</Link>. *</span>
        </label>
      </p>
      <button className="btn y" type="submit" disabled={state.status === "sending"}>
        {state.status === "sending" ? "Sending…" : enrol ? "Send Enquiry" : "Send Message"}
      </button>
      {state.status === "ok" && <div className="msg ok" role="status">{state.message}</div>}
      {state.status === "error" && <div className="msg err" role="alert">{state.message}</div>}
      {enrol && <p style={{ marginTop: 28, fontSize: 14 }}>Do not enter payment card details on this form.</p>}
    </form>
  );
}
