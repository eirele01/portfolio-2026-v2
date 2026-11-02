# Eirele Joven Boter — Portfolio

A portfolio that **is** a software project: the visitor plays the client and
scrolls through the 8 stages of the software development life cycle — from the
first conversation to "Let's build yours."

Built from `portfolio-blueprint.md` (single source of truth). All copy traces
to its FACTS section; banned words are avoided; "AWS" never appears; the
fictional demo client (Novara) is labelled wherever it appears.

## Stack

- **Next.js 16 (App Router) + TypeScript strict** — prerendered text first;
  every animated part is a client component.
- **GSAP 3 + ScrollTrigger + @gsap/react, Lenis** — one master normalized
  timeline per pinned stage; native scroll preserved (no scroll-jacking,
  keyboard untouched, `syncTouch: false`).
- **Tailwind CSS 4 + CSS custom-property tokens** — design system in
  `src/app/globals.css` (amber `#FFB454` accent, film-title darks, Geist /
  Geist Mono self-hosted).
- **Zod-validated content modules** — `src/content/*` owns every word and
  number; components own presentation; exhaustive-renderer switches fail
  compilation when a beat kind has no renderer.

## The experience

One content model, four renderings (`useExperienceMode`, blueprint §5.1):

| Mode | When | What |
|---|---|---|
| `story` | default | Pinned, scrubbed, cinematic story (8 phases + transitions + dip) |
| `lite` | saveData / 2–3g / low memory / visitor toggle | Same content flowing, visuals in final state, light reveals |
| `static` | `prefers-reduced-motion`, `?mode=static` | Zero motion, everything stacked |
| Quick View | `/?view=quick` or "Skip the story" (ADR-002) | One-page printable summary |

Deep links: `/#discovery`, `/#design`, `/#architecture`, `/#development`,
`/#testing`, `/#deployment`, `/#maintenance`, `/#contact`.

## Media

Raw footage is now partially in (`scripts/media/media-report.txt`,
ADR-005): **phase 1, phase 2 and the transition 1→2 are real scrubbed
clips**; phases 3–7 render CinematicBackdrop until their clips arrive.
The hero shows the keyed green-screen cut-out (no halo, verified over
light and dark). Lite/static modes show phase posters where they exist.

```bash
node scripts/media/encode.mjs   # encode raw-assets/ → public/media/ + report
python3 scripts/make_og.py      # regenerate the OG image from the cut-out
```

Drop further raw files into `raw-assets/` and re-run the encode — the site
activates them automatically (runtime probe, ADR-003/005):

```
public/media/
  hero/eirele-cutout.webp           # keyed portrait (light + dark verified)
  video/phase-N.mp4  phase-N-m.mp4  # all-intra, ≤10MB / ≤4MB
  video/transition-N-M.mp4 (-m)
  posters/phase-N-{1600,800}.webp   # frame 0 when a clip exists
```

A FACTS-only resume PDF (`scripts/make_resume.py`) powers the download CTA
until the real resume replaces it (ADR-004, TODO.md).

## Develop

```bash
bun install
bun run dev        # http://localhost:3000
bun run lint       # eslint
bunx tsc --noEmit  # typecheck
```

Env: `NEXT_PUBLIC_MEDIA_BASE_URL` (optional CDN prefix for `/media/**`),
`NEXT_PUBLIC_SITE_URL` (canonical/OG/sitemap origin),
`NEXT_PUBLIC_DEBUG_ANALYTICS=1` (log analytics events in dev).

## Verify (quick pass)

- `/?mode=story` — scroll the whole story; check transitions, beats, rail,
  progress bar, theme dip, contact, footer toggle.
- `/?mode=static` and `?mode=lite` — same content, no pinning.
- `/?view=quick` — Quick View; Esc/back closes; print-friendly.
- Keyboard: Tab order starts at "Skip to main content"; rail dots, SDLC-loop
  buttons and copy-email are operable; Esc closes the overlay.
- 390px and 1440px widths.

## Docs

- `docs/decisions/*.md` — ADRs (particles, Quick View overlay, backdrops,
  resume).
- `TODO.md` — `CONFIRM` items (unconfirmed sentences are omitted, never
  invented) and the media checklist.
- `PROMPT.md` — the original blueprint (source of truth).
