import { journey, journeyPhases, layers, traceNotes, traceStep } from "@/lib/site";

/*
 * Customer journey as a service blueprint (NN/g "Service Blueprints: Definition"):
 * phases over the steps (NN/g "Journey Mapping 101"), the frontstage lane, a line of visibility,
 * then backstage lanes. One step is traced vertically through every layer.
 */
export default function JourneyBlueprint() {
  const traceCol = journey.indexOf(traceStep) + 1;
  const phaseStarts = journeyPhases.map((_, i) => 1 + journeyPhases.slice(0, i).reduce((sum, [, n]) => sum + n, 0));
  const [front, ...back] = layers;
  const lane = (name: string, i: number, row: number) => (
    <div key={name} className="bp-lane" style={{ gridRow: row }}>
      <span className="bp-lane-name">{name}</span>
      <span className="bp-node" style={{ gridColumn: traceCol, ["--k" as string]: i }}>
        <i aria-hidden="true" />
        <span className="bp-note">{traceNotes[i]}</span>
      </span>
    </div>
  );

  return (
    <>
    <div className="bp-scroll">
      <div className="bp" role="group" aria-label={`Customer journey: ${journey.join(", ")}. ${traceStep} is traced through ${layers.join(", ")}.`}>
        {journeyPhases.map(([label, n], i) => (
          <div key={label} className="bp-phase" style={{ gridColumn: `${phaseStarts[i]} / span ${n}` }}>{label}</div>
        ))}
        <div className="bp-rail" aria-hidden="true" />
        {journey.map((s, i) => (
          <div key={s} className={`bp-step${s === traceStep ? " hl" : ""}`} style={{ gridColumn: i + 1 }}>
            <span>{s}</span>
          </div>
        ))}
        <div className="bp-trace" style={{ gridColumn: traceCol }} aria-hidden="true" />
        {lane(front, 0, 3)}
        <div className="bp-visibility" aria-hidden="true">
          <span>Line of visibility</span>
          <em>↑ customer sees · behind the scenes ↓</em>
        </div>
        {back.map((name, i) => lane(name, i + 1, 5 + i))}
      </div>
    </div>
    <p className="bp-hint">Swipe to follow the journey →</p>
    </>
  );
}
