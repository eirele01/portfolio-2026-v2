"use client";

import { useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { person, heroBeats } from "@/content/facts";
import { track } from "@/lib/analytics";
import { heroExitState } from "@/lib/scroll/heroExit";
import { scrollToTarget } from "@/lib/scroll/engine";
import { setActivePhase, registerPhaseEl } from "@/lib/scroll/activePhase";
import { useIsMobile } from "@/lib/scroll/useIsMobile";
import { HeroParticles } from "./HeroParticles";
import { PortraitSlot } from "./PortraitSlot";

gsap.registerPlugin(ScrollTrigger);

/**
 * Phase 0 — Myself (hero). Light canvas, still portrait (or its monogram
 * fallback), typed name, idle breathing, particles behind, and a scrubbed
 * exit that hands off to the Dip. 120vh desktop / 100vh mobile.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useGSAP(
    () => {
      const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
      tl.set({}, {}, 1);
      // Exit: the whole composition lifts 40px and fades while the Dip takes over.
      tl.to(
        content.current,
        { y: -40, autoAlpha: 0, duration: 0.16, ease: "power2.in" },
        0.84,
      );
      tl.eventCallback("onUpdate", () => {
        heroExitState.p = tl.progress();
      });

      const vh = isMobile ? 100 : 120;
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
          if (self.isActive) {
            setActivePhase(0);
            document.documentElement.dataset.theme = "light";
          }
          heroExitState.active = self.isActive;
        },
      });
      registerPhaseEl(0, root.current);

      // Entrance: typed name + gentle beat reveals (time-based, not scrubbed).
      const name = root.current?.querySelectorAll<HTMLElement>("[data-name-char]");
      const intro = gsap.timeline({ delay: 0.15 });
      if (name && name.length) {
        intro.fromTo(
          name,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.02, stagger: 0.04, ease: "none" },
        );
        const caret = root.current?.querySelector<HTMLElement>("[data-caret]");
        if (caret) {
          // Blink twice, then hold visible.
          intro
            .to(caret, { autoAlpha: 0, duration: 0.3, yoyo: true, repeat: 3, ease: "steps(1)" })
            .set(caret, { autoAlpha: 1 });
        }
      }
      intro.fromTo(
        "[data-hero-reveal]",
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.12, ease: "power3.out" },
        "-=0.2",
      );

      // Idle life: breathing on the portrait slot + mouse parallax (desktop).
      const slot = root.current?.querySelector<HTMLElement>("[data-breathing]");
      let breath: gsap.core.Tween | undefined;
      if (slot) {
        breath = gsap.to(slot, {
          scale: 1.012,
          duration: 3,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
      }
      const fine = window.matchMedia("(pointer: fine)").matches;
      const onMove = (e: MouseEvent) => {
        if (!slot || !fine) return;
        const dx = (e.clientX / window.innerWidth - 0.5) * 16; // ≤ 8px
        const dy = (e.clientY / window.innerHeight - 0.5) * 12; // ≤ 6px
        gsap.to(slot, { x: dx, y: dy, duration: 1.2, ease: "power2.out" });
      };
      window.addEventListener("mousemove", onMove);

      return () => {
        // kill(true) reverts pin state/spacer (viewport-class flip safety).
        st.kill(true);
        tl.kill();
        intro.kill();
        breath?.kill();
        window.removeEventListener("mousemove", onMove);
        registerPhaseEl(0, null);
      };
    },
    { scope: root, dependencies: [isMobile], revertOnUpdate: true },
  );

  return (
    <section
      ref={root}
      id="myself"
      aria-labelledby="hero-h"
      className="relative h-svh overflow-hidden bg-canvas text-ink"
      data-phase={0}
    >
      <HeroParticles />
      <div
        ref={content}
        className="relative z-10 mx-auto flex h-full w-full max-w-[1440px] flex-col justify-between px-clamp pb-[7svh] pt-[14svh] lg:flex-row lg:items-end lg:gap-8 lg:pb-[9svh]"
      >
        {/* Text column */}
        <div className="flex flex-col lg:max-w-[46rem]">
          <p data-hero-reveal className="label-mono mb-5 text-mute">
            {person.role}
            <span aria-hidden="true" className="mx-3 inline-block h-px w-8 -translate-y-1 bg-amber" />
            {person.location}
          </p>
          <h1 id="hero-h" className="display" aria-label={person.name}>
            <span aria-hidden="true">
              {person.name.toUpperCase().split(" ").map((word, wi) => (
                <span key={wi} className="inline-block whitespace-nowrap">
                  {Array.from(word).map((c, i) => (
                    <span key={i} data-name-char="char" className="inline-block">
                      {c}
                    </span>
                  ))}
                  {wi < person.name.split(" ").length - 1 && (
                    <span data-name-char="space" className="inline-block w-[0.32em]" />
                  )}
                </span>
              ))}
            </span>
            <span
              data-caret
              aria-hidden="true"
              className="caret ml-2 inline-block h-[0.72em] w-[0.5ch] -translate-y-[0.04em] bg-amber align-middle"
            />
          </h1>

          <div data-hero-reveal className="mt-6 flex flex-wrap items-center gap-2">
            <span className="chip">Web</span>
            <span className="chip">IoT</span>
            <span className="chip">AI</span>
          </div>

          <p data-hero-reveal className="body-copy mt-7 max-w-[40ch] text-[1.05rem] text-ink">
            {heroBeats.beat1}
          </p>
          <p
            data-hero-reveal
            className="body-copy mt-4 max-w-[46ch] text-[0.92rem] leading-relaxed text-mute"
          >
            {heroBeats.beat2}
          </p>

          <div data-hero-reveal className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href={person.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="label-mono text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-amber"
            >
              LinkedIn ↗
            </a>
            <a
              href={person.github}
              target="_blank"
              rel="noopener noreferrer"
              className="label-mono text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-amber"
            >
              GitHub ↗
            </a>
            {/* [NAV-02] Was "Skip the story" (opened Quick View) — the owner
             * repurposed it as the resume download (round 18). Quick View
             * stays reachable via /?view=quick. */}
            <a
              href={person.resumePath}
              download
              onClick={() => track("resume_download", { channel: "hero" })}
              className="label-mono inline-flex min-h-[44px] items-center gap-1 text-ink underline decoration-amber underline-offset-4"
              aria-label="Download my resume (PDF)"
            >
              Download my Resume
            </a>
          </div>
        </div>

        {/* Portrait column — slot reserved; monogram fallback when no cut-out exists */}
        <div className="pointer-events-none flex flex-1 items-end justify-center lg:max-w-[38%] lg:justify-end">
          <PortraitSlot />
        </div>
      </div>

      {/* Beat 3 — scroll cue */}
      <div
        data-hero-reveal
        className="absolute inset-x-0 bottom-[2.4svh] z-10 flex flex-col items-center gap-2"
      >
        <p className="label-mono text-mute">{heroBeats.beat3}</p>
        <span className="cue-line block h-8 w-px bg-amber" aria-hidden="true" />
      </div>
    </section>
  );
}
