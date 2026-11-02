"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { person } from "@/content/facts";
import { track } from "@/lib/analytics";
import { getMode } from "@/lib/mode/experience";
import { CopyEmailButton } from "../chrome/CopyEmailButton";
import { ExperienceToggle } from "../chrome/ExperienceToggle";
import { ContactForm } from "./ContactForm";

gsap.registerPlugin(ScrollTrigger);

/** Mandaluyong wall-clock (Asia/Manila, UTC+8, no DST). Client-only: the
    first paint shows a mono placeholder so SSR markup never mismatches. */
function useManilaTime(): string {
  const [time, setTime] = useState("--:--");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Manila",
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/**
 * Contact (un-pinned, after the logbook and the stack ledger) + footer.
 * [CONTACT-02] visitor-first restructure of [CONTACT-01]'s layout: the
 * left column answers "who am I writing to?" — a live Mandaluyong clock
 * (fact from facts.ts, sets the reply-time expectation without claiming
 * one), then the two direct channels under ledger micro-labels (DIRECT:
 * mailto pill + copy; ELSEWHERE: LinkedIn / GitHub / resume). The form is
 * the primary path and says so in its own header ("same inbox as the
 * email") — the old bottom-of-column cross-reference line is gone. The
 * grid children get one gentle once-reveal on first scroll into view
 * (story + lite; static mode and reduced-motion skip it).
 */
export function ContactSection() {
  const root = useRef<HTMLElement>(null);
  const magnetic = useRef<HTMLAnchorElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const localTime = useManilaTime();

  useGSAP(
    () => {
      // Entrance: one calm stagger, first time the section crosses 3/4 view.
      // static mode is zero-motion by contract; reduced-motion skips too.
      if (getMode() === "static") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (!grid.current) return;
      gsap.from(grid.current.children, {
        autoAlpha: 0,
        y: 24,
        duration: 0.6,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 72%", once: true },
      });

      const el = magnetic.current;
      if (!el) return;
      const fine = window.matchMedia("(pointer: fine)").matches;
      if (!fine) return;
      const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
      const onMove = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        // drift ≤ 6px toward the pointer
        xTo(Math.max(-6, Math.min(6, dx * 0.06)));
        yTo(Math.max(-6, Math.min(6, dy * 0.06)));
      };
      const onLeave = () => {
        xTo(0);
        yTo(0);
      };
      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);
      return () => {
        el.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseleave", onLeave);
      };
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="contact"
      aria-labelledby="contact-h"
      className="relative flex min-h-[92svh] flex-col justify-center overflow-hidden bg-canvas px-clamp pb-10 pt-24 text-ink"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60vmax 60vmax at 18% 12%, rgba(255,180,84,0.14) 0%, rgba(10,10,11,0) 60%)",
        }}
      />
      <div ref={grid} className="relative z-10 grid items-start gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
        <div>
          {/* [LOG-01] renumbered 10 → 11 when the logbook took PHASE 10 */}
          <p className="label-mono mb-5 text-mute">PHASE 11 / YOURS</p>
          <h2 id="contact-h" className="h2 max-w-[12ch]">
            Let&rsquo;s build yours.
          </h2>
          <p className="body-copy mt-5 max-w-[44ch] text-mute">
            Tell me what must never break. I&rsquo;ll take it from the first
            conversation to the live deployment.
          </p>

          {/* [CONTACT-02] where + when, straight from facts.ts — the visitor
              sees the timezone before writing, no invented reply promise. */}
          <p className="label-mono mt-7 flex items-center gap-2.5 text-mute">
            <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-amber" />
            {person.location} — {localTime} UTC+8
          </p>

          <div className="mt-8 max-w-[460px]">
            <div className="border-t border-line pt-5">
              <p className="label-mono mb-4 text-mute">DIRECT</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <a
                  ref={magnetic}
                  href={`mailto:${person.email}`}
                  onClick={() => track("contact_click", { channel: "email" })}
                  className="inline-flex min-h-[56px] items-center rounded-full bg-amber px-7 font-mono text-[0.85rem] font-medium tracking-[0.04em] text-amber-ink transition-transform"
                >
                  {person.email}
                </a>
                <CopyEmailButton />
              </div>
            </div>

            <div className="mt-6 border-t border-line pt-5">
              <p className="label-mono mb-4 text-mute">ELSEWHERE</p>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                <a
                  href={person.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("contact_click", { channel: "linkedin" })}
                  className="label-mono min-h-[44px] text-ink underline decoration-line underline-offset-4 hover:decoration-amber"
                >
                  LinkedIn ↗
                </a>
                <a
                  href={person.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("contact_click", { channel: "github" })}
                  className="label-mono min-h-[44px] text-ink underline decoration-line underline-offset-4 hover:decoration-amber"
                >
                  GitHub ↗
                </a>
                <a
                  href={person.resumePath}
                  download
                  onClick={() => track("resume_download")}
                  className="label-mono min-h-[44px] text-ink underline decoration-line underline-offset-4 hover:decoration-amber"
                >
                  Download resume ↓
                </a>
              </div>
            </div>
          </div>
        </div>

        <ContactForm />
      </div>

      <footer className="relative z-10 mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <p className="label-mono text-mute">
          Designed and built by {person.name} · © 2026
        </p>
        <ExperienceToggle />
      </footer>
    </section>
  );
}
