"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useStageTL } from "../PhaseStage";
import { VisualShell, type VisualProps } from "./SketchToUi";

/**
 * Two terminal visuals.
 *  - CommitLog [Phase 4]: five mono lines type in sequence. aria-hidden —
 *    decorative, the surrounding beats carry the meaning.
 *  - TerminalTests [Phase 5]: red ✕ lines appear, each flips to ✓ green as
 *    scroll advances, then the checklist ticks. Color is never the only
 *    signal — the ✕/✓ glyphs and text carry state too [A11Y-08].
 * Final state (SSR/static): everything green and ticked.
 */

const COMMITS = [
  "feat: device registry",
  "feat: realtime telemetry",
  "feat: room dashboard",
  "feat: scene automation",
  "fix: reconnect handling",
];

const FAILURES = [
  "device latency timeout",
  "websocket dropped",
  "mobile layout overflow",
];

const CHECKS = [
  "Unit",
  "Integration",
  "End-to-end",
  "Device latency",
  "Device disconnects",
  "Mobile responsive",
];

export function CommitLog({ beat }: VisualProps) {
  const win: [number, number] = [beat.at, Math.min(beat.until ?? 0.6, 0.98)];
  const root = useRef<HTMLDivElement>(null);
  const tl = useStageTL();

  useGSAP(
    () => {
      if (!tl || !root.current) return;
      const [start, end] = win;
      const span = end - start;
      const lines = root.current.querySelectorAll<HTMLElement>("[data-line]");
      const slot = (span * 0.85) / lines.length;
      lines.forEach((l, i) => {
        tl.fromTo(
          l,
          { autoAlpha: 0, x: -8 },
          { autoAlpha: 1, x: 0, duration: slot * 0.6, ease: "power3.out" },
          start + i * slot,
        );
      });
    },
    { scope: root, dependencies: [tl, win[0], win[1]] },
  );

  return (
    <VisualShell beat={beat}>
      <div ref={root} className="w-full max-w-[560px]">
        <div className="glass rounded-md" aria-hidden="true">
          <div className="border-b border-glass-line px-4 py-2.5">
            <span className="label-mono text-mute opacity-70">commits — main</span>
          </div>
          <div className="px-4 py-3">
            {COMMITS.map((c) => (
              <p
                key={c}
                data-line
                className="flex items-center gap-2 font-mono text-[0.8rem] leading-6 text-[#efece6]/85"
              >
                <span className="text-amber">›</span>
                {c}
              </p>
            ))}
            <p className="flex items-center gap-2 font-mono text-[0.8rem] leading-6">
              <span className="text-amber">›</span>
              <span className="caret inline-block h-[0.95em] w-[0.55ch] bg-amber" />
            </p>
          </div>
        </div>
      </div>
    </VisualShell>
  );
}

export function TerminalTests({ beat }: VisualProps) {
  const win: [number, number] = [beat.at, Math.min(beat.until ?? 0.78, 0.98)];
  const root = useRef<HTMLDivElement>(null);
  const tl = useStageTL();

  useGSAP(
    () => {
      if (!tl || !root.current) return;
      const [start, end] = win;
      const span = end - start;

      // Failure lines appear (✕ red), then flip to ✓ green.
      const rows = root.current.querySelectorAll<HTMLElement>("[data-row]");
      const failSlot = span * 0.1;
      rows.forEach((row, i) => {
        const t0 = start + i * failSlot * 1.4;
        tl.fromTo(
          row,
          { autoAlpha: 0, x: -8 },
          { autoAlpha: 1, x: 0, duration: failSlot * 0.5, ease: "power3.out" },
          t0,
        );
        const bad = row.querySelector<HTMLElement>("[data-bad]");
        const good = row.querySelector<HTMLElement>("[data-good]");
        if (bad && good) {
          const flip = t0 + failSlot * 2.2 + span * 0.06;
          // Story starts from the failing state; final state is fixed (SSR).
          tl.set(bad, { autoAlpha: 1 }, start);
          tl.set(good, { autoAlpha: 0 }, start);
          tl.to(bad, { autoAlpha: 0, duration: failSlot * 0.3, ease: "power2.in" }, flip);
          tl.fromTo(
            good,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: failSlot * 0.3, ease: "power2.out" },
            flip + failSlot * 0.3,
          );
        }
      });

      // Checklist ticks.
      const ticks = root.current.querySelectorAll<HTMLElement>("[data-tick]");
      const tickStart = start + span * 0.55;
      const tickSlot = (span * 0.4) / ticks.length;
      ticks.forEach((t, i) => {
        const box = t.querySelector<HTMLElement>("[data-box]");
        const mark = t.querySelector<HTMLElement>("[data-mark]");
        if (box && mark) {
          const t0 = tickStart + i * tickSlot;
          tl.fromTo(box, { autoAlpha: 0.35 }, { autoAlpha: 1, duration: tickSlot * 0.5 }, t0);
          tl.fromTo(
            mark,
            { autoAlpha: 0, scale: 0.4 },
            { autoAlpha: 1, scale: 1, duration: tickSlot * 0.5, ease: "power3.out" },
            t0,
          );
        }
      });
    },
    { scope: root, dependencies: [tl, win[0], win[1]] },
  );

  return (
    <VisualShell beat={beat}>
      <div ref={root} className="w-full max-w-[560px]">
        <div className="glass rounded-md">
          <div className="border-b border-glass-line px-4 py-2.5">
            <span className="label-mono text-mute opacity-70">qa — edge cases</span>
          </div>
          <div className="space-y-1 px-4 py-3" aria-hidden="true">
            {FAILURES.map((f) => (
              <p key={f} data-row className="flex items-center gap-2 font-mono text-[0.8rem] leading-6">
                <span data-bad className="text-err" style={{ opacity: 0, visibility: "hidden" }}>
                  ✕
                </span>
                <span data-good className="text-ok">✓</span>
                <span className="text-[#efece6]/85">{f}</span>
              </p>
            ))}
          </div>
          <div className="border-t border-glass-line px-4 py-3">
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2" aria-label="Test coverage checklist">
              {CHECKS.map((c) => (
                <li key={c} data-tick className="flex items-center gap-2 text-[0.85rem]">
                  <span
                    data-box
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border border-ok/60"
                    aria-hidden="true"
                  >
                    <span data-mark className="text-[0.65rem] leading-none text-ok">
                      ✓
                    </span>
                  </span>
                  <span className="text-[#efece6]/85">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </VisualShell>
  );
}
