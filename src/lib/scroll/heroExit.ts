/** Shared mutable state for the hero's exit handoff (no React re-renders). */
export const heroExitState = {
  /** 0..1 progress of the hero's scrubbed exit. */
  p: 0,
  /** Whether the hero stage is currently pinned/active. */
  active: false,
};
