# 006 — Story canvas: one persistent stage for all footage

Date: 2026-10-31 · Status: Accepted · Supersedes the per-section video of ADR-003/005 · Refs [SCR-07]

## Context

Visitor feedback after the full 13-clip media set landed:

1. At every phase → transition → phase boundary the outgoing video **scrolled up
   with the page** before the next clip appeared. The transition clips existed
   precisely to connect phases, but they never got the chance: with one pinned
   section per segment, each unpin rolls a full viewport of DOM — the videos
   rolled with it, so the "connection" was two hard cuts with a page-roll
   between them.
2. The scrub felt laggy (15fps encodes + sub-frame seek storms).
3. Example widgets (SketchToUi, terminals, pipeline, …) sat centered and
   covered the footage subject.
4. Video looked blurry (CRF 26).

## Decision

**All footage lives on one persistent, never-scrolling stage.**

- `StoryCanvas` renders a `sticky top-0` viewport-filling layer behind every
  pinned section (negative bottom margin so it occupies zero flow height).
  It owns all 13 clips as absolutely-stacked layers (poster + `<video>` +
  scrim, or `CinematicBackdrop` when a clip is absent).
- Sections keep their pins, beats and labels but render **text only**. Each
  stage timeline drives its segment's `playhead.p` (0..1) and `opacity.o`
  through the `canvasStore` external store; the canvas applies them on the
  GSAP ticker (no React re-renders while scrubbing).
- Boundary hand-off: the outgoing layer **holds** (progress clamps at 1) while
  text rolls away; the incoming layer dissolves in over the first ~3–4% of its
  pin. Only phase 7 fades out at its end, handing off to the light Contact
  sheet. Nothing visual ever rolls.
- Loading: a ±1 segment window around the active one keeps `<video>` mounted
  with `preload="auto"`; everything else shows posters. The existing probe +
  prefetch chain (ADR-005) is unchanged. Coarse pointers still play the active
  clip instead of scrubbing; every other pointer scrubs (headless/unknown
  pointers count as desktop — `!pointer: coarse`, not `pointer: fine`).
- Encodes (scripts/media/encode.mjs): 24fps (source rate), desktop CRF 20
  lanczos + light unsharp / mobile CRF 24, all-intra (`-g 1`) preserved —
  every frame is a seek target. Seek loop is frame-quantized (1/24s) with a
  direct snap on flick-scrolls.
- Pacing: phase scroll lengths +20–25%, transitions 150→180vh; visual beats
  anchored lower-left (`VisualShell`); stage label/caption beat in/out so no
  text rolls over held footage.

## Consequences

- The transition clips finally do their job: phase → morph → phase plays in
  place with no page-roll.
- 13 stacked layers is cheap: at most ±1 have mounted `<video>`; hidden layers
  are `visibility: hidden` and skipped by the ticker's style writes.
- Raw footage is 1280×720 — that is the hard quality ceiling; the CRF 20 +
  sharpening encode presents it as cleanly as the source allows.
- `ScrubVideo.tsx` is deleted; per-section scrims moved onto the canvas
  layers. Lite/static (`FlowingStory`) is untouched.
- Fast Refresh (dev-only) can transiently throw React `removeChild` errors
  while pins hold DOM; verified not reproducible on any real user path
  (deep scroll, mode switches story⇄lite⇄story).

## Verification highlights (2026-10-31, live dev server)

- Playhead vs scroll: p1 4.8s @ 48%, 9.4s @ 94% (reverse), t1-2 3.6s @ 36%,
  p2 5.0s @ 50% — frame-accurate both directions.
- Boundary: p1 holds 1.00/10s through the roll zone; t1-2 fades 0 → 0.82 → 1.00
  across the first ~150vh of its pin while its video scrubs from 1.1s.
- p7 store opacity 1.00 → 0.525 (mid-fade) → 0 before Contact.
- Mode switches and a 12-step fast scroll pass: no console errors.
