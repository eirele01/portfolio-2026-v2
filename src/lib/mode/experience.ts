"use client";

import { useSyncExternalStore } from "react";

/**
 * Experience modes [ARC-01]:
 *  - story  (default): pinned, scrubbed cinematic story
 *  - lite: same content as flowing sections, posters/final-state visuals,
 *          light fade-in reveals, no video, no particles
 *  - static: prefers-reduced-motion or ?mode=static — zero motion
 * (quick is an overlay view, not a mode — see QuickView.)
 *
 * Resolution order [ARC-02]: explicit ?mode= > saved choice (localStorage,
 * try/catch) > prefers-reduced-motion > device/network heuristics > story.
 */
export type ExperienceMode = "story" | "lite" | "static";

const STORAGE_KEY = "ejb-experience-mode";

let mode: ExperienceMode | null = null; // null = unresolved (SSR renders story)
let resolvedBy = "default";
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const readSaved = (): ExperienceMode | null => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "story" || v === "lite" || v === "static" ? v : null;
  } catch {
    return null;
  }
};

const persist = (m: ExperienceMode) => {
  try {
    localStorage.setItem(STORAGE_KEY, m);
  } catch {
    // Storage can throw in private mode — choice stays session-only.
  }
};

function heuristicsLite(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  if (nav.connection?.saveData) return true;
  const et = nav.connection?.effectiveType;
  if (et === "slow-2g" || et === "2g" || et === "3g") return true;
  if ((nav.deviceMemory ?? 8) <= 2) return true;
  if ((nav.hardwareConcurrency || 8) <= 2) return true;
  return false;
}

export function resolveMode(urlParam?: string | null): {
  mode: ExperienceMode;
  reason: string;
} {
  const valid = urlParam === "story" || urlParam === "lite" || urlParam === "static" ? urlParam : null;
  if (valid) return { mode: valid, reason: "url-param" };
  const saved = readSaved();
  if (saved) return { mode: saved, reason: "saved" };
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return { mode: "static", reason: "reduced-motion" };
  }
  if (heuristicsLite()) return { mode: "lite", reason: "heuristics" };
  return { mode: "story", reason: "default" };
}

/** Runs once on mount. SSR default is "story" so prerendered HTML is story-mode. */
export function ensureModeResolved(urlParam?: string | null): ExperienceMode {
  if (mode !== null) return mode;
  const r = resolveMode(urlParam);
  mode = r.mode;
  resolvedBy = r.reason;
  emit();
  return mode;
}

/** Whether the mode has been resolved at least once (SSR default doesn't
 *  count). Used by the media preloader trigger: starting a 70 MB fetch
 *  before resolution could download footage for a visitor about to be
 *  downgraded to lite. */
export function isModeResolved(): boolean {
  return mode !== null;
}

export function setMode(m: ExperienceMode): void {
  if (mode === m) return;
  mode = m;
  resolvedBy = "visitor";
  persist(m);
  emit();
}

export const getMode = (): ExperienceMode => mode ?? "story";
export const getModeSource = (): string => resolvedBy;

export function useExperienceMode(): ExperienceMode {
  return useSyncExternalStore(subscribe, getMode, () => "story");
}
