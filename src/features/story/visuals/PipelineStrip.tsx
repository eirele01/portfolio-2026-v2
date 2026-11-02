"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useStageTL } from "../PhaseStage";
import { VisualShell, type VisualProps } from "./SketchToUi";

/**
 * Pipeline strip [Phase 6, Beat 2]: five nodes light in sequence —
 * Commit → Build (Docker) → Test → Deploy (Cloud Run) → Live — connected by
 * a thin line with a travelling packet. Final state (SSR/static): all lit,
 * packet gone. The packet moves via transform (never layout properties).
 */
const STEPS = ["Commit", "Build (Docker)", "Test", "Deploy (Cloud Run)", "Live"];

export function PipelineStrip({ beat }: VisualProps) {
  const win: [number, number] = [beat.at, Math.min(beat.until ?? 0.6, 0.98)];
  const root = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const packet = useRef<HTMLSpanElement>(null);
  const tl = useStageTL();

  useGSAP(
    () => {
      if (!tl || !root.current) return;
      const [start, end] = win;
      const span = end - start;

      const lit = root.current.querySelectorAll<HTMLElement>("[data-lit]");
      lit.forEach((l, i) => {
        tl.fromTo(
          l,
          { autoAlpha: 0, scale: 0.85 },
          { autoAlpha: 1, scale: 1, duration: span * 0.08, ease: "power3.out" },
          start + span * (0.06 + i * 0.17),
        );
      });

      const dot = packet.current;
      const track = line.current;
      if (dot && track) {
        // Measure the track (re-measured by ResizeObserver, never in-ticker).
        let w = track.offsetWidth;
        const ro = new ResizeObserver(() => {
          w = track.offsetWidth;
        });
        ro.observe(track);
        const state = { p: 0 };
        const place = () => {
          dot.style.transform = `translateX(${state.p * w}px)`;
        };
        tl.set(dot, { autoAlpha: 1 }, start + span * 0.06);
        tl.fromTo(
          state,
          { p: 0 },
          { p: 1, duration: span * 0.74, ease: "none", onUpdate: place },
          start + span * 0.06,
        );
        tl.to(dot, { autoAlpha: 0, duration: span * 0.04 }, end - span * 0.04);
        place();
        return () => ro.disconnect();
      }
    },
    { scope: root, dependencies: [tl, win[0], win[1]] },
  );

  return (
    <VisualShell beat={beat} card>
      {/* [VIS-01] Definite width + larger furniture — the old shrink-wrapped
       * `max-w-[640px]` card collapsed to ~346px of thin strip (visitor
       * round 17: pipeline read as the smallest visual on the page). Dots,
       * labels and paddings scale with it; line/packet offsets track the
       * pt-9 + 24px dot geometry. The calc term caps at the shell's real
       * content width so phones/tablets never overflow (see ArchitectureDiagram). */}
      <div ref={root} className="w-[min(760px,calc(100vw_-_2*clamp(20px,_5vw,_72px)_-_40px))]">
        <div className="relative pb-2 pt-9">
          <div
            ref={line}
            aria-hidden="true"
            className="absolute left-[6%] right-[6%] top-[calc(2.25rem+11px)] h-px bg-line"
          />
          <span
            ref={packet}
            aria-hidden="true"
            className="absolute left-[6%] top-[calc(2.25rem+7px)] z-10 h-2.5 w-2.5 rounded-full bg-amber opacity-0"
          />
          <ol className="relative flex items-start justify-between" aria-label="Deployment pipeline: Commit, Build with Docker, Test, Deploy with Cloud Run, Live">
            {STEPS.map((s, i) => (
              <li
                key={s}
                className="flex flex-col items-center gap-3"
                style={{ width: `${100 / STEPS.length}%` }}
              >
                <span className="relative flex h-6 w-6 items-center justify-center">
                  <span aria-hidden="true" className="absolute h-5 w-5 rounded-full border border-line bg-[#141416]" />
                  <span
                    data-lit
                    aria-hidden="true"
                    className="absolute h-5 w-5 rounded-full bg-amber"
                    style={i === 0 ? undefined : { opacity: 0, visibility: "hidden" }}
                  />
                </span>
                <span className="label-mono max-w-[8.5rem] text-center !text-[0.7rem] leading-tight text-mute">
                  {s}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </VisualShell>
  );
}
