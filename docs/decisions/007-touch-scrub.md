# ADR 007 — Story footage scrubs on every pointer (touch autoplay retired)

Date: 2026-11-17 · Round 39 [v1-2] · Supersedes blueprint §8.4's
`SCRUB_ON_TOUCH = false` touch fallback · Owner-approved

## Context

Blueprint §8.4 mandated that touch devices autoplay each pinned clip once
(muted, inline) instead of scrubbing, with the explicit instruction:
"Flip the flag if real-device testing shows scrubbing is smooth." The
flag lived in `StoryCanvas` as a `(pointer: coarse)` gate (`scrubRef`);
the scrub machinery itself — blob preloader [LOAD-01], short-GOP v4
encodes (g=12, no B-frames), the ±1 mounting window, rate-assist +
frame-quantized single-flight seeks + the 350 ms watchdog [SCR-10/11] —
was built pointer-blind from the start. Everything around the clips
(pins, beats, rail, dissolves) was already scroll-driven on phones; the
clips were the one exception, which is why the owner experienced mobile
story mode as "it just plays video". The owner real-device tested
(rounds 37–38 were both phone-driven) and decided: "i want in the mobile
screen to be scroll driven. i am all goods with the large screen do not
change it."

## Decision

`driveScrub` runs for EVERY pointer. The coarse-pointer branch is
deleted: no `scrubRef`, no `matchMedia`, no play-once effect. Desktop
behaviour is unchanged by construction — on fine pointers the old code
executed exactly the same ticker and `driveScrub` lines; the deleted
branches were no-ops there.

## Alternatives considered

- Keep autoplay, scrub only "when smooth" per device: untestable from the
  sandbox, and the owner already answered the question with their real
  phone.
- Scrub but keep a play-once fallback behind a flag: dead code and two
  playback paths to maintain for no user-visible benefit.

## Consequences

- Phones and desktop read the story identically; the clip layer finally
  matches the pins/beats/rail that were already scroll-driven on touch.
- Zero data-usage change on mobile: the preloader already fetched all 13
  `-m` clips as blobs (~28 MB); autoplay streamed the same bytes.
- Battery/thermal likely improve: autoplay kept decoding a clip to its
  end after the visitor stopped scrolling; scrub's settled branch halts
  decode the moment scroll stops.
- Rollback is one commit: restore the `scrubRef` gate + play-once effect
  (git history keeps both).
