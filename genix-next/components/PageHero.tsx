export default function PageHero({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  const words = title.split(" ");
  return (
    <section className="page-hero">
      <div className="w">
        <div className="eb">{eyebrow}</div>
        {/* masked word rise, after Bettr Academy's hero */}
        <h1 aria-label={title} data-split="">
          {words.map((w, i) => (
            <span key={i} aria-hidden="true">
              <span className="mw"><span style={{ "--i": i } as React.CSSProperties}>{w}</span></span>
              {i < words.length - 1 ? " " : ""}
            </span>
          ))}
        </h1>
        {children && <p>{children}</p>}
      </div>
    </section>
  );
}
