"use client";

import { phases } from "@/content/phases";

/**
 * ProcessLedger [LITE-01] — the flow twin of the story's seven phase pins.
 * Owner decision (round 28): story mode keeps the full beat script; lite
 * and static fold the seven sections into ONE compact ledger — the phase
 * name + its one-line lede per row, numbered and hairline-divided in the
 * same language as the Stack ledger and the logbook. No posters, no GSAP,
 * no beat script here: the full walk-through (dialogue, chips, diagrams,
 * counters) plays only in story mode, and the intro line says so.
 *
 * The seven deep-link slugs (#discovery … #maintenance) are story-only —
 * flow anchors point at #process (FlowMenu, ModeVeil fold, chatbot
 * knowledge all updated in the same round).
 */
export function ProcessLedger({ lite }: { lite: boolean }) {
  return (
    <section
      id="process"
      aria-labelledby="process-h"
      className="relative overflow-hidden bg-[#0a0a0b] px-clamp py-[14svh] text-ink"
    >
      {/* amber corner glow — the Stack/Log flow twins' backdrop language */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(58vmax 58vmax at 84% 6%, rgba(255,180,84,0.10) 0%, rgba(10,10,11,0) 58%)",
        }}
      />
      <div className={`relative z-10 ${lite ? "reveal" : ""}`}>
        <p className="label-mono text-mute">
          <span aria-hidden="true" className="mr-3 inline-block h-px w-10 -translate-y-1 bg-amber" />
          PHASES 01–07 / HOW I WORK
        </p>
        <h2
          id="process-h"
          className="mt-2 text-[clamp(1.7rem,3vw,2.6rem)] font-medium leading-tight tracking-[-0.02em]"
        >
          One process, end to end.
        </h2>
        <p className="mt-1.5 max-w-[54ch] text-[0.8rem] leading-relaxed text-mute lg:text-[0.84rem]">
          From the first conversation to the live deployment — the same seven
          phases carry every build. The full walk-through plays in the story.
        </p>
        <div className={`mt-8 border-t border-white/10 lg:mt-10 ${lite ? "reveal" : ""}`}>
          <ol>
            {phases.map((p, i) => (
              <li
                key={p.id}
                className="border-b border-white/10 py-3.5 sm:grid sm:grid-cols-[minmax(9.5rem,13rem)_minmax(0,1fr)] sm:gap-x-8 lg:py-[1.05rem]"
              >
                <div className="flex items-baseline">
                  <span
                    aria-hidden="true"
                    className="w-[1.6rem] shrink-0 font-mono text-[0.66rem] tracking-[0.14em] text-amber"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-[0.95rem] font-medium leading-tight tracking-[-0.01em] text-white lg:text-[1.02rem]">
                    {p.name}
                  </h3>
                </div>
                <p className="mt-1.5 text-[0.86rem] leading-relaxed text-mute sm:mt-0 lg:text-[0.9rem]">
                  {p.lede}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
