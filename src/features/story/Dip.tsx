"use client";

import { Fragment, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { setActivePhase } from "@/lib/scroll/activePhase";
import { useIsMobile } from "@/lib/scroll/useIsMobile";

gsap.registerPlugin(ScrollTrigger);

/**
 * Dip (Phase 0 → 1): dark panel; the hero's light world dissolves into the
 * night acts. `--bg`/`--fg` tween light → dark on the section itself, and
 * the document theme flips for the chrome. Starts preloading Phase 1 media.
 *
 * [STORY-02] Visitor round 12: "THE STORY" is now a display-size title and
 * the description COMPLETES WITH SCROLL — every word brightens from a
 * faint ghost to full ink along the scrubbed timeline, so the sentence
 * assembles word by word as the visitor scrolls through the dip (and
 * un-assembles in reverse). No-JS / no-timeline keeps the full sentence.
 */
const DIP_DESCRIPTION =
  "How a smart home goes from a first conversation to shipped software — seven phases, from the first interview to long after launch. Scroll to walk through it.";

export function Dip() {
  const root = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const words = useRef<HTMLParagraphElement>(null);
  const isMobile = useIsMobile();

  useGSAP(
    () => {
      const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
      tl.set({}, {}, 1);
      if (panel.current) {
        tl.fromTo(
          panel.current,
          { backgroundColor: "#f4f2ee" },
          { backgroundColor: "#0a0a0b", duration: 1 },
          0,
        );
      }
      if (label.current) {
        // [STORY-02] retimed earlier (0.55) so the word reveal below has
        // room to complete inside the pin.
        tl.fromTo(
          label.current,
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.12, ease: "power3.out" },
          0.55,
        );
      }
      if (words.current) {
        // [STORY-02] The word-by-word completion: each span brightens from
        // a 0.14 ghost to full ink, staggered across the last third of the
        // dip. Scrubbed — forward assembles, reverse disassembles.
        const spans = words.current.querySelectorAll<HTMLElement>(".dip-word");
        if (spans.length) {
          tl.fromTo(
            spans,
            { opacity: 0.14 },
            { opacity: 1, duration: 0.06, stagger: 0.01, ease: "none" },
            0.66,
          );
        }
      }
      const vh = isMobile ? 80 : 100;
      const st = ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: `+=${vh}%`,
        pin: true,
        anticipatePin: 1,
        scrub: true,
        animation: tl,
        invalidateOnRefresh: true,
        onToggle: (self) => {
          document.documentElement.dataset.theme = self.isActive ? "dark" : "light";
          if (self.isActive) setActivePhase(1);
        },
        onLeaveBack: () => {
          document.documentElement.dataset.theme = "light";
          setActivePhase(0);
        },
      });
      return () => {
        // kill(true) reverts pin state/spacer (viewport-class flip safety).
        st.kill(true);
        tl.kill();
      };
    },
    { scope: root, dependencies: [isMobile], revertOnUpdate: true },
  );

  return (
    <section
      ref={root}
      aria-hidden="true"
      className="relative h-svh overflow-hidden"
      data-stage="dip"
    >
      <div ref={panel} className="absolute inset-0" style={{ backgroundColor: "#f4f2ee" }}>
        <div ref={label} className="absolute bottom-[12svh] left-clamp opacity-0" style={{ visibility: "hidden" }}>
          <span className="mb-4 block h-px w-16 bg-amber" />
          {/* [CNT-04] The first thing the dark acts say is what the visitor
              is about to see — the phase signpost stays, but the explainer
              leads, so the story never opens on a bare "01 / 07".
              [STORY-02] Title raised to display size (visitor round 12). */}
          <p className="font-mono text-[clamp(1.7rem,4.5vw,3.2rem)] font-medium leading-none tracking-[0.16em] text-[#efece6]">
            THE STORY
          </p>
          <p ref={words} className="mt-5 max-w-[46ch] text-[1rem] leading-relaxed text-[#efece6]/90 lg:text-[1.05rem]">
            {DIP_DESCRIPTION.split(" ").map((w, i, arr) => (
              <Fragment key={i}>
                <span className="dip-word">{w}</span>
                {i < arr.length - 1 ? " " : null}
              </Fragment>
            ))}
          </p>
          <p className="label-mono mt-5 text-[#efece6]/50">PHASE 01 / DISCOVERY · 01 / 07</p>
        </div>
      </div>
    </section>
  );
}
