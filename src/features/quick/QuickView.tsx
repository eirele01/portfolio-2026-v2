"use client";

import { useEffect, useRef } from "react";
import { person, heroBeats, career, skillGroups } from "@/content/facts";
import { projects } from "@/content/projects";
import { ExperienceToggle } from "../chrome/ExperienceToggle";
import { CopyEmailButton } from "../chrome/CopyEmailButton";
import { lockScroll, unlockScroll } from "@/lib/scroll/engine";
import { track } from "@/lib/analytics";
import { formatNumber } from "@/lib/math";

/**
 * Quick View — the 30-second path [UX-01]: who, what, 3 projects, skills,
 * timeline, contact. Zero motion, semantic HTML, print-friendly.
 * Implemented as a full-screen overlay on the single user-visible route
 * (ADR-002), openable via /?view=quick (no in-page button since the
 * "Skip the story" buttons became the resume download [NAV-02]); Esc to close.
 */
export function QuickView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    track("quick_view_open");
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Lock the story underneath: freeze Lenis (a running Lenis would
    // intercept the overlay's wheel events, so the overlay itself could not
    // scroll) and clip native overflow for static/no-Lenis contexts. The
    // overlay is exempt from Lenis via data-lenis-prevent below, so it
    // scrolls natively while the story cannot.
    lockScroll();
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prev;
      unlockScroll();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="quick-overlay fixed inset-0 z-40 overflow-y-auto bg-canvas text-ink"
      role="dialog"
      aria-modal="true"
      aria-label="Quick view — summary"
      data-lenis-prevent
    >
      <div className="mx-auto w-full max-w-[880px] px-clamp pb-24 pt-6">
        <div className="no-print sticky top-0 z-10 -mx-2 mb-6 flex items-center justify-between bg-canvas/90 px-2 py-3 backdrop-blur-sm">
          <span className="label-mono text-mute">QUICK VIEW</span>
          <div className="flex items-center gap-4">
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="label-mono min-h-[44px] text-ink underline decoration-amber underline-offset-4"
            >
              ← Watch the story
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close quick view"
              className="flex h-11 w-11 items-center justify-center border border-line rounded-full text-ink"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Who */}
        <header className="border-b border-line pb-10">
          <p className="label-mono mb-4 text-mute">
            {person.role} · {person.location}
          </p>
          <h1 className="h2">{person.name}</h1>
          <p className="body-copy mt-5 max-w-[54ch] text-[1.05rem]">{heroBeats.beat1}</p>
          <p className="body-copy mt-3 max-w-[54ch] text-[0.92rem] text-mute">{heroBeats.beat2}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {person.specialties.map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </div>
        </header>

        {/* Projects */}
        <section aria-labelledby="qv-projects" className="border-b border-line py-10">
          <h2 id="qv-projects" className="label-mono mb-6 text-mute">
            SELECTED WORK
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {projects.map((p) => (
              <article key={p.id} className="flex flex-col rounded-md border border-line p-4">
                <h3 className="text-base font-medium">{p.title}</h3>
                <p className="mt-1.5 text-[0.85rem] leading-snug text-mute">{p.oneLiner}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.stack.map((s) => (
                    <span key={s} className="chip !px-2 !py-0.5 !text-[0.6rem]">
                      {s}
                    </span>
                  ))}
                </div>
                {p.metric && (
                  <p className="label-mono mt-3 text-amber">
                    {formatNumber(p.metric.value)}
                    {p.metric.suffix} {p.metric.label}
                  </p>
                )}
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("project_click", { project: p.id })}
                  className="label-mono mt-4 w-fit underline decoration-line underline-offset-4 hover:decoration-amber"
                >
                  Visit ↗
                </a>
              </article>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section aria-labelledby="qv-skills" className="border-b border-line py-10">
          <h2 id="qv-skills" className="label-mono mb-6 text-mute">
            STACK & SKILLS
          </h2>
          <div className="flex flex-col gap-4">
            {skillGroups.map((g) => (
              <div key={g.label} className="flex flex-wrap items-center gap-2">
                <span className="label-mono w-24 shrink-0 text-mute">{g.label}</span>
                {g.items.map((s) => (
                  <span key={s} className="chip">
                    {s}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section aria-labelledby="qv-timeline" className="border-b border-line py-10">
          <h2 id="qv-timeline" className="label-mono mb-6 text-mute">
            PATH
          </h2>
          <ol className="flex flex-col gap-5">
            {career.map((c) => (
              <li key={c.role} className="grid grid-cols-[7.5rem_1fr] items-baseline gap-4">
                <span className="label-mono text-mute">{c.period}</span>
                <span>
                  <span className="font-medium">{c.role}</span>
                  <span className="mt-0.5 block text-[0.88rem] text-mute">{c.note}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* Contact */}
        <section aria-labelledby="qv-contact" className="pt-10">
          <h2 id="qv-contact" className="label-mono mb-6 text-mute">
            CONTACT
          </h2>
          <div className="flex flex-col items-start gap-4">
            <a
              href={`mailto:${person.email}`}
              onClick={() => track("contact_click", { channel: "email" })}
              className="text-[1.05rem] font-medium underline decoration-amber underline-offset-4"
            >
              {person.email}
            </a>
            <CopyEmailButton />
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <a
                href={person.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("contact_click", { channel: "linkedin" })}
                className="label-mono min-h-[44px] underline decoration-line underline-offset-4 hover:decoration-amber"
              >
                LinkedIn ↗
              </a>
              <a
                href={person.github}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("contact_click", { channel: "github" })}
                className="label-mono min-h-[44px] underline decoration-line underline-offset-4 hover:decoration-amber"
              >
                GitHub ↗
              </a>
              <a
                href={person.resumePath}
                download
                onClick={() => track("resume_download")}
                className="label-mono min-h-[44px] underline decoration-line underline-offset-4 hover:decoration-amber"
              >
                Download resume ↓
              </a>
            </div>
            <div className="no-print mt-6 flex items-center gap-4">
              <span className="label-mono text-mute">Experience:</span>
              <ExperienceToggle />
            </div>
            <p className="label-mono mt-8 text-mute opacity-70">
              Designed and built by {person.name} · © 2026
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
