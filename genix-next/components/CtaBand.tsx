import Link from "next/link";

export default function CtaBand({ title, text, href, label }: { title: string; text: string; href: string; label: string }) {
  return (
    <section className="cta">
      <div className="w">
        <h2>{title}</h2>
        <p>{text}</p>
        <Link className="btn y" href={href}>{label}</Link>
      </div>
    </section>
  );
}
