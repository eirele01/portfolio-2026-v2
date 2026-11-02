# ADR-003: CinematicBackdrop stands in for the raw footage until it is encoded

**Status:** accepted · **Date:** 2026-10-31 · **Refs:** [MED-01..03], §9, §5.1

## Context
The hand-off did not include the raw videos/posters/portrait (only the
blueprint). The blueprint mandates: never invent content, fail gracefully,
do not stall.

## Decision
- Every dark stage renders `CinematicBackdrop`: abstract per-phase stage
  lighting (act-based glow position/tint, optional grid/scan texture,
  vignette) driven by the same stage timeline. It never pretends to be
  footage or product UI.
- `ScrubVideo` is fully implemented per §8.4 (lerp playhead on the GSAP
  ticker, poster crossfade on loadeddata/error, touch autoplay mode) and is
  wired into `PhaseSection` behind a runtime HEAD probe of
  `/media/video/phase-N.mp4`. When encoded media is added to `public/media/`,
  the video path activates with no code changes.
- The hero portrait slot shows a designed EJB monogram medallion (never a
  fake photo) until `public/media/hero/eirele-cutout.webp` exists, then swaps
  to the cut-out automatically.

## Consequences
- The experience is complete and honest today; footage upgrades it later.
- Media probes cost a handful of HEAD 404s in dev until media lands.
