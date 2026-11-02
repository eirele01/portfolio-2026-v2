"use client";

import { useEffect, useRef, useState } from "react";
import { person } from "@/content/facts";
import { useExperienceMode } from "@/lib/mode/experience";
import {
  getPreloadState,
  skipMediaPreload,
  useMediaPreload,
} from "@/lib/media/preload";

/**
 * Loader (z-40).
 *
 * Two regimes:
 *  - story mode [LOAD-01]: a REAL preloader. The overlay stays up while
 *    `startMediaPreload` fetches every clip + poster (byte-weighted
 *    progress bar, percentage, footage counter). Reveal waits for the
 *    preload to settle AND fonts. "Skip loading" (button after 6s, or
 *    Esc) reveals the site immediately WITHOUT aborting the queue
 *    [CACHE-01]: fetching continues in the background at a lower rate,
 *    so unfinished clips stream until their blob lands, then switch
 *    over automatically — a skipped slow visit still converges to
 *    fully-local scrubbing.
 *  - lite / static / non-story: the original brief brand moment —
 *    poster-first means there is nothing heavy to wait for. Max ~1.4s.
 *
 * Rendered at all only when the parent passes `enabled` (quick view and
 * explicit ?mode=static skip it entirely).
 */

const EXIT_MS = 450;

export function Loader({ enabled }: { enabled: boolean }) {
  const mode = useExperienceMode();
  const story = enabled && mode === "story";
  const preload = useMediaPreload();
  const [done, setDone] = useState(!enabled);
  const [gone, setGone] = useState(!enabled);
  const [showSkip, setShowSkip] = useState(false);
  const [display, setDisplay] = useState(0); // smoothed progress 0..1
  const finishing = useRef(false);

  const loading = preload.status === "loading";
  const settled = preload.status === "done" || preload.status === "skipped";

  // Story regime: follow real progress until the preload settles.
  useEffect(() => {
    if (!story) return;
    let cancelled = false;
    let raf = 0;

    const finish = () => {
      if (cancelled || finishing.current) return;
      finishing.current = true;
      setDisplay(1);
      setDone(true);
      setTimeout(() => {
        if (!cancelled) setGone(true);
      }, EXIT_MS);
    };

    // Smoothed bar: raw byte progress jumps as chunks land; ease toward it.
    const loop = () => {
      const target = settled ? 1 : getPreloadState().progress;
      setDisplay((d) => {
        const next = d + (target - d) * 0.14;
        // Self-terminate once the bar is visually complete and loading ended.
        if (settled && target - next < 0.002) {
          cancelAnimationFrame(raf);
          return 1;
        }
        return next;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Minimum brand moment, fonts gate (with a cap so a hanging font can
    // never hold the page), and the settled watcher.
    const minT = setTimeout(() => {
      if (settled) finish();
    }, 650);
    const settleT = setInterval(() => {
      const st = getPreloadState().status;
      if ((st === "done" || st === "skipped") && performance.now() > 650) finish();
    }, 100);
    const fontT = setTimeout(() => {
      if (settled) finish();
    }, 4000);
    void document.fonts?.ready.then(() => {
      if (settled) finish();
    });
    // Safety valve: never hold the visitor more than 25s even if some
    // connection stalls without erroring. Reveals WITHOUT aborting —
    // the queue keeps filling in the background [CACHE-01].
    const maxT = setTimeout(() => {
      if (!cancelled) {
        skipMediaPreload();
        finish();
      }
    }, 25000);
    // Skip affordance once loading takes a moment.
    const skipT = setTimeout(() => setShowSkip(true), 6000);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(minT);
      clearInterval(settleT);
      clearTimeout(fontT);
      clearTimeout(maxT);
      clearTimeout(skipT);
    };
  }, [story, settled]);

  // Non-story regime: the original brief brand moment (fonts + cap).
  useEffect(() => {
    if (story || !enabled) return;
    let cancelled = false;
    const finish = () => {
      if (cancelled || finishing.current) return;
      finishing.current = true;
      setDone(true);
      setTimeout(() => {
        if (!cancelled) setGone(true);
      }, 500);
    };
    const min = setTimeout(finish, 550);
    const max = setTimeout(finish, 1400);
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) setTimeout(finish, 200);
      });
    }
    return () => {
      cancelled = true;
      clearTimeout(min);
      clearTimeout(max);
    };
  }, [story, enabled]);

  // Esc skips the wait too (story regime, once the affordance is visible).
  useEffect(() => {
    if (!showSkip) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skipMediaPreload();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSkip]);

  if (gone) return null;

  const active = story && !done;
  // Between SSR paint and hydration+start the preload is "idle" — show only
  // the brand mark and the empty line (no fake 0%/"ready" flash).
  const hydrating = active && preload.status === "idle";
  const pct = Math.min(100, Math.round(display * 100));
  // Screen readers get stepped updates, not 60 announcements a second.
  const srPct = Math.min(100, Math.floor(pct / 25) * 25);

  return (
    <div
      role="status"
      aria-label={
        done
          ? "Loading complete"
          : `Loading experience${srPct > 0 ? `, ${srPct} percent loaded` : ""}`
      }
      className={`fixed inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-canvas transition-opacity duration-[450ms] ${
        done ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <span className="label-mono text-ink">{person.monogram}</span>

      <span className="block h-px w-40 overflow-hidden bg-line">
        <span
          className={`block h-full w-full bg-amber ${
            active && !hydrating ? "" : "loader-line"
          }`}
          style={active && !hydrating ? { transform: `scaleX(${display})` } : undefined}
        />
      </span>

      {active && !hydrating ? (
        <div className="flex flex-col items-center gap-1.5" aria-hidden="true">
          <span className="label-mono tabular-nums text-mute">{pct}%</span>
          <span className="label-mono !text-[0.6rem] text-mute/60">
            {loading
              ? `footage ${String(preload.videosDone).padStart(2, "0")} / ${String(
                  preload.videosTotal,
                ).padStart(2, "0")}`
              : "ready"}
          </span>
        </div>
      ) : (
        <span className="sr-only">Loading</span>
      )}

      {showSkip && active && (
        <button
          type="button"
          onClick={skipMediaPreload}
          className="label-mono absolute bottom-6 right-6 !text-[0.65rem] text-mute/70 transition-colors duration-200 hover:text-ink focus-visible:text-ink focus-visible:outline focus-visible:outline-amber"
        >
          Skip loading →
        </button>
      )}

      <style>{`
        .loader-line { transform-origin: left; animation: loader-fill 1.1s var(--ease-inout) both; }
        @keyframes loader-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @media (prefers-reduced-motion: reduce) { .loader-line { animation: none; transform: scaleX(1); } }
      `}</style>
    </div>
  );
}
