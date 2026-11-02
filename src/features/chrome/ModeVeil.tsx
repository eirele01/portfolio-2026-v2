"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getMode, setMode, type ExperienceMode } from "@/lib/mode/experience";
import { registerModeSwitchRunner } from "@/lib/mode/switch";
import { lockScroll, scrollToTarget, unlockScroll } from "@/lib/scroll/engine";
import { announce } from "@/lib/a11y/announce";
import { track } from "@/lib/analytics";

/**
 * ModeVeil [NAV-03] — the cinematic cut that plays when the visitor
 * switches STORY ⇆ LITE from the chrome toggle. Two dark panels close over
 * the viewport (a cut, not a reload), the rendering swaps underneath, the
 * new rendering is re-anchored to the narrative landmark the visitor had
 * reached, then the panels retract. Always mounted in Portfolio, OUTSIDE
 * the mode conditionals: Chrome remounts across modes, so the transition
 * must live above that swap.
 *
 * Panels use the fixed dark-act palette (not theme tokens): the html theme
 * legitimately flips during the swap and must not repaint the curtain.
 */

// Narrative landmarks, top of page first. [LITE-01] The seven story
// phase slugs exist ONLY in the story rendering; the flow renderings fold
// them into one #process ledger — so the list keeps the slugs (story-side
// resolution) AND "process" (flow-side), and applyAnchor folds between
// the two spellings when the destination rendering lacks the id.
const LANDMARKS = [
  "myself",
  "process",
  "discovery",
  "design",
  "architecture",
  "development",
  "testing",
  "deployment",
  "maintenance",
  "work",
  "stack",
  "experience",
  "contact",
] as const;

const PHASE_SLUGS = new Set([
  "discovery",
  "design",
  "architecture",
  "development",
  "testing",
  "deployment",
  "maintenance",
]);

/** [LITE-01] Cross-mode fold: any story phase landmark lands on the flow
 *  ledger; the flow ledger lands back on the story's first phase. Ids that
 *  exist in both renderings pass through untouched. */
function foldAnchor(id: string): string {
  if (PHASE_SLUGS.has(id)) return "process";
  if (id === "process") return "discovery";
  return id;
}

/** Absolute page position of a landmark, pin-aware: story pins move their
 *  elements into translated/fixed positions while active, so the element's
 *  rect lies about its page offset — the ScrollTrigger start is the truth. */
function landmarkTop(el: HTMLElement): number {
  const st = ScrollTrigger.getAll().find((t) => t.trigger === el && t.vars?.pin);
  if (st && typeof st.start === "number") return st.start;
  return el.getBoundingClientRect().top + window.scrollY;
}

/** The last landmark the visitor reached (crossed the viewport middle). */
function findAnchor(): string | null {
  const line = window.scrollY + window.innerHeight * 0.5;
  let best: string | null = null;
  let bestTop = -Infinity;
  for (const id of LANDMARKS) {
    const el = document.getElementById(id);
    if (!el) continue;
    const top = landmarkTop(el);
    if (top <= line && top > bestTop) {
      best = id;
      bestTop = top;
    }
  }
  return best;
}

/** Land the (new) rendering on the same landmark — pin start + 2 in story
 *  (mirrors jumpToHash), flow offset in lite/static. [LITE-01] phase slugs
 *  fold to/from #process when the destination rendering lacks the id. */
function applyAnchor(id: string | null): void {
  if (!id) {
    scrollToTarget(0, { immediate: true });
    return;
  }
  const target = document.getElementById(id) ? id : foldAnchor(id);
  const el = document.getElementById(target);
  if (!el) return;
  const st = ScrollTrigger.getAll().find((t) => t.trigger === el && t.vars?.pin);
  if (st && typeof st.start === "number") scrollToTarget(st.start + 2, { immediate: true });
  else scrollToTarget(el, { immediate: true });
}

export function ModeVeil() {
  const rootRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const botRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const busy = useRef(false);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    gsap.set(root, { visibility: "hidden" });

    const run = (to: ExperienceMode): boolean => {
      if (busy.current || getMode() === to) return false;
      busy.current = true;

      track("mode_change", { mode: to, from: "toggle" });
      announce(
        to === "story"
          ? "Story experience — the scrubbed video version."
          : "Lite experience — the flowing poster version.",
      );

      // Reduced motion: no curtain, swap in place (lite reveals are
      // motion-reduce gated too, so static visitors see nothing jump).
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setMode(to);
        busy.current = false;
        return true;
      }

      const anchor = findAnchor();
      lockScroll(); // lenis, if up (story); native input is blocked below
      document.documentElement.style.overflow = "hidden";
      if (wordRef.current) wordRef.current.textContent = to === "story" ? "STORY" : "LITE";

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(root, { visibility: "hidden", pointerEvents: "none" });
          document.documentElement.style.overflow = "";
          unlockScroll();
          busy.current = false;
        },
      });
      tlRef.current = tl;

      tl.set(root, { visibility: "visible", pointerEvents: "auto" })
        .fromTo(
          topRef.current,
          { yPercent: -102 },
          { yPercent: 0, duration: 0.42, ease: "power3.inOut" },
          0,
        )
        .fromTo(
          botRef.current,
          { yPercent: 102 },
          { yPercent: 0, duration: 0.42, ease: "power3.inOut" },
          0,
        )
        .fromTo(
          slideRef.current,
          { yPercent: 115 },
          { yPercent: 0, duration: 0.38, ease: "power3.out" },
          0.16,
        )
        // Fully covered: swap the rendering, then re-anchor the scroll —
        // as soon as the new tree commits (rAF ×2 lands after React's
        // effects: story pins exist, flow twins are measurable), and twice
        // more while the story pin spacers settle their starts (the NAV-01
        // re-jump idea, bounded). All under cover.
        .add(() => {
          setMode(to);
          requestAnimationFrame(() => requestAnimationFrame(() => applyAnchor(anchor)));
          window.setTimeout(() => applyAnchor(anchor), 400);
          window.setTimeout(() => applyAnchor(anchor), 800);
        }, 0.56)
        .to(slideRef.current, { yPercent: -115, duration: 0.3, ease: "power3.in" }, 1.02)
        .to(topRef.current, { yPercent: -102, duration: 0.46, ease: "power3.inOut" }, 1.14)
        .to(botRef.current, { yPercent: 102, duration: 0.46, ease: "power3.inOut" }, 1.14);
      return true;
    };

    registerModeSwitchRunner(run);
    return () => {
      registerModeSwitchRunner(null);
      tlRef.current?.kill();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="no-print pointer-events-none fixed inset-0 z-[45]"
    >
      <div
        ref={topRef}
        className="absolute inset-x-0 top-0 h-[50.5%] bg-[#0a0a0b] will-change-transform"
      />
      <div
        ref={botRef}
        className="absolute inset-x-0 bottom-0 h-[50.5%] bg-[#0a0a0b] will-change-transform"
      />
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div ref={slideRef} className="flex flex-col items-center gap-3 will-change-transform">
          <span className="block h-px w-8 bg-amber" aria-hidden="true" />
          <p className="label-mono text-[0.6rem] text-[#efece6]/55">Experience mode</p>
          <span
            ref={wordRef}
            className="text-[clamp(2.8rem,11vw,6.5rem)] font-medium leading-none tracking-[-0.02em] text-[#efece6]"
          />
        </div>
      </div>
    </div>
  );
}
