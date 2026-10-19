import Link from "next/link";
import { nav, legalLinks, contact } from "@/lib/site";

export default function Footer() {
  const hasContact = contact.email || contact.phone || contact.social.length;
  return (
    <footer>
      <div className="w">
        <div className="cols">
          <div className="brand">
            <b>Genix Solutions</b><small>LEARN | BUILD | GROW</small>
            Offshore software testing services and an industry-focused QA training programme.
          </div>
          <div>{nav.slice(0, 4).map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}</div>
          <div>
            {nav.slice(4).map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
            <Link href="/enrol">Enrol Now</Link>
            {legalLinks.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
          </div>
          {hasContact && (
            <div>
              {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
              {contact.phone && <a href={`tel:${contact.phone}`}>{contact.phone}</a>}
              {contact.social.map((s) => <a key={s.href} href={s.href}>{s.label}</a>)}
            </div>
          )}
        </div>
        <div className="copy">&copy; 2026 Genix Solutions. All rights reserved. <span className="credit">Illustrations by <a href="https://storyset.com" target="_blank" rel="noopener noreferrer">Storyset</a></span></div>
      </div>
    </footer>
  );
}
