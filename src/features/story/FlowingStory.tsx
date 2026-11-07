"use client";

import { useEffect } from "react";
import { person, heroBeats } from "@/content/facts";
import { FlowContext } from "./flowContext";
import { ContactSection } from "./ContactSection";
import { WorkFlow } from "./WorkSection";
import { StackFlow } from "./StackSection";
import { ExperienceFlow } from "./ExperienceSection";
import { ProcessLedger } from "./ProcessLedger";
import { PortraitSlot } from "@/features/hero/PortraitSlot";
import { track, trackOnce } from "@/lib/analytics";

/**
 * Static & Lite modes — the same content model as the story, as plain
 * flowing sections. Static: zero motion. Lite: light fade-in reveals.
 * Visuals render in final state; transitions are pacing devices and are
 * skipped. [ARC-01]
 *
 * [LITE-01] The seven story phases do NOT flow here as sections — they
 * fold into one ProcessLedger (#process). The full beat script is
 * story-only; the ledger carries phase names + ledes.
 */
export function FlowingStory({ mode }: { mode: "static" | "lite" }) {
  const lite = mode === "lite";

  useEffect(() => {
    trackOnce(`mode-${mode}`, "mode_resolved", { mode });
    // Chrome theme follows the dark acts when they pass the viewport middle.
    const section = document.querySelector("[data-theme-section]");
    const themeIo = new IntersectionObserver(
      ([entry]) => {
        document.documentElement.dataset.theme = entry.isIntersecting ? "dark" : "light";
      },
      { rootMargin: "-35% 0px -35% 0px" },
    );
    if (section) themeIo.observe(section);
    return () => themeIo.disconnect();
  }, [mode]);

  useEffect(() => {
    if (!lite) return;
    trackOnce(`mode-${mode}`, "mode_resolved", { mode });
    // Light reveals only (lite mode); CSS transition, no library.
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [lite, mode]);

  return (
    <FlowContext.Provider value={true}>
      <main id="main" data-mode={mode}>
        {/* Hero — light, no pin, no typing. [LITE-02] now carries the
            same portrait slot as the story hero (text left, portrait
            bottom-right on lg; portrait below the text below lg) — the
            story Hero is a separate component and is untouched. */}
        <section
          id="myself"
          aria-labelledby="hero-h"
          className="relative flex min-h-svh flex-col justify-center overflow-hidden bg-canvas px-clamp pb-16 pt-24 text-ink"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(80vmax 80vmax at 78% 30%, rgba(17,17,17,0.05) 0%, rgba(244,242,238,0) 55%)",
            }}
          />
          <div className="relative z-10 flex w-full flex-col items-start gap-8 lg:flex-row lg:items-end lg:gap-8">
            <div className="flex flex-col items-start lg:max-w-[46rem]">
            <p className="label-mono mb-5 text-mute">
              {person.role}
              <span aria-hidden="true" className="mx-3 inline-block h-px w-8 -translate-y-1 bg-amber" />
              {person.location}
            </p>
            <h1 id="hero-h" className="display">
              {person.name}
            </h1>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="chip">Web</span>
              <span className="chip">IoT</span>
              <span className="chip">AI</span>
            </div>
            <p className={`body-copy mt-7 max-w-[44ch] text-[1.05rem] ${lite ? "reveal" : ""}`}>
              {heroBeats.beat1}
            </p>
            <p className={`body-copy mt-4 max-w-[48ch] text-[0.92rem] text-mute ${lite ? "reveal" : ""}`}>
              {heroBeats.beat2}
            </p>
            <div className={`mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 ${lite ? "reveal" : ""}`}>
              <a
                href={person.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="label-mono inline-flex min-h-[44px] items-center text-ink underline decoration-line underline-offset-4 hover:decoration-amber"
              >
                LinkedIn ↗
              </a>
              <a
                href={person.github}
                target="_blank"
                rel="noopener noreferrer"
                className="label-mono inline-flex min-h-[44px] items-center text-ink underline decoration-line underline-offset-4 hover:decoration-amber"
              >
                GitHub ↗
              </a>
              {/* [NAV-02] Was "Begin the story ↓" — the owner repurposed it
               * as the resume download (round 18); lite/static have no
               * pinned story to begin, so the download is the better CTA.
               * [LITE-02] all three links share the inline-flex items-center
               * 44px pattern — the resume link used to center its text while
               * the two plain links sat at the top of their 44px boxes, a
               * ~13px visible baseline drop the owner flagged. */}
              <a
                href={person.resumePath}
                download
                onClick={() => track("resume_download", { channel: "flow" })}
                className="label-mono inline-flex min-h-[44px] items-center gap-2 text-ink underline decoration-amber underline-offset-4"
                aria-label="Download my resume (PDF)"
              >
                Download my Resume
              </a>
            </div>
            </div>
            <div
              className={`pointer-events-none flex w-full flex-1 items-end justify-center lg:w-auto lg:justify-end ${lite ? "reveal" : ""}`}
            >
              <PortraitSlot sizeClass="h-[30svh] sm:h-[40svh] lg:h-[72svh]" />
            </div>
          </div>
        </section>

        {/* Phases — [LITE-01] folded into one Process ledger (story keeps
            the seven full sections; this is the flow twin) */}
        <div data-theme-section className="relative bg-[#0a0a0b]">
          <ProcessLedger lite={lite} />
          <WorkFlow lite={lite} />
          <StackFlow lite={lite} />
          <ExperienceFlow lite={lite} />
          <ContactSection />
        </div>
      </main>
    </FlowContext.Provider>
  );
}
