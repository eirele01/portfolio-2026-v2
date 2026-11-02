"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { scrollToTarget } from "@/lib/scroll/engine";
import { useStageTL } from "../PhaseStage";
import { VisualShell, type VisualProps } from "./SketchToUi";

/**
 * SDLC loop [Phase 7, Beat 2]: a 7-node loop — Discovery, Design,
 * Architecture, Development, Testing, Deployment, Maintenance — with the
 * arrow looping back to the start and "SDLC" in the center. Nodes light in
 * sequence as scroll advances; each node is a real button that scrolls back
 * to that phase (the loop doubles as navigation) [A11Y-07].
 */

const NODES = [
  { label: "Discovery", slug: "#discovery" },
  { label: "Design", slug: "#design" },
  { label: "Architecture", slug: "#architecture" },
  { label: "Development", slug: "#development" },
  { label: "Testing", slug: "#testing" },
  { label: "Deployment", slug: "#deployment" },
  { label: "Maintenance", slug: "#maintenance" },
] as const;

export function SdlcLoop({ beat }: VisualProps) {
  const win: [number, number] = [beat.at, Math.min(beat.until ?? 0.9, 0.98)];
  const root = useRef<HTMLDivElement>(null);
  const tl = useStageTL();

  useGSAP(
    () => {
      if (!tl || !root.current) return;
      const [start, end] = win;
      const span = end - start;

      // Ring draws, then nodes light in sequence.
      const ring = root.current.querySelector<SVGCircleElement>("[data-ring]");
      if (ring) {
        tl.fromTo(
          ring,
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0.001, duration: span * 0.3, ease: "none" },
          start,
        );
      }
      const lit = root.current.querySelectorAll<HTMLElement>("[data-node-lit]");
      lit.forEach((l, i) => {
        tl.fromTo(
          l,
          { autoAlpha: 0, scale: 0.9 },
          { autoAlpha: 1, scale: 1, duration: span * 0.05, ease: "power3.out" },
          start + span * (0.12 + i * 0.1),
        );
      });
      const center = root.current.querySelector<HTMLElement>("[data-center]");
      if (center) {
        tl.fromTo(
          center,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: span * 0.06, ease: "power2.out" },
          start + span * 0.08,
        );
      }
    },
    { scope: root, dependencies: [tl, win[0], win[1]] },
  );

  return (
    <VisualShell beat={beat}>
      {/* [MOB-01] Width drives this square's height — cap it against short
          viewports so ring + caption fit the bottom band under the label. */}
      <div ref={root} className="flex w-full max-w-[min(420px,44svh)] flex-col items-center">
        <div className="glass relative aspect-square w-full rounded-full p-2">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <circle
              data-ring
              cx="50"
              cy="50"
              r="47"
              fill="none"
              stroke="rgba(255,180,84,0.55)"
              strokeWidth="0.6"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={0}
            />
            {/* arrowhead near the start of the ring (loop back) */}
            <path d="M50,1.2 l3,2.4 -3,2.4 z" fill="rgba(255,180,84,0.8)" />
          </svg>

          <span
            data-center
            className="label-mono absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-mute"
          >
            SDLC
          </span>

          {NODES.map((n, i) => {
            const angle = -Math.PI / 2 + (i / NODES.length) * Math.PI * 2;
            const left = 50 + 41 * Math.cos(angle);
            const top = 50 + 41 * Math.sin(angle);
            return (
              <button
                key={n.slug}
                type="button"
                onClick={() => scrollToTarget(n.slug)}
                className="absolute flex min-h-[44px] min-w-[44px] -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                style={{ left: `${left}%`, top: `${top}%` }}
                aria-label={`Go to phase: ${n.label}`}
              >
                <span
                  data-node-lit
                  className="chip !px-2.5 !py-1 !text-[0.58rem] bg-[#141416] shadow-none"
                  style={i === 0 ? undefined : { opacity: 0, visibility: "hidden" }}
                >
                  {n.label}
                </span>
              </button>
            );
          })}
        </div>
        <p className="label-mono mt-4 text-mute opacity-80">Monitor. Learn. Improve. Repeat.</p>
      </div>
    </VisualShell>
  );
}
