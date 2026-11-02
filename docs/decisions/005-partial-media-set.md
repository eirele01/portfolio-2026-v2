# ADR-005: Partial media set — graceful per-asset activation

**Status:** Accepted · **Date:** 2026-10-31 · **Scope:** media pipeline & story rendering

## Context

The blueprint (§9.1) specifies the full raw set: 7 phase clips, 6 transition
clips, 7 phase stills and the green-screen portrait. The owner's hand-off
contains **3 of 13 clips** (phase 1, transition 1→2, phase 2), **5 of 7
stills** (phases 1–4, 7) and the green-screen portrait. No `resume.pdf`.

## Decision

1. **Encode whatever exists; report whatever doesn't.** `scripts/media/encode.mjs`
   treats the full manifest as expected, prints `SKIPPED` per missing raw file
   and writes `scripts/media/media-report.txt`. The build is never blocked by a
   partial hand-off.
2. **Posters follow the footage.** For a phase WITH a clip, the poster is the
   clip's frame 0 ([MED-03] — the raw stills are *not* frame-identical: measured
   mean-abs-diff ≈ 49–78 @64px). For phases without footage, the raw still is
   the poster. Phases 5/6 have neither → CinematicBackdrop (ADR-003).
3. **Per-asset runtime activation (extends ADR-003).** `ScrubStory` HEAD-probes
   each phase clip *and* transition clip; `TransitionStage` renders a scrubbed
   `ScrubVideo` when its clip exists, else the backdrop. `ScrubVideo` picks the
   `-m` mobile variant with a one-shot fallback to the desktop file.
   `FlowingStory` (lite/static) shows the phase poster when it exists.
4. **Continuity is reported, not patched.** Both existing boundaries are HARD
   CUTs (diff 56 / 89); the optional 8% crossfade bridge (§8.6) stays a P2
   backlog item rather than a silent fix.
5. **The hero cut-out is machine-keyed.** A green-excess key
   (g − max(r,b); thresholds probed in `scripts/media/probe.mjs`: background
   41–63, subject ≤ 15), despill, 1px feather + choke; trimmed via a manual
   alpha bounding box (sharp's `.trim()` collapses alpha canvases). Inspected
   over `#f4f2ee` and `#0a0a0b` — no halo ([MED-04]).

## Consequences

- Dropping further raw files into `raw-assets/` and re-running
  `node scripts/media/encode.mjs` activates them with **no code changes**.
- The story currently mixes scrubbed video (phases 1–2, transition 1→2) with
  stage-lit backdrops (phases 3–7) — acceptable as an intentional act-based
  visual language (ADR-003) until the remaining clips arrive.
- `TODO.md` lists the missing raw assets for the owner.

## Update — 2026-10-31 (second hand-off)

The owner delivered phase 3/4/5 clips, transitions 2→3 … 5→6 and the phase
5/6 stills. Re-running the encoder activated everything with zero component
changes — the probe-driven runtime simply found the files (10/13 clips,
7/7 stills at that point). Continuity: one CONTINUOUS boundary (T3-4 → P4,
diff 1.9), the rest hard cuts — consistent with the act-based language.

## Update — 2026-10-31 (third hand-off)

The owner delivered the final two phase clips (`phase_6_raw_video.mp4`,
`phase_7_raw_video.mp4`). Re-running the encoder activated them with zero
component changes, as designed. The set is now **12/13 clips and 7/7
stills** — every phase of the story runs real scrubbed footage; only
`phase_6_transition_to_phase_7_raw_video.mp4` is missing, so that one
boundary keeps its stage-lit breath (ADR-003). Posters for phases 6/7
regenerated from the clips' frame 0 per [MED-03]; continuity for the new
boundaries is in `media-report.txt` (T5-6 → P6 hard cut, diff 50.95).

Same-day nav hardening (see TODO §Site meta): cold loads could land deep
links on stale pin offsets. `ScrubStory` now verifies the landing and
re-jumps until it sticks (respects user scroll), `scrollToTarget` forces
through the scroll lock (programmatic intent), and `Portfolio` refreshes
ScrollTrigger on fonts.ready plus a debounced body ResizeObserver so pin
starts always match the final layout.

## Update — 2026-10-31 (final hand-off: complete set)

`phase_6_transition_to_phase_7_raw_video.mp4` arrived — the raw set is now
**13/13 clips and 7/7 stills** with zero SKIPPED entries. Continuity for the
last boundaries: P6 → T6-7 diff 4.2 and T6-7 → P7 diff 2.2, both CONTINUOUS —
the story now flows unbroken from deployment into the maintenance finale.
The t-6-7 stage switched from its stage-lit breath to real scrubbed footage
with no component changes, closing the loop on ADR-005's core promise.

The full-set encode also surfaced a latent defect the missing clip had been
masking: transition clips never scrubbed (they sat on frame 0 for the whole
pin). Root cause: `ScrubVideo` registers its playhead driver on the timeline
from `useStageTL` (PhaseStage's context), but `TransitionStage` provided its
own separate, consumer-less context — so inside transitions `useStageTL()`
returned null. Fix: `TransitionStage` now shares PhaseStage's
`StageTLProvider`; verified t-5-6 and t-6-7 playheads advance mid-pin.
