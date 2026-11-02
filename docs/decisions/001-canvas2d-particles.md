# ADR-001: Hero particles use Canvas2D, not three.js/R3F

**Status:** accepted · **Date:** 2026-10-31 · **Refs:** [HERO-01], blueprint §13.1

## Context
The blueprint prefers `three` + `@react-three/fiber` for ~1,200 hero particles
but sets a hard budget: the lazy chunk must stay ≤ 200 KB and allows a Canvas2D
swap as the documented fallback.

## Decision
Implement HeroParticles with a single Canvas2D + rAF loop (sine-field drift,
mouse parallax ≤ 8px, converge/dissolve on hero exit, dpr cap 1.5, count halved
on mobile/low cores, paused offscreen and on hidden tabs).

## Consequences
- Zero extra dependencies; the hero ships no 3D runtime.
- Identical visual result at this particle count and size (1.5px points).
- If particles later need depth/3D, introduce R3F behind the same component
  API with a new ADR.
