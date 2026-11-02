"use client";

import { useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { TransitionConfig } from "@/content/schema";
import { setActivePhase } from "@/lib/scroll/activePhase";
import { useIsMobile } from "@/lib/scroll/useIsMobile";
import { getSegment, setActiveSegment, wireSegmentTweens } from "./canvasStore";

gsap.registerPlugin(ScrollTrigger);

/**
 * TransitionStage [SCR-06][SCR-07]: pinned, no body text, one label beat
 * (mono PHASE 0N / NAME + accent line + 0N / 07) bottom-left, fading in
 * ~0.45 and out by ~0.82. The rail's active dot advances at 50%.
 *
 * The transition CLIP lives on the StoryCanvas (segment "tN-M"): this stage
 * scrubs its playhead and dissolves the layer in, so the morph from phase N
 * to phase N+1 plays in place — no roll, no cut. Without footage the canvas
 * falls back to a quiet dark backdrop (ADR-003).
 */
export function TransitionStage({
  config,
  nextPhase,
}: {
  config: TransitionConfig;
  nextPhase: number;
}) {
  const root = useRef<HTMLElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const rule = useRef<HTMLSpanElement>(null);
  const isMobile = useIsMobile();
  // Lazy timeline so canvas registration order never matters.
  const [tl] = useState(() => {
    const t = gsap.timeline({ paused: true, defaults: { ease: "none" } });
    t.set({}, {}, 1); // normalized duration 1
    return t;
  });

  useGSAP(
    () => {
      // Canvas layer ownership [SCR-07] + seamless hand-off [SCR-08]: this
      // stage enters mid-clip (the previous phase's dissolve pre-scrubbed us
      // to HANDOFF_LEAD) and dissolves into the next phase across its own
      // last stretch. Transitions are short (150–180vh) and mostly
      // label-free, so the label beat is the only extra motion here.
      const seg = getSegment(`t${config.from}-${config.to}`);
      seg.playhead.p = 0;
      seg.opacity.o = 0;
      const segmentTweens = wireSegmentTweens(tl, `t${config.from}-${config.to}`);

      if (label.current) {
        tl.fromTo(
          label.current,
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.14, ease: "power3.out" },
          0.45,
        );
        tl.to(label.current, { autoAlpha: 0, y: -10, duration: 0.1, ease: "power2.in" }, 0.82);
      }
      if (rule.current) {
        tl.fromTo(
          rule.current,
          { scaleX: 0 },
          { scaleX: 1, duration: 0.2, ease: "power2.out", transformOrigin: "left center" },
          0.4,
        );
      }
      const vh = isMobile ? config.scrollVh.mobile : config.scrollVh.desktop;
      const st = ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: `+=${vh}%`,
        pin: true,
        anticipatePin: 1,
        scrub: true,
        animation: tl,
        invalidateOnRefresh: true,
        // The rail's active dot advances at 50% of the transition [SCR-06].
        onUpdate: (self) => {
          if (self.progress > 0.5) setActivePhase(nextPhase);
        },
        onToggle: (self) => {
          if (self.isActive) {
            // Deep-link safety net, same as PhaseStage [SCR-08].
            if (self.progress < 0.5 && seg.opacity.o < 0.5) seg.opacity.o = 1;
            setActiveSegment(`t${config.from}-${config.to}`);
            document.documentElement.dataset.theme = "dark";
          }
        },
      });
      return () => {
        // kill(true) reverts pin state/spacer (viewport-class flip safety).
        st.kill(true);
        segmentTweens.forEach((tw) => tw.kill());
        seg.playhead.p = 0;
        seg.opacity.o = 0;
      };
    },
    {
      scope: root,
      dependencies: [isMobile, config, nextPhase, tl],
      revertOnUpdate: true,
    },
  );

  const n = String(nextPhase).padStart(2, "0");

  return (
    <section
      ref={root}
      id={config.id}
      aria-hidden="false"
      className="relative z-10 h-svh overflow-hidden bg-transparent text-ink"
      data-transition={config.id}
    >
      <div
        ref={label}
        className="pointer-events-none absolute bottom-[12svh] left-clamp z-10 opacity-0"
        style={{ visibility: "hidden" }}
      >
        <span ref={rule} className="mb-3 block h-px w-12 bg-amber" />
        <p className="label-mono text-ink">{config.label}</p>
        <p className="label-mono mt-2 text-mute opacity-60">{n} / 07</p>
      </div>
    </section>
  );
}
