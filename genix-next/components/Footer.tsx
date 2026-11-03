import Link from "next/link";
import Logo from "./Logo";
import { footerCols, legalLinks, contact } from "@/lib/site";

export default function Footer() {
  const hasContact = Boolean(contact.email || contact.phone || contact.social.length);
  return (
    <footer>
      <div className="w">
        <div className="cols">
          <div className="brand">
            <Link href="/" className="logo" aria-label="Genix Solutions home">
              <Logo />
              <span><b>Genix</b><small>SOLUTIONS</small></span>
            </Link>
            <p>Practical QA skills. Reliable software quality.</p>
          </div>
          {footerCols.map((c) => (
            <div key={c.title}>
              <h4>{c.title}</h4>
              {c.links.map((l) => <Link key={l.label} href={l.href}>{l.label}</Link>)}
            </div>
          ))}
          {hasContact && (
            <div>
              <h4>Get in touch</h4>
              {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
              {contact.phone && <a href={`tel:${contact.phone}`}>{contact.phone}</a>}
              {contact.social.map((s) => <a key={s.href} href={s.href}>{s.label}</a>)}
            </div>
          )}
        </div>
        <div className="copy">
          <span>&copy; 2026 Genix Solutions. All rights reserved.</span>
          <span className="legal">
            {legalLinks.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
          </span>
          <span className="credit">Photos from <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a> · Illustrations by <a href="https://storyset.com" target="_blank" rel="noopener noreferrer">Storyset</a></span>
        </div>
      </div>
    </footer>
  );
}
