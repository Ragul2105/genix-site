/*
 * Spot illustrations for the "Why Genix" cards. Each is a small scene from the programme itself,
 * drawn inside the reference's split frame: two stacked rounded tiles with a thin gap.
 * Palette matches the hero ticket (navy surfaces, sky labels, yellow for "the thing to look at").
 */

const C = {
  navy: "#0B1F3A",
  panel: "#16345E",
  chip: "#1F3F6E",
  sky: "#6EA8FF",
  soft: "#9CC1FF",
  text: "#C5D3EA",
  white: "#FFFFFF",
  yellow: "#FFC83D",
  green: "#4ADE80",
  red: "#FF6B6B",
};

const W = 220;
const TOP = 128;
const GAP = 8;
const H = 280;

/** Split frame shared by all four scenes. */
function Frame({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="fi">
      <defs>
        <clipPath id={id}>
          <rect x="0" y="0" width={W} height={TOP} rx="18" />
          <rect x="0" y={TOP + GAP} width={W} height={H - TOP - GAP} rx="18" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect width={W} height={H} fill={C.navy} />
        {children}
      </g>
    </svg>
  );
}

const Check = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r="8" fill={C.green} fillOpacity=".18" />
    <path d="M-3.5 0.2 L-1 2.8 L3.8 -2.6" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

/** A defect ticket, then the first moves a tester makes. */
export function ScenarioArt() {
  return (
    <Frame id="fi-scenario" label="A bug ticket for a double charge, with reproduce and API checks done and the database check in progress">
      {/* top tile: the ticket */}
      <circle cx="22" cy="22" r="4" fill={C.red} />
      <circle cx="34" cy="22" r="4" fill={C.yellow} />
      <circle cx="46" cy="22" r="4" fill={C.green} />
      <text x="20" y="50" className="fi-k" fill={C.sky}>BUG-142</text>
      <rect x="148" y="38" width="54" height="18" rx="9" fill={C.yellow} />
      <text x="175" y="51" className="fi-s" fill={C.navy} textAnchor="middle">High</text>
      <text x="20" y="78" className="fi-t" fill={C.white}>Customer charged</text>
      <text x="20" y="98" className="fi-t" fill={C.white}>twice after retry</text>
      <rect x="20" y="108" width="52" height="4" rx="2" fill={C.chip} />
      {/* bottom tile: what you do first */}
      <text x="20" y={TOP + GAP + 28} className="fi-k" fill={C.sky}>FIRST STEPS</text>
      <rect x="14" y={TOP + GAP + 40} width="192" height="26" rx="8" fill={C.panel} />
      <Check x={30} y={TOP + GAP + 53} />
      <text x="46" y={TOP + GAP + 57} className="fi-s" fill={C.text}>Reproduce on checkout</text>
      <rect x="14" y={TOP + GAP + 72} width="192" height="26" rx="8" fill={C.panel} />
      <Check x={30} y={TOP + GAP + 85} />
      <text x="46" y={TOP + GAP + 89} className="fi-s" fill={C.text}>Check API response</text>
      <rect x="14" y={TOP + GAP + 104} width="192" height="26" rx="8" fill={C.chip} stroke={C.yellow} strokeOpacity=".7" />
      <circle cx="30" cy={TOP + GAP + 117} r="4" fill={C.yellow} className="fi-pulse" />
      <text x="46" y={TOP + GAP + 121} className="fi-s" fill={C.white}>Inspect order in DB</text>
    </Frame>
  );
}

/** The one e-commerce journey every module comes back to. */
export function ProjectArt() {
  const top = [
    { x: 20, label: "Search" },
    { x: 118, label: "Cart" },
  ];
  const bottom = [
    { x: 20, label: "Payment", hl: true },
    { x: 118, label: "Order" },
  ];
  const yTop = 70;
  const yBot = TOP + GAP + 46;
  return (
    <Frame id="fi-project" label="The course project's customer journey: search, cart, payment and order, with the order confirmed">
      <text x="20" y="34" className="fi-k" fill={C.sky}>ONE PROJECT · E-COMMERCE</text>
      {/* path runs through both tiles, across the gap */}
      <path
        d={`M66 ${yTop + 15} H118 M164 ${yTop + 30} V${yTop + 52} Q164 ${yTop + 60} 156 ${yTop + 60} H74 Q66 ${yTop + 60} 66 ${yTop + 68} V${yBot}`}
        fill="none" stroke={C.sky} strokeOpacity=".55" strokeWidth="2" strokeDasharray="4 5"
      />
      <path d={`M112 ${yBot + 15} H118`} stroke={C.sky} strokeOpacity=".55" strokeWidth="2" strokeDasharray="4 5" />
      {top.map((n) => (
        <g key={n.label}>
          <rect x={n.x} y={yTop} width="92" height="30" rx="15" fill={C.chip} />
          <text x={n.x + 46} y={yTop + 20} className="fi-s" fill={C.soft} textAnchor="middle">{n.label}</text>
        </g>
      ))}
      {bottom.map((n) => (
        <g key={n.label}>
          <rect x={n.x} y={yBot} width="92" height="30" rx="15" fill={n.hl ? C.yellow : C.chip} />
          <text x={n.x + 46} y={yBot + 20} className="fi-s" fill={n.hl ? C.navy : C.soft} textAnchor="middle">{n.label}</text>
        </g>
      ))}
      {/* order confirmation */}
      <rect x="20" y={yBot + 48} width="180" height="50" rx="12" fill={C.panel} />
      <Check x={42} y={yBot + 73} />
      <text x="60" y={yBot + 69} className="fi-s" fill={C.white}>Order #4821 placed</text>
      <text x="60" y={yBot + 85} className="fi-xs" fill={C.text}>UI · API · DB in sync</text>
    </Frame>
  );
}

/** A sprint and the pipeline that ships it. */
export function WorkflowArt() {
  const y0 = TOP + GAP;
  const stages = [
    { label: "Build", meta: "1m 12s", state: "done" },
    { label: "Regression", meta: "124 passed", state: "done" },
    { label: "Deploy · staging", meta: "running", state: "run" },
  ] as const;
  return (
    <Frame id="fi-workflow" label="Sprint 14 progress and a CI pipeline with build and regression passed and deploy to staging running">
      <text x="20" y="34" className="fi-k" fill={C.sky}>SPRINT 14</text>
      <text x="200" y="34" className="fi-xs" fill={C.text} textAnchor="end">Day 7 of 10</text>
      <rect x="20" y="48" width="180" height="8" rx="4" fill={C.chip} />
      <rect x="20" y="48" width="126" height="8" rx="4" fill={C.sky} />
      <rect x="20" y="72" width="54" height="40" rx="8" fill={C.panel} />
      <text x="47" y="90" className="fi-n" fill={C.white} textAnchor="middle">9</text>
      <text x="47" y="104" className="fi-xs" fill={C.text} textAnchor="middle">done</text>
      <rect x="83" y="72" width="54" height="40" rx="8" fill={C.panel} />
      <text x="110" y="90" className="fi-n" fill={C.white} textAnchor="middle">3</text>
      <text x="110" y="104" className="fi-xs" fill={C.text} textAnchor="middle">in test</text>
      <rect x="146" y="72" width="54" height="40" rx="8" fill={C.panel} stroke={C.red} strokeOpacity=".6" />
      <text x="173" y="90" className="fi-n" fill={C.white} textAnchor="middle">1</text>
      <text x="173" y="104" className="fi-xs" fill={C.text} textAnchor="middle">defect</text>
      <text x="20" y={y0 + 28} className="fi-k" fill={C.sky}>PIPELINE</text>
      <path d={`M30 ${y0 + 52} V${y0 + 116}`} stroke={C.chip} strokeWidth="2" />
      {stages.map((s, i) => {
        const y = y0 + 52 + i * 32;
        return (
          <g key={s.label}>
            {s.state === "done" ? <Check x={30} y={y} /> : (
              <g>
                <circle cx="30" cy={y} r="8" fill={C.yellow} fillOpacity=".2" />
                <circle cx="30" cy={y} r="4" fill={C.yellow} className="fi-pulse" />
              </g>
            )}
            <text x="48" y={y + 4} className="fi-s" fill={s.state === "run" ? C.white : C.text}>{s.label}</text>
            <text x="200" y={y + 4} className="fi-xs" fill={s.state === "run" ? C.yellow : C.soft} textAnchor="end">{s.meta}</text>
          </g>
        );
      })}
    </Frame>
  );
}

/** A QA CV, ISTQB preparation and an interview question. */
export function CareerArt() {
  const y0 = TOP + GAP;
  return (
    <Frame id="fi-career" label="A QA engineer CV with skills, an ISTQB preparation badge and an interview question">
      {/* top tile: CV */}
      <rect x="18" y="18" width="184" height="96" rx="12" fill={C.panel} />
      <circle cx="44" cy="46" r="14" fill={C.chip} />
      <circle cx="44" cy="42" r="5" fill={C.soft} />
      <path d="M35 55 Q44 47 53 55" fill={C.soft} />
      <rect x="66" y="36" width="78" height="7" rx="3.5" fill={C.white} />
      <text x="66" y="58" className="fi-xs" fill={C.sky}>QA Engineer</text>
      {["API", "SQL", "Automation"].map((s, i) => {
        const x = [32, 70, 108][i];
        const w = [32, 32, 70][i];
        return (
          <g key={s}>
            <rect x={x} y="74" width={w} height="18" rx="9" fill={C.chip} />
            <text x={x + w / 2} y="86.5" className="fi-xs" fill={C.soft} textAnchor="middle">{s}</text>
          </g>
        );
      })}
      <rect x="32" y="100" width="120" height="4" rx="2" fill={C.chip} />
      {/* bottom tile: certification prep + interview */}
      <g transform={`translate(40 ${y0 + 40})`}>
        <circle r="22" fill={C.yellow} />
        <circle r="16" fill="none" stroke={C.navy} strokeOpacity=".35" strokeWidth="1.5" strokeDasharray="2 3" />
        <path d="M0 -8 L2.4 -2.4 L8.4 -2 L3.8 1.8 L5.2 7.6 L0 4.6 L-5.2 7.6 L-3.8 1.8 L-8.4 -2 L-2.4 -2.4 Z" fill={C.navy} />
      </g>
      <text x="74" y={y0 + 36} className="fi-s" fill={C.white}>ISTQB prep</text>
      <text x="74" y={y0 + 52} className="fi-xs" fill={C.text}>Syllabus · mock exams</text>
      <path d={`M18 ${y0 + 80} H190 Q202 ${y0 + 80} 202 ${y0 + 92} V${y0 + 114} Q202 ${y0 + 126} 190 ${y0 + 126} H38 L26 ${y0 + 134} V${y0 + 126} Q18 ${y0 + 126} 18 ${y0 + 114} Z`} fill={C.panel} />
      <text x="30" y={y0 + 99} className="fi-xs" fill={C.sky}>INTERVIEW</text>
      <text x="30" y={y0 + 116} className="fi-s" fill={C.white}>“Walk me through a bug…”</text>
    </Frame>
  );
}
