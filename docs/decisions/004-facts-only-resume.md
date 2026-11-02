# ADR-004: A FACTS-only resume PDF is generated so the download CTA works

**Status:** accepted · **Date:** 2026-10-31 · **Refs:** §4 FACTS, §17

## Context
`raw-assets/resume.pdf` was not provided. A broken "Download resume" link
would fail the 30-second test.

## Decision
`scripts/make_resume.py` generates `public/Eirele_Joven_Boter_Resume.pdf`
containing only blueprint FACTS: identity, contact, positioning, career path
(2014–present), the three projects with stacks/URLs, and the skill groups.
No invented employers, dates, education or metrics.

## Consequences
- Every conversion CTA on the site works today.
- The owner replaces the file with the real resume (same path) — listed in
  TODO.md; the site needs no change.
