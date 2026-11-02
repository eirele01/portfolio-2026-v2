import { setMode, type ExperienceMode } from "./experience";

/**
 * Mode-switch request bus [NAV-03]. The chrome toggle only RAISES a
 * request; ModeVeil registers the actual runner (it owns the curtain
 * animation, the scroll re-anchoring and stays mounted across the mode
 * swap — Chrome itself remounts, so it can't). If no veil is mounted
 * (headless trees, odd embeds) the switch falls back to a direct setMode
 * so the toggle can never dead-end.
 */
type Runner = (to: ExperienceMode) => boolean;

let runner: Runner | null = null;

export function registerModeSwitchRunner(fn: Runner | null): void {
  runner = fn;
}

/** Returns false when a switch is already in flight (runner busy). */
export function requestModeSwitch(to: ExperienceMode): boolean {
  if (runner) return runner(to);
  setMode(to);
  return true;
}
