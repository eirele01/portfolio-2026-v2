"use client";

import { useSyncExternalStore } from "react";

/**
 * Active phase store — tiny external store (allowed by blueprint §14.1) so
 * the rail, progress bar and live region subscribe without re-rendering the
 * story. Set from ScrollTrigger callbacks; never React state. [SCR-03]
 */
export interface PhaseMeta {
  index: number;
  name: string;
  slug: string;
}

let activePhase = 0;
let storyProgress = 0;
const phaseListeners = new Set<() => void>();
const progressListeners = new Set<() => void>();

export const setActivePhase = (n: number): void => {
  if (activePhase === n) return;
  activePhase = n;
  phaseListeners.forEach((l) => l());
};

export const getActivePhase = (): number => activePhase;

export const setStoryProgress = (p: number): void => {
  storyProgress = p;
  progressListeners.forEach((l) => l());
};

export interface PhaseRef { meta: PhaseMeta; el: HTMLElement }

/** Element registry so rail/hash navigation can find pinned sections. */
const phaseEls = new Map<number, HTMLElement>();

export const registerPhaseEl = (index: number, el: HTMLElement | null): void => {
  if (el) phaseEls.set(index, el);
  else phaseEls.delete(index);
};

export const getPhaseEl = (index: number): HTMLElement | undefined =>
  phaseEls.get(index);

export function useActivePhase(): number {
  return useSyncExternalStore(
    (l) => {
      phaseListeners.add(l);
      return () => phaseListeners.delete(l);
    },
    getActivePhase,
    () => 0,
  );
}

/** Imperative progress subscription (mutates DOM via refs, no re-render). */
export function onStoryProgress(cb: (p: number) => void): () => void {
  const l = () => cb(storyProgress);
  progressListeners.add(l);
  return () => progressListeners.delete(l);
}
