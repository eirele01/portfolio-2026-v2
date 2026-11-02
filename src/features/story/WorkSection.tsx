"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { work, type WorkItem } from "@/content/work";
import { track } from "@/lib/analytics";

gsap.registerPlugin(ScrollTrigger);

/**
 * THE WORK SHELF [WORK-01] — "products I launched from zero", shown between
 * story phase 7 and Contact (owner request, 2026-11-01).
 *
 * Story mode = a pinned horizontal gallery: vertical scroll drives the track
 * left (the owner's "scroll down → moves left", tuned better):
 *   - cards start AND end centred (leading/trailing padding = half viewport),
 *     so the shelf enters on card 01 and exits on card 09 — no dead edges;
 *   - per-card emphasis driven imperatively from one onUpdate (distance from
 *     viewport centre → scale / opacity / y / counter-parallax on the
 *     screenshot) — no per-card ScrollTriggers, no React state in the scroll
 *     path, no layout thrash (batched reads then batched writes);
 *   - a rolling mono counter (01 / 09) + hairline progress bar in the header;
 *   - an end-of-pin HOLD [HOLD-02]: 12% of the active travel appended
 *     AFTER the ride with nothing animating — card 09 rests centred
 *     (counter 09/09, bar full) for a clear beat before the section
 *     departs (owner: "i want to add a pause or additional scroll to
 *     stay in that section before transitioning to next section"). The
 *     counter/bar are driven by the ACTIVE portion only (progress
 *     clamped via ×(1+HOLD)) so the still beat never reads as stuck;
 *   - the pin length derives from the measured track width (functional
 *     `end` + function-based x), so it survives resizes/refreshes.
 * Lite/static modes render the same cards as a plain responsive grid
 * (`WorkFlow`) — no pin, no motion.
 *
 * Boundary rule [SCR-11]: the wrapper carries `-mt-[100svh]` so this pin
 * starts exactly where phase 7's pin-spacer ends (no frozen-viewport gap).
 * The margin lives on the wrapper, never on the pinned element.
 */

/* ------------------------------------------------------------- card ----- */

function WorkCard({ item, index, flow = false }: { item: WorkItem; index: number; flow?: boolean }) {
  const n = String(index + 1).padStart(2, "0");
  return (
    <article
      className={
        flow
          ? "work-card group relative flex flex-col border border-white/10 bg-white/[0.045] p-3 lg:p-4"
          : "work-card group relative flex w-[78vw] shrink-0 snap-center flex-col border border-white/10 bg-white/[0.045] p-3 sm:w-[420px] lg:w-[540px] lg:p-4"
      }
    >
      {/* fake browser chrome — screenshots read as live sites */}
      <div className="mb-3 flex items-center gap-2" aria-hidden="true">
        <span className="inline-block h-[7px] w-[7px] rounded-full bg-white/20" />
        <span className="inline-block h-[7px] w-[7px] rounded-full bg-white/20" />
        <span className="inline-block h-[7px] w-[7px] rounded-full bg-white/20" />
        <span className="ml-1 flex-1 truncate rounded-full border border-white/10 bg-black/30 px-3 py-1 font-mono text-[0.6rem] tracking-[0.08em] text-white/45">
          {item.url.replace(/^https?:\/\/(www\.)?/, "")}
        </span>
      </div>

      <div className="work-card-media relative overflow-hidden rounded-sm">
        <img
          src={item.image}
          alt={`${item.name} — website screenshot`}
          width={1280}
          height={800}
          loading="lazy"
          decoding="async"
          className="block aspect-[2/1] w-full scale-[1.08] object-cover object-top sm:aspect-[16/9]"
        />
        {/* live badge */}
        <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 font-mono text-[0.58rem] tracking-[0.14em] text-white/85 backdrop-blur-sm">
          <span className="inline-block h-[6px] w-[6px] rounded-full bg-emerald-400" />
          LIVE
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-3">
        <span className="font-mono text-[0.7rem] tracking-[0.14em] text-amber" aria-hidden="true">
          {n}
        </span>
        <h3 className="text-[1.22rem] font-medium leading-tight tracking-[-0.01em] text-white lg:text-[1.35rem]">
          {item.name}
        </h3>
        {item.metric && (
          <span className="ml-auto shrink-0 font-mono text-[0.62rem] tracking-[0.1em] text-white/60">
            {item.metric.value}
            {item.metric.suffix} {item.metric.label.toUpperCase()}
          </span>
        )}
      </div>

      <p className="mt-1.5 text-[0.78rem] leading-relaxed text-white/65 lg:text-[0.8rem]">{item.description}</p>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {item.stack.map((s) => (
          <span
            key={s}
            className="rounded-full border border-white/12 bg-white/[0.04] px-2 py-[3px] font-mono text-[0.58rem] tracking-[0.08em] text-white/55"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
        <span className="font-mono text-[0.6rem] tracking-[0.16em] text-white/40">
          {item.tag.toUpperCase()}
        </span>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("work_card_click", { work: item.id })}
          className="label-mono inline-flex min-h-[36px] items-center gap-1 text-white underline decoration-white/25 underline-offset-4 transition-colors hover:text-amber hover:decoration-amber"
          aria-label={`Visit ${item.name} (opens in a new tab)`}
        >
          Visit site ↗
        </a>
      </div>
    </article>
  );
}

/* -------------------------------------------------- story-mode shelf ----- */

export function WorkSection() {
  const wrap = useRef<HTMLDivElement>(null); // -mt wrapper (never pinned)
  const root = useRef<HTMLElement>(null); // pinned section
  const trackRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const track = trackRef.current;
      if (!track || !root.current) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return; // story mode never resolves to reduced-motion, belt & braces

      const cards = Array.from(track.querySelectorAll<HTMLElement>(".work-card"));
      const n = cards.length;

      // emphasize cards by distance from the viewport centre (imperative;
      // reads batched before writes so this is one layout per frame at most)
      const paint = () => {
        const mid = window.innerWidth / 2;
        const rects = cards.map((c) => c.getBoundingClientRect());
        cards.forEach((card, i) => {
          const r = rects[i];
          const d = Math.max(-1, Math.min(1, (r.left + r.width / 2 - mid) / mid));
          const ad = Math.abs(d);
          gsap.set(card, {
            scale: 1 - 0.055 * Math.pow(ad, 1.15),
            autoAlpha: 1 - 0.5 * Math.pow(ad, 1.4),
            y: 16 * ad,
          });
          const img = card.querySelector<HTMLElement>(".work-card-media img");
          if (img) img.style.translate = `${(-d * 16).toFixed(2)}px 0`;
        });
      };

      const amount = () => Math.max(1, track.scrollWidth - window.innerWidth);

      // [HOLD-02] the dwell appended after the travel, as a ratio of the
      // ACTIVE distance (same pattern as the stack ledger's [HOLD-01]):
      // multiplied into `end` instead of stretching the tween, so the ride
      // pace is untouched and the extra distance is pure stillness.
      const HOLD = 0.12;

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          // ~1.05px of scroll per px of travel — unhurried, readable —
          // then the hold [HOLD-02] appended on top (ride pace unchanged)
          end: () => `+=${Math.round(amount() * 1.05 * (1 + HOLD))}`,
          pin: true,
          anticipatePin: 1,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onToggle: (self) => {
            if (self.isActive) document.documentElement.dataset.theme = "dark";
          },
          onUpdate: (self) => {
            // [HOLD-02] counter + bar belong to the ACTIVE portion: they
            // hit 09/09 and full exactly when the travel completes, then
            // rest through the dwell
            const p = Math.min(1, self.progress * (1 + HOLD));
            if (counterRef.current) {
              counterRef.current.textContent = String(
                Math.min(n, Math.max(1, Math.round(p * (n - 1)) + 1)),
              ).padStart(2, "0");
            }
            if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
            paint();
          },
        },
      });

      // The shelf travel itself. The header stays STATIC (always visible):
      // the pin starts at "top top", so there is no pre-pin scroll from which
      // an entrance could run — a fromTo here would just hold the header at
      // autoAlpha 0 on the deep-link landing frame.
      tl.fromTo(
        track,
        { x: 0 },
        { x: () => -amount(), duration: 1 },
        0,
      );

      // [HOLD-02] pure dead time after the travel (position 1 = the ride's
      // end): the pin keeps scrolling for HOLD × the active distance while
      // card 09 just rests centred, then the section departs. A no-op tween
      // is the idiomatic scrub "pause" — nothing animates, the frame is
      // already final.
      tl.to({}, { duration: HOLD }, 1);

      paint();

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        gsap.set(cards, { clearProps: "all" });
        cards.forEach((c) => {
          const img = c.querySelector<HTMLElement>(".work-card-media img");
          if (img) img.style.translate = "";
        });
      };
    },
    { scope: root },
  );

  return (
    <div ref={wrap} className="-mt-[100svh]">
      <section
        ref={root}
        id="work"
        aria-labelledby="work-h"
        className="relative z-10 flex h-svh flex-col justify-center overflow-hidden bg-[#0a0a0b] px-clamp pt-10 text-ink lg:pt-14"
      >
        {/* ambient glow, echoes Contact */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(58vmax 58vmax at 14% 8%, rgba(255,180,84,0.10) 0%, rgba(10,10,11,0) 58%)",
          }}
        />

        {/* header */}
        <div data-work-head className="relative z-10 px-clamp">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div>
              <p className="label-mono text-mute">
                <span aria-hidden="true" className="mr-3 inline-block h-px w-10 -translate-y-1 bg-amber" />
                PHASE 08 / SHIPPED
              </p>
              <h2 id="work-h" className="mt-2 text-[clamp(1.7rem,3vw,2.6rem)] font-medium leading-tight tracking-[-0.02em]">
                Launched from zero.
              </h2>
              <p className="mt-1.5 max-w-[54ch] text-[0.8rem] leading-relaxed text-mute lg:text-[0.84rem]">
                Nine products taken from a first conversation to a live URL —
                the same process you just watched, shipped for real clients.
              </p>
            </div>
            <div className="flex items-baseline gap-4 pb-1">
              <p className="label-mono hidden text-mute opacity-70 md:block">
                SCROLL ↓ THE SHELF MOVES LEFT
              </p>
              <p className="label-mono text-mute" aria-live="off">
                <span ref={counterRef} className="text-ink">01</span>
                <span aria-hidden="true"> / {String(work.length).padStart(2, "0")}</span>
                <span className="sr-only"> of {work.length} products</span>
              </p>
            </div>
          </div>
          <div className="mt-3 h-px w-full bg-white/10" aria-hidden="true">
            <div ref={barRef} className="h-full w-full origin-left bg-amber" style={{ transform: "scaleX(0)" }} />
          </div>
        </div>

        {/* horizontal track — leading/trailing half-viewport padding so the
            shelf starts and ends on a centred card */}
        <div className="relative z-10 mt-4 overflow-hidden lg:mt-7">
          <div
            ref={trackRef}
            className="flex w-max snap-x snap-mandatory gap-5 px-[11vw] will-change-transform lg:gap-9 lg:px-[max(calc((100vw_-_540px)/2),_3rem)]"
          >
            {work.map((item, i) => (
              <WorkCard key={item.id} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* --------------------------------------------- lite / static rendering --- */

/**
 * Flow-mode twin [ARC-01]: same cards, plain responsive grid, native scroll.
 * No pin, no GSAP — static mode renders it final-state; lite adds `.reveal`.
 */
export function WorkFlow({ lite }: { lite: boolean }) {
  return (
    <section
      id="work"
      aria-labelledby="work-h"
      className="relative overflow-hidden bg-[#0a0a0b] px-clamp py-[14svh] text-ink"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(58vmax 58vmax at 14% 8%, rgba(255,180,84,0.10) 0%, rgba(10,10,11,0) 58%)",
        }}
      />
      <div className={`relative z-10 ${lite ? "reveal" : ""}`}>
        <p className="label-mono text-mute">
          <span aria-hidden="true" className="mr-3 inline-block h-px w-10 -translate-y-1 bg-amber" />
          PHASE 08 / SHIPPED
        </p>
        <h2 id="work-h" className="h2 mt-3 max-w-[14ch]">
          Launched from zero.
        </h2>
        <p className="body-copy mt-3 max-w-[52ch] text-[0.92rem] text-mute">
          Nine products taken from a first conversation to a live URL — the
          same process you just watched, shipped for real clients.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {work.map((item, i) => (
            <div key={item.id} className={lite ? "reveal" : undefined}>
              <WorkCard item={item} index={i} flow />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
