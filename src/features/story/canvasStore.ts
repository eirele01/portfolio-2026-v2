"use client";

import { useSyncExternalStore } from "react";
import type { gsap } from "gsap";

/**
 * Story canvas store [SCR-07].
 *
 * The story renders ONE persistent, viewport-filling stage (StoryCanvas) that
 * never scrolls. Each pinned section drives its footage layer through this
 * store instead of owning a <video>:
 *
 *   - `getSegment(key)` → stable `{ playhead, opacity }` proxy objects. The
 *     section's stage timeline tweens `playhead.p` (0..1) and `opacity.o`
 *     (0..1); the canvas reads them on the GSAP ticker and maps the playhead
 *     to `video.currentTime`, the opacity to the layer's style. Because the
 *     layers live on the canvas, footage crossfades IN PLACE at boundaries —
 *     nothing scrolls between sections. Hand-off overlap [SCR-08]: the
 *     crossfade runs across the END of each pin (see wireSegmentTweens), so
 *     the next clip is already moving while the current one lands — no dead
 *     pause at any clip end.
 *
 *   - `activeSegment` mirrors which section currently owns the viewport. The
 *     canvas keeps a ±1 src window mounted around it (memory + bandwidth)
 *     and, on coarse pointers, plays the active clip instead of scrubbing.
 */

export interface SegmentState {
  /** Normalized 0..1 playhead, tweened by the owning section's timeline. */
  playhead: { p: number };
  /** Layer visibility 0..1, tweened by the owning section's timeline. */
  opacity: { o: number };
}

const segments = new Map<string, SegmentState>();

export const getSegment = (key: string): SegmentState => {
  let s = segments.get(key);
  if (!s) {
    s = { playhead: { p: 0 }, opacity: { o: 0 } };
    segments.set(key, s);
  }
  return s;
};

/** Story order — adjacent segments crossfade into each other. */
export const SEGMENT_ORDER = [
  "p1",
  "t1-2",
  "p2",
  "t2-3",
  "p3",
  "t3-4",
  "p4",
  "t4-5",
  "p5",
  "t5-6",
  "p6",
  "t6-7",
  "p7",
] as const;

/**
 * Seamless hand-off tuning [SCR-08].
 *
 * Pins are adjacent (one section's pin end == the next section's pin start),
 * so a crossfade that only runs inside the NEXT pin starts from a frozen
 * frame — visitors read that as a dead pause at the end of every clip.
 * Instead each stage's timeline spends its FINAL stretch dissolving into the
 * next segment WHILE its own footage is still scrubbing:
 *
 *   [0 .. HANDOFF_AT]            own clip scrubs start→1
 *   [HANDOFF_AT .. 1]            next clip fades in + scrubs 0→HANDOFF_LEAD,
 *                                own clip fades out (both keep moving)
 *   next stage's pin             picks the playhead up from HANDOFF_LEAD
 *
 * The next stage's own timeline must therefore start its playhead tween at
 * `HANDOFF_LEAD` (see wireSegmentTweens). Values are fractions of a stage
 * timeline (0..1 over the whole pin).
 */
export const HANDOFF_AT = 0.82; // dissolve begins (last 18% of the pin)
export const HANDOFF_FADE = 0.14; // opacity crossfade length (of the pin)
export const HANDOFF_LEAD = 0.18; // how far into the next clip we scrub early

const nextKey = (key: string): string | null => {
  const i = SEGMENT_ORDER.indexOf(key as (typeof SEGMENT_ORDER)[number]);
  if (i < 0 || i >= SEGMENT_ORDER.length - 1) return null;
  return SEGMENT_ORDER[i + 1];
};

/** First key in story order (plays from its true frame 0). */
export const FIRST_SEGMENT = SEGMENT_ORDER[0];

/**
 * Registers the canvas tweens for one pinned stage on its timeline:
 * its own playhead (entering at `HANDOFF_LEAD` unless it opens the story)
 * plus the crossfade into the next segment. Returns the created tweens so
 * the stage can kill them on cleanup.
 *
 * Own opacity is deliberately NOT tweened at the start: the previous stage's
 * hand-off leaves it at 1 (a zero-duration `set` would immediateRender and
 * light the layer up while the previous clip still owns the screen). Stages
 * that open the story fade in from the canvas black instead.
 */
export function wireSegmentTweens(
  tl: gsap.core.Timeline,
  key: string,
): gsap.core.Animation[] {
  const own = getSegment(key);
  const next = nextKey(key);
  const tweens: gsap.core.Animation[] = [];

  // Own footage: entering playhead → 1 across the whole pin.
  const startAt = key === FIRST_SEGMENT ? 0 : HANDOFF_LEAD;
  tweens.push(
    tl.fromTo(own.playhead, { p: startAt }, { p: 1, duration: 1, ease: "none" }, 0),
  );

  if (key === FIRST_SEGMENT) {
    // Story opener: fade up from the canvas black, reversible at the top.
    tweens.push(
      tl.fromTo(own.opacity, { o: 0 }, { o: 1, duration: 0.03, ease: "none" }, 0),
    );
  }

  if (next) {
    const nx = getSegment(next);
    // Dissolve: next layer up, own layer down — both while still moving.
    tweens.push(
      tl.fromTo(
        nx.opacity,
        { o: 0 },
        { o: 1, duration: HANDOFF_FADE, ease: "none" },
        HANDOFF_AT,
      ),
    );
    tweens.push(
      tl.to(
        own.opacity,
        { o: 0, duration: HANDOFF_FADE, ease: "none" },
        HANDOFF_AT + (HANDOFF_LEAD - HANDOFF_FADE),
      ),
    );
    // Pre-scrub the next clip so it is already moving at the hand-off.
    tweens.push(
      tl.fromTo(
        nx.playhead,
        { p: 0 },
        { p: HANDOFF_LEAD, duration: 1 - HANDOFF_AT, ease: "none" },
        HANDOFF_AT,
      ),
    );
  }
  return tweens;
}

let activeSegment: string | null = null;
const listeners = new Set<() => void>();

export const setActiveSegment = (key: string | null): void => {
  if (activeSegment === key) return;
  activeSegment = key;
  listeners.forEach((l) => l());
};

export const getActiveSegment = (): string | null => activeSegment;

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** React binding for the canvas (re-renders only on segment change). */
export function useActiveSegment(): string | null {
  return useSyncExternalStore(subscribe, getActiveSegment, () => null);
}
