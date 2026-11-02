"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { experience, experienceYears, type Posting } from "@/content/experience";

gsap.registerPlugin(ScrollTrigger);

/**
 * THE LOGBOOK [LOG-01] — the career history, shown between the Stack
 * ledger and Contact (owner request, 2026-11-01; design delegated to the
 * builder). Four postings, oldest-first, rendered as a voyage: a route
 * line runs down the entries, each posting is a waypoint, and the header
 * carries a rolling year readout (2014 → 2024) driven by the same
 * progress as the reveals. The headline "Different decks, same job."
 * pays off the hero's own line ("Operations manager. Seafarer. Engineer.
 * Different decks, same job…") — the logbook is the proof.
 *
 * Story mode = a pinned section with ONE scrubbed timeline (house
 * pattern, shared with the Work shelf and the Stack ledger):
 *   - entry 01 renders settled (the pin starts at "top top" — same lesson
 *     as the shelf header / stack row 01: no pre-pin scroll from which a
 *     fromTo could run, so the landing frame is never an empty wall);
 *   - the route line draws from waypoint 01 to the section's end across
 *     ~85% of the pin, timed so its tip arrives at each waypoint as that
 *     posting reveals (tip fraction ≈ reveal position — close enough at
 *     scrub 0.6 that they read as one event);
 *   - entries 02–04 cascade in across the first ~62% (slight overlap),
 *     each waypoint's dot lighting (scale + ring border) exactly with its
 *     entry;
 *   - the whole wall drifts up credits-style by the MEASURED overflow
 *     (functional tween value + invalidateOnRefresh) so all four postings
 *     stay readable on phone/tablet viewports without shrinking anything;
 *   - an end-of-pin HOLD: 30% of the active distance appended AFTER the
 *     cascade as pure stillness (no-op tween + ratio in the functional
 *     `end`) — the finished route rests before Contact slides in, same
 *     rhythm as the shelf's [HOLD-02] and the ledger's [HOLD-01];
 *   - the year readout + progress bar belong to the ACTIVE portion only
 *     (progress clamped via ×(1+HOLD)): the readout rests on 2024 /
 *     ENTRY 04 and the bar rests full through the beat;
 *   - theme flips dark while the pin is active (like Work/Stack acts).
 * Lite/static modes render the same entries as a plain flowing section
 * (`ExperienceFlow`) — line fully drawn, every waypoint lit, no pin, no
 * motion; lite adds `.reveal` fades.
 *
 * Boundary: NO `-mt-[100svh]` wrapper — this section follows the Stack
 * ledger in NATURAL FLOW, exactly the lesson of [HOLD-02] (a butt-jointed
 * pin start slides the next section over the previous one's last viewport
 * of travel / hold). The ledger completes its ride and rest, releases,
 * and scrolls away with the logbook following right beneath it. Contact
 * below is un-pinned and needs no boundary either.
 */

/* ------------------------------------------------------------ entry ----- */

function LogEntry({ posting, index, flow = false }: { posting: Posting; index: number; flow?: boolean }) {
  const n = String(index + 1).padStart(2, "0");
  return (
    <li
      className={`log-entry relative grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4 pb-4 lg:pb-5 ${
        index > 0 ? "pt-4 lg:pt-5" : ""
      } ${index < experience.length - 1 ? "border-b border-white/10" : ""}`}
    >
      {/* waypoint column — the route line runs behind these dots */}
      <div className="relative" aria-hidden="true">
        <span className="log-node absolute left-1/2 top-[11px] flex h-[9px] w-[9px] -translate-x-1/2 items-center justify-center rounded-full border border-white/30 bg-[#0a0a0b]">
          {/* the lit core: scaled to 0 in story mode until its posting lands
              (inline style, not a Tailwind scale-* class — GSAP tweens the
              transform, and the two would compose to a permanent 0);
              always lit in flow and for the settled entry 01 */}
          <span
            className="log-node-dot block h-[5px] w-[5px] rounded-full bg-amber"
            style={flow || index === 0 ? undefined : { transform: "scale(0)" }}
          />
        </span>
      </div>

      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="font-mono text-[0.66rem] tracking-[0.14em]">
            <span className="text-amber" aria-hidden="true">
              {n}
            </span>
            <span className="ml-3 text-white/85">{posting.period}</span>
          </p>
          <span className="font-mono text-[0.55rem] uppercase tracking-[0.16em] text-white/35">{posting.tag}</span>
        </div>

        <h3 className="mt-1.5 text-[1.02rem] font-medium leading-snug tracking-[-0.01em] text-white lg:text-[1.12rem]">
          {posting.role}
        </h3>
        <p className="mt-0.5 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-white/45">{posting.company}</p>

        <ul className="mt-2.5 space-y-1.5">
          {posting.bullets.map((b) => (
            <li key={b} className="flex gap-2.5 text-[0.8rem] leading-relaxed text-white/65 lg:text-[0.84rem]">
              <span aria-hidden="true" className="mt-[0.5em] h-px w-3 shrink-0 bg-white/30" />
              <span className="min-w-0">{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

/* ------------------------------------------------ shared section header --- */

/**
 * `readout` (story): the rolling year + entry counter, driven imperatively
 * from onUpdate. `summary` (flow): a static mono count in the same slot.
 * The readout is aria-hidden — every fact it shows is in the entries.
 */
function LogHeader({
  withBar,
  barRef,
  yearRef,
  entryRef,
}: {
  withBar: boolean;
  barRef?: React.RefObject<HTMLDivElement | null>;
  yearRef?: React.RefObject<HTMLParagraphElement | null>;
  entryRef?: React.RefObject<HTMLSpanElement | null>;
}) {
  return (
    <div data-log-head className="relative z-10">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="label-mono text-mute">
            <span aria-hidden="true" className="mr-3 inline-block h-px w-10 -translate-y-1 bg-amber" />
            PHASE 10 / LOGBOOK
          </p>
          <h2
            id="experience-h"
            className="mt-2 text-[clamp(1.7rem,3vw,2.6rem)] font-medium leading-tight tracking-[-0.02em]"
          >
            Different decks, same job.
          </h2>
          <p className="mt-1.5 max-w-[54ch] text-[0.8rem] leading-relaxed text-mute lg:text-[0.84rem]">
            The logbook behind that line — {experienceYears} years,{" "}
            {experience.length} postings, from ops floors and ship decks to
            production code.
          </p>
        </div>

        {withBar ? (
          <div className="flex items-baseline gap-4 pb-1 text-right" aria-hidden="true">
            <div>
              <p
                ref={yearRef}
                className="font-mono text-[clamp(1.5rem,3vw,2.3rem)] leading-none tracking-[0.02em] text-ink"
              >
                {experience[0].startYear}
              </p>
              <p className="label-mono mt-1.5 text-mute opacity-70">
                ENTRY <span ref={entryRef}>01</span>
                <span aria-hidden="true"> / {String(experience.length).padStart(2, "0")}</span>
              </p>
            </div>
          </div>
        ) : (
          <p className="label-mono hidden pb-1 text-mute opacity-70 md:block">
            <span className="text-ink">{experienceYears}</span> YEARS
            <span aria-hidden="true" className="mx-2">
              ·
            </span>
            {String(experience.length).padStart(2, "0")} POSTINGS
          </p>
        )}
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

/* -------------------------------------------------- story-mode logbook --- */

export function ExperienceSection() {
  const root = useRef<HTMLElement>(null); // pinned section
  const windowRef = useRef<HTMLDivElement>(null); // flex-1 viewport budget
  const innerRef = useRef<HTMLDivElement>(null); // full logbook height
  const lineRef = useRef<HTMLDivElement>(null); // the route line
  const yearRef = useRef<HTMLParagraphElement>(null);
  const entryRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const win = windowRef.current;
      const inner = innerRef.current;
      if (!win || !inner || !root.current) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return; // story mode never resolves to reduced-motion, belt & braces

      const entries = Array.from(inner.querySelectorAll<HTMLElement>(".log-entry"));
      const dots = Array.from(inner.querySelectorAll<HTMLElement>(".log-node-dot"));
      const rings = Array.from(inner.querySelectorAll<HTMLElement>(".log-node"));
      const n = entries.length;

      // vertical overflow the wall must travel inside the fixed viewport
      const drift = () => Math.max(0, inner.offsetHeight - win.clientHeight);

      // the dwell appended after the cascade, as a ratio of the ACTIVE pin
      // distance — multiplied into `end` (not stretched into the tweens) so
      // the reading pace is untouched and the extra distance is pure
      // stillness (same pattern as [HOLD-01]/[HOLD-02]).
      const HOLD = 0.3;

      // reveal positions: entry 01 settled; 02–04 spread across the first
      // 62% of the ACTIVE timeline with a slight overlap; shared with
      // onUpdate so the year readout flips exactly when an entry lands.
      const span = 0.62;
      const step = span / (n - 1);
      const at: number[] = [0];
      for (let i = 1; i < n; i++) at.push(i * step);

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          // one unhurried viewport for the cascade + the wall's own travel,
          // then the hold appended on top (reading pace unchanged)
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
            // readout + bar belong to the ACTIVE portion: they reach
            // 2024 / ENTRY 04 / full exactly when the cascade completes
            // and rest through the dwell
            const p = Math.min(1, self.progress * (1 + HOLD));
            let idx = 0;
            for (let i = 0; i < n; i++) if (p >= at[i]) idx = i;
            if (yearRef.current) yearRef.current.textContent = String(experience[idx].startYear);
            if (entryRef.current) entryRef.current.textContent = String(idx + 1).padStart(2, "0");
            if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
          },
        },
      });

      // the route draws from waypoint 01 downward; 0.85 of the timeline
      // puts the tip at each waypoint roughly when its posting lands
      // (waypoints sit at ~28% / ~50% / ~74% of the line's length)
      tl.fromTo(lineRef.current, { scaleY: 0 }, { scaleY: 1, duration: 0.85 }, 0);

      // entries 02–04 + their waypoints light exactly together
      entries.forEach((entry, i) => {
        if (i === 0) return; // settled — the landing frame is never empty
        tl.fromTo(
          entry,
          { autoAlpha: 0, y: 26 },
          { autoAlpha: 1, y: 0, duration: step * 1.45 },
          at[i],
        );
        tl.fromTo(dots[i], { scale: 0 }, { scale: 1, duration: 0.12 }, at[i]);
        tl.fromTo(
          rings[i],
          { borderColor: "rgba(239,236,230,0.3)" },
          { borderColor: "#ffb454", duration: 0.12 },
          at[i],
        );
      });

      // the credits-roll: wall drifts up by exactly the measured overflow
      tl.fromTo(inner, { y: 0 }, { y: () => -drift(), duration: 1 }, 0);

      // pure dead time after the cascade (position 1 = the cascade's end):
      // the pin keeps scrolling for HOLD × the active distance while the
      // finished route just sits there, then releases into Contact. A
      // no-op tween is the idiomatic scrub "pause".
      tl.to({}, { duration: HOLD }, 1);

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        gsap.set(
          [...entries, ...dots, ...rings, inner, lineRef.current].filter(Boolean),
          { clearProps: "all" },
        );
      };
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="experience"
      aria-labelledby="experience-h"
      className="relative z-10 flex h-svh flex-col overflow-hidden bg-[#0a0a0b] px-clamp pb-7 pt-10 text-ink lg:pt-14"
    >
      {/* ambient glow — bottom-right, mirrored against Stack's top-right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(58vmax 58vmax at 82% 90%, rgba(255,180,84,0.10) 0%, rgba(10,10,11,0) 58%)",
        }}
      />

      <LogHeader withBar barRef={barRef} yearRef={yearRef} entryRef={entryRef} />

      {/* the logbook: window = what fits, inner = what drifts through it.
          overflow-hidden + a top/bottom mask fade so rising entries
          dissolve at the window edge instead of sliding under the header
          text (same credits-roll masking as the stack ledger) */}
      <div
        ref={windowRef}
        className="relative z-10 mt-4 min-h-0 flex-1 overflow-hidden [-webkit-mask-image:linear-gradient(to_bottom,transparent_0,black_30px,black_calc(100%_-_16px),transparent)] [mask-image:linear-gradient(to_bottom,transparent_0,black_30px,black_calc(100%_-_16px),transparent)] lg:mt-7"
      >
        <div ref={innerRef} className="relative will-change-transform">
          {/* [LOG-02] clearance above entry 01 (owner: the first posting
              was half-dissolved by the top mask fade at the pin start and
              slid under it as soon as the wall began to drift). Inside the
              drifting wall — the measured overflow grows by the same
              amount, so the credits-roll maths stay exact and entry 01
              lands fully below the 30px fade with readable travel before
              it reaches the edge. */}
          <div aria-hidden="true" className="h-28 lg:h-32" />
          {/* the route line: starts at waypoint 01's centre (spacer + the
              15px stub to the dot: 112px mobile / 128px desktop), runs
              past the last waypoint — the tail is the "still under way"
              beat — and draws origin-top */}
          <div
            ref={lineRef}
            aria-hidden="true"
            className="absolute bottom-2 left-[15.5px] top-[127px] w-px origin-top bg-white/15 lg:top-[143px]"
            style={{ transform: "scaleY(0)" }}
          />
          <ol className="relative">
            {experience.map((posting, i) => (
              <LogEntry key={posting.id} posting={posting} index={i} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------- lite / static rendering --- */

/**
 * Flow-mode twin [ARC-01]: same logbook, plain flowing section, native
 * scroll — route line fully drawn, every waypoint lit. No pin, no GSAP;
 * static mode renders it final-state, lite adds `.reveal` fades.
 */
export function ExperienceFlow({ lite }: { lite: boolean }) {
  return (
    <section
      id="experience"
      aria-labelledby="experience-h"
      className="relative overflow-hidden bg-[#0a0a0b] px-clamp py-[14svh] text-ink"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(58vmax 58vmax at 82% 90%, rgba(255,180,84,0.10) 0%, rgba(10,10,11,0) 58%)",
        }}
      />
      <div className={`relative z-10 ${lite ? "reveal" : ""}`}>
        <LogHeader withBar={false} />
        {/* the border lives on the wrapper (not the <ol>); the route
            line's top offset (15px stub to the dot) matches the story
            pin's — the pin adds the [LOG-02] clearance spacer on top, flow
            relies on the wrapper's own margin */}
        <div className="relative mt-8 border-t border-white/10 lg:mt-10">
          {/* flow twin: the route drawn in full, tail included */}
          <div
            aria-hidden="true"
            className="absolute bottom-2 left-[15.5px] top-[15px] w-px bg-white/15"
          />
          <ol className="relative">
            {experience.map((posting, i) => (
              <LogEntry key={posting.id} posting={posting} index={i} flow />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
