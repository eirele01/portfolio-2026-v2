"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { skills, skillTotal, type SkillCategory } from "@/content/skills";

gsap.registerPlugin(ScrollTrigger);

/**
 * THE STACK LEDGER [STACK-01] — "every tool I ship with", shown between the
 * Work shelf and Contact (owner request, 2026-11-01; design delegated to
 * the builder). Eight discipline rows — mono index, name, count on the left,
 * the tools as wrapped chips on the right, a hairline under each row.
 *
 * Story mode = a pinned section with ONE scrubbed timeline:
 *   - row 01 renders settled (the pin starts at "top top", so — same lesson
 *     as the Work shelf header — there is no pre-pin scroll from which a
 *     fromTo could run; an empty landing frame would read as a broken page);
 *   - rows 02–08 cascade in across the first ~90% of the pin (scrub-tied,
 *     slight overlap for a soft assembly);
 *   - the whole wall drifts up credits-style by the MEASURED overflow
 *     (functional tween value + invalidateOnRefresh), which is what makes
 *     all 74 chips readable on phone/tablet viewports without shrinking
 *     anything — desktop, where the ledger nearly fits, just drifts a
 *     little or not at all;
 *   - an end-of-pin HOLD [HOLD-01]: ~35% of the active distance appended
 *     AFTER the roll with nothing animating, so the finished ledger rests
 *     on screen for a beat before Contact slides in (owner: "add an
 *     additional scroll/pause before going to the next section");
 *   - a hairline progress bar in the header (echoes the Work shelf) that
 *     fills across the ACTIVE portion only and rests full during the hold,
 *     so the still beat never reads as a stuck page;
 *   - theme flips dark while the pin is active (like Work/Contact acts).
 * Lite/static modes render the same rows as a plain flowing section
 * (`StackFlow`) — no pin, no motion, `.reveal` fades in lite.
 *
 * Boundary [HOLD-02]: NO `-mt-[100svh]` wrapper — this section follows the
 * Work shelf in NATURAL FLOW. The old butt-joint (pin start == shelf pin
 * end) made the ledger SLIDE OVER the shelf during the shelf's last
 * viewport of pin travel — the owner saw "PHASE 09 overlap PHASE 08
 * before all the products were shown" (2026-11-01). Now the shelf
 * completes its ride and rests [HOLD-02 in WorkSection], releases, and
 * scrolls away with this section following right beneath it; this pin
 * engages 100svh after the shelf's release. The phase pins keep the
 * `-mt` butt-joint — that rule [SCR-11] exists for the VIDEO canvas
 * hand-offs, which this section has none of.
 */

/* --------------------------------------------------------------- row ----- */

function StackRow({ cat, index }: { cat: SkillCategory; index: number }) {
  const n = String(index + 1).padStart(2, "0");
  return (
    <div className="stack-row border-b border-white/10 py-3 sm:grid sm:grid-cols-[minmax(150px,200px)_minmax(0,1fr)] sm:gap-x-8 lg:py-[1.05rem]">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-baseline">
            <span
              className="w-[1.6rem] shrink-0 font-mono text-[0.66rem] tracking-[0.14em] text-amber"
              aria-hidden="true"
            >
              {n}
            </span>
            <h3 className="text-[0.95rem] font-medium leading-tight tracking-[-0.01em] text-white lg:text-[1.02rem]">
              {cat.label}
            </h3>
          </div>
          <span
            className="font-mono text-[0.6rem] tracking-[0.1em] text-white/45"
            aria-label={`${cat.skills.length} tools`}
          >
            {String(cat.skills.length).padStart(2, "0")}
          </span>
        </div>
        <p className="mt-0.5 pl-[2.1rem] font-mono text-[0.55rem] uppercase tracking-[0.12em] text-white/35 lg:mt-1">
          {cat.blurb}
        </p>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5 sm:mt-0 sm:content-start lg:gap-2">
        {cat.skills.map((s) => (
          <span
            key={s}
            className="rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-[3px] font-mono text-[0.58rem] tracking-[0.08em] text-white/60 transition-colors duration-200 hover:border-amber/60 hover:text-white lg:text-[0.6rem]"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------ shared section header --- */

function StackHeader({ withBar, barRef }: { withBar: boolean; barRef?: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div data-stack-head className="relative z-10">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="label-mono text-mute">
            <span aria-hidden="true" className="mr-3 inline-block h-px w-10 -translate-y-1 bg-amber" />
            PHASE 09 / STACK
          </p>
          <h2
            id="stack-h"
            className="mt-2 text-[clamp(1.7rem,3vw,2.6rem)] font-medium leading-tight tracking-[-0.02em]"
          >
            Every tool I ship with.
          </h2>
          <p className="mt-1.5 max-w-[54ch] text-[0.8rem] leading-relaxed text-mute lg:text-[0.84rem]">
            The stack behind the shipped work — chosen per project, not per
            trend, from interfaces and backends to devices, cloud and AI.
          </p>
        </div>
        <p className="label-mono hidden pb-1 text-mute opacity-70 md:block">
          <span className="text-ink">{skillTotal}</span> TOOLS
          <span aria-hidden="true" className="mx-2">
            ·
          </span>
          {String(skills.length).padStart(2, "0")} DISCIPLINES
        </p>
      </div>
      {withBar && (
        <div className="mt-3 h-px w-full bg-white/10" aria-hidden="true">
          <div
            ref={barRef}
            className="h-full w-full origin-left bg-amber"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------- story-mode ledger ----- */

export function StackSection() {
  const wrap = useRef<HTMLDivElement>(null); // natural-flow wrapper (never pinned; no -mt — see [HOLD-02])
  const root = useRef<HTMLElement>(null); // pinned section
  const rowsWindow = useRef<HTMLDivElement>(null); // flex-1 viewport budget
  const rowsInner = useRef<HTMLDivElement>(null); // full ledger height
  const barRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const win = rowsWindow.current;
      const inner = rowsInner.current;
      if (!win || !inner || !root.current) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return; // story mode never resolves to reduced-motion, belt & braces

      const rowEls = Array.from(inner.querySelectorAll<HTMLElement>(".stack-row"));
      const n = rowEls.length;

      // vertical overflow the wall must travel inside the fixed viewport
      const drift = () => Math.max(0, inner.offsetHeight - win.clientHeight);

      // [HOLD-01] the dwell appended after the roll, expressed as a ratio of
      // the ACTIVE pin distance (cascade + credits-roll). Keeping it here (a
      // constant multiplied into `end`) — instead of stretching the tween
      // durations — is what preserves the active scroll pace exactly and
      // makes the extra distance pure stillness.
      const HOLD = 0.35;

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          // one unhurried viewport for the cascade + the wall's own travel,
          // then the hold appended on top (active pace unchanged)
          end: () =>
            `+=${Math.round((window.innerHeight * 1.15 + drift()) * (1 + HOLD))}`,
          pin: true,
          anticipatePin: 1,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onToggle: (self) => {
            if (self.isActive) document.documentElement.dataset.theme = "dark";
          },
          onUpdate: (self) => {
            // the bar belongs to the ACTIVE portion: it reaches 1.0 exactly
            // when the roll completes and rests full through the dwell
            if (barRef.current) {
              barRef.current.style.transform = `scaleX(${Math.min(1, self.progress * (1 + HOLD))})`;
            }
          },
        },
      });

      // rows 02–08 assemble across the first 90% of the ACTIVE timeline
      // (the hold [HOLD-01] is appended after); row 01 is
      // already settled so the landing frame is never an empty wall
      const span = 0.9;
      rowEls.forEach((row, i) => {
        if (i === 0) return;
        const at = ((i - 1) / (n - 1)) * span;
        tl.fromTo(
          row,
          { autoAlpha: 0, y: 26 },
          { autoAlpha: 1, y: 0, duration: (span / (n - 1)) * 1.45 },
          at,
        );
      });

      // the credits-roll: wall drifts up by exactly the measured overflow
      tl.fromTo(inner, { y: 0 }, { y: () => -drift(), duration: 1 }, 0);

      // [HOLD-01] pure dead time after the roll (position 1 = the roll's
      // end): the pin keeps scrolling for HOLD × the active distance while
      // the completed ledger just sits there, then releases into Contact.
      // A no-op tween is the idiomatic scrub "pause" — nothing animates,
      // the frame is already final.
      tl.to({}, { duration: HOLD }, 1);

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        gsap.set([...rowEls, inner], { clearProps: "all" });
      };
    },
    { scope: root },
  );

  return (
    <div ref={wrap}>
      <section
        ref={root}
        id="stack"
        aria-labelledby="stack-h"
        className="relative z-10 flex h-svh flex-col overflow-hidden bg-[#0a0a0b] px-clamp pb-7 pt-10 text-ink lg:pt-14"
      >
        {/* ambient glow — mirrored to the right to differ from the Work shelf */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(58vmax 58vmax at 86% 10%, rgba(255,180,84,0.10) 0%, rgba(10,10,11,0) 58%)",
          }}
        />

        <StackHeader withBar barRef={barRef} />

        {/* the wall: window = what fits, inner = what drifts through it.
            overflow-hidden + a top/bottom mask fade so rising rows dissolve
            at the window edge instead of sliding under the header text
            (credits-roll masking) [STACK-01] */}
        <div
          ref={rowsWindow}
          className="relative z-10 mt-4 min-h-0 flex-1 overflow-hidden [-webkit-mask-image:linear-gradient(to_bottom,transparent_0,black_30px,black_calc(100%_-_16px),transparent)] [mask-image:linear-gradient(to_bottom,transparent_0,black_30px,black_calc(100%_-_16px),transparent)] lg:mt-7"
        >
          <div ref={rowsInner} className="will-change-transform">
            {skills.map((cat, i) => (
              <StackRow key={cat.id} cat={cat} index={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* --------------------------------------------- lite / static rendering --- */

/**
 * Flow-mode twin [ARC-01]: same ledger, plain flowing section, native
 * scroll. No pin, no GSAP — static mode renders it final-state; lite adds
 * `.reveal` fades.
 */
export function StackFlow({ lite }: { lite: boolean }) {
  return (
    <section
      id="stack"
      aria-labelledby="stack-h"
      className="relative overflow-hidden bg-[#0a0a0b] px-clamp py-[14svh] text-ink"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(58vmax 58vmax at 86% 10%, rgba(255,180,84,0.10) 0%, rgba(10,10,11,0) 58%)",
        }}
      />
      <div className={`relative z-10 ${lite ? "reveal" : ""}`}>
        <StackHeader withBar={false} />
        <div className={`mt-8 border-t border-white/10 lg:mt-10 ${lite ? "reveal" : ""}`}>
          {skills.map((cat, i) => (
            <StackRow key={cat.id} cat={cat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
