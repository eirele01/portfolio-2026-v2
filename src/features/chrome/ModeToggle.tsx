"use client";

import { useExperienceMode, type ExperienceMode } from "@/lib/mode/experience";
import { requestModeSwitch } from "@/lib/mode/switch";

/**
 * ModeToggle [NAV-03] — the STORY / LITE switch in the chrome, beside
 * "Contact". A segmented pill with a sliding amber thumb; the swap itself
 * is animated by ModeVeil (a cinematic cut to the other rendering,
 * re-anchored to the visitor's current narrative landmark). "static"
 * (reduced motion / data saver) rides the LITE side — same flowing
 * rendering family; choosing STORY is the explicit opt-in.
 */
const SIDES: { key: Exclude<ExperienceMode, "static">; label: string }[] = [
  { key: "story", label: "Story" },
  { key: "lite", label: "Lite" },
];

export function ModeToggle() {
  const mode = useExperienceMode();
  const active: Exclude<ExperienceMode, "static"> = mode === "story" ? "story" : "lite";

  return (
    <div
      role="group"
      aria-label="Experience mode"
      className="relative flex items-center rounded-full border border-line p-[3px]"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-[3px] left-[3px] w-[calc(50%-3px)] rounded-full bg-amber transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
        style={{ transform: `translateX(${active === "lite" ? "100%" : "0%"})` }}
      />
      {SIDES.map((side) => {
        const isActive = active === side.key;
        return (
          <button
            key={side.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => {
              if (!isActive) requestModeSwitch(side.key);
            }}
            className={`label-mono relative z-10 w-16 min-h-[34px] text-center text-[0.6rem] transition-colors duration-200 ${
              isActive ? "text-amber-ink" : "text-mute hover:text-ink"
            }`}
          >
            {side.label}
          </button>
        );
      })}
    </div>
  );
}
