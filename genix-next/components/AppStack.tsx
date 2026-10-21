import Image from "next/image";
import anchors from "@/public/illustrations/app-stack.json";
import { stackLayers } from "@/lib/project";

/**
 * The practice app, exploded into its five layers (rendered in Blender: 3d/build_stack.py).
 * Labels sit on the anchor points Blender exported, so they always line up with the render.
 */
export default function AppStack({ showPayment = true }: { showPayment?: boolean }) {
  const a = anchors as unknown as Record<string, [number, number]>;
  return (
    <figure className="as">
      <Image src="/illustrations/app-stack.webp" alt="The course's e-commerce app pulled apart into five layers: browser and mobile UI, API, application services, database and external systems, with a payment request traced through all of them."
        width={1700} height={1800} sizes="(max-width: 900px) 92vw, 560px" />
      {stackLayers.map((l, i) => (
        <span key={l.key} className="as-tag" style={{ left: `${a[l.key][0] * 100}%`, top: `${a[l.key][1] * 100}%`, ["--c" as string]: l.color }}>
          <b>{String(i + 1).padStart(2, "0")}</b>{l.name}
        </span>
      ))}
      {showPayment && (
        <span className="as-pay" style={{ left: `${a.payment[0] * 100}%`, top: `${a.payment[1] * 100}%` }}>
          Payment request
        </span>
      )}
    </figure>
  );
}
