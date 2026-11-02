# TODO

> Full project state (architecture, commands, feedback log, media pipeline)
> lives in `PROJECT_STATE.md` — read that first in a new session.

Items tagged `CONFIRM` need the owner's answer. Per blueprint §4, they are
omitted from copy (never invented) and listed here.

## CONFIRM

| # | Item | Current handling |
|---|------|------------------|
| 1 | ~~Reservation PH — problem sentence~~ | **Moot (2026-10-31, round 12)**: the story through-line is now the labelled demo client Novara (smart-home hub) — phase 1 no longer references Reservation PH. |
| 2 | **Reservation PH — result sentence** | Omitted entirely (Phase 4 card shows features + stack only). |
| 3 | **Duff Street Clinic — result sentence** | Omitted entirely. |
| 4 | **BrilliantPOS — result sentence** | Omitted entirely (kept metric `250 businesses` is shown). |
| 5 | ~~Duff Street URL~~ | **Resolved (2026-11-01, round 16)**: the owner's own list uses `https://duffstreetcomplex.com.au/` — the ANSWER value was right. |
| 6 | **AI Engineering example** — none yet | `flags.showAiNode = false`; the optional AI node renders nothing and AI work is claimed nowhere. |

## Media

Encoded and live (2026-10-31, third hand-off, see `scripts/media/media-report.txt`):

- [x] Green-screen portrait → keyed cut-out at `public/media/hero/eirele-cutout.webp`
      (+ `-800.webp`), inspected over light and dark — no halo (ADR-005).
- [x] `phase_{1..7}_raw_video.mp4` → `phase-N.mp4` / `phase-N-m.mp4` (all within budget).
- [x] `phase_{2,3,4,5}_transition_to_phase_{3,4,5,6}_raw_video.mp4` → `transition-N-M.mp4` / `-m.mp4`.
- [x] Posters: clips' frame 0 for all phases with footage + transitions 1→2 … 5→6;
      stills stand in for phase 6/7 posters if the 6→7 transition never arrives.
- [x] Continuity measured for every boundary with footage — one CONTINUOUS
      (T3-4 last → P4 first, diff 1.9), the rest hard cuts (ADR-005).
- [x] og-image regenerated with the real portrait (`scripts/make_og.py`).

Raw set complete — 13/13 clips, 7/7 stills (2026-10-31). Remaining:

- [x] `phase_6_transition_to_phase_7_raw_video.mp4` — delivered 2026-10-31,
      encoded, continuity P6→T6-7 (diff 4.2) and T6-7→P7 (diff 2.2) both
      CONTINUOUS. **The raw set is complete: 13/13 clips, 7/7 stills.**
- [ ] Replace the generated FACTS-only resume
      (`public/Eirele_Joven_Boter_Resume.pdf`, built by `scripts/make_resume.py`)
      with the owner's real resume at the same path.

## Site meta

- [x] Fixed 2026-10-31 (later): transition clips never scrubbed — they sat on
      frame 0 for the whole pin. `ScrubVideo` reads the stage timeline via
      `useStageTL` (PhaseStage's context), but `TransitionStage` provided its
      own separate (and consumer-less) context, so inside transitions the
      playhead tween never registered. Now `TransitionStage` shares
      PhaseStage's provider (`StageTLProvider`); verified t-5-6 and t-6-7
      playheads advance mid-pin, phases unaffected.
- [x] Added 2026-10-31: `ModeHint` — when the app silently downgrades a
      visitor to lite/static (data saver, slow network, low memory or OS
      reduced motion), a dismissible pill explains it and offers a one-tap
      "Watch with video" switch. Never shown for explicit choices
      (`?mode=`, toggle).
- [x] Fixed 2026-10-31: deep links (`#testing` etc.) could land on pre-pin
      offsets, most visibly on a cold load — three stacked causes: (1) a
      one-shot jump racing the pin layout, (2) `lenis.scrollTo` being a no-op
      while the scroll lock held (now `force: true` for programmatic scrolls),
      (3) late fonts shifting spacers after the last ScrollTrigger.refresh.
      The loader now follows the target's trigger start until the position
      actually sticks (`ScrubStory`), Portfolio refreshes on fonts.ready plus
      a debounced body ResizeObserver. Verified: 4 cold-context runs across
      390px/1440px land exactly; manual scroll, Contact and Back-to-start
      unaffected.

- [x] Fixed 2026-10-31 (SCR-10, "video still shuttery / sometimes not
      playing"): two compounding causes. (1) All-intra encodes (g=1) made
      every frame a full I-frame — 8–13 MB per clip (161 MB total) meant the
      ±1 preload window could never buffer far enough ahead, and every seek
      paid an I-frame decode (~30–55 ms). Re-encoded v3: short closed GOP
      (g=12), B-frames off, same 24fps/CRF20/1280 quality — clips now 3–6 MB
      (70 MB total), fully buffered on mount, warm seeks ~17 ms.
      (2) The scrub driver lerped its seek target every tick, so the seek
      pipeline never settled. Rewritten as `driveScrub` (StoryCanvas): a
      three-regime control loop — settle (pause when within ½ frame, zero
      decode), rate-assist (small forward gaps play NATIVELY with
      playbackRate 1+gap/0.14, velocity-matched to the scroll, no seeks at
      all), single-flight frame-quantized seeks (reverse moves, flicks,
      unbuffered targets). Crossfades give the highest-opacity layer full
      treatment; the fading layer scrubs at half rate. Verified in-browser:
      continuous slow scroll = ~0 seeks (rate loop covers it), reverse =
      fine-grained seeks that never fight playback, boundary crossfades
      correct, console clean.
- [x] Fixed 2026-10-31 (rollback recovery): the sandbox restored the workspace
      from an older snapshot (source tree back to the ~05:28 state — pre
      canvas architecture, pre content ledes, pre QuickView/lite scroll
      fixes; git-ignored public/media kept the v3 encodes). Rebuilt from the
      session record: StoryCanvas + canvasStore (SCR-07/08/10) re-created,
      PhaseStage/TransitionStage/ScrubStory/media.ts restored, QuickView
      lockScroll+data-lenis-prevent and Portfolio destroyScrollEngine
      re-applied [SCR-09], phase ledes [CNT-04] and the Dip "THE STORY"
      opener re-written, encode.mjs back on v3 short-GOP. HEAD probes no
      longer ship — probeMedia uses a 1-byte ranged GET, so the preview
      gateway stops 403-ing the availability checks. Everything committed to
      git afterwards so a future snapshot restore lands on this state.

- [ ] Set `NEXT_PUBLIC_SITE_URL` in production env so `metadataBase`,
      canonical/sitemap URLs and OG URLs are absolute.
- [ ] Wire a cookieless analytics provider (Plausible/Umami) —
      `lib/analytics.ts` is the single facade [ANA-01].
- [ ] P2: `/work/[slug]` case-study pages and the "Behind the build" panel.
- [ ] P2: CI wiring (Lighthouse CI, axe via Playwright) per blueprint §16.

- [x] Fixed 2026-10-31 [SCR-11] — visual placement + reading pace + boundary
      freezes (visitor round 7):
      (1) Visual beats (SketchToUi, ArchitectureDiagram, CommitLog,
      TerminalTests, PipelineStrip, SdlcLoop) moved from dead-center to the
      LOWER-LEFT on desktop (VisualShell: `lg:items-end lg:justify-start
      lg:pb-[9svh]`, aligned with the text column); entrance travel raised
      to 24px so they rise out of the corner. Below lg the mobile placement
      (above the bottom panel) is unchanged. The clip's subject now stays
      visible center/right.
      (2) Reading pace: every pin's scrollVh raised ~40% (phases 250–400 →
      350–560, transitions 150 → 210; mobile likewise) so captions and
      visuals stay on screen longer per wheel notch.
      (3) ROOT CAUSE of "video pauses / sticks while scrolling": sequential
      `top top` pins with pinSpacing always leave the outgoing section's own
      height as dead scroll between pin end and the next pin start — the
      incoming clip's playhead sat parked at HANDOFF_LEAD for a FULL viewport
      at every one of the 12 boundaries (~30% of the journey had frozen
      footage). Fix: each TransitionStage/PhaseSection (phase 1 excepted)
      sits in a wrapper with `-mt-[100svh]`, pulling every pin start exactly
      onto the previous pin end (verified in-browser: boundary gaps = 0px;
      clip times advance continuously both directions across boundaries).
      Margin lives on the wrapper, never on the pinned element (GSAP measures
      pinned elements via rects).
      (4) Scrub-driver hardening [SCR-10 rev]: tick-parity bug fixed (the
      per-CALL tickNo counter gave the fading layer a FIXED parity, so it
      could freeze for a whole crossfade — now one increment per ticker
      tick); rate-assist requires buffer HEADROOM (0.35s past the target) so
      native playback never runs into the buffer edge (the other "pause"
      reading, slow links); seek watchdog supersedes any seek stuck >350ms
      instead of single-flight-blocking forever; playbackRate cap 6 → 4.
      probeMedia now uses a 1-byte ranged GET (HEAD 403s on the preview
      gateway — media loads cleanly through it).

- [x] Added 2026-10-31 [LOAD-01] — first-visit/refresh preloader (owner:
      "better to have a loading in the first open of the profile to fully
      load all the asset specially the video"). `src/lib/media/preload.ts`
      fetches every story asset up front behind the Loader: 13 clips become
      in-memory Blobs (`resolveVideoSrc` hands `<video>` blob: URLs, so
      scrub/seek/rate-assist never wait on the network again), posters +
      hero warm the HTTP cache. Byte-weighted progress (rAF-coalesced)
      drives the Loader bar, % readout and "footage NN/13" counter; reveal
      waits for preload + fonts (min 650ms brand moment). Safety valves:
      "Skip loading" button after 6s / Esc (aborts in-flight fetches,
      finished blobs kept, unfinished clips stream the old way via the idle
      probe fallback — now cancellable on unmount), 25s hard cap.
      Ordering rules that matter: the preload starts ONLY in Portfolio's
      post-resolution effect (story mode) — ScrubStory mounts before mode
      resolution and would otherwise fetch 70MB for ?mode=lite visitors
      (verified: lite/static = 0 video requests); the phase-prefetch links
      now fire only when preload status is "skipped" (else they race the
      preloader — observed phase-1 downloaded twice). Refresh included:
      blobs rebuild from `cache: "force-cache"` at disk speed (~0.3s warm).
      Verified on dev: story loads exactly 13 video requests, all mounted
      videos blob-served + fully buffered, scrub follows scroll both
      directions, crossfades correct, deep link lands, console clean;
      production rebuilt and restarted (:3000 200, ranged media 206).
      Skip-path verified by review only (localhost finishes <1s — the
      button/Esc/25s cap couldn't be triggered locally; first real slow
      visit via the preview gateway will exercise it).

- [x] Fixed 2026-10-31 [CACHE-02/03] — "much better now, but still slow
      rendering of the video, cache? CDN?". Measured first: sandbox origin
      serves at ~350 MB/s, gateway loop ~30 MB/s, full GETs DO forward the
      [CACHE-01] Cache-Control/ETag (only HEAD is 403 and 206s drop the
      headers) — so the remaining cost is the user-side proxy leg and
      ~70 MB of desktop footage on a cold cache. Shipped:
      (1) [CACHE-02] public/sw.js — media Service Worker, registered
      beforeInteractive in the root layout so first-visit preloader
      fetches land in it. Cache-first Cache API layer ("media-v1") for
      same-origin GETs under /media/ WITHOUT a Range header
      (ignoreVary match; populate on miss). ≤2 MB responses (posters,
      hero) serve stale-while-revalidate so re-encoded posters self-heal;
      mp4 clips are strict cache-first — after a re-encode bump
      media-v1→media-v2 in sw.js (noted in encode.mjs header too).
      Range requests pass through untouched (1-byte availability probes
      must not trigger multi-MB downloads; streaming fallback needs
      native 206s). Purge: postMessage "purge-media-cache" to the SW.
      (2) [CACHE-03] src/lib/media/variant.ts — pickVideoVariant(), one
      session-stable full(1280w)/light(720w) decision used by the
      preloader, ScrubStory availability maps AND StoryCanvas layer pick
      (blob map keyed by URL — the decision must live in one function).
      Touch/narrow = light always; desktop = light when Network
      Information API reports saveData / ≤3g / downlink < 1.5 Mbps
      (~17 MB vs ~70 MB); Safari/Firefox desktop keep full quality.
      (3) CDN question answered: production deploys get edge caching for
      public/ automatically and NEXT_PUBLIC_MEDIA_BASE_URL already makes
      the clips bucket/CDN-portable; nothing attachable to the preview
      gateway in-sandbox.
      Verified on production (:81 via gateway path): SW registers and
      controls the page, first visit caches 13 videos + 14 images;
      repeat visit = 31 media requests, 0 over the network, both mounted
      videos blob-served and fully buffered; scrub forward (settle +
      rate-assist) and reverse (frame-quantized seeks) unchanged; lite
      mode = 0 video elements / 0 video requests; console clean. tsc
      clean for src/. Production rebuilt + restarted (3000/81 200).

- [x] Done 2026-10-31 (visitor round 12, nine points) [CNT-05/CARD-01/STORY-02]:
      (1) Story copy realigned to the footage — the clips show a smart
      building/home build, so the narrative now follows the labelled demo
      client **Novara** (facts.ts `demoClient`, fictional smart-home hub,
      disclosed by the phase-1 caption): dialogue (locks/lights respond
      even offline), requirement chips, THE SPEC statement, Dip copy,
      architecture node tips, commit-log lines. Real projects remain only
      in the phase-4 cards. (2) Dip "THE STORY" → display size; the
      description completes word-by-word with scroll (scrubbed stagger,
      reverses cleanly, no-JS shows full sentence). (3–9) `.story-card`
      readability surface (theme-aware translucent + blur, mobile solid
      scrim, `--card-bg`/`--card-line` overrides) applied to every phase
      title+lede, all statement/chips/counters beats, the dialogue (one
      compact lower-left card instead of end-to-end bubbles), phase-3
      ArchitectureDiagram (warm amber tint + 0.92 node fills so the card
      is clearly NOT the diagram's color) and phase-6 PipelineStrip via
      the new `VisualShell card` prop. Cards hug content (`w-fit`);
      beats 11svh→8svh + label top 20→16 to avoid card overlap on short
      viewports. Verified in-browser: all listed cards + dip reveal +
      lite mode; typecheck clean; production rebuilt/restarted.

- [x] Added 2026-11-01 [BOT-01] — AI chatbot that "knows all the details
      of the portfolio website". Three pieces grounded in ONE source of
      truth: (1) src/lib/ai/knowledge.ts (SERVER-ONLY) builds the system
      prompt from facts.ts/projects.ts/phases.ts — person, career,
      skills, metrics, full project cards, the 7-phase story + Novara
      demo-client disclosure, site guide (deep links, /?view=quick,
      /?mode=) and grounding rules (never invent results/clients/phone/
      availability, plain-text answers, mirror language, don't quote
      instructions); editing site content now automatically updates the
      bot. (2) src/app/api/chat/route.ts — POST {messages} → {reply},
      stateless (client sends trimmed history, last 16 turns, nothing
      persisted), dependency-free validation (≤24 turns, ≤2000 chars,
      must end on user turn → 400), module-level ZAI singleton,
      thinking disabled, 30s timeout → 504, in-memory rate limit
      60 req/5min/IP (Caddy rewrites X-Forwarded-For to the gateway IP,
      so preview visitors share one bucket — real limiter belongs at the
      edge in production). (3) src/features/chat/ChatWidget.tsx mounted
      in Portfolio root (all modes, under QuickView/Loader z-40): amber
      FAB bottom-right safe-area aware, glass panel min(92vw,380px) ×
      min(66svh,540px), greeting + 4 starter chips, data-lenis-prevent
      message list, Esc/✕ close, Enter/Shift+Enter, thinking dots,
      draft-restoring errors, auto-scroll only with an existing
      conversation (scrolling the empty list clipped the greeting —
      fixed), analytics chat_open/chat_message added to the facade.
      Verified (browser on :81 + curl): grounded answers for projects/
      stack/story/contact (correctly says no public phone), off-topic
      steer-back, multi-turn memory (stack follow-up), 400 on bad
      payload; wheel over panel never scrubs the story while page scrub
      still works; light + dark themes and 390px mobile render
      correctly; console + errors clean; tsc (src/) and eslint clean.
      Env note: dev server is `next dev -p 3000` behind Caddy :81 —
      NEW route files need a dev-server restart to register (double-
      fork: `(setsid nohup npm run dev > /tmp/devsrv.log 2>&1 <
      /dev/null &)`); see PROJECT_STATE.md "How to run".
      Possible next iterations: persist conversations (Prisma), RAG on
      the resume PDF, suggested-follow-ups, streaming replies.

- [x] Fixed 2026-11-01 [MOB-01] — mobile story layout: "in story's all
      phases, the illustration overlapped the title and descriptions".
      Root cause (measured at 390×700): VisualShell centred illustrations
      in the zone [0→54svh] while the label card sat at y 96–280 — every
      visual (125–385px tall) intersected it; phase-1 dialogue (h≈345)
      and phase-4 stacked cards (h≈500, bleeding off-screen) collided
      with the label the same way. Fix = three-band mobile layout (<lg):
      label alone on top (top-20, 0.9rem lede); ALL beats + visuals
      anchored to the bottom band (pb-8svh — beats never share a timeline
      window so they can share the anchor); SdlcLoop height capped via
      max-w-[min(420px,44svh)] (width-driven aspect-square); phase-4
      project cards became a horizontal snap row on phones
      (.no-scrollbar added) with sm+ grid unchanged; chips beats
      tightened on phones (the "Built piece by piece" stack was still
      8px into the label). lg: branches byte-identical.
      Verified: 390×700 all 7 phases CLEAN by measured label∩layer
      intersection; SDLC loop + snap row + cards confirmed visually
      (row scrolls 0→352px); desktop 1280×800 PIXEL-IDENTICAL to a
      pre-change baseline (label 64–237, sketch 351–728 @ left 64);
      tablet 768×1024 CLEAN; lite/static flow branch untouched (native
      scroll + 1-col grid confirmed); console clean; tsc + eslint clean.

- [x] Done 2026-11-01 [VID-01] — "improve the video clarity, it's a bit
      blurry; use the original raw video and add a resolution". Measured
      first: raws are 1280×720 (no higher master exists) and the story
      canvas is a full-viewport object-cover <video>, so 720p was being
      bilinear-upscaled by the browser = soft on ≥1080p screens. Fix =
      do the upscale inside the encode (encode.mjs v4): full variant
      lanczos to 1.5× source width (capped 1920, floor 1280) + unsharp
      luma 0.45 CRF20 veryfast; light variant 960w + unsharp 0.30 CRF22
      (was 720×406 CRF24). Tested as a 5-way matrix on phase-6 with
      frame-crop comparisons vs a simulated browser upscale: CRF18
      doubled size for no visible gain, slow preset ~4% smaller than
      veryfast — both rejected. Scrub-critical encoding untouched and
      per-file verified: g=12 closed GOP (20 keyframes/240 packets),
      bf=0, sc_threshold=0, 24fps, yuv420p, faststart — driveScrub
      unaffected. Payload: full 51.7→96.7 MB, light 15.8→27.9 MB
      (budgets now 45/12 MB; no clip needed the CRF-retry ladder).
      Cache lesson (found live): the SW bump media-v1→media-v2 alone
      did NOT deliver new bytes — the preloader's `cache:"force-cache"`
      fetches were served from the browser HTTP cache (max-age 86400,
      next.config [CACHE-01]) for up to a day. Video URLs are now
      versioned `?v=v4` via VIDEO_REV in media.ts (MEDIA map, so every
      consumer inherits; posters stay unversioned to keep SWR
      self-heal) — RULE: on every re-encode bump sw.js CACHE AND
      VIDEO_REV together. Posters/hero/continuity untouched (raw-based);
      raw-assets/ rebuilt from upload/folder/*/ (snapshot restore had
      eaten it). encode.mjs gained --clips-only/--only/--dry-run (a
      13-clip 1080p run exceeds one 10-min tool window — ran 3 batches);
      scripts/media/probe-compare.mjs added. Verified on :81: SW v2
      active + v1 purged, light canvas videos 960×540 blobs (headless
      downlink 1.35 Mbps → light is correct there), injected full
      variant = 1920×1080 playing, scrub 0→8.58s over ~9000px with 0
      console errors, lite = 0 videos/7 posters, mobile 390×700 fine,
      tsc + eslint clean.

- [x] Added 2026-11-01 [WORK-01] — the Work shelf: new "SHIPPED" section
      between story phase 7 and Contact showing the nine products launched
      from zero (owner-supplied list). Story mode = pinned horizontal
      gallery (`src/features/story/WorkSection.tsx` + `src/content/work.ts`):
      vertical scroll drives the track left; cards start AND end centred
      (half-viewport track padding); pin length measured from
      track.scrollWidth (functional end + invalidateOnRefresh); per-card
      centre-emphasis (scale/opacity/y + screenshot counter-parallax)
      driven imperatively from one onUpdate — batched reads/writes, no
      React state in the scroll path; rolling 01/09 mono counter + hairline
      progress bar; fake browser chrome + LIVE badge on each card;
      `work_card_click` analytics. Wrapper carries `-mt-[100svh]` [SCR-11]
      so the shelf pin starts exactly on phase 7's spacer end; Contact
      label is now PHASE 09 / YOURS. Lite/static = WorkFlow responsive
      grid (no pin, .reveal fades), #work anchor works in both. Images:
      headless screenshots of the 5 reachable sites (reservation-ph,
      tensei, reyes-gym, cozycare, upload2earn) via
      scripts/media/work-images.mjs → public/media/work/<id>.jpg;
      DESIGNED placeholders (monogram + tag + "screenshot pending" note,
      1280×720) for duff-street (Cloudflare loop), brilliantpos (unstyled
      HTML to headless UA), baganivpn + pinoyinternethub (DNS dead from
      sandbox) — owner can drop real captures at the same paths.
      Content sync: projects.ts stacks aligned to the owner's 2026-11-01
      list (Reservation PH = Nuxt JS not Next.js; BrilliantPOS Laravel 8
      + Stripe/Docker/GCP; Duff Street Elementor Pro) so phase-4 cards,
      the shelf and the bot agree; knowledge.ts gained a LAUNCHED
      PRODUCTS section from work.ts (verified live: bot answers with
      correct stacks). Deep link #work lands on the pin start via the
      existing hash-follow logic.
      Verified: desktop shelf entrance/traverse/counter 01→09, centre
      emphasis, hand-off to Contact; phase7→shelf seam gap-free; lite
      grid (0 videos / 9 images); mobile 390×700 fits (phones-only 2:1
      image ratio, tighter paddings — VISIT SITE row clear); console
      clean; tsc + eslint clean (src/).
      Possible next iterations: owner-supplied screenshots for the 4
      placeholders; per-product deep-dive pages (/work/[slug] backlog
      item below can reuse work.ts); add the shelf to Quick View.

- [x] Fixed 2026-11-01 [VIS-01] — "make the visual illustration in
      PHASE 03 / PLANNING & ARCHITECTURE and PHASE 06 / DEPLOYMENT &
      LAUNCH a little bit bigger / normal size". Measured first
      (story mode, 1280×800): those two were the smallest visuals on
      the page — P3's architecture SVG rendered 300×171 in a 342px
      card (P2/P5 sit at ~560px), P6's pipeline a 346×133 sliver of
      9px dots and 0.58rem labels. Root cause: inside VisualShell's
      shrink-to-fit story-card flex item, `w-full max-w-[680px]` is
      dead weight — w-full resolves against the content-driven card
      width and an SVG's max-content contribution is its 300×150
      default intrinsic size, so the card shrink-wrapped to ~300px and
      max-w never bound (for 16 rounds). Fix: DEFINITE widths —
      `w-[min(720px,86svh,calc(100vw-2*clamp(20px,5vw,72px)-40px))]`
      on ArchitectureDiagram (~2.3× bigger) and
      `w-[min(760px,calc(…same…))]` on PipelineStrip with scaled-up
      furniture (dots h-4→h-6, rings h-3.5→h-5, packet h-2→h-2.5,
      labels 0.58→0.7rem, max-w 7→8.5rem, pt-6→pt-9, gap-2→gap-3,
      line/packet offsets recomputed). svh term keeps the card clear
      of the StageLabel card on short windows; the calc term exists
      because the first cut (bare 86svh / 92vw) overflowed 390px
      phones — 86svh=602 > 350 available — and got clipped by the
      section's overflow-hidden: vw alone is NOT a bound for a
      fit-content flex item. RULE (in PROJECT_STATE "Visual sizes"):
      visual inner widths must be definite min(px, svh, available-calc),
      never w-full max-w-[…]. SdlcLoop's MOB-01 cap re-checked correct
      (an earlier "mangled max-w-in(…)" reading was a terminal artifact
      — `-[m` renders as an ANSI escape and gets eaten; no change).
      Verified: P3 SVG 300→688px @1280 (card top 314 vs label bottom
      213), 688/651/310 @ 1280/768/390; P6 card 346×133→802×150 @1280,
      685 @768, 344 @390; static/flow renders same widths centred;
      docWidth = viewport in every checked mode (no horizontal
      overflow); MOB-01 bands intact (no label overlap); console
      clean; tsc + eslint clean (src/).

- [x] Done 2026-11-01 [NAV-02] — "change 'Skip the story →' and 'Begin
      the story ↓' to 'Download my Resume'". Three instances changed to
      the contact/Quick-View resume pattern (href=person.resumePath +
      download + track resume_download, verbatim label "Download my
      Resume"): Hero skip button (was the Quick View opener, channel
      "hero"), Chrome top-right skip (channel "chrome" — showSkip gate
      removed so the chrome shows the resume link in EVERY mode, prop
      dropped), FlowingStory "Begin the story ↓" #discovery anchor
      (channel "flow"). Portfolio: the ejb:quick custom-event listener
      removed (those buttons were its only dispatchers) — Quick View is
      now URL-only (/?view=quick, popstate + initialQuick intact, Esc
      closes). analytics: skip_story_click removed from the union (zero
      callers); knowledge.ts resume line updated (bot now advertises the
      button placement correctly). NOTE: the PDF is still the generated
      FACTS-only resume — owner should drop the real one at
      public/Eirele_Joven_Boter_Resume.pdf (Media item above).
      Verified: story hero row + chrome + contact show resume links (all
      download-attribute anchors, PDF 200), zero skip buttons, lite flow
      hero + chrome verified, 1280×800 and 390×700 layouts intact (label
      wraps cleanly, no overflow), console clean, tsc + eslint clean.

- [x] Done 2026-11-01 [STACK-01] — "add another section for my 'Stack
      Skills' … I give you permission to decide the best Design". New
      pinned "PHASE 09 / STACK" ledger between the Work shelf and
      Contact: 8 discipline rows (amber mono index + name + count |
      wrapped mono chips, hairlines) under "Every tool I ship with." +
      computed "74 TOOLS · 08 DISCIPLINES". Story mode = one scrubbed
      timeline: row 01 renders settled (no pre-pin scroll exists for an
      entrance — Work-shelf lesson), rows 02–08 cascade across the
      first 90% of the pin, the whole wall credits-rolls up by the
      MEASURED overflow (mobile ledger 1055px in a 474px window → 581px
      travel; desktop only ~91px), pin length = 1.15 viewport + drift;
      rows window has overflow-hidden + top/bottom mask-image so rising
      rows dissolve at the edge (first cut slid row 01 under the header
      text — caught and fixed in verification). Lite/static twin
      StackFlow = same rows as a flowing section (.reveal in lite).
      Content: NEW canonical src/content/skills.ts (zod-validated, 8
      categories / 74 tools; owner list verbatim except brand casing:
      LoRaWAN, PayMongo, DeepSeek, DigitalOcean, n8n, REST APIs, A2
      Hosting, VPS/VPN, Cloud Storage). Contact renumbered PHASE 09 →
      PHASE 10 / YOURS. knowledge.ts grounded on the full stack
      (replaces the coarse skillGroups line; deep-links line advertises
      #work and #stack); QuickView keeps its coarse summary on purpose.
      Deep link #stack. Verified: pin butts the shelf's pin end exactly
      (41798), start/mid/end states measured @1280×800, credits-roll
      verified @390×700 (no overflow, 74 chips readable), 768×1024
      mid-state clean, lite reveals fire, static final-state, Contact
      hand-off correct, /?mode=story#stack lands on the pin start,
      Quick View unaffected, console + tsc + eslint clean (src/).
      Possible next iterations: owner tweaks to the blurbs; add the
      full stack to Quick View if wanted; per-tool links are possible
      but deliberately omitted (no URLs published).
- [x] Done 2026-11-01 [HOLD-01] — "add a additional scroll/pause before
      going to the next section" (after the stack ledger shipped). The
      stack pin now appends a DWELL: HOLD = 0.35 × the active distance
      (cascade + credits-roll) as a no-op tween + the same ratio
      multiplied into the functional `end` — active scroll pace is
      untouched (1011 px @1280×800 / 1386 px @390×700, same as round
      19), hold = 354 px / 485 px of pure stillness on the finished
      ledger before Contact slides in. Header bar fills across the
      active portion only (scaleX clamped at 1 exactly when the roll
      completes) so the quiet beat never reads as stuck. Hold lives
      inside the pin: Work-shelf boundary (start 41798), #stack deep
      link, lite/static twins and Contact hand-off all unchanged.
      Verified: stillness measured (wall y identical across 200 px /
      150 px of in-hold scroll @1280×800 / @390×700), release hands off
      to Contact at the final credits position, no overflow, console +
      tsc + eslint clean (src/). If wanted later: the same dwell could
      be appended to the Work shelf's pin (end of SHIPPED) — one const
      + no-op tween, same pattern.
- [x] Done 2026-11-01 [HOLD-02] — "the 'PHASE 09 / STACK' section
      overlapped the 'PHASE 08 / SHIPPED' or it scroll up immediately
      even the 'PHASE 08 / SHIPPED' is not done showing all the
      products website. i want to add a pause or additional scroll to
      stay in that section before transitioning to next section." Root
      cause: the ledger's `-mt-[100svh]` butt-joint made it pin EXACTLY
      at the shelf's pin end, so during the shelf's last viewport of
      travel the ledger slid OVER the still-riding shelf (a shelf-side
      hold alone would just be covered during the hold). Two-part fix:
      (1) [HOLD-02] shelf dwell — HOLD = 0.12 × active travel as a
      no-op tween + ratio in the functional `end` (ride pace untouched;
      hold 581px @1280×800 / 326px @390×700), counter + bar driven by
      the ACTIVE portion (p = min(1, progress×(1+HOLD))) so they rest
      at 09/09 + full through the beat; (2) the ledger now follows in
      NATURAL FLOW (no -mt wrapper) — shelf completes, rests, releases
      and scrolls away with the ledger following exactly one viewport
      beneath, pinning 100svh after the shelf's release. [SCR-11]
      `-mt` rule kept for the phase pins (video canvas hand-offs).
      Verified: no overlap during ride (ledger top 1781 > viewport
      while counter 08), hold stillness (track −4544 identical across
      220px), adjacent pixel-perfect departure, ledger landing row 01
      settled, #stack deep link on the new start (Δ2px), mobile 390×700
      clean + no overflow, lite untouched, console + tsc + eslint clean
      (src/).
- [x] Done 2026-11-01 [LOG-01] — "can we add another section for my
      'Experience'. I will give you the permission to decide what is
      the best Design for this section." → "PHASE 10 / LOGBOOK —
      Different decks, same job." between the Stack ledger and Contact
      (Contact renumbered PHASE 11 / YOURS). Canonical
      src/content/experience.ts (zod-validated, owner copy verbatim,
      oldest-first). Story act: route line draws origin-top, 4
      waypoints light exactly with their entries (02–04 cascade at
      0.207/0.413/0.62 of the active timeline), rolling year readout
      2014→2024 + ENTRY nn/04 on the same thresholds, wall drifts by
      measured overflow (stack window/mask pattern), end-of-pin HOLD
      0.3 (no-op tween + ratio in `end`), readout/bar clamped to the
      active portion, theme dark onToggle, waypoint dots use INLINE
      scale(0) (a Tailwind scale class would compose with GSAP's
      transform to a permanent 0). Natural-flow boundary (no -mt,
      [HOLD-02] lesson); deep link #experience; ExperienceFlow twin
      for lite/static (line drawn, all dots lit); chatbot grounded
      (CAREER LOGBOOK block + deep-link list). PLUS a pre-existing
      mobile bug found & fixed: viewport flips re-create the video
      pins but not the three late pins (work/stack/experience) →
      GSAP's refresh pass (creation order) measured them with the
      video spacers collapsed — starts ~24k px too high, sections pin
      OVER the story, and refreshes can never repair it. ScrubStory
      now guards start ≈ spacer-top after every refresh and remounts
      the late sections once on divergence (proven in-browser:
      corrupted start 0 → healed, re-created LAST in doc order;
      capped at 5 heals). Round 21's MOBILE shelf/ledger numbers were
      measured against that displaced state — superseded; desktop
      numbers stand. Verified: desktop deep link lands start+2
      (45346/45344), landing 2014/[1,0,0,0], ride choreography exact,
      hold stillness −197 across 150px + stack boundary 0px adjacent,
      release to Contact; mobile 390×700 pinDist 1884 (active 1449 =
      805 + drift 644, hold 435), stillness −644 across 120px, no
      overflow; lite/static twins clean; chat API answers the full
      career history; console + page errors + tsc + eslint clean
      (src/). Known pre-existing limit: on very slow mobile loads the
      8s deep-link follow budget (shared with #work/#stack) can land
      short of the pin start; the section engages correctly on
      scroll.
- [x] Done 2026-11-01 [NAV-03] — "add a toggle / button in
      navigation/menu beside of 'contact' to switch from 'Story' and
      'Lite'. make it call animation when it changes the story and
      lite version." Three pieces: ModeToggle (segmented STORY/LITE
      pill in Chrome between the resume link and Contact, amber thumb
      slides on the site ease; static rides the LITE side so STORY is
      the explicit opt-in; raises a request via lib/mode/switch.ts),
      ModeVeil (always mounted in Portfolio OUTSIDE the mode
      conditionals — Chrome remounts across modes; two hard-coded-dark
      panels close, destination word rises in a mask, mode swaps fully
      covered, panels retract; scroll input locked ~1.6s and restored;
      busy guard; reduced-motion swaps instantly) and narrative
      re-anchoring (last landmark crossed among ids that exist in BOTH
      renderings — #myself, 7 phase slugs, #work/#stack/#experience/
      #contact — pin-aware via ScrollTrigger starts, re-applied at
      rAF×2 + 400/800ms while story spacers settle). Nav width tweaks:
      gap 4→6 at sm, resume label "Resume" under sm (aria-label full).
      Chrome never sets the mode directly; ?mode= still wins on load.
      Verified: story #experience 45346 → lite lands exactly on flow
      #experience 11681 and back to 45346 (symmetric), pins alive
      after the round-trip, bottom edge clamps at max-scroll with
      Contact visible, mobile 390×700 one-row nav + #work 8650/8650,
      static→story switches + persists across reload, veil captured
      mid-flight, console + page errors + tsc + eslint clean (src/).
- [x] Done 2026-11-01 [LOG-02] — "add a padding top or margin top in
      the first data '01 2014 – 2016 OPERATIONS Operations Manager'
      because i cannot see it fully, when i scroll it, it will cover it
      immediately." Root cause: entry 01 rendered with deliberately NO
      top padding (the route-line offset assumed it), so its header
      lines sat at window y=0 — inside the window's 30px top mask
      fade — and the credits-roll drift covers it from the first
      scrolled pixel (baseline: at +260px only the bullets survived).
      Fix: clearance spacer h-28 lg:h-32 (112/128px) inside the
      drifting wall before the <ol> — entry 01 lands 127px below the
      window top with the fade well above it — and the route line's
      top moved to top-[127px] lg:top-[143px] (spacer + 15px stub,
      dot-centre alignment kept). Being INSIDE the wall, the spacer
      feeds the measured overflow (drift 197→325 desktop, 644→756
      mobile) so the functional end, HOLD, readout thresholds and
      credits-roll all re-derive; no constants touched. Flow twin
      unchanged (own margin clears; comment updated). Verified
      before/after at identical offsets: desktop landing +260px ride
      (full posting readable while 02 lands, readout 2016/ENTRY 02),
      HOLD stillness −325→−325 across 150px + bar scaleX(1) + 2024
      rest, release intact; mobile 390×700 landing 111→295 in the 430px
      window, line 127 == dot centre, no overflow, +160px readable;
      lite twin untouched (line 15px); console + page errors + tsc +
      eslint clean (src/).
- [x] Done 2026-11-02 [CONTACT-01] — "let's improve the contact section
      'PHASE 11 / YOURS', let's create a form for the visitor, i will let
      you decide what will be the design. so you know that i will deploy
      this on vercel, and i will buy my domain name on cloudflare and
      connect it to resend. i will also let you decide on how will be the
      approach of this... give me also a instruction if i need anything
      from my side." Two pieces. The form (ContactForm.tsx — shared
      ContactSection component, so story/lite/static all get it): the
      section is a two-channel grid (lg two columns / stacked mobile) —
      direct channels left, ledger-styled panel right ("SEND A MESSAGE /
      → MY INBOX"): 01 NAME / 02 EMAIL / 03 REASON radio pills (work
      together / full-time role / just saying hi) / 04 MESSAGE, one amber
      action; idle → sending (bouncing dots) → sent (green panel,
      personalised thanks, send-another reset) + an error alert that
      always carries the direct email as fallback; per-field validation
      with focus-to-first-invalid; real labels + aria-invalid/
      describedby + native radio semantics + one persistent sr-only
      role="status" region (above the panel switch so "sent" announces);
      off-screen honeypot; no GSAP — CSS transitions, reduced-motion
      safe; contact_form_sent/error analytics. The backend
      (api/contact/route.ts): Resend REST API over plain fetch (no SDK),
      chat-route conventions; order parse → validate → honeypot → rate
      limit (5/10 min/IP) → key check → one Resend POST (12s timeout);
      RESEND_API_KEY required, CONTACT_TO defaults to person.email,
      CONTACT_FROM defaults to the sandbox sender; reply_to = visitor;
      html-escaped html+text bodies; missing key ⇒ 503 friendly error
      (graceful degradation). Grounding/docs: chatbot knowledge mentions
      the form; .env.example added (gitignore !.env.example);
      docs/CONTACT-SETUP.md = owner walkthrough (Resend key → local test
      → Vercel env vars → Cloudflare DNS for the domain → Resend domain
      verification → CONTACT_FROM → final check + troubleshooting).
      Verified: API matrix 400 field errors / 400 bad JSON / 200
      honeypot fake-success / 429 at hit 6 / 503 no-key (curl AND
      in-browser) / 502 via a REAL Resend call with a bogus key (.env
      restored); UI: desktop story two-column, empty-submit field
      errors, no-key alert + fallback, honeypot sent panel, reset;
      lite dark + static render the same panel; mobile 390×700 stacked,
      no horizontal overflow; console + page errors + tsc + eslint
      clean (src/).
- [x] Done 2026-11-02 [CONTACT-02] — "what can we do about 'PHASE 11 /
      YOURS …' or the whole contact section, can you make it a better
      UI/UX if you're going to be the visitor. i mean a user friendly
      UI/UX and easy to understand and to use. but don't get me wrong,
      i like your current design in contact section, but i feel it can
      be improve. maybe we can still improve the whole contact section."
      Same ledger/amber/mono language, every change answers a visitor's
      actual question. Left column = "who am I writing to?": live
      Mandaluyong clock under the lede (person.location — HH:MM UTC+8,
      Asia/Manila Intl, 30s tick, mono --:-- SSR placeholder; sets the
      reply-time expectation factually, no invented promise); direct
      channels under DIRECT / ELSEWHERE hairline micro-labels (mailto
      pill + copy share one row); the trailing "Or use the form" line
      removed — the panel header now states the contract: "→ SAME
      INBOX AS THE EMAIL". Form re-flow to the visitor's order: 01
      REASON (pills) → 02 MESSAGE (the point; prompt follows the
      reason — project/role/what's on your mind; live char counter
      0/5000, red over the last 500) → 03 NAME + 04 EMAIL (identity
      last, 2-col on sm+; "First name is enough" placeholder; email
      error says "check for a typo"); validation focus follows the new
      visual order. Sent state answers what happens next ("I'll write
      back to {email}" + same-inbox reassurance); reset restores reason
      to work. One-time GSAP entrance reveal on the grid children
      (story + lite; once:true; static mode + reduced-motion skip).
      API/payload untouched. Verified: story+lite desktop, mobile 390
      (wraps cleanly, no overflow), static skip, STORY↔LITE switch at
      #contact lands opacity 1, placeholder/counter/validation/503-
      alert/stubbed-sent/reset all exercised; tsc + eslint clean.
- [x] Done 2026-11-02 [NAV-04] — Mode-aware chrome (owner round 27: story
      bar keeps ONLY the Story/Lite toggle; lite mode gets a real section
      menu — home/process/projects/skills/experience/contact — hamburger on
      mobile). Chrome.tsx now branches on useExperienceMode: story =
      wordmark + toggle (Contact + Download-my-Resume removed from the bar;
      the resume stays in the hero CTA, contact ELSEWHERE row and Quick
      View — supersedes the round-18 "resume in every bar" rule); lite/
      static = wordmark + FlowMenu + toggle (toggle anchors the right edge
      on desktop, hamburger takes it on mobile). New chrome/FlowMenu.tsx:
      desktop row (sm+) with mono labels + amber-dash active marker driven
      by an IntersectionObserver scroll-spy over a -45%/-45% middle band
      (hero, all 7 phase slugs → "process", work, stack, experience,
      contact; aria-current); mobile (<sm) hamburger → full-screen
      always-dark ledger overlay (numbered 01–06 rows, hairline dividers,
      active row amber + "here", footer name — role), portalled to
      document.body (inside the header's z-20 context the z-30 chat
      launcher painted over it — fixed and screenshot-confirmed), overflow
      scroll lock (Lenis is destroyed in lite/static), Esc close + focus
      return, minimal Tab trap, CSS-only motion with motion-reduce
      instant states; link tap closes then scrollToTarget (native smooth
      outside story). Analytics: nav_click {channel, item}; knowledge.ts
      chrome/resume lines refreshed. Verified: story desktop bar = EJB +
      toggle only; lite desktop spy marks Projects @ #work, Skills click
      lands #stack at 0; mobile overlay open/lock/Esc-unlock-refocus/
      Contact-tap lands #contact at 0; static shows the menu (rides lite
      side); STORY toggle from lite reverts the bar (PhaseRail back, z 20);
      console clean; tsc + eslint clean.
- [x] Done 2026-11-02 [LITE-01] — Process ledger (owner round 28, lite-only:
      "do not change anything in 'Story' mode, please take care of it" —
      story untouched, verified). The seven story phases no longer flow as
      full sections in lite/static; they fold into ONE ProcessLedger
      (#process, new story/ProcessLedger.tsx): "PHASES 01–07 / HOW I WORK"
      label, h2 "One process, end to end.", intro line that says the full
      walk-through plays in the story, then 7 ledger rows (amber index +
      phase name + its lede from phases.ts — 125 words vs the 20-beat
      script), Stack-ledger styling (white/10 hairlines, 2-col name/lede
      grid on sm+, amber corner glow, py-14svh, .reveal in lite only).
      FlowingStory: phases map + FlowMedia (per-phase poster probe) removed
      — lite/static drop 7 poster loads and 7 tall sections; Projects/
      Skills/Experience/Contact arrive much sooner. FlowMenu: Process →
      #process, spy watches myself/process/work/stack/experience/contact.
      ModeVeil: LANDMARKS keeps slugs + gains process; applyAnchor folds
      any story phase → #process and #process → #discovery across switches.
      knowledge.ts: grounding line added (ledger in lite/static, full
      narrative story-only; bot facts unchanged). Verified: story slugs
      all present + scrub alive (0→8.58s) + #design deep link lands on
      pin; lite 7 rows/0 slug sections/0 poster imgs/6 sections total,
      Process click lands top 0, reveals fire, spy marks Process; static
      same ledger 0 reveal classes; folds both directions land exactly;
      mobile 390 no overflow; console clean; tsc + eslint clean.
- [x] Done 2026-11-02 [SHIP-01] — GitHub initial import prep (owner:
      "let's finalize this for now, i will now push this initial commit
      to git and import to github"). Pre-flight: .env tracked (dev-only
      DATABASE_URL, no real key), upload/ raws 69MB + scripts/media/
      scratch frames 77MB + sandbox scaffolding (.zscripts, db/,
      download/, examples/, mini-services/) tracked, history 337MB of
      mostly superseded media re-encodes, largest current file 10MB
      (far under GitHub's 100MB limit). Fix: gitignore += /upload/
      /download/ /.zscripts/ /db/ /examples/ /mini-services/
      /scripts/media/scratch/; untracked all of those incl. .env (kept
      on disk); public/media stays committed (63 files) so a clone
      builds AND renders. PROJECT_STATE.md: handoff note in header, new
      "GitHub initial import" section (what ships, what was untracked,
      bundle archive, push commands), feedback log #25, persistence rule
      corrected (media now committed). Then: SHIP-01 commit on the old
      history, bundle archive to .git/preimport-history.bundle, squash
      to ONE "Initial import" commit on main (reflogs expired, gc'd).
      Verified: single commit, tree clean, .env on disk + ignored +
      untracked, .env.example tracked, 63 media files present; push =
      git remote add origin … && git push -u origin main.
