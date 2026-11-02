"use client";

import { useEffect, useState } from "react";
import { getModeSource, setMode, useExperienceMode } from "@/lib/mode/experience";
import { track } from "@/lib/analytics";

/**
 * ModeHint — only for visitors the app silently downgraded [ARC-02].
 * If heuristics (data saver / slow network / low memory) or the OS
 * reduced-motion preference picked lite/static, the site shows posters
 * instead of the scrubbed video story — easy to misread as "broken".
 * This pill explains it and offers a one-tap switch to the full story.
 * Never shown when the choice was explicit (URL param, toggle, visitor).
 */
export function ModeHint() {
  const mode = useExperienceMode();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 1800);
    return () => clearTimeout(t);
  }, []);

  const source = getModeSource();
  const autoDowngraded =
    mode !== "story" && (source === "heuristics" || source === "reduced-motion");
  const show = autoDowngraded && !dismissed;

  if (!show) return null;

  const reason =
    source === "reduced-motion"
      ? "Your device prefers reduced motion, so the video story is off."
      : "Slow connection detected, so the video story is off.";

  return (
    <div
      role="status"
      className={`no-print fixed bottom-4 left-4 z-30 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-canvas/95 p-4 shadow-lg backdrop-blur transition-opacity duration-500 motion-reduce:transition-none ${
        mounted ? "opacity-100" : "opacity-0"
      }`}
    >
      <p className="label-mono text-mute">{reason}</p>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            track("mode_change", { mode: "story", from: "hint" });
            setMode("story");
          }}
          className="label-mono min-h-[36px] rounded-full bg-amber px-4 text-amber-ink transition-transform hover:scale-[1.03] motion-reduce:transition-none"
        >
          Watch with video
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="label-mono min-h-[36px] rounded-full px-3 text-mute transition-colors hover:text-ink"
        >
          Keep posters
        </button>
      </div>
    </div>
  );
}
