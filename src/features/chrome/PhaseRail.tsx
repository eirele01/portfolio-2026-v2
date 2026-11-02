"use client";

import { useEffect, useRef } from "react";
import { phases } from "@/content/phases";
import { useActivePhase, getPhaseEl, onStoryProgress } from "@/lib/scroll/activePhase";
import { scrollToTarget } from "@/lib/scroll/engine";

/**
 * PhaseRail (desktop, z-30) / ProgressBar + counter (mobile).
 * The rail doubles as navigation: every dot is a ≥44px target that jumps to
 * its phase [A11Y-07]. Mobile gets a top progress line and a 03 / 07 counter.
 */
export function PhaseRail() {
  const active = useActivePhase();

  return (
    <nav
      aria-label="Story phases"
      className="fixed right-[calc(clamp(20px,5vw,72px)/2)] top-1/2 z-30 hidden -translate-y-1/2 flex-col items-end gap-1 lg:flex"
    >
      {phases.map((p) => {
        const isActive = active === p.index;
        return (
          <button
            key={p.slug}
            type="button"
            onClick={() => {
              const el = getPhaseEl(p.index);
              scrollToTarget(el ?? `#${p.slug}`);
            }}
            aria-label={`Phase ${p.index}: ${p.name}`}
            aria-current={isActive ? "true" : undefined}
            className="group flex h-11 w-11 items-center justify-end"
          >
            <span
              aria-hidden="true"
              className={`mr-1 hidden whitespace-nowrap rounded px-2 py-1 text-[0.6rem] font-mono tracking-[0.12em] transition-opacity lg:group-hover:block lg:group-focus-visible:block ${
                isActive ? "text-ink" : "text-mute"
              } bg-[#141416]`}
            >
              {p.name.toUpperCase()}
            </span>
            <span
              aria-hidden="true"
              className={`block rounded-full transition-all duration-300 ${
                isActive
                  ? "h-2.5 w-2.5 bg-amber"
                  : "h-2 w-2 border border-line bg-transparent group-hover:border-amber"
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
}

export function ProgressBar() {
  const active = useActivePhase();
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Imperative transform for the bar (no React state in the scroll path).
    // [SCR-03] The counter text is owned by React (re-renders per phase).
    return onStoryProgress((p) => {
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    });
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-30 lg:hidden" aria-hidden="true">
      <div className="h-[2px] w-full bg-line/40">
        <div ref={bar} className="h-full w-full origin-left bg-amber" style={{ transform: "scaleX(0)" }} />
      </div>
      <div className="flex justify-end px-4 pt-2">
        <span className="label-mono text-mute opacity-80">
          {String(active).padStart(2, "0")} / 07
        </span>
      </div>
    </div>
  );
}
