"use client";

import { setMode, useExperienceMode, type ExperienceMode } from "@/lib/mode/experience";
import { track } from "@/lib/analytics";

/**
 * Experience toggle [ARC-02]: Story / Lite. The visitor's choice persists
 * (localStorage, try/catch). Static is system-driven (reduced motion) and
 * not offered here.
 */
export function ExperienceToggle() {
  const mode = useExperienceMode();
  const options: { value: ExperienceMode; label: string }[] = [
    { value: "story", label: "Story" },
    { value: "lite", label: "Lite" },
  ];
  return (
    <div
      role="group"
      aria-label="Experience mode"
      className="inline-flex items-center gap-0.5 rounded-full border border-line p-0.5"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={mode === o.value}
          onClick={() => {
            track("mode_change", { mode: o.value });
            setMode(o.value);
          }}
          className={`label-mono min-h-[36px] rounded-full px-3 transition-colors ${
            mode === o.value ? "bg-amber text-amber-ink" : "text-mute hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
