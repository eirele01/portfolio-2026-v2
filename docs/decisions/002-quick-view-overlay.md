# ADR-002: Quick View is an overlay on `/` (not a `/quick` route)

**Status:** accepted · **Date:** 2026-10-31 · **Refs:** [UX-01], ARC-02

## Context
The blueprint specifies a `/quick` route. The deployment preview gateway used
for this build exposes exactly one user-visible route (`/`). The blueprint's
escape-hatch rule ("choose the safest default, log it, do not stall") applies.

## Decision
Quick View renders as a full-screen, focus-managed, print-friendly overlay on
the home route, reachable via:
- "Skip the story" buttons (chrome + hero),
- deep link `/?view=quick` (honored at SSR — no flash),
- browser back/forward (history entry pushed on open, popstate closes),
- Esc to close.

## Consequences
- Deep-link semantics preserved via query param instead of path.
- When deployed outside this sandbox, promote to the `/quick` route by moving
  `QuickView` into `src/app/quick/page.tsx` — the component is self-contained.
