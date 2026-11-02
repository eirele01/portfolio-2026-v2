"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { PhaseConfig } from "@/content/schema";
import { setActivePhase, registerPhaseEl } from "@/lib/scroll/activePhase";
import { useIsMobile } from "@/lib/scroll/useIsMobile";
import { getSegment, setActiveSegment, wireSegmentTweens, FIRST_SEGMENT } from "./canvasStore";
import { useFlow } from "./flowContext";

gsap.registerPlugin(ScrollTrigger);

/**
 * One master timeline of normalized duration 1 per pinned section [SCR-02].
 * Scroll position maps to timeline progress; all beats, widgets and (later)
 * the video playhead register tweens on it at fractions of 0..1.
 * The timeline is created lazily so children can register before this
 * component's effect runs.
 */
const TimelineContext = createContext<gsap.core.Timeline | null>(null);

export const useStageTL = (): gsap.core.Timeline | null => useContext(TimelineContext);

/** Shared with TransitionStage so its ScrubVideo registers the same
 * normalized playhead driver on the transition timeline [SCR-06]. */
export const StageTLProvider = TimelineContext.Provider;

interface BeatRegistration {
  el: RefObject<HTMLElement | null>;
  at: number;
  until?: number;
  /** Distance of the entrance travel in px (≤ 24 per motion language). */
  travel?: number;
}

/**
 * Registers entrance/exit tweens for a beat on the stage timeline.
 * autoAlpha keeps hidden beats visibility:hidden → not focusable [A11Y-05].
 * Every beat tweens back out so reverse scrolling is clean.
 */
export function useBeat({ el, at, until, travel = 24 }: BeatRegistration): void {
  const tl = useStageTL();
  useGSAP(
    () => {
      if (!tl || !el.current) return;
      const end = Math.min(until ?? 0.99, 0.99);
      const outAt = Math.min(Math.max(end - 0.055, at + 0.07), 0.985);
      tl.fromTo(
        el.current,
        { autoAlpha: 0, y: travel },
        { autoAlpha: 1, y: 0, duration: 0.075, ease: "power3.out" },
        at,
      );
      if (end < 0.99) {
        tl.to(
          el.current,
          { autoAlpha: 0, y: -16, duration: 0.05, ease: "power2.in" },
          outAt,
        );
      }
    },
    { scope: el, dependencies: [tl, at, until] },
  );
}

export function PhaseStage({
  config,
  segmentKey,
  fadeOutEnd = false,
  children,
  className = "",
}: {
  config: PhaseConfig;
  /** Canvas segment this stage drives (e.g. "p3") [SCR-07]. */
  segmentKey: string;
  /** Last stage of the story dissolves out before the contact sheet. */
  fadeOutEnd?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const root = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();
  // The timeline is built ONCE and never cleared: children register their
  // beats into it on mount; re-running this effect (viewport class change)
  // only re-creates the ScrollTrigger around the same timeline.
  const [tl] = useState(() => {
    const t = gsap.timeline({ paused: true, defaults: { ease: "none" } });
    t.set({}, {}, 1); // pin total duration to exactly 1
    return t;
  });

  useGSAP(
    () => {
      // This stage owns a canvas layer [SCR-07] and dissolves into the NEXT
      // segment across its last stretch, so the hand-off happens mid-motion
      // instead of at a frozen frame [SCR-08]. The footage NEVER scrolls —
      // only text does.
      const seg = getSegment(segmentKey);
      seg.playhead.p = 0;
      seg.opacity.o = 0;
      const segmentTweens = wireSegmentTweens(tl, segmentKey);
      const fadeOutTween = fadeOutEnd
        ? tl.to(seg.opacity, { o: 0, duration: 0.045, ease: "none" }, 0.955)
        : null;

      const vh = isMobile ? config.scrollVh.mobile : config.scrollVh.desktop;
      const st = ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: `+=${vh}%`, // 100% = one viewport height
        pin: true,
        anticipatePin: 1,
        scrub: true,
        animation: tl,
        invalidateOnRefresh: true,
        onToggle: (self) => {
          if (self.isActive) {
            // Deep links / refreshes can land inside this pin without the
            // previous stage's hand-off ever running (layer still at o:0).
            // Snap the layer visible only when entering before the dissolve
            // zone — entering through it must keep the scrubbed values. The
            // story opener fades in via its own tween instead [SCR-08].
            if (
              segmentKey !== FIRST_SEGMENT &&
              self.progress < 0.5 &&
              seg.opacity.o < 0.5
            )
              seg.opacity.o = 1;
            setActivePhase(config.index);
            setActiveSegment(segmentKey);
            document.documentElement.dataset.theme = "dark";
          }
        },
      });
      registerPhaseEl(config.index, root.current);
      return () => {
        // kill(true) reverts pin state/spacer — without it a mid-pin kill
        // (viewport-class flip) leaves a stale transform on the section.
        st.kill(true);
        registerPhaseEl(config.index, null);
        segmentTweens.forEach((tw) => tw.kill());
        fadeOutTween?.kill();
        seg.playhead.p = 0;
        seg.opacity.o = 0;
      };
    },
    { scope: root, dependencies: [isMobile, config, segmentKey, fadeOutEnd], revertOnUpdate: true },
  );

  return (
    <TimelineContext.Provider value={tl}>
      <section
        ref={root}
        id={config.slug}
        aria-labelledby={`${config.id}-h`}
        className={`stage relative z-10 h-svh overflow-hidden bg-transparent text-ink ${className}`}
        data-phase={config.index}
      >
        {children}
      </section>
    </TimelineContext.Provider>
  );
}

/** The persistent mono label (h2) — accent rule + phase counter + the
 * phase's one-line purpose (`lede`), so every stage answers "what is this
 * phase for" while it plays [CNT-04]. Beats in and out on the stage timeline
 * so nothing textual rolls between pins [SCR-07]; static/lite contexts keep
 * it plainly visible. */
export function StageLabel({
  config,
  total = 7,
}: {
  config: Pick<PhaseConfig, "id" | "label" | "index" | "lede">;
  total?: number;
}) {
  const flow = useFlow();
  const ref = useRef<HTMLDivElement>(null);
  useBeat({ el: ref, at: 0.02, until: 0.95, travel: 16 });
  const n = String(config.index).padStart(2, "0");
  return (
    <div
      ref={ref}
      className={
        flow
          ? "relative z-10 max-w-[86vw]"
          : "pointer-events-none absolute left-clamp top-20 z-10 max-w-[86vw] lg:top-16"
      }
    >
      {/* [CARD-01] Readability card behind the persistent phase title +
          lede (visitor round 12) — the label sits directly on footage. */}
      <div className="story-card w-fit max-w-full p-4 lg:p-5">
        <h2 id={`${config.id}-h`} className="label-mono text-mute">
          <span aria-hidden="true" className="mr-3 inline-block h-px w-10 -translate-y-1 bg-amber" />
          {config.label}
          <span className="sr-only">
            {" "}
            — phase {config.index} of {total}
          </span>
        </h2>
        <p aria-hidden="true" className="label-mono mt-2 text-mute opacity-60">
          {n} / {String(total).padStart(2, "0")}
        </p>
        {config.lede && (
          <p className="mt-3 max-w-[44ch] text-[0.9rem] leading-relaxed text-mute lg:text-[0.95rem]">
            {config.lede}
          </p>
        )}
      </div>
    </div>
  );
}
