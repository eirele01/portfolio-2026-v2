"use client";

import { useRef, type ReactNode, type RefObject } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import type { Beat } from "@/content/schema";
import { demoClient } from "@/content/facts";
import { useBeat, useStageTL } from "../PhaseStage";
import { useFlow } from "../flowContext";

/**
 * Shared shell for visual beats [SCR-11]: anchored to the LOWER-LEFT on
 * desktop — the same column as the text beats — so the clip's subject stays
 * visible in the center/right and the widget never blocks the footage.
 * [MOB-01] Below lg it anchors to the BOTTOM band too (horizontally
 * centred, pb-8svh — the same line the text beats use): it used to float
 * centred in the upper half, directly on top of the phase title/lede card.
 * Registers the visual's entrance/exit on the stage timeline; the entrance
 * rises from below (travel 24) so it reads as growing out of the bottom
 * edge. Without a timeline (static/lite/no-JS) it renders visible, in
 * final state.
 */
export function VisualShell({
  beat,
  children,
  className = "",
  card = false,
  cardClassName = "",
}: {
  beat: Extract<Beat, { kind: "visual" }>;
  children: ReactNode;
  className?: string;
  card?: boolean;
  /** [CARD-01] Wrap the visual in a low-opacity readability card (visitor
   *  round 12: phase 3 diagram + phase 6 pipeline). The card carries
   *  `--card-bg` overrides via cardClassName so a visual can demand a
   *  contrasting tint (the architecture diagram must not sit on its own
   *  near-black fill). */
  cardClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const flow = useFlow();
  useBeat({ el: ref, at: beat.at, until: beat.until, travel: 24 });
  return (
    <div
      ref={ref}
      className={
        flow
          ? `relative z-10 my-8 flex justify-center ${className}`
          : `absolute inset-0 z-10 flex items-end justify-center px-clamp pb-[8svh] lg:items-end lg:justify-start lg:pb-[9svh] ${className}`
      }
    >
      {card ? (
        <div className={`story-card p-4 lg:p-5 ${cardClassName}`}>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export interface VisualProps {
  beat: Extract<Beat, { kind: "visual" }>;
}

/** Crossfade helper: registers visible→hidden tweens for stacked layers. */
export function useCrossfade(
  refs: RefObject<HTMLElement | null>[],
  win: [number, number],
  marks: number[], // entry point (fraction of window) for each layer
): void {
  const tl = useStageTL();
  useGSAP(
    () => {
      if (!tl) return;
      const [start, end] = win;
      const span = end - start;
      const f = (x: number) => start + x * span;
      refs.forEach((r, i) => {
        if (!r.current) return;
        if (i === 0) {
          tl.set(r.current, { autoAlpha: 1 }, start);
          tl.to(r.current, { autoAlpha: 0, duration: span * 0.06, ease: "power2.in" }, f(marks[1] - 0.04));
        } else {
          tl.fromTo(r.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: span * 0.06, ease: "power2.out" }, f(marks[i]));
          if (i < refs.length - 1) {
            tl.to(r.current, { autoAlpha: 0, duration: span * 0.06, ease: "power2.in" }, f(marks[i + 1] - 0.04));
          }
        }
      });
    },
    { dependencies: [tl, win[0], win[1]] },
  );
}

/** Small mono step indicator: 1 SKETCH · 2 WIREFRAME · 3 UI */
export function StepDots({ labels, active }: { labels: string[]; active: number }) {
  return (
    <div className="flex items-center gap-3">
      {labels.map((l, i) => (
        <span key={l} className="label-mono flex items-center gap-1.5" aria-hidden="true">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${i === active ? "bg-amber" : "bg-line"}`}
          />
          <span className={i === active ? "text-ink" : "text-mute opacity-60"}>{l}</span>
        </span>
      ))}
    </div>
  );
}

const STEPS = ["SKETCH", "WIREFRAME", "UI"];

/**
 * Sketch → Wireframe → UI — three CSS/SVG states crossfading inside one
 * 16:10 frame (never screenshots). Final state: the polished dashboard.
 */
export function SketchToUi({ beat }: VisualProps) {
  const win: [number, number] = [beat.at, Math.min(beat.until ?? 0.84, 0.98)];
  const sketch = useRef<HTMLDivElement>(null);
  const wire = useRef<HTMLDivElement>(null);
  const ui = useRef<HTMLDivElement>(null);
  const step = useRef<HTMLParagraphElement>(null);
  const tl = useStageTL();

  useCrossfade([sketch, wire, ui], win, [0, 0.34, 0.67]);

  // Step indicator text follows the crossfade progress (story mode only).
  useGSAP(
    () => {
      if (!tl || !step.current) return;
      const [start, end] = win;
      const span = end - start;
      const obj = { v: 0 };
      tl.to(
        obj,
        {
          v: 2,
          duration: span,
          ease: "none",
          onUpdate: () => {
            if (!step.current) return;
            const i = Math.max(0, Math.min(2, Math.round(obj.v)));
            step.current.textContent = STEPS[i];
          },
        },
        start,
      );
    },
    { dependencies: [tl] },
  );

  return (
    <VisualShell beat={beat}>
      <div className="w-full max-w-[560px]">
        <div className="mb-2 flex items-center justify-between">
          <p ref={step} className="label-mono text-mute">
            UI
          </p>
          <p className="label-mono text-mute opacity-70">
            {demoClient.name} — fictional demo client
          </p>
        </div>
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md border border-line">
          {/* State 1 — dashed sketch with mono notes */}
          <Layer ref={sketch} className="bg-[#f4f2ee] text-[#111]">
            <div className="absolute left-[6%] top-[10%] h-[36%] w-[52%] border border-dashed border-[#111]/50">
              <Note className="-top-5 left-0">hero</Note>
            </div>
            <div className="absolute bottom-[10%] left-[6%] h-[34%] w-[30%] border border-dashed border-[#111]/50">
              <Note className="-top-5 left-0">device list</Note>
            </div>
            <div className="absolute bottom-[14%] right-[8%] h-[16%] w-[26%] border border-dashed border-[#111]/50">
              <Note className="-top-5 left-0">cta</Note>
            </div>
            <div className="absolute right-[8%] top-[10%] h-[36%] w-[32%] border border-dashed border-[#111]/25" />
          </Layer>
          {/* State 2 — solid gray wireframe */}
          <Layer ref={wire} className="bg-[#141416] text-[#8a8a90]" hidden>
            <div className="absolute left-[6%] top-[10%] h-[36%] w-[52%] rounded-sm bg-[#2a2a2e]" />
            <div className="absolute bottom-[10%] left-[6%] h-[34%] w-[30%] rounded-sm bg-[#2a2a2e]" />
            <div className="absolute bottom-[14%] right-[8%] h-[16%] w-[26%] rounded-sm bg-[#2a2a2e]" />
            <div className="absolute right-[8%] top-[10%] h-[36%] w-[32%] rounded-sm bg-[#232327]" />
            <div className="absolute inset-x-[6%] top-[4%] h-px bg-[#2a2a2e]" />
          </Layer>
          {/* State 3 — polished dashboard skeleton (final state) */}
          <Layer ref={ui} className="bg-[#0d0d0f] text-[#efece6]">
            {/* sidebar */}
            <div className="absolute bottom-0 left-0 top-0 w-[12%] border-r border-[#efece6]/10">
              <div className="mx-auto mt-3 h-1.5 w-1.5 rounded-full bg-amber" />
              <div className="mx-auto mt-4 space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="mx-auto h-1 w-1/2 rounded-full bg-[#efece6]/15" />
                ))}
              </div>
            </div>
            {/* header */}
            <div className="absolute left-[12%] right-0 top-0 flex h-[14%] items-center justify-between border-b border-[#efece6]/10 px-4">
              <span className="label-mono text-[#efece6]/80">{demoClient.name}</span>
              <span className="label-mono text-[#efece6]/40">LIVE</span>
            </div>
            {/* temperature dial */}
            <div className="absolute left-[18%] top-[26%] h-[44%] w-[30%]">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(239,236,230,0.12)" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r="40" fill="none" stroke="#ffb454" strokeWidth="6"
                  strokeDasharray="188 251" strokeLinecap="round" transform="rotate(-90 50 50)"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-mono text-sm">
                22.5°
              </span>
              <span className="label-mono absolute inset-x-0 -bottom-5 text-center text-[#efece6]/40">
                temperature
              </span>
            </div>
            {/* sparklines */}
            <div className="absolute bottom-[12%] right-[6%] h-[26%] w-[38%]">
              <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="h-full w-full">
                <polyline points="0,40 30,34 60,38 90,22 120,28 150,14 180,20 200,10" fill="none" stroke="#ffb454" strokeWidth="2" />
              </svg>
            </div>
            <div className="absolute bottom-[42%] right-[6%] h-[26%] w-[38%]">
              <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="h-full w-full">
                <polyline points="0,30 30,36 60,26 90,32 120,18 150,26 180,16 200,22" fill="none" stroke="rgba(239,236,230,0.35)" strokeWidth="2" />
              </svg>
            </div>
          </Layer>
        </div>
        <div className="mt-2 lg:hidden">
          <StepDots labels={STEPS} active={2} />
        </div>
      </div>
    </VisualShell>
  );
}

function Layer({
  ref,
  className = "",
  hidden = false,
  children,
}: {
  ref: RefObject<HTMLDivElement | null>;
  className?: string;
  hidden?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      ref={ref}
      className={`absolute inset-0 rounded-[inherit] ${className}`}
      style={hidden ? { opacity: 0, visibility: "hidden" } : undefined}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

function Note({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={`label-mono absolute font-mono text-[0.6rem] normal-case tracking-normal text-[#111]/60 ${className}`}
    >
      {children}
    </span>
  );
}
