# PROJECT STATE — Eirele Joven Boter portfolio

Single source of truth for "where this project is". Read this first in any
new session. Working list of open items lives in `TODO.md` (its CONFIRM
table lists facts only the owner can supply).

Last updated: 2026-11-03 (after round 35 — the chat brain, RAG-only
[BOT-03]: the owner has no API key access and wants no AI provider, so
the whole [BOT-02] provider ladder (AI_API_KEY → OpenAI-compatible
fetch → sandbox SDK) was removed and replaced by a local RAG engine —
src/lib/ai/knowledge.ts compiles the content modules into 39 pre-
written fact chunks, src/lib/ai/rag.ts retrieves by IDF-scored
keyword/title/body hits plus intent topics (two tiers: overview +7,
specific +9, so "what did he do at Tensei?" lifts the logbook posting
over the same-named shelf product) and composes the reply locally —
with tool lookup ("does he know Flutter?" → discipline + shipped-in
products), honest misses ("Python isn't in the published stack"),
discipline drill-down ("IoT toolkit" → that group, not the 74-tool
dump), deterministic follow-ups ("what stack does it use?" → the
previous turn's chunk), and greeting/identity/fallback paths. No env
vars, no network egress, nothing left that can 401/429/time out; the
widget behaves identically in the sandbox and on Vercel; GET /api/chat
always answers {provider:"local-rag", knowledgeChunks:39}; only
rate-limited / rag-error ref codes remain; ChatWidget untouched (it is
brain-agnostic). docs/AI-CHAT-SETUP.md rewritten for the no-key
reality; probe battery lives in scripts/probe-chat.sh. See Round
35). Before that, round 34 — the chat assistant, deployable
[BOT-02]: the widget died on the owner's Vercel deploy because the
z-ai-web-dev-sdk reads its credentials from a .z-ai-config FILE that
only exists in the dev sandbox — every production request threw. The
route now resolves its brain in order: AI_API_KEY env var → plain fetch
to an OpenAI-compatible endpoint (AI_BASE_URL default the Z.ai open
platform https://api.z.ai/api/paas/v4, AI_MODEL default glm-5.3,
GLM thinking disabled) → lazily-loaded sandbox SDK fallback →
503 not-configured with a visitor-safe message. Every failure carries a
safe ref code + owner hint (widget prints "ref: …" in the error
bubble), GET /api/chat is a no-secrets wiring self-check, and the
owner's walkthrough is docs/AI-CHAT-SETUP.md. The sandbox preview
behavior is unchanged — the fallback keeps it on the SDK. See Round
34). Before that, round 33 — the contact form, diagnosable
in production [CONTACT-03]: the owner's first Vercel deploy (live at
eirelejovenboter.com, Cloudflare DNS-only confirmed via response
headers) fails every real submission with 502 — the route's one generic
message hid WHICH Resend rejection; every failure path now answers with
a safe ref code + owner hint, the form prints "ref: …" under the error
line, and GET /api/contact is a no-secrets wiring self-check
(configured/from/to, private inbox masked). Production probed while
diagnosing: route healthy (200 honeypot / 400 validation) and
RESEND_API_KEY IS set (502, not 503) — the remaining fix is owner-side
in the Resend dashboard and the ref code names it. ALSO flagged: the
live deployment predates SEO-01 (robots.txt without the Sitemap line,
sitemap.xml still carrying ?view=quick, no canonical link) — pulling
the latest main and redeploying ships round 32. See Round 33). Before
that, round 32 — the SEO pass [SEO-01]:
canonical URL added, static robots.txt replaced by a dynamic route that
ADVERTISES the sitemap, sitemap.xml made canonical-only and origin-aware,
JSON-LD Person gains url/image, and a server-side origin resolver
(NEXT_PUBLIC_SITE_URL → Vercel production domain → deployment URL) so
canonical/sitemap/robots/structured-data work out of the box on the
first Vercel deploy — the owner's Google Search Console walkthrough is
docs/SEO-SETUP.md. See Round 32). Before that, round 31 — the work
shelf, two real
captures [WORK-IMG-01]: the owner-supplied screenshots for Brilliant POS
and Duff Street replaced their designed placeholders at the same
public/media/work paths — cleaned of capture artifacts (cookie banner /
scrollbar / reCAPTCHA badge), 1280×720 mozjpeg q80, zero code change;
the media SW's stale-while-revalidate (≤2 MB) self-heals the swap, so
NO media-v CACHE bump. See Round 31). Before that, round 30 — the
resume, ATS-hardened
[ATS-01]: the generated PDF was already born-digital text, single
column, standard headings — but the experience/skills rows were Table
flowables (the classic ATS-parser mangler) and two invisible U+3000
spaces sat inside the job/project title lines; all rows are now plain
paragraphs with the same ledger look, Subject/Keywords metadata filled,
still one page A4 at the same path. No phone and no EDUCATION section
stay deliberate (FACTS / CONFIRM #7). See Round 30). Before that,
round 29 — the resume, resynced to the portfolio [RES-01]: the
generated PDF now mirrors the canonical content modules — all four
logbook postings with companies and owner bullets (Yellow Cab → Wallem
→ freelance → Tensei), the first four Work-shelf projects verbatim
(Reservation PH, Brilliant POS 250+, Duff Street Medical Complex,
Tensei iBMS) and a stack-ledger skills digest; one page A4, same path,
same look. See Round 29). Before that, the GitHub
handoff [SHIP-01]: the repo is finalized for
its GitHub initial import — working junk untracked (env, raw uploads,
scratch frames, sandbox scaffolding), ALL media committed so a fresh
clone builds and renders, and the 28-round history squashed to ONE
"Initial import" commit after being archived at
`.git/preimport-history.bundle`; see "GitHub initial import" below).
Before that, round 28 — the process ledger [LITE-01]:
lite/static no longer flow the seven story phases as full sections —
they fold into ONE compact "PHASES 01–07 / HOW I WORK" ledger (#process):
phase name + its one-line lede per row, Stack-ledger styling, no
posters, no beat script (the full walk-through is story-only now, and
the ledger intro says so). FlowMenu "Process" → #process; the mode veil
folds phase slugs ⇆ #process on switches. STORY MODE UNTOUCHED — owner
repeated it twice; verified slugs, pins, scrub and deep links. See
Round 28). Before that, round 27 — the mode-aware chrome [NAV-04]: the
story bar keeps only the wordmark + STORY/LITE toggle; lite/static adds
a FlowMenu section nav (desktop row with scroll-spy, mobile hamburger
overlay). See Round 27). Before that, round 26 — the
contact section, visitor-first [CONTACT-02]: "PHASE 11 / YOURS"
restructured around the visitor's questions — a live Mandaluyong clock
(UTC+8) under the lede, the direct channels under DIRECT/ELSEWHERE
ledger micro-labels, the form re-flowed 01 reason → 02 message → 03
name + 04 email with a reason-aware prompt and live counter, the panel
header saying "same inbox as the email", a sent state that says what
happens next, and a one-time entrance reveal (static mode +
reduced-motion skip). API untouched. See Round 26). Before that, round
25 — the contact form [CONTACT-01]:
"PHASE 11 / YOURS" got a visitor message form beside the direct
channels — a ledger-styled panel with honeypot + rate limiting,
delivered by `POST /api/contact` through the Resend REST API into the
same inbox as the direct email; it degrades gracefully without
configuration, and the owner's setup guide (Resend key → Vercel env
vars → Cloudflare DNS → domain verification) lives in
`docs/CONTACT-SETUP.md`. See Round 25). Before that, round 24 —
the logbook's first entry stays readable [LOG-02]: a clearance spacer
inside the drifting wall so entry 01 lands below the window's top mask
fade (see Round 24). Before that, round 23 — the STORY/LITE chrome
toggle [NAV-03]: a segmented pill beside "Contact" switches between the
story and lite renderings with a cinematic curtain — dark panels close,
the mode swaps underneath, the new rendering is re-anchored to the same
narrative landmark, panels retract; reduced-motion swaps instantly and
the choice persists. Before that, round 22 — the career logbook
[LOG-01]: a new pinned "PHASE 10 / LOGBOOK — Different decks, same
job." section between the Stack ledger and Contact; four postings
oldest-first along a self-drawing route line with waypoint nodes and a
rolling year readout 2014→2024; end-of-pin hold; lite/static flow twin;
Contact renumbered "PHASE 11 / YOURS"; chatbot grounded via the new
canonical `src/content/experience.ts`; PLUS a pre-existing mobile
pin-order bug found and fixed — see the guard in ScrubStory, Round 22).

---

## What this is

A cinematic, scroll-scrubbed personal portfolio for **Eirele Joven Boter**
(software engineer — web, IoT, AI). The signature experience is "story
mode": one persistent full-viewport video canvas behind pinned text
sections; scrolling scrubs 13 clips (7 phases + 6 transitions) with
crossfades. Same content also renders in **lite** (posters, no video;
the seven phases fold into one "How I work" ledger [LITE-01]) and
**static** (reduced motion) modes, plus a Quick View overlay.

- Stack: Next.js 16 (standalone output), React 19, GSAP ScrollTrigger,
  Lenis, Tailwind v4, TypeScript. No CMS — content lives in
  `src/content/`.
- Media: 13 short-GOP mp4 clips (~97 MB desktop 1080p / ~28 MB mobile 960w,
  v4 clarity encodes) + posters + hero cutout under `public/media/`
  (git-ignored, survives via re-encode script; raws mirrored in
  `raw-assets/` — see Media pipeline).

## How to run / rebuild

| Thing | Command |
|---|---|
| Dev server (user preview) | auto-running: `next dev -p 3000` (tee → `dev.log`), Caddy proxies **81 → 3000** — hot reload. NOTE (2026-11-01 session): **newly added route files are NOT picked up by the running dev server** — restart it: `(setsid nohup npm run dev > /tmp/devsrv.log 2>&1 < /dev/null &)` (the double-fork detach survives the tool shell; a plain `&` gets reaped) |
| Production build | `npm run build` (only if a standalone prod server is explicitly needed; the preview uses the dev server) |
| Restart production | `pkill -f "next-server"` then `HOSTNAME=0.0.0.0 PORT=3000 NODE_ENV=production setsid nohup node .next/standalone/server.js > /tmp/server.log 2>&1 &` |
| Health check | `curl -s -o /dev/null -w "%{http_code}" localhost:3000` and `curl -s -o /dev/null -w "%{http_code}" 127.0.0.1:81` |
| Re-encode media | `node scripts/media/encode.mjs` (v4: `-g 12 -bf 0 -sc_threshold 0`, 24fps; desktop lanczos-upscaled to 1.5× source width capped 1920 CRF20 + unsharp 0.45, mobile `-m` 960w CRF22 + unsharp 0.30). Flags: `--clips-only` (skip posters/hero/continuity), `--only a,b` (subset), `--dry-run` — a full 13-clip 1080p run exceeds one 10-min tool window, so batch it. Raw inputs are read from `raw-assets/` (rebuild it from `upload/folder/*/` if a snapshot restore eats it). After ANY re-encode: bump `CACHE` in `public/sw.js` AND `VIDEO_REV` in `src/lib/media/media.ts` together. Run in foreground — background processes get recycled by the sandbox |
| Browser verification | `agent-browser open "http://127.0.0.1:81/?mode=story"` (use explicit `?mode=` — headless Chrome reports 2 cores, so heuristics pick lite on default) |

Sandbox caveats: background processes die between sessions (servers too —
check health first); the workspace can be restored from an older git
snapshot (that happened once — commit early, see "State persistence").

## Architecture map

```
src/features/Portfolio.tsx        Root: mode resolution, engines, preload trigger [LOAD-01]
  ├─ chrome/Loader.tsx            Loading overlay — real progress in story mode [LOAD-01]
  ├─ chrome/PhaseRail, ProgressBar, Cursor, ModeHint
  ├─ chrome/Chrome.tsx            Fixed bar, mode-aware [NAV-04]: story = wordmark + toggle; lite/static = wordmark + FlowMenu + toggle
  ├─ chrome/FlowMenu.tsx          Lite/static section menu [NAV-04] — desktop row with scroll-spy; mobile hamburger overlay (portal, scroll lock, Esc)
  ├─ chrome/ModeToggle.tsx        STORY/LITE pill at the bar's right edge — raises switch requests [NAV-03]
  ├─ chrome/ModeVeil.tsx          Always-mounted curtain that animates the mode swap [NAV-03]
  ├─ story/ScrubStory.tsx         Story root: pins, deep links, availability, prefetch
  │   ├─ hero/Hero.tsx            Above-the-fold intro (PortraitSlot cutout)
  │   ├─ story/Dip.tsx            "THE STORY" opener between hero and phase 1
  │   ├─ story/StoryCanvas.tsx    Persistent video canvas + driveScrub [SCR-07/10/11]
  │   ├─ story/PhaseStage.tsx     Pinned phase sections (exports StageTLProvider)
  │   ├─ story/TransitionStage.tsx Transition pins (shares StageTLProvider)
  │   ├─ story/beats/, visuals/   Text beats + lower-left visual shells [SCR-11]
  │   └─ story/ContactSection.tsx Final CTA — direct channels + form, visitor-first layout [CONTACT-01][CONTACT-02]
  │       └─ story/ContactForm.tsx  Message form panel — reason→message→identity flow (every mode) [CONTACT-01][CONTACT-02]
  ├─ story/FlowingStory.tsx       lite/static rendering (posters, no video)
  │   └─ story/ProcessLedger.tsx  Flow twin of the 7 phase pins — one "How I work" ledger, #process [LITE-01]
  └─ quick/QuickView.tsx          Overlay view (lockScroll + data-lenis-prevent)

src/lib/media/media.ts            Media URL map (videos `?v=` versioned [VID-01]) + probeMedia (1-byte ranged GET)
src/lib/media/variant.ts          Session-stable clip-variant pick (full/light) [CACHE-03]
src/lib/media/preload.ts          Up-front asset preloader → blobs [LOAD-01]
public/sw.js                      Media Service Worker — cache-first /media [CACHE-02]
src/lib/mode/experience.ts        Mode store: ?mode= > saved > reduced-motion > heuristics
src/lib/mode/switch.ts            Toggle→veil request bus (direct setMode fallback) [NAV-03]
src/lib/scroll/engine.ts          Lenis on gsap ticker; start/stop vs destroy [SCR-09]
src/lib/scroll/activePhase.ts     Active-phase store (rail, progress, announcements)
src/content/phases.ts             All phase/transition copy + scrollVh pacing
src/content/work.ts                The 9 launched products (Work shelf data) [WORK-01]
src/features/story/WorkSection.tsx  Pinned horizontal shelf (story) + flow grid (lite/static) [WORK-01][HOLD-02]
src/content/skills.ts             Canonical stack: 8 disciplines / 74 tools (bot + section) [STACK-01]
src/features/story/StackSection.tsx Pinned stack ledger (story, natural flow after the shelf) + flow ledger (lite/static) [STACK-01][HOLD-01][HOLD-02]
src/content/experience.ts         Canonical career logbook: 4 postings, oldest-first (bot + section) [LOG-01]
src/features/story/ExperienceSection.tsx  Pinned route-line logbook (story, natural flow after the ledger) + flow twin (lite/static) [LOG-01]
src/lib/ai/knowledge.ts           Chatbot knowledge base — 39 fact chunks FROM the content modules [BOT-01][BOT-03]
src/lib/ai/rag.ts                 Chatbot engine — local retrieval + composition, no AI provider, no key [BOT-03]
src/app/api/chat/route.ts         POST /api/chat — validation, rate limit, local RAG reply, GET self-check [BOT-01][BOT-03]
src/app/api/contact/route.ts      POST /api/contact — honeypot, rate limit, Resend via fetch + GET self-check + ref codes [CONTACT-01][CONTACT-03]
docs/CONTACT-SETUP.md             Owner setup: Resend + Vercel + Cloudflare DNS walkthrough [CONTACT-01]
docs/AI-CHAT-SETUP.md             Owner guide: the no-key RAG chat — verify + edit the brain [BOT-03]
src/features/chat/ChatWidget.tsx  Floating ask-me-anything panel (z-30, non-modal; prints ref codes) [BOT-01][BOT-02]
TODO.md                           Open items + fix log
```

### Story mechanics (the parts that must not regress)

- **Canvas**: one sticky never-scrolling stage; all 13 clips as layers.
  Only ±1 segments around the active one keep a mounted `<video>`.
  Playhead/opacity live in `canvasStore` proxies, tweened by each stage's
  timeline, applied on the GSAP ticker — scrubbing never re-renders React.
- **Hand-off [SCR-08]**: at 82% of each pin the next clip starts fading in
  and pre-scrubbing to 18% — no dead frame at clip ends.
- **Boundaries [SCR-11]**: each section wrapper uses `-mt-[100svh]` so pin
  starts exactly meet the previous pin end (pinSpacing otherwise leaves a
  frozen-viewport gap — visitors read that as "video stuck").
  EXCEPTION [HOLD-02/LOG-01]: the sections AFTER the video canvas follow
  in NATURAL FLOW (no `-mt`) — the stack ledger after the Work shelf and
  the logbook after the ledger. The butt-joint made a following pin slide
  OVER the previous section's last viewport of travel / hold (see Rounds
  21–22). The phase pins keep the `-mt` — that rule exists for the VIDEO
  canvas hand-offs.
- **Late-pin creation order [LOG-01]**: the video stages re-create their
  pins on viewport flips; the three late pins (Work / Stack / Experience)
  must never outlive that. ScrubStory runs a guard after every refresh:
  if a late pin's start diverges from its spacer top (creation-order
  corruption, mobile — see Round 22), it remounts the three sections so
  their pins re-create LAST. Do not remove the guard or the keys.
- **driveScrub [SCR-10/11]**: settle (½-frame → hold) / rate-assist (small
  forward gaps play natively with buffer headroom) / single-flight
  frame-quantized seeks with a 350 ms watchdog. Requires short-GOP encodes.
- **Reading pace [SCR-11]**: `scrollVh` in `src/content/phases.ts` is the
  pin length per section (raised ~40% in round 7 — do not lower it back).
- **Visual shells [SCR-11/MOB-01]**: illustrations pin lower-left on
  desktop (`VisualShell`), never covering the clip subject; below lg
  they anchor to the SAME bottom band as the text beats (pb-8svh,
  horizontally centred) so the top band belongs to the phase label
  alone — see "Round 14" below.
- **Visual sizes [VIS-01]**: a visual's inner width must be DEFINITE
  (`w-[min(<px>,<svh>,calc(100vw - shell - card padding))]`) — never
  `w-full max-w-[…]`: the story-card is a shrink-to-fit flex item, so
  `w-full` resolves against a content-driven width and SVG visuals
  collapse to the 300×150 default intrinsic size (phase 3 sat at 300px
  for 16 rounds). The svh term keeps the card clear of the StageLabel
  card, the calc term keeps phones/tablets from overflowing (vw is not
  a bound for fit-content). See "Round 17" below.

### Preloader [LOAD-01] — first visit / refresh

`src/lib/media/preload.ts` (singleton) fetches every story asset up front
behind the Loader: videos become **in-memory blobs** (scrub/seek never
touch the network afterwards), posters + hero warm the HTTP cache.
Byte-weighted progress (rAF-coalesced) drives the Loader's bar, percent and
"footage 08/13" counter.

- Trigger: **Portfolio's mode effect** — only after mode resolution
  (story only). ScrubStory mounts before resolution and must NOT start it
  (a ?mode=lite visitor would otherwise download 70 MB); it only starts
  the preload when mode was already resolved (late story mounts).
- Skip: "Skip loading" button after 6 s (or Esc) aborts in-flight fetches;
  finished blobs stay, unfinished clips stream the old way (the idle probe
  path provides availability then). Hard 25 s cap in the Loader.
- Variant: `pickVideoVariant` (see "Delivery & caching" below) —
  desktop 1080p, touch/narrow or slow-link 960w `-m` clips.
- Refresh: blobs don't survive reload but `cache: "force-cache"` refills
  at disk speed (~0.3 s for all 13 on a warm cache).
- Prefetch links (`ScrubStory`) now only fire when preload status is
  "skipped" — any other state they'd race/duplicate the preloader.

### Delivery & caching [CACHE-02/03] — the "video still renders slowly" round

Measured through the preview gateway (2026-10-31): the sandbox origin
serves at ~350 MB/s and the gateway loops back at ~30 MB/s, full GETs
forward the origin's `Cache-Control`/ETag — but HEAD is 403 (probeMedia
already works around that) and 206 range replies drop the cache headers.
The real cost is the user-side leg + ~70 MB of desktop footage crossing
the proxy on a cold cache. Two levers shipped:

- **[CACHE-02] `public/sw.js` — media Service Worker.** Registered
  beforeInteractive in the root layout (so even the first visit's later
  preloader fetches land in it). Intercepts ONLY same-origin GETs under
  `/media/` without a Range header: cache-first from the `media-v2` Cache
  API, populate on miss, `ignoreVary` matching. Responses ≤ 2 MB (posters,
  hero) serve stale-while-revalidate and self-heal after re-encodes; the
  mp4 clips are strict cache-first — **after a re-encode, bump
  `media-v2` → `media-v3` in sw.js AND `VIDEO_REV` in media.ts** (rule
  also noted in encode.mjs; why BOTH, see "Round 15" below).
  Range requests pass through untouched: the 1-byte availability probe
  must not trigger a multi-MB download, and the streaming fallback needs
  native range behaviour. Verified: repeat story visit = 31 media
  requests, 0 over the network; lite mode = 0 video requests; scrub
  forward/reverse, blobs and hand-offs unchanged; console clean.
- **[CACHE-03] `src/lib/media/variant.ts` — `pickVideoVariant()`.** One
  session-stable function deciding full (1080p) vs light (960w, ~28 MB):
  touch/narrow always light; desktop goes light too when the Network
  Information API signals saveData / ≤3g / downlink < 1.5 Mbps (Chromium
  only — Safari/Firefox keep full quality). Called by the preloader,
  ScrubStory's availability maps and StoryCanvas's layer pick so the
  blob map and `<video>` src can never disagree. Deliberately does NOT
  flip on mid-session viewport changes (a src swap mid-scrub would stall
  the scrubber).
- **CDN**: production deploys (Vercel/Cloudflare etc.) get edge caching
  for `public/` automatically, and `NEXT_PUBLIC_MEDIA_BASE_URL` in
  media.ts moves the clips to a bucket/CDN without code changes. Nothing
  more to build in-sandbox — the preview gateway is fixed plumbing.

### Round 35 — the chat brain, RAG-only [BOT-03]

**Request (owner, 2026-11-03):** "use only RAG chatbot in AI Chatbot,
do not use any AI provider. make it working that only use the project.
i do not have api key access."

**Shipped — the provider wiring is gone; the brain is local retrieval:**

- **src/lib/ai/knowledge.ts rewritten as the knowledge base** — 39
  answer chunks compiled from the canonical content modules (facts /
  projects / work / skills / experience / phases): person, location,
  projects overview + 9 product chunks, stack overview + 8 discipline
  chunks, experience overview + 4 posting chunks, metrics, process
  overview + 7 phase chunks, website, resume, contact, availability.
  Each chunk carries topic + title + keywords + a pre-composed plain-
  text body (+ follow-up suggestion). Nothing a chunk says is absent
  from the site; deliberate omissions (per-project result sentences,
  phone) stay omitted. Also exports skillToolIndex / toolUsage (tool →
  discipline → shipped-in products, with work.ts↔skills.ts spelling
  aliases) and stackFact.
- **src/lib/ai/rag.ts (new) — the engine**: tokenizer (dot/+/# aware,
  stopwords, plural folding), corpus IDF, BM25-lite scoring (keyword ×4
  ≫ title ×2.5 ≫ body ×1, multiword phrase bonus), intent regexes →
  topic bonuses in TWO TIERS (overview +7, specific +9 — the first
  probe round caught the flat bonus sending "What did he do at
  Tensei?" to the shelf product instead of the logbook posting).
  Composer paths: tool lookup (discipline + shipped-in list), honest
  misses (TECH_HINTS → "isn't in the published stack"), discipline
  drill-down ("IoT toolkit" → that group), deterministic follow-ups
  (the stateless server re-retrieves the previous turn and answers
  short references from that chunk's matching block, with a merged-
  context retry), greeting/thanks/identity, soft confidence ("closest
  thing I know…") and an honest fallback steering back to scope.
- **/api/chat simplified**: POST = validate → rate limit →
  answerFromMessages → { reply }. The provider fetch, AI_API_KEY,
  sandbox SDK, timeout race, maxDuration and their ref codes (ai-*,
  network, timeout, sandbox-error, not-configured) are all removed;
  only rate-limited and the defensive rag-error remain. GET self-check
  now always answers { ok, configured: true, provider: "local-rag",
  model: "portfolio-content", knowledgeChunks: 39 }. No env vars, no
  network egress — identical behavior sandbox + Vercel, zero per-
  question cost. ChatWidget untouched: brain-agnostic, and multi-line
  bubbles were already pre-line.
- **docs/AI-CHAT-SETUP.md rewritten** for the no-key reality (how the
  RAG brain works, self-check, the two remaining ref codes, how to
  edit the brain, honest limitations: no paraphrasing, English-only,
  deterministic). .env.example: the AI block removed.
  z-ai-web-dev-sdk stays a sandbox-tooling dependency but no app code
  imports it.
- **scripts/probe-chat.sh (new)** — the ~20-question verification
  battery (overviews, entities, tool lookup, honest miss, follow-up,
  drill-down, smalltalk, identity, fallback, 400s).

**Verified:** tsc clean for src/ (the skills/ scaffolding error remains
the documented exclusion) + eslint clean; dev server RESTARTED (new
module files are not picked up hot) → GET self-check
{provider:"local-rag", knowledgeChunks:39}; full battery — "What has
Eirele built?" → the 9 products, "What's his tech stack?" → the
74-tool ledger, "Does he know Flutter?" → Mobile discipline, "Where
has he used Laravel?" → + shipped in Reservation PH / Tensei, "Does he
know Python?" → honest miss, "Tell me about BrilliantPOS" → product
details with a single non-repeating follow-up, "What stack does it
use?" (follow-up) → its stack line, "What did he do at Tensei?" → the
logbook posting (1,000+ devices @ 99.9% uptime), "What's in his IoT
toolkit?" → the IoT group, "Explain the story section" → 7 phases +
the Novara demo label, phase 3 → key line + #architecture deep link,
contact / phone / availability / location / resume / metrics all
grounded, "hi" / "Are you ChatGPT?" / "What's the weather in Paris?" →
greeting / identity / fallback, invalid payloads → 400; browser
(lite) — widget opens, real keystrokes, the grounded multi-line reply
renders in the bubble. Story mode byte-for-byte untouched (chat files
render in no mode's canvas).

### Round 34 — the chat assistant, deployable [BOT-02]

**Request (owner, 2026-11-02):** "after i deployed it in vercel
'https://eirelejovenboter.com/', the chat ai assistance stopped working.
can you fix it so i can use it in my deployed portfolio."

**Root cause (SDK inspected):** `ZAI.create()` → `loadConfig()` reads a
`.z-ai-config` JSON FILE from process.cwd() / ~ / /etc. The file exists
in the dev sandbox (that's why the preview worked), but a Vercel
deployment has none — and should never carry one, it holds a key — so
on production every POST /api/chat threw inside `getZAI()` and visitors
got "The assistant is unavailable right now." The bot was
sandbox-only by construction, not a deploy bug on the owner's side.

**Shipped — the route resolves its brain in order:**

- **Production path: `AI_API_KEY` env var → plain fetch** to an
  OpenAI-compatible endpoint: `AI_BASE_URL` (default the Z.ai open
  platform, `https://api.z.ai/api/paas/v4`) + `AI_MODEL` (default
  `glm-5.3`, today's docs flagship; verified via docs.z.ai — Bearer
  auth, /chat/completions, OpenAI-SDK-compatible). GLM
  `thinking: disabled` is sent only to z.ai hosts so stricter providers
  never see an unknown field. Same dependency-free style as the contact
  route; `Accept-Language: en-US,en` per the API docs.
- **Fallback: the sandbox SDK, loaded lazily** (`await import(...)`) —
  the preview keeps its config-file path and behaves exactly as before;
  the SDK is never initialized on a deployment without the env var.
- **Neither available → 503 `not-configured`** with a visitor-safe
  bubble ("isn't wired to a brain on this deployment yet — the contact
  form and direct email always work") — no more dead "unavailable".
- **Ref codes + owner hints on every failure** [CONTACT-03 pattern]:
  `ai-auth` (401/403), `ai-quota` (429), `ai-unavailable` (5xx),
  `ai-<status>`, `network`, `timeout` (504), `rate-limited`,
  `sandbox-error`. Provider bodies (can quote account data) stay in the
  function log (400 chars); visitor `error` texts unchanged apart from
  the new not-configured one.
- **GET /api/chat wiring self-check** — `{ ok, configured, provider:
  "env" | "sandbox-sdk" | null, model }`, Cache-Control: no-store, no
  key material.
- **ChatWidget** — error responses render the bubble directly with a
  tiny `ref: <code>` line inside (label-mono, muted); network aborts
  keep the existing draft-restore behavior. `export const maxDuration =
  60` guards the 30 s race headroom (Hobby fluid allows 300 s).
- **docs/AI-CHAT-SETUP.md** (new) — owner walkthrough: Z.ai open
  platform key → Vercel env vars (`AI_API_KEY`, optional
  `AI_BASE_URL`/`AI_MODEL`) → redeploy → self-check + widget test →
  ref-code troubleshooting table. `.env.example` documents the vars.

**Verified:** tsc clean for src/ (scaffolding exclusions remain),
eslint clean; sandbox path — GET → `{configured:true, provider:
"sandbox-sdk"}`, POST "What has Eirele built?" → grounded reply naming
Reservation PH / BrilliantPOS / Tensei iBMS (200, ~10 s); provider path
— restarted with a deliberately invalid key: GET → `{provider:"env",
model:"glm-5.3"}`, POST → real call to api.z.ai → provider 401
(`token expired or incorrect`) → 502 `ai-auth` + hint + function-log
line; server restored clean; browser (lite) — widget opens, question
asked with real keystrokes, grounded reply bubble renders, panel layout
intact.

**Owner next moves (docs/AI-CHAT-SETUP.md):** pull latest main →
redeploy → get a standard key from the Z.AI Open Platform (z.ai →
model API → API Keys) → set `AI_API_KEY` on Vercel (+ optionally
`AI_MODEL`, e.g. a cheaper variant; `AI_BASE_URL` only for a different
provider) → redeploy → open /api/chat (expect `configured:true,
provider:"env"`) → ask the bot something. If a message fails, read the
`ref:` code in the bubble.

### Round 33 — the contact form, diagnosable in production [CONTACT-03]

**Request (owner, 2026-11-02):** "i already pushed this to github and
import deploy in vercel. i tried the contact form and this is the
error:" — `POST https://eirelejovenboter.com/api/contact 502 (Bad
Gateway)` with `{"error": "The message couldn't be delivered. The
direct email always works:"}` for submission `{name: "jayson navarro",
email: "navarrojayson69@gmail.com", reason: "hello", message: "gi",
company: ""}`.

**Diagnosis first (route code + live probes of the production site).**
The 502 has exactly two sources in the route — Resend answered non-ok,
or the fetch threw — and both returned the same generic visitor
message, so the exact Resend rejection lived only in the Vercel
function log. The probes narrowed the field:

- The 503 "isn't connected to a mailbox yet" did NOT fire ⇒
  **RESEND_API_KEY IS set** on the deployment.
- Honeypot POST → `200 {ok:true}`; a validation POST → `400` with the
  per-field errors ⇒ the deployed route is healthy end-to-end except
  the delivery leg ⇒ **Resend itself refused the send.**
- Realistic causes, in order: **403** (the sandbox sender —
  `onboarding@resend.dev` may only deliver to the Resend account's own
  address until eirelejovenboter.com is verified; likely unless
  CONTACT_TO was set to the signup address), **401** (key invalid /
  wrong account / partial copy), **422** (payload rejected). Which one
  is written to the function log as `[api/contact] Resend NNN: …` —
  unreadable from the owner's browser, which is the real bug shipped
  fixed here:

- **Every failure path returns a safe ref code + owner hint.**
  `resendFailure(status)` maps 401 → `resend-auth`, 403 →
  `resend-forbidden`, 422 → `resend-rejected`, 429 → `resend-quota`,
  5xx → `resend-unavailable`, anything else → `resend-<status>`; the
  catch path → `network`; the 503 gains `not-configured`; the site's
  own 429 gains `rate-limited`. Codes carry no secrets and no
  addresses (a Resend error body can quote the account address — that
  stays in the function log, which the route already writes, 400
  chars). The visitor `error` text is unchanged.
- **The form prints the ref.** ContactForm renders `ref: <code>` in
  label-mono under the error line (state clears with the form), so the
  owner can diagnose a live failure straight from the page instead of
  DevTools → Network.
- **GET /api/contact wiring self-check.** `{ ok, configured, from, to }`
  — the private inbox masked (`e***@gmail.com`, with a
  "(default — facts.ts)" marker), the sender shown as-is (public by
  design), `Cache-Control: no-store`; sends nothing, stores nothing,
  no rate limit needed. Answers "is my key even wired" in one browser
  tab.
- **docs/CONTACT-SETUP.md** — new "Wiring self-check" subsection under
  Step 3 plus a ref-code troubleshooting table (the old symptom rows
  kept and mapped to the codes). `.env.example` names the self-check.

**Production also probed while diagnosing (2026-11-02):** homepage 200;
`server: Vercel`, `x-vercel-cache: MISS`, no `cf-ray` ⇒ Cloudflare is
DNS-only exactly as CONTACT-SETUP.md Step 4 prescribes. But the
**deployment predates SEO-01**: robots.txt serves no Sitemap line,
sitemap.xml still lists `?view=quick`, and the homepage head carries no
canonical link — the owner's push happened before the SEO-01 commit
landed. Pulling latest main and redeploying ships round 32. (Bonus
confirmation: the live pre-SEO sitemap resolves
https://eirelejovenboter.com, which only NEXT_PUBLIC_SITE_URL can
supply ⇒ that env var IS set — TODO "Site meta" item closed by
evidence.)

**Verified:** tsc clean for src/ (the three remaining tsc errors are
sandbox scaffolding examples//skills/, the documented exclusion) and
eslint clean; dev server — GET → `{configured:false, from:"Portfolio
<onboarding@resend.dev> (default — sandbox sender)", to:"e***@gmail.com
(default — facts.ts)"}`, valid POST → 503 `not-configured` + hint,
honeypot → 200; restart with a deliberately invalid key → Resend 401 →
502 `resend-auth` + hint, function-log line `[api/contact] Resend 401:
{"message":"API key is invalid", …}`; server restored clean
afterwards; browser (lite #contact): real submit shows the error box
with the visitor text + `ref: NOT-CONFIGURED` + mailto fallback,
layout intact.

**Owner next moves (mirrored in TODO.md):** 1) pull latest main →
redeploy (gets SEO-01 live plus this diagnosability); 2) open
/api/contact → expect `configured:true`; 3) submit the form once →
read the ref code — `resend-forbidden` ⇒ set CONTACT_TO to the Resend
signup address to test, or finish domain verification and set
CONTACT_FROM (CONTACT-SETUP.md steps 3/5); `resend-auth` ⇒ re-copy a
full-access key; 4) redeploy after each env change (Vercel env edits
don't apply to a running deployment).

### Round 32 — the SEO pass [SEO-01]

**Request (owner, 2026-11-02):** "can you optimize the SEO of my
portfolio website and make it easy to search and find in google
search."

**Assessment first** — the base was already strong from round 1:
title/description from facts.ts, OG + Twitter cards with the real
portrait og-image.jpg, JSON-LD Person, full SSR (no `ssr:false`
anywhere), a noscript content block, h1 = the name. Real gaps found and
fixed:

- **robots.txt never advertised the sitemap** — the static file was
  Allow-only. Replaced by `src/app/robots.ts` (public/robots.txt
  removed): same allow-all rules + `Sitemap: <origin>/sitemap.xml`
  whenever a canonical origin resolves.
- **Origin resolution made automatic** — new `src/lib/site-url.ts`
  (server-only consumers): NEXT_PUBLIC_SITE_URL →
  VERCEL_PROJECT_PRODUCTION_URL → VERCEL_URL → "". The Vercel system
  vars mean canonical/sitemap/robots/JSON-LD are correct from the first
  deploy — the explicit env var stays the override once the custom
  domain is live. A localhost URL is never written to any of them.
- **Canonical added** — `alternates.canonical: "/"` (was missing
  entirely); `?mode=` / `?view=quick` are render variants of one
  document, not duplicate pages.
- **sitemap.xml canonical-only** — the `?view=quick` entry dropped (a
  parameter URL must not compete with "/" in the index); empty sitemap
  until an origin resolves.
- **JSON-LD enriched** — Person gains absolute `url` + `image`
  (og-image.jpg) when the origin resolves.
- **Optional meta verification** — `GOOGLE_SITE_VERIFICATION` env
  renders the Search Console meta tag; the DNS TXT method needs no code.
  `.env.example` documents both vars.
- **Story mode untouched** — layout metadata + two server routes only;
  the story hero's per-char animated h1 keeps its aria-label (the
  lite/static h1 crawlers see carries the plain name as real text).

**Owner side — `docs/SEO-SETUP.md` (new):** deploy on Vercel → verify
the Search Console DOMAIN property via a Cloudflare DNS TXT record →
submit `sitemap.xml` → request indexing of "/"; validation via Rich
Results Test (Person) and `site:` queries; honest expectations (the
unique name ranks fast through the sameAs LinkedIn/GitHub cross-links;
generic keywords need backlinks — link the site from LinkedIn, GitHub
README, the resume).

**Verified:** tsc + eslint clean; dev server restarted (new route
file); `/robots.txt` serves allow-all with no localhost leak in the
sandbox, `/sitemap.xml` is a valid (empty) urlset; the head carries
title/description/canonical/OG/Twitter and the JSON-LD parses as Person
(name, jobTitle, address, sameAs, knowsAbout); the resolver was
unit-tested across all four tiers (explicit env with trailing slash →
stripped, production domain, deployment URL, none → ""); page
re-rendered in-browser (h1 text intact, console clean).

### Round 31 — the work shelf, real captures for Brilliant POS + Duff Street [WORK-IMG-01]

**Request (owner, 2026-11-02):** "can you update the image placeholder
of brilliantpos and duff-street in work section, here are the files." —
two pasted screenshots: `upload/pasted_image_1793614832880.png` (Brilliant
POS homepage, 1904×945) and `upload/pasted_image_1793507399619.png`
(Duff Street homepage, 1919×942).

**What shipped:** `scripts/media/swap-work-images.mjs` (new) — from now
on the ONLY writer of these two files:

- **Artifacts cleaned before the card raster.** Brilliant POS carried a
  cookie-consent banner (bottom-left) + a white content strip below the
  hero — cropped above the banner (y ≤ 670), centre-crop to 1280×720.
  Three candidates were generated and reviewed on a sheet first: the
  left-anchored variant cut the "POINT OF SALE DONE RIGHT" headline, the
  banner-column-crop variant showed mid-word nav fragments — centre won.
  Duff Street carried a browser scrollbar (right edge, x ≥ 1904) and a
  reCAPTCHA badge (bottom-left, x ≤ 64) — both edges trimmed; the top
  announcement bar and the full hero stay.
- **Same conventions as the shelf's real captures** — 1280×720, mozjpeg
  q80 progressive (81 KB / 89 KB), SAME paths (`/media/work/<id>.jpg`):
  no code change anywhere; work.ts, the story shelf, the lite grid all
  read the same paths and picked the captures up untouched. Story mode
  code: byte-for-byte untouched (data-only change).
- **No `media-v` CACHE bump — deliberate.** The work jpgs are ≤ 2 MB and
  the media SW serves that class stale-while-revalidate (instant from
  cache, refreshed in background), so the swap self-heals on each
  visitor's next visit; a bump would also evict every returning
  visitor's cached 70 MB video set over a 170 KB image fix (see
  public/sw.js POLICY — the bump rule stays for >2 MB video bytes).
- **Rerun safety.** `work-images.mjs` no longer lists the two ids in its
  PLACEHOLDER array, so a regenerate-everything run cannot clobber the
  swaps; its docblock and the work.ts docblock name
  `swap-work-images.mjs` as the only writer. Remaining placeholders:
  baganivpn + pinoyinternethub (domains unreachable from the sandbox).

**Verified:** candidate sheet inspected; in-browser — lite `#work` grid
shows both captures clean (no banner/scrollbar/badge); story shelf
scrubbed 01→06 — Duff Street card centred clean, Brilliant POS peek
confirms the new bytes, the two remaining placeholders correct; tsc +
eslint clean (src/).

### Round 30 — the resume, ATS-hardened [ATS-01]

**Request (owner, 2026-11-02):** "Read the project state. Next, can you
make the resume ats friendly or is it already ats friendly? update the
project state after."

**Assessment first** — the RES-01 PDF was already most of the way to
ATS-safe: born-digital text (pdftotext extracts every line in reading
order), standard section headings (PROFILE / EXPERIENCE / SELECTED
PROJECTS / SKILLS), effectively single column, base-14 Helvetica,
reverse-chronological date ranges, contact block in the body, no photo,
no text-in-graphics, no headers/footers, no forms/JavaScript (pdfinfo:
Form none, JS no), ATS-conventional filename. Three real parser risks
shipped fixed in `scripts/make_resume.py`:

- **Zero Table flowables.** The experience rows (0.1 mm-gutter Tables)
  and the skills rows (28/126 mm two-column Table) are now plain
  paragraphs with indents — skills read "Label — items", one flowing
  paragraph per category. Tables are the #1 known mangler for ATS
  layout heuristics (cells dropped, reordered or glued — pdftotext
  happened to read them, real parsers are not obliged to). Rendered
  page inspected: same ledger look.
- **No exotic whitespace.** The two invisible U+3000 full-width spaces
  inside the job-title and project-title lines became visible " · "
  separators; extracted text now contains only · – — as non-ASCII.
- **Metadata filled.** PDF Subject ("Resume — Software Engineer (Web,
  IoT, AI)") and Keywords (stack head terms) now sit alongside
  Title/Author.

**Deliberately NOT changed:** no phone number (facts.ts
`phonePublic: false` — an owner FACTS decision; most ATS forms ask for
one, so it stays theirs to make), no EDUCATION section (nothing
canonical to state — logged as TODO CONFIRM #7; ATS forms often have a
required education field), "SELECTED PROJECTS" heading kept (contains
the standard PROJECTS token), en-dash bullets and date ranges kept
(universally parsed), Helvetica left unembedded (base-14 is the most
widely mapped resume font family).

**Verified:** regenerated; pdfinfo = 1 page A4 with Subject/Keywords
present; pdftotext carries Yellow Cab / Wallem / Tensei / 1,000+ /
99.9% / 250+ / reservationph.com / LoRaWAN, skills extract as clean
"Label — items" lines, U+3000 gone; rendered page inspected — same
ledger look, no overflow, bottom margin clear; serves 200 at the
unchanged `person.resumePath` on :3000 and :81 (hero CTA, contact
ELSEWHERE, Quick View untouched). Also: `/tool-results/` (session
tool-output scratch) added to .gitignore.

### Round 29 — the resume, resynced to the portfolio [RES-01]

**Request (owner, 2026-11-02):** "done. thank you. Read the project
state. Next, can you update the resume base on the portfolio. update
the project state after." — the served PDF (Oct 31) predated the
logbook and the Work shelf.

**What shipped:** `scripts/make_resume.py` rewritten around the
canonical content modules; PDF regenerated (one page A4, same ledger
look — amber rule, hairlines, gray meta; tightened type to fit).

- **Experience = `experience.ts` (the logbook), verbatim.** All four
  postings, with the companies the old resume lacked: Operations
  Manager — Yellow Cab Pizza Co. (team of 25, inventory + labor costs,
  100% customer-satisfaction), Able Seaman — Wallem Philippines
  Shipping, Inc., Full Stack Web & Mobile Developer — Freelance
  (end-to-end: booking systems, POS, the medical clinic site), Full
  Stack Software Engineer / IoT Specialist — Tensei Philippines Inc.
  (iBMS/CMMS/automation lifecycle, 1,000+ devices @ 99.9% uptime via
  MQTT/WebSockets, dashboards + Android app, GCP with automated tests).
  Only edit: two pairs of adjacent owner bullets merged to keep one
  page.
- **Projects = `work.ts` (the Work shelf), verbatim** — first four in
  the owner's shelf order, each with its live domain, description and
  stack exactly as shipped: Reservation PH / BOOKING SAAS, Brilliant
  POS / RETAIL & RESTAURANT POS with the kept 250+ businesses metric,
  Duff Street Medical Complex / CLINIC WEBSITE · AU, Tensei Philippines
  Inc. / ENTERPRISE · IBMS. This drops claims the owner's newer copy
  replaced (old "Laravel 12, Next.js" and "Laravel 7" stacks, Duff
  Street "50+ doctors / telehealth", Reservation PH "loyalty programs /
  analytics dashboards" — none in work.ts anymore).
- **Skills = `skills.ts` (the stack ledger) digest** — the ledger's own
  categories as rows (Frontend, Backend, Mobile, IoT & Hardware,
  DevOps & Cloud, AI, CMS & No-Code), verbatim item names, curated for
  one page: generic tooling (ESLint, Prettier, Postman, VS Code,
  Webpack, hosting brands) and the AWS/Azure entries dropped (the
  blueprint bans AWS claims; the full owner list lives on the site).
  AI stays specialty + tools only — no AI project claimed (CONFIRM #6).
- **Profile/contact mirror `facts.ts`** — heroBeats wording, person
  block; the role line carries AI Engineering as a specialty, as the
  site does.

**Verified:** `pdfinfo` = 1 page; pdftotext carries Yellow Cab / Wallem
/ Tensei / 1,000+ / 99.9% / 250+ / reservationph / Elementor Pro /
LoRaWAN; the rendered page inspected — no overflow, every section fits,
bottom margin clear. Serves 200 at the unchanged `person.resumePath`
(`/Eirele_Joven_Boter_Resume.pdf`) — hero CTA, contact ELSEWHERE and
Quick View need no code change. The "replace with the owner's real
PDF" backlog item stays open.

### Round 28 — the process ledger [LITE-01]

**Request (owner, 2026-11-02):** "now i want to discuss the 'process'
section in 'lite' mode, if i will not include the process and just add
a portfolio information OR make the process simplified not like in the
current. I am okay with the current code in 'Story' mode, so this
improvement is for the 'lite' mode." — discussed first (options laid
out), then: "okay i will go with your recommendation, but i will
repeat, do not change anything in 'Story' mode, please take care of
it." The recommendation taken: a compact merged ledger (NOT a generic
portfolio-info block, which would duplicate Projects/Skills/Experience,
and NOT deleting the process outright, which would drop the only proof
of the hero's "end to end" claim).

**What shipped:**

- **`story/ProcessLedger.tsx` (new)** — one flow-native section
  (`#process`, aria-labelledby `process-h`) replacing the seven flowed
  phase sections in lite AND static. Header: `PHASES 01–07 / HOW I
  WORK` label (amber dash), h2 "One process, end to end.", intro line
  ending "The full walk-through plays in the story." — the ledger says
  itself that the script is story-only. Rows: 01–07 amber index + phase
  name (h3) + its one-line `lede` from `src/content/phases.ts` (125
  words carry the whole process now, vs the full 20-beat script).
  Styling clones the Stack ledger / logbook twins: `border-white/10`
  hairlines, two-column name/lede grid on sm+, amber corner glow,
  `py-[14svh]`, `.reveal` fades in lite only (IO in FlowingStory picks
  them up; static renders final-state).
- **FlowingStory.tsx** — the phases map + `FlowMedia` (per-phase poster
  probe/render) removed; `<ProcessLedger lite={lite} />` inside the
  dark `data-theme-section` wrapper ahead of WorkFlow. Dead imports
  gone (StageLabel, BeatView, CinematicBackdrop, MEDIA/mediaUrl/
  probeMedia, useState). Net effect: lite/static drop 7 poster loads
  and the page shortens by seven tall sections — Projects/Skills/
  Experience/Contact arrive much sooner.
- **FlowMenu [NAV-04] rewired** — "Process" now targets `#process`;
  the scroll-spy watches `myself → process → work → stack →
  experience → contact` (the phase slugs left the spy — they are
  story-only ids).
- **ModeVeil fold [NAV-03]** — LANDMARKS keeps the seven slugs
  (story-side resolution) and gains `process` (flow-side);
  `applyAnchor` folds when the destination rendering lacks the id:
  any story phase → the flow ledger, the flow ledger → the story's
  first phase (`#discovery` pin start). Same-landmark switches pass
  through untouched.
- **knowledge.ts** — new grounding line: lite/static fold the phases
  into the #process ledger; the full narrative plays only in story.
  The chatbot's phase facts themselves are untouched (it grounds on
  `phases.ts` either way).
- **STORY MODE UNTOUCHED** (owner repeated it twice) — no story file
  edited: ScrubStory, PhaseStage, phases.ts content, beats, visuals,
  StoryCanvas all untouched; the ledger reads the same content module
  the story pins render from.

**Verified (browser):** story — all seven slug sections exist, scrub
alive (video currentTime 0 → 8.58 s on scroll), deep link /?mode=story
#design still lands exactly on the pin. lite desktop — `#process`
renders 7 rows (first "Discovery"), 0 phase-slug sections, 0 poster
imgs in the section, page = 6 sections total (hero + process + work +
stack + experience + contact); Process menu click lands #process at
viewport top 0, both `.reveal` blocks flip to `.is-in`, scroll-spy
marks exactly "Process"; static — same ledger, zero reveal classes.
Mode-switch folds: lite parked at #process → STORY lands #discovery at
top 0; story parked on the design pin → LITE lands #process at top 0.
Mobile 390×700 — rows stack name-over-lede, no horizontal overflow.
Console clean on fresh loads; tsc + eslint clean.

### Round 27 — the mode-aware chrome [NAV-04]

**Request (owner, 2026-11-02):** "in story mode: remove the button
'contact' and 'download my resume' in menu bar, keep only the toggle
(Story/Lite) button. in lite mode: add a menu for home, process,
projects, skills, experience , contact and the toggle (Story/Lite)
button, make it hamburger menu when it in mobile screen." + "update the
project state after."

**What shipped:**

- **Chrome.tsx is mode-aware** (`useExperienceMode`). Story: wordmark
  left, STORY/LITE toggle right — nothing else (contact + resume live
  at the end of the narrative; this supersedes the round-18 decision
  that kept the resume link in the bar of every mode — the download
  remains in the hero CTA, the contact section's ELSEWHERE row and
  Quick View). Lite/static: wordmark + FlowMenu + toggle. Order
  matters: the toggle anchors the right edge on desktop, the hamburger
  takes the right edge on mobile (thumb reach).
- **`chrome/FlowMenu.tsx` (new)** — one item list (Home→top,
  Process→#discovery, Projects→#work, Skills→#stack,
  Experience→#experience, Contact→#contact) and one scroll-spy, two
  halves: `FlowMenuLinks` (sm+) — mono labels whose active item gets an
  amber dash + full ink (`aria-current`); the spy is an
  IntersectionObserver over a thin band at the viewport middle
  (-45%/-45%, mirroring FlowingStory's theme observer) covering hero,
  ALL seven phase slugs (they all map to "process" so the marker holds
  through the whole run), work, stack, experience, contact.
- **`FlowMenuMobile` (<sm)** — two-bar hamburger → X; a full-screen
  always-dark ledger overlay: top row mirrors the bar (EJB + close at
  the hamburger's spot), numbered rows 01–06 with hairline dividers,
  active item amber + a "here" marker, footer "{name} — {role}".
  Scroll locks via `documentElement` overflow (Lenis doesn't exist in
  lite/static), Esc closes and returns focus to the hamburger, a
  minimal Tab trap keeps focus inside. **The panel is portalled to
  document.body** — rendered inside the header it sat in the header's
  z-20 stacking context and the chat launcher (z-30) painted over it.
- **CSS-only motion** (opacity/translate transitions,
  `motion-reduce:transition-none`) — static and reduced-motion visitors
  get instant states, same rule as the ModeToggle thumb. Link taps
  close the overlay first (the cleanup releases the scroll lock) then
  `scrollToTarget` — native smooth scrolling in lite/static, where the
  Lenis engine is destroyed.
- **Analytics**: new `nav_click` event with
  `{channel: flow_menu | flow_menu_overlay, item}`; the story Contact
  button's `contact_click {channel: nav}` disappears with the button,
  every other contact_click channel stays. knowledge.ts grounding
  lines refreshed (chrome description + resume locations).

**Verified (browser):** story desktop — bar = EJB + STORY/LITE only
(Contact and Resume gone; hero CTA + contact ELSEWHERE still carry the
resume). lite desktop 1280×800 — HOME…CONTACT row + toggle; parked at
#work, aria-current lands on Projects (the only marked item); a Skills
click lands #stack at viewport top 0. Mobile 390×700 — bar = EJB +
toggle + hamburger (rightmost); overlay shows the numbered ledger rows,
"04 SKILLS · here" after scrolling to #stack, scroll locked, the chat
launcher sits UNDER the panel (portal fix confirmed in screenshot), Esc
closes + unlocks + refocuses "Open menu", a Contact tap closes and
lands #contact at 0. static mode — the menu is present (rides the lite
side [NAV-03]). Toggle to STORY from lite — the bar reverts to
toggle-only, the PhaseRail returns, header z back to 20. Console clean
on fresh loads; tsc + eslint clean.

### Round 26 — the contact section, visitor-first [CONTACT-02]

**Request (owner, 2026-11-02):** "what can we do about 'PHASE 11 / YOURS\n…' or the whole contact section, can you make it a better UI/UX if\nyou're going to be the visitor. i mean a user friendly UI/UX and easy to\nunderstand and to use. but don't get me wrong, i like your current\ndesign in contact section, but i feel it can be improve. maybe we can\nstill improve the whole contact section. let's give it a try." +\n"update the project state after."

**What shipped** (same visual language — ledger, amber, mono; every\nchange answers a question a visitor actually has):

- **Left column = "who am I writing to?"** A live Mandaluyong clock now\n  sits under the lede: `{person.location} — HH:MM UTC+8` (Asia/Manila\n  via `Intl.DateTimeFormat`, 30 s tick; first paint shows a mono\n  `--:--` placeholder so SSR markup never mismatches). It sets the\n  reply-time expectation factually from facts.ts — no invented "replies\n  in 24 h" promise. The two direct channels moved under ledger\n  micro-labels: **DIRECT** (mailto pill + copy button now share ONE\n  row) and **ELSEWHERE** (LinkedIn / GitHub / resume), each with a\n  hairline top border. The trailing "Or use the form — it lands in the\n  same inbox" line is GONE — it cross-referenced right while pointing\n  left; the form panel states the channel contract itself in its\n  header: "→ SAME INBOX AS THE EMAIL".
- **Form re-flow to the visitor's order** — 01 REASON (one-tap pills,\n  unchanged) → 02 MESSAGE (the point) → 03 NAME + 04 EMAIL (identity\n  last: autofill makes it cheap, the reply needs it; 2-col grid on\n  sm+, stacked on phones). The writing prompt now follows the chosen\n  reason (work: "The project — what it must do, and by when…" / hire:\n  "The role — team, product, start date…" / hello: "What's on your\n  mind?"). A live char counter (`0 / 5000`) sits in the message label\n  row and turns red over the last 500 chars. Name placeholder "First\n  name is enough" lowers the bar; the email error now says "check for\n  a typo". Validation focus follows the new visual order (message →\n  name → email).
- **Sent state answers "what happens next"**: "Thanks, {first} — it\n  landed in my inbox. I'll write back to {email}." + "Same inbox as\n  {email} — nothing gets lost." Reset also restores the reason to\n  work. Privacy line tightened: "Straight to {email} — no lists, no\n  newsletter."
- **One gentle entrance**: the grid's two children get a one-time GSAP\n  reveal (autoAlpha 0→1, y 24, stagger 0.1) when the section first\n  crosses 72% of the viewport — ContactSection is shared, so it\n  carries its own trigger in story AND lite (lite's IO still handles\n  the other sections; no double animation since no `.reveal` class is\n  used here). `once: true` — no lingering ScrollTrigger. static mode\n  skips by contract (`getMode()`), prefers-reduced-motion skips.
- **API untouched** — same payload shape, same endpoint; this round is\n  presentation + flow only.

**Verified (browser):** story + lite desktop 1280×800 — clock live\n(13:12/13:13 UTC+8, ticking), DIRECT row, ELSEWHERE row, panel header,\nreordered fields; placeholder follows the reason pill ("What's on your\nmind?" after clicking Just saying hi); typing moves the counter\n(30 / 5000); empty submit focuses 03 Name with both errors inline;\nreal submit (dev has no RESEND_API_KEY) shows the 503 alert with the\nfallback email; fetch stubbed to ok → sent panel with the reply-to\nsentence; "send another message" clears everything, counter 0 / 5000,\nreason back to work. Mobile 390×700 story — clock row wraps cleanly,\npill + copy wrap to two rows, stacked form, name/email full-width, no\noverflow. static mode — reveal correctly skipped (opacity 1, clock\nstill ticks). Mode switch STORY↔LITE while parked at #contact — both\ngrid children land at opacity 1 (no stuck-hidden regression from the\nnew trigger). tsc + eslint clean; the only page-error entries are\nthree stale HMR artifacts from the edit window (the useGSAP import\nlanded one file-write later) — absent from clean loads.

### Round 25 — the contact form + its mail pipeline [CONTACT-01]

**Request (owner, 2026-11-02):** "let's improve the contact section
'PHASE 11 / YOURS', let's create a form for the visitor, i will let you
decide what will be the design. so you know that i will deploy this on
vercel, and i will buy my domain name 'http://eirelejovenboter.com/' on
cloudflare and connect it to resend. i will also let you decide on how
will be the approach of this. but if you have a better idea, i will go
for it. after that, give me also a instruction if i need anything from
my side or do i need to do something in my end." + "update the project
state after."

**What shipped:**

- **The form** (`ContactForm.tsx` — `ContactSection` is one shared
  component, so story/lite/static all get it): the section is now a
  two-channel grid (two columns on lg, stacked on mobile) — direct
  channels stay left (mailto pill, copy, profiles), the form panel sits
  right under a "SEND A MESSAGE / → MY INBOX" header row. Ledger
  language: numbered mono fields 01 NAME / 02 EMAIL / 03 REASON (radio
  pills: work together / full-time role / just saying hi) / 04 MESSAGE,
  one amber action. States: idle → sending (bouncing dots) → sent
  (green panel, personalised thanks, "send another message" reset),
  plus an inline error alert that always carries the direct email as
  the fallback route. Client validation with per-field errors and
  focus-to-first-invalid. A11y: real labels, aria-invalid/
  describedby, native radio semantics, one persistent sr-only
  `role="status"` live region announcing sending/sent/error (placed
  above the panel switch so "sent" is announceable too). Anti-spam:
  off-screen honeypot field ("company" — filled means bot, the API
  answers fake success). No GSAP in the form on purpose — calm CSS
  transitions, reduced-motion safe. Analytics: `contact_form_sent` /
  `contact_form_error`.
- **The backend** (`src/app/api/contact/route.ts`): dependency-free —
  Resend REST API over plain `fetch` (no SDK added), same conventions
  as /api/chat (hand validation, in-memory rate limit, NextResponse
  error shapes). Order: parse → validate → honeypot → rate limit
  (5 per 10 min / IP) → key check → one Resend POST (12 s timeout).
  Env: `RESEND_API_KEY` (required), `CONTACT_TO` (defaults to
  `person.email` from facts.ts), `CONTACT_FROM` (defaults to Resend's
  sandbox sender until the domain is verified). Nothing persisted;
  `reply_to` = the visitor, so replying in the mail app answers them;
  subject `Portfolio message — <reason> — <name>` (header-safe);
  html + text bodies, html-escaped. Missing key ⇒ 503 with a friendly
  message — the site degrades gracefully, it never breaks.
- **Grounding + docs**: chatbot knowledge mentions the form (same
  inbox; failed send → point to the direct email); `.env.example`
  documents the variables (`.gitignore` got `!.env.example`);
  **`docs/CONTACT-SETUP.md`** is the owner's step-by-step: Resend key
  → local test → Vercel env vars → Cloudflare DNS for the domain →
  Resend domain verification → `CONTACT_FROM` → final check +
  troubleshooting table.

**Verified (browser + curl):** API matrix — 400 field errors / 400 bad
JSON / 200 honeypot fake-success / 429 at hit 6 (5-per-10-min window,
counting across the whole test session) / 503 no-key (curl AND
in-browser alert) / 502 via a REAL Resend call with a bogus key
(`.env` restored afterwards). UI — desktop 1280×800 story: two-column
grid, empty submit shows all three field errors, filled submit (no
key) shows the red alert + email fallback, honeypot submit shows the
sent panel, "send another" resets to a clean form; lite (dark theme)
and static render the same panel; mobile 390×700 lite: stacked panel,
300px form width inside the 350px panel (20px section pad + 1px
border + 24px panel pad — correct), reason chips wrap to full-width
rows, no horizontal overflow. The sr-only sent announcement confirmed
on the right node (a pre-existing amber `[role=status]` chip from
CopyEmailButton shares the section — test selectors must target
`p.sr-only[role=status]`; code unaffected). Console + page errors +
tsc + eslint clean (src/).

### Round 24 — the logbook's first entry stays readable [LOG-02]

**Request (owner, 2026-11-01):** "a quick improvement in 'PHASE 10 /
LOGBOOK', can you add a padding top or margin top in the first data
'01 2014 – 2016 / OPERATIONS / Operations Manager' because i cannot see
it fully, when i scroll it, it will cover it immediately." + "update the
project state after."

**Root cause:** entry 01 was rendered with deliberately NO top padding
(the route-line offset assumed it), so its header lines sat at window
y=0 — inside the window's 30px top mask fade — and the credits-roll
drift starts from the first scrolled pixel. Net effect: the first
posting was half-dissolved AT the pin start and fully covered within
the first ~150px of scroll (baseline screenshots confirm: at +260px
only the bullets were still visible).

**Fix (`ExperienceSection.tsx`, story act only):** a clearance spacer
(`h-28 lg:h-32` — 112px mobile / 128px desktop) inside the drifting
wall, before the `<ol>`; the route line's top offset moved to match
(`top-[127px] lg:top-[143px]` = spacer + the 15px stub to waypoint 01's
dot, dot-centre alignment preserved). Being INSIDE the wall, the spacer
feeds the measured overflow (`drift()` 197→325 desktop, 644→756
mobile), so the credits-roll maths, HOLD, readout thresholds and the
functional `end` all re-derive themselves — no constants touched. Flow
twin unchanged (no mask, no pin — its own margin already clears; comment
updated).

**Verified (browser, before/after at identical scroll offsets):**
desktop 1280×800 — landing: entry 01 top at 127px in the window (was 0),
header lines fully opaque; at +260px (entry 02 landing, readout
2016/ENTRY 02): the whole first posting readable (was: title/tag
dissolved); ride: wall −325 → −325 across the last 150px (HOLD
stillness), bar rests scaleX(1), readout rests 2024, release into
Contact intact; line top 143 == dot centre 143.5. Mobile 390×700 —
landing: entry 01 spans 111→295 in the 430px window (fully visible),
line top 127 == dot centre 127, drift 756, no horizontal overflow
(scrollWidth 390); at +160px the full posting is readable (was:
dissolving). Lite twin: line top 15px, all entries render, no
regression. Console + page errors + tsc + eslint clean (src/).

### Round 23 — the STORY/LITE chrome toggle [NAV-03]

**Request (owner, 2026-11-01):** "can you add a toggle / button in
navigation/menu beside of 'contact' to switch from 'Story' and 'Lite'.
make it call animation when it changes the story and lite version." +
"update the project state after."

**What shipped** — a three-piece mechanism, so the animation survives
the fact that Chrome itself remounts across modes:

- `ModeToggle.tsx` (in Chrome's nav, between the resume link and
  Contact): a segmented pill — STORY | LITE — with an amber thumb that
  slides between the halves (`translateX`, site ease `--ease-out-expo`,
  `motion-reduce:transition-none`). It only RAISES a switch request via
  the `lib/mode/switch.ts` bus (direct `setMode` fallback if no veil is
  mounted). "static" (reduced motion / data saver) rides the LITE side
  — same flowing rendering family — so choosing STORY is the explicit
  opt-in; `aria-pressed` per half, group labelled "Experience mode".
  Nav tweaks for the added width: gap 4→6 at sm, resume label shortens
  to "Resume" under sm (aria-label keeps the full wording). Fits 390px
  on one row (measured: nav 283px + monogram + padding = 390).
- `ModeVeil.tsx` (always mounted in Portfolio, OUTSIDE the mode
  conditionals): the cinematic cut. Two fixed dark panels (hard-coded
  `#0a0a0b` — the html theme legitimately flips during the swap and
  must not repaint the curtain) close over the viewport (0.42s,
  power3.inOut) with the destination word rising in a mask ("EXPERIENCE
  MODE" caption + LITE/STORY, amber rule); fully covered, the mode
  swaps, then the panels retract. Scroll input is locked for the
  ~1.6s cut (html overflow hidden + lenis stop, both restored
  onComplete); pointer events are swallowed by the veil only while it
  is visible; a busy guard makes rapid re-clicks no-ops.
- **Narrative re-anchoring** — the part that makes the switch feel like
  a cut, not a teleport to top: before the swap, the last landmark the
  visitor reached (crossed the viewport middle) is found among the ids
  that exist in BOTH renderings (#myself, the 7 phase slugs, #work,
  #stack, #experience, #contact), pin-aware (`ScrollTrigger` start for
  pinned story sections — element rects lie while pinned; flow offsets
  otherwise). After the swap the new rendering is jumped to that same
  landmark immediately after commit (rAF ×2) and twice more at 400/800ms
  while the story pin spacers settle (the bounded NAV-01 re-jump idea).
  Reduced-motion visitors skip the curtain entirely (instant swap; lite
  reveals are already motion-reduce gated).

Also: `mode_change` analytics (`{mode, from: "toggle"}`), polite live-region
announcement of the destination, chatbot knowledge gained the toggle line,
and the choice persists through the existing `ejb-experience-mode` store
(`?mode=` URL still wins on load, by design [ARC-02]).

**Verified (browser):** desktop 1280×800 — story at the #experience pin
start (45346) → LITE: veil captured mid-flight (panels + "LITE" word),
lands lite at scrollY 11681 == flow #experience top exactly; thumb
slid; STORY back: lands at 45346 — the SAME pin start (symmetric), pins
alive (+800 scroll keeps the section pinned), theme dark, overflow
lock released, console + page errors clean. Bottom edge: story page end
→ lite lands at max-scroll with Contact fully visible (correct clamp).
Mobile 390×700 — one-row nav, work → LITE lands exactly on flow #work
(8650/8650), dark theme legible. Static: `?mode=static` loads with the
LITE side lit, STORY switches (persists "story"); reload without params
restores the saved mode. tsc + eslint clean (src/).

### Round 22 — the career logbook [LOG-01]

**Request (owner, 2026-11-01):** "Next, can we add another section for my
'Experience'. I will give you the permission to decide what is the best
Design for this section. Please take care of this section." + the four
postings verbatim (Tensei 2024–, Freelance 2019–, Wallem 2016–19, Yellow
Cab 2014–16) + "update the project state after."

**The section — "PHASE 10 / LOGBOOK — Different decks, same job."**
(`ExperienceSection.tsx` + canonical `src/content/experience.ts`),
between the Stack ledger and Contact; Contact renumbered
**PHASE 11 / YOURS**. The headline pays off the hero's own line
("Operations manager. Seafarer. Engineer. Different decks, same job…")
— the logbook is the proof. Four postings oldest-first, rendered as a
voyage:

- a route line draws origin-top down the entries; each posting is a
  waypoint whose amber dot (scale 0→1 + ring border → #ffb454) lights
  EXACTLY with its entry's cascade (02–04 at 0.207 / 0.413 / 0.62 of the
  active timeline, step-span 0.62 with 1.45× overlap — stack maths);
  entry 01 renders settled (landing frame never empty);
- a rolling year readout in the header (2014 → 2024, plus ENTRY nn / 04)
  flips on the same thresholds as the reveals; it and the progress bar
  are driven by the ACTIVE portion only (`p = min(1, progress ×
  (1 + HOLD))`) and rest through the beat;
- the wall drifts by the MEASURED overflow inside a masked window (the
  stack ledger's pattern) so all four postings stay readable on phones;
- end-of-pin HOLD = 0.3 × active distance appended (no-op tween + ratio
  in the functional `end`) — the finished route rests before Contact;
- theme flips dark onToggle; waypoints' dots use INLINE `scale(0)` (not
  a Tailwind scale class — the CSS `scale` property would compose with
  GSAP's transform to a permanent 0);
- boundary: NATURAL FLOW after the ledger (no `-mt` — the [HOLD-02]
  lesson); deep link **#experience**; `ExperienceFlow` twin for
  lite/static (line fully drawn, every waypoint lit, no pin); the
  chatbot gained the CAREER LOGBOOK block compiled from the same module
  (verified: POST /api/chat answers the full history) and the deep-link
  list in its knowledge.

**Pin-order guard — a pre-existing mobile bug, found and fixed this
round (`ScrubStory.tsx`).** The video stages re-create their pins on
viewport flips (`useIsMobile` deps + revertOnUpdate). When such a
re-creation ran WITHOUT the three late pins (Work / Stack / Experience)
re-creating too, GSAP's refresh pass (creation order) measured the late
pins while the video spacers above were still collapsed: #work start
1402 vs spacer top 26220, #stack 5152 vs 29970, #experience 7724 vs
32542 — and EVERY later refresh reproduced the same broken order, so
the displaced pins pinned their sections OVER the video phases
mid-story. Only observed mid-session (desktop→mobile viewport flip);
all fresh loads (warm, cold-cache, with/without deep link) measured
correct. Refreshes alone CANNOT repair it, so the guard checks after
every refresh (rAF-debounced) that each late pin's start ≈ its spacer
top (the invariant for start:"top top" pins) and, on divergence,
remounts the three sections once (key bump) so their pins re-create
LAST in document order. Proven in-browser: start corrupted to 0 →
remount → start = spacer top again, experience re-created at creation
index 18 (after maintenance at 15). Capped at 5 heals. Honesty note:
round 21's MOBILE shelf/ledger measurements were taken against this
displaced (frozen-at-final) state and read as "hold works" — they are
superseded by this round's mobile verification; the desktop numbers
stand.

**Verified (browser, fresh loads):** desktop 1280×800 — `#experience`
deep link lands on start+2 (45346 vs 45344); landing frame = entry 01
settled, 02–04 hidden, line scaleY 0, readout 2014 / ENTRY 01; ride:
readout flips 2016/2019/2024 exactly at entry reveals (mid-tween
opacities match the timeline maths; line tip 0.297 at p 0.252); hold:
wall still (inner −197 → −197 across 150 px) while Contact approaches
beneath (1036 → 886), bar full, readout rests 2024 / 04; at the pin
start the stack spacer bottom == viewport top exactly (0 px, adjacent).
Mobile 390×700 — pinDist 1884 (active 1449 = 805 + drift 644, hold
435), landing 2014 / [1,0,0,0], stackBottom −2 adjacent, stillness
−644 → −644 across 120 px, no horizontal overflow (scrollWidth 390).
Lite + static: 4 entries plain flow, line drawn, all waypoints lit, no
pin. Guard heal proven (above). Console + page errors clean; tsc +
eslint clean (src/).

**Known limitation (pre-existing, shared with #work/#stack):** on very
slow mobile loads the deep-link follow loop (8 s budget) can exhaust
before the layout settles and land short of the pin start; the section
itself engages correctly once scrolled to.

### Round 21 — the shelf keeps its stage [HOLD-02]

**Request (owner, 2026-11-01):** "the 'PHASE 09 / STACK' section
overlapped the 'PHASE 08 / SHIPPED' … or it scroll up immediately even
the 'PHASE 08 / SHIPPED' is not done showing all the products website.
i want to add a pause or additional scroll to stay in that section
before transitioning to next section."

**Root cause — the butt-joint itself.** The stack ledger's wrapper
carried the phase-pattern `-mt-[100svh]` [SCR-11], so its pin started
EXACTLY at the shelf's pin end — which means during the shelf's LAST
viewport of pin travel the ledger (later in DOM, same z-index) slid up
OVER the still-pinned, still-riding shelf. A hold inside the shelf pin
could not fix that: the ledger would simply cover it during the hold
instead.

**Fix — two parts, `WorkSection.tsx` + `StackSection.tsx`:**

- **[HOLD-02] shelf dwell** (same pattern as [HOLD-01]): `HOLD = 0.12`
  × the active travel appended after the ride as a no-op tween + the
  ratio multiplied into the functional `end` — ride pace untouched
  (active 4838 px @1280×800 / 2723 px @390×700, hold 581 px / 326 px,
  ratio exactly 1.12). Card 09 rests centred at 09/09 with a full bar.
  The counter + bar are driven by the ACTIVE portion only
  (`p = min(1, progress × (1 + HOLD))`) so they hit 09/09 exactly when
  the travel completes and REST through the dwell — a raw-progress
  counter would have sat at 08 during the still beat.
- **The ledger follows in NATURAL FLOW**: the `-mt-[100svh]` wrapper is
  GONE from StackSection (scrub story only; StackFlow untouched). The
  [SCR-11] rule stays for the phase pins — it exists for the VIDEO
  canvas hand-offs, which the ledger has none of. New sequence: ride →
  card 09 rests (ledger still below the viewport) → shelf releases and
  scrolls away with the ledger following exactly one viewport beneath
  (measured adjacent to the pixel) → ledger pins 100svh after the
  shelf's release.

**Verified (browser, story mode, fresh clean loads):** desktop
1280×800 — late ride: ledger top 1781 (far below the viewport) while
the shelf still travels (counter 08); hold: track identical −4544
across 220 px of scroll, counter rests 09, bar scaleX(1), ledger still
below the viewport (1381 → 1161); departure: shelf bottom == ledger
top at 700 (adjacent: true) moving as one page; ledger pins at shelf
end + 800 with row 01 settled and rows 02–08 hidden (landing frame
never empty); `/?mode=story#stack` lands on the new pin start
(scrollY 43181 vs start 43179). Mobile 390×700 — hold 326 px, no
overlap, 09/09 rest, adjacent departure, no horizontal overflow. Lite
mode: both sections plain flow (9 cards / 8 rows, no pins). Console +
page errors clean; tsc + eslint clean (src/).

### Round 20 — end-of-pin hold before Contact [HOLD-01]

**Request (owner, 2026-11-01):** "add a additional scroll/pause before
going to the next section" — right after the stack ledger shipped, so
the beat belongs at the end of THAT section, before Contact arrives.

**What changed — `StackSection.tsx` only.** The stack pin used to
release the instant the credits-roll completed, so Contact replaced the
finished ledger with no breath in between. The pin now appends a DWELL:
`HOLD = 0.35` × the ACTIVE distance (cascade + roll) added on top, as a
no-op tween (`tl.to({}, { duration: HOLD }, 1)`) plus the same ratio
multiplied into the functional `end`. Multiplying `end` (instead of
stretching tween durations) keeps the active scroll pace untouched:
measured active 1011 px @1280×800 / 1386 px @390×700 — identical to
Round 19 — pin distance now 1365 px / 1871 px, hold 354 px / 485 px,
ratio exactly 1.35 on both viewports. The header progress bar fills
across the ACTIVE portion only (`scaleX(min(1, progress × (1 +
HOLD)))`): it reaches 1.0 exactly when the roll completes and rests
full through the stillness, so the quiet beat never reads as a stuck
page. The hold lives INSIDE the pin, so everything around it is
untouched: the Work-shelf boundary (`-mt-[100svh]`, pin start 41798
unchanged), the `#stack` deep link, lite/static flow twins, Contact's
hand-off mechanics.

**Verified (browser, story mode, fresh clean loads):** desktop
1280×800 — wall y identical (130.3 → 130.3) across 200 px of scroll
inside the hold while the page scrolls beneath the pinned ledger
(Contact 1154 → 954), bar scaleX(1) through the dwell, release past the
pin end hands off to Contact with the wall at its final credits
position (53.3 = 130.3 − 77 section travel); mobile 390×700 — y
−383.1 → −383.1 across 150 px, bar full, no horizontal overflow
(scrollWidth 390); lite mode — plain flow section (8 rows, no pin)
unchanged; console + page errors clean; tsc + eslint clean (src/).

### Round 19 — stack skills section [STACK-01]

**Request (owner, 2026-11-01):** add a "Stack Skills" section; design
delegated to the builder ("I will give you the permission to decide
what is the best Design"). Content provided verbatim: 8 categories —
Frontend 14, Backend 14, Mobile 3, IoT & Hardware 6, DevOps & Cloud 20,
AI 9, CMS & No-Code 4, Developer Tools 4 = **74 tools**.

**Design decision — "PHASE 09 / STACK", the stack ledger.** After the
Work shelf's horizontal ride, a second horizontal shelf would have felt
repetitive, so the stack is an EDITORIAL INDEX instead: eight rows
(amber mono index + discipline name + tool count in a ~200px label
column, tools as wrapped mono chips on the right, hairline under each
row) under the header "Every tool I ship with." + a computed
"74 TOOLS · 08 DISCIPLINES" counter. Same dark `#0a0a0b` + amber-glow
language as the shelf, mirrored glow position. Story mode = pinned
section with ONE scrubbed timeline:

- row 01 renders settled (a pin starts at "top top" — no pre-pin scroll
  exists from which a fromTo could run; the Work shelf learned this
  same lesson for its header) and rows 02–08 cascade in across the
  first 90% of the pin with slight overlap;
- the whole wall drifts up CREDITS-STYLE by the MEASURED overflow
  (functional tween value + invalidateOnRefresh) — that is what makes
  all 74 chips readable on phones (mobile ledger is 1055px in a 474px
  window → 581px of travel) without shrinking anything; desktop's
  near-fit ledger just drifts ~91px;
- pin length = `1.15 viewports + drift` (measured 1011px @1280×800,
  1386px @390×700, 1178px @768×1024);
- hairline amber progress bar in the header (echoes the shelf);
- the rows window carries `overflow-hidden` + a top/bottom
  `mask-image` linear-gradient so rising rows DISSOLVE at the window
  edge — the first cut without the mask slid row 01 under the header
  text by the end of the pin (caught in desktop verification,
  fixed before commit).

**What changed:**

- `src/content/skills.ts` (NEW, zod-validated): the canonical stack —
  the only owner edits are brand-casing normalisations (LoraWAN →
  LoRaWAN, Paymongo → PayMongo, Deepseek → DeepSeek, Digital Ocean →
  DigitalOcean, N8N → n8n, RestAPIs → REST APIs, A2hosting → A2
  Hosting, Virtual Private Server/Network → VPS/VPN; "GCP Cloud
  storage" → "Cloud Storage" to match its unprefixed siblings App
  Engine/Compute Engine/Cloud Run). Nothing added, nothing removed.
  Figma deliberately appears in both Frontend and CMS & No-Code (owner
  listed it twice). `skillTotal` computed = 74.
- `src/features/story/StackSection.tsx` (NEW): `StackSection` (pinned
  story mode) + `StackFlow` (lite/static twin — same rows, plain
  flowing section, `.reveal` fades in lite). `-mt-[100svh]` wrapper
  butts the pin against the Work shelf's pin end [SCR-11]; Contact
  below is un-pinned so nothing after needed a boundary fix. Deep link
  `#stack`.
- `ScrubStory.tsx` / `FlowingStory.tsx`: section mounted between Work
  and Contact in both renderers.
- `ContactSection.tsx`: kicker "PHASE 09 / YOURS" → "PHASE 10 / YOURS"
  (the numbering stays monotonic: 07 acts → 08 shipped → 09 stack →
  10 yours).
- `knowledge.ts` [BOT-01]: the coarse `skillGroups` line is replaced by
  a skills-at-a-glance line + a full "THE STACK" block compiled from
  skills.ts, so the bot can answer "does he know X" for any of the 74;
  the deep-links line now also advertises `#work` and `#stack`.
  (QuickView still shows the coarse `skillGroups` summary — untouched
  on purpose, it's the 30-second path.)

**Verified (browser, story mode unless noted):** pin starts exactly at
the Work shelf's pin end (41798) and engages with stackTop 0; row 01
settled + rows 02–08 hidden at landing, 4 rows + wall −46px + bar 0.506
at mid, all 8 rows + wall −91px + bar 1 + last-row bottom == window
bottom at end (row 01 dissolved into the mask, zero header overlap);
mobile 390×700: 581px credits travel, all 74 chips readable, DevOps'
20 chips wrap to 5 lines, no horizontal scroll; tablet 768×1024 and
desktop 1280×800 clean; lite mode: flow ledger renders final-state,
`.reveal` fires (2/2); static mode: all rows visible; Contact follows
the pin with "PHASE 10 / YOURS"; `/?mode=story#stack` deep link lands
on the pin start (scrollY 41800 == trigger.start + 2); Quick View
unaffected; console + page errors clean; tsc + eslint clean (src/).
Dev-only noise note: measuring DURING Fast Refresh rebuilds gives
bogus geometry (pins are killed/re-created mid-rebuild) — always
verify on a fresh clean load.

### Round 18 — resume CTA [NAV-02]

**Request (owner, 2026-11-01):** change the "Skip the story →" and
"Begin the story ↓" buttons to "Download my Resume".

**What changed** — three instances across two modes, all to the SAME
pattern the contact section/Quick View already used
(`href={person.resumePath}` + `download` + `track("resume_download")`,
label verbatim "Download my Resume", aria-label "Download my resume
(PDF)"):

- `Hero.tsx`: the skip button (opened Quick View) → resume link,
  keeps the amber-underline emphasis styling, channel `hero`.
- `Chrome.tsx`: the story-gated skip button → resume link (channel
  `chrome`). The `showSkip` gate is GONE and the prop removed — "skip"
  only made sense while the story played, a resume download is useful in
  every mode, so the chrome now shows it everywhere (story AND lite/static).
- `FlowingStory.tsx`: the `#discovery` anchor → resume link (channel
  `flow`) — lite/static have no pinned story to begin.
- `Portfolio.tsx`: `<Chrome />` (no prop) + the `ejb:quick` custom-event
  listener removed — those two buttons were its only dispatchers. Quick
  View stays reachable via `/?view=quick` (history/popstate handling and
  `initialQuick` untouched); Esc still closes it.
- `analytics.ts`: `skip_story_click` removed from the event union (zero
  callers); `resume_download` already existed and gains a `channel`
  payload (hero/chrome/flow — contact + Quick View callers send none).
- `knowledge.ts`: the bot's resume line now says every mode has a
  "Download my Resume" button (hero, chrome, flow hero) plus contact and
  Quick View.

**Note for the owner:** the PDF at `public/Eirele_Joven_Boter_Resume.pdf`
is still the auto-generated FACTS-only resume — with a button this
prominent, dropping the real resume at that same path is the obvious next
step (TODO "Media" item).

**Verified (browser):** story mode — hero row + chrome show "Download my
Resume", zero "Skip" buttons left, all anchors carry `download` +
`/Eirele_Joven_Boter_Resume.pdf`, PDF serves 200; lite mode — chrome nav
[Download my Resume, Contact] and the flow hero link present; desktop
1280×800 and mobile 390×700 layouts intact (longer label wraps cleanly in
the hero links row, docWidth = viewport); console clean; tsc + eslint
clean (src/).

### Round 17 — phase 3 + phase 6 visual sizes [VIS-01]

**Request (owner, 2026-11-01):** "improve the size and make it a little
bit bigger or make it normal size of the visual illustration in PHASE 03
/ PLANNING & ARCHITECTURE and PHASE 06 / DEPLOYMENT & LAUNCH."

**Measured first (desktop 1280×800, story mode):** the two flagged
visuals were the two SMALLEST on the page — phase 3's architecture
diagram rendered its SVG at **300×171** inside a 342px card, phase 6's
pipeline strip a 346×133 sliver — while phase 2 (SketchToUi) and phase 5
(Terminals) sat at the intended ~560px. Root cause: every visual lives
in `VisualShell`'s shrink-to-fit `story-card` flex item; inside it,
`w-full max-w-[680px]` is DEAD WEIGHT — `w-full` resolves against the
content-driven card width, and an SVG's max-content contribution is its
**300×150 default intrinsic size**, so the card shrink-wrapped to ~300px
and `max-w` never bound. (PipelineStrip avoided that trap only to become
a ~346px strip of 9px dots and 0.58rem labels.)

**Fix — definite widths + scaled furniture:**

- `ArchitectureDiagram`: `w-full max-w-[680px]` →
  `w-[min(720px,86svh,calc(100vw - 2*clamp(20px,5vw,72px) - 40px))]` —
  720px target (~2.3× bigger, node labels 13px→13.4px rendered);
  `86svh` keeps the card clear of the StageLabel card on short windows;
  the `calc` term is the shell's real content width minus card padding.
- `PipelineStrip`: `w-full max-w-[640px]` →
  `w-[min(760px,calc(100vw - 2*clamp(20px,5vw,72px) - 40px))]`, dots
  h-4→h-6 (rings h-3.5→h-5), packet h-2→h-2.5, labels
  `!text-[0.58rem]`→`!text-[0.7rem]` (max-w 7rem→8.5rem), pt-6→pt-9,
  gap-2→gap-3, line/packet `top-[calc(...)]` offsets recomputed for the
  new pt-9 + 24px dot geometry.
- First cut used bare `86svh`/`92vw` terms — caught live on 390px:
  86svh (602px) exceeded the 350px available width and the card
  overflowed into the section's `overflow-hidden` (clipped both sides).
  vw alone is NOT a bound for a fit-content flex item — hence the
  explicit calc term on both visuals. Rule captured in "Visual sizes"
  above.
- Phase 7's `SdlcLoop` cap (`max-w-[min(420px,44svh)]`, MOB-01) was
  re-checked and is correct — earlier reads that showed a mangled
  `max-w-in(…)` class were a terminal-display artifact (`-[m` eaten as
  an ANSI escape); no change needed.

**Verified (browser):** desktop 1280×800 — P3 SVG 300→688px (card top
314 vs label bottom 213, 100px clear), P6 card 346×133→802×150 (top
578, dot 16→20px); tablet 768×1024 (651 / 685, both inside px-clamp);
mobile 390×700 (310 / 344, no clipping, no label overlap — MOB-01 bands
intact); static/flow mode renders the same widths centred (P3 688/310,
P6 802, docWidth = viewport everywhere); console clean; tsc + eslint
clean (src/).

### Round 16 — the Work shelf [WORK-01]

**Request (owner, 2026-11-01):** a "Work" section after story phase 7 and
before Contact showing the products launched from zero — scroll-down
should move the list sideways, "but better if you have any idea"; each
entry with image (screenshot if possible, placeholder otherwise), name,
key description, stacks and a live link. Nine sites supplied.

**Images — real screenshots where the sandbox could get them.** Headless
capture of the live URLs (`scripts/media/work-images.mjs`, sources in
`/tmp/shots`): reservation-ph, tensei, reyes-gym, cozycare, upload2earn
are REAL site captures (1440×900 → 1280×800 mozjpeg q80). Three sites
could not be captured: duffstreetcomplex.com.au (Cloudflare JS challenge
loops forever in headless), brilliantpos.com (serves unstyled HTML to
this headless UA) and baganivpn.com + pinoyinternethub.com (DNS does
not resolve from the sandbox). Those four get DESIGNED placeholders
(ink gradient + dot texture + amber rule + big monogram + a small
"screenshot pending …" note) generated as SVG → jpeg so the shelf never
looks broken — owner can drop a real capture at
`public/media/work/<id>.jpg` anytime (16:9-ish, 1280×720+).

**The section (story mode)** — `src/features/story/WorkSection.tsx`:
a pinned `h-svh` section (`#work`, deep-linkable through the existing
hash-follow logic) whose vertical scroll drives a horizontal track:

- Cards start AND end centred: leading/trailing track padding is half
  the viewport minus half a card, so card 01 owns the entrance frame and
  card 09 the exit — no dead edges, counter runs 01→09.
- Pin length is measured, not guessed: `end` is a function of
  `track.scrollWidth - innerWidth` (×1.05 — slightly unhurried), with a
  function-based `x` tween and `invalidateOnRefresh` so resizes re-derive.
- Per-card emphasis is IMPERATIVE from one `onUpdate`: distance from the
  viewport centre drives scale (0.945→1), autoAlpha (0.5→1), y (16→0) and
  a small counter-parallax on the screenshot (`translate` ±16px). Reads
  are batched before writes (one layout per frame), no per-card
  ScrollTriggers, no React state in the scroll path.
- Header: "PHASE 08 / SHIPPED" + "Launched from zero." + lede, a rolling
  mono counter (span textContent, `aria-live="off"` + sr-only total) and
  a hairline progress bar — all static (no entrance tween: the pin starts
  at "top top", so an entrance would just hold the header invisible on
  the deep-link frame — found live).
- Cards: fake browser chrome (dots + URL pill) so screenshots read as
  live sites, LIVE badge, amber index + name (+ metric when one exists —
  Brilliant POS keeps its 250+ businesses), description, stack chips,
  tag + "Visit site ↗" (`work_card_click` analytics; target=_blank
  noopener, aria-label per product).
- Boundary: the section wrapper carries `-mt-[100svh]` [SCR-11] so the
  shelf's pin starts exactly on phase 7's pin-spacer end; Contact
  follows as before (its label is now PHASE 09 / YOURS). The section
  sets `theme=dark` while active, like the story's dark acts.

**Lite/static** — `WorkFlow` renders the same cards as a responsive grid
(1/2/3 cols), no pin, no GSAP; lite adds `.reveal` fades. `#work` works
as a plain anchor there.

**Content** — `src/content/work.ts` (zod-validated): the nine products
with the owner's URLs, tightened descriptions (owner's key features,
never invented) and stack lists. `projects.ts` was synced to the
owner's 2026-11-01 stack lists (Reservation PH is Nuxt JS — not Next.js
as the earlier draft had it; BrilliantPOS Laravel 8 + Stripe/Docker/GCP;
Duff Street Elementor Pro) so the phase-4 cards, the Work shelf and the
bot can never contradict each other.

**Chatbot** — `knowledge.ts` gained a LAUNCHED PRODUCTS section compiled
from `work.ts`; verified live: asking "what products has Eirele
launched?" returns the shelf items with correct stacks.

**Verified (browser, :81):** desktop 1280×800 — shelf entrance, counter
01→09 across the full traverse, centre-emphasis + dimming, progress bar,
hand-off into Contact; deep link `/?mode=story#work` lands on the pin
start; phase 7 → shelf seam shows the footage with the shelf rising in
(no frozen gap); lite mode grid (0 videos / 9 images); mobile 390×700
fits (2:1 image ratio on phones only, tighter paddings); console clean;
tsc + eslint clean (src/).

### Round 15 — video clarity re-encode [VID-01]

**Bug (owner, 2026-11-01):** "can we try to improve the video clarity, it
a bit blurry? maybe use the original raw video and add a resolution or
pixel." Measured first: **the raws are only 1280×720** — no higher-res
master exists — and the story canvas is a full-viewport `object-cover`
`<video>`, so every 720p frame was being upscaled to the screen by the
browser (bilinear): soft on any ≥1080p display, worse on retina. The old
encodes were native-width (1280) CRF20 + unsharp 0.35 — sharp *for 720p*,
then thrown away by the browser stretch.

**Fix — move the upscale INSIDE the encode (v4, encode.mjs):** lanczos
resample to 1.5× source width (capped 1920, floor 1280) + unsharp luma
0.45, CRF20, veryfast; light variant 960w + unsharp 0.30, CRF22 (was
406p CRF24 — the phone canvas got the same treatment). Settings tested on
the busiest clip (phase-6) as a 5-way matrix + light pair; frame-crop
comparisons against a simulated browser upscale showed CRF18 doubling the
size for zero visible gain and `slow` preset ~4% smaller than veryfast
(upscaled content is cheap to encode). **Scrub-critical encoding kept
byte-for-byte: g=12 closed GOP, bf=0, sc_threshold=0, 24fps, yuv420p,
faststart** — verified per file (240 pkts / 20 K-frames / has_b_frames=0).

- Payload: full 51.7 → **96.7 MB** (13 clips, 4.2–10 MB each), light
  15.8 → **27.9 MB**. Per-clip budgets raised (45/12 MB); no clip needed
  the CRF-retry ladder.
- **Cache-busting needs BOTH levers (found live):** after the SW bump to
  `media-v2`, the browser STILL served the old 720×406 bytes — the
  preloader fetches with `cache: "force-cache"` and the HTTP cache
  (`max-age=86400`, [CACHE-01]) is fresh for a day, which the SW bump
  cannot defeat. Video URLs are now versioned `?v=v4` (`VIDEO_REV` in
  `media.ts`, applied inside the MEDIA map so every consumer inherits
  it; posters stay unversioned to keep their SWR self-heal). Rule: on
  every re-encode bump `CACHE` in sw.js **and** `VIDEO_REV` together.
- Posters/hero/continuity untouched (raw-derived); `raw-assets/` was
  rebuilt from `upload/folder/*/` (the snapshot restore had eaten it).
- encode.mjs gained `--clips-only` / `--only a,b` / `--dry-run` flags —
  a 13-clip 1080p run no longer fits one 10-min tool window; ran as 3
  batches. `probe-compare.mjs` added (raw vs full vs light spec table).

**Verified (browser, :81):** SW `media-v2` activates, v1 cache purged;
light-variant canvas videos are 960×540 blobs (headless downlink 1.35
Mbps → light is the CORRECT pick there); injected full-variant video =
1920×1080, decodes and plays; scrub drive advances playheads (0→8.58 s
over ~9000 px) with zero console errors; lite mode 0 videos / 7 posters;
mobile 390×700 story fine; tsc + eslint clean (src/).

### Round 14 — mobile story layout re-band [MOB-01]

**Bug (owner, 2026-11-01):** on phones, in every story phase, the
illustration covered the phase title + lede card. Measured at 390×700:
the label card sat at y 96–280 while VisualShell centred its content in
the zone [0 → 54svh] — every visual (125–385 px tall) intersected it;
phase 1's dialogue card (h ≈ 345) and phase 4's stacked project cards
(h ≈ 500, running off-screen) collided the same way.

**Fix — three bands on mobile (`<lg`), desktop untouched:**
- `StageLabel`: top-24 → **top-20**, lede 0.95rem → **0.9rem on mobile**
  (`PhaseStage.tsx`). Top band = label alone.
- Text beats (statement/dialogue/chips/counters): the mobile
  `pb-[calc(45svh+2rem)]` upper-half anchor replaced by the desktop
  anchor **`pb-[8svh]`** (`Beats.tsx`). Beats never share a timeline
  window, so text and visuals can share the bottom band safely.
- `VisualShell`: mobile branch `items-center justify-center
  pb-[46svh] sm:pb-[42svh]` → **`items-end justify-center pb-[8svh]`**
  (bottom band, centred; `lg:` lower-left branch unchanged).
- `SdlcLoop`: the ring is width-driven (`aspect-square`), so its mobile
  height is capped via **`max-w-[min(420px,44svh)]`** (no-op on tall/
  desktop screens — 44svh exceeds 420px above ~955 px height).
- `CardsView` (phase 4): 3 stacked cards could never fit any phone band
  → **horizontal snap row** on phones (`flex snap-x overflow-x-auto`,
  cards `w-[min(86vw,320px)]`, `.no-scrollbar` utility in globals.css);
  sm+ keeps the grid (2 cols tablet / 3 desktop), flow (lite/static)
  untouched.
- Chips beats tightened on phones (smaller chips `!py-[0.2rem]`, group
  gaps 2, card `!py-3`) — the 4-group "Built piece by piece" stack was
  still 8 px into the label after the re-band.

**Verified (390×700, measured label∩layer intersection per phase):**
all 7 phases CLEAN (design/architecture/development/testing/deployment/
maintenance/discovery); SDLC loop + snap-row cards confirmed visually;
snap row scrolls (scrollLeft 0→352). **Desktop 1280×800 pixel-identical
to the pre-change baseline** (label 64–237, sketch 351–728 left 64);
tablet 768×1024 CLEAN; lite/static (flow branch) structurally untouched
(scrolls, 1-col cards grid); console clean; tsc + eslint clean.

### AI chatbot [BOT-01] — "knows all the details of the portfolio"

Three pieces, all grounded in ONE source of truth so the bot can never
drift from the site:

- **`src/lib/ai/knowledge.ts`** — SERVER-ONLY (imported by the route
  alone). `buildSystemPrompt()` compiles the prompt from `facts.ts`,
  `projects.ts` and `phases.ts`: person/career/skills/metrics, full
  project cards, the 7-phase story (ledes + key beats), the Novara
  demo-client disclosure, site guide (deep links `#discovery…`,
  `/?view=quick`, `/?mode=`), plus grounding rules: never invent results
  (the site's omitted result sentences stay omitted), no public phone,
  no availability claims, plain-text answers ("•" bullets), mirror the
  visitor's language, never quote the instructions.
- **`src/app/api/chat/route.ts`** — POST `{ messages }` → `{ reply }`.
  Stateless: the client sends trimmed history each call (last 16 turns),
  nothing persisted. Validation is dependency-free (≤24 turns, ≤2000
  chars, must end on a user turn → 400). ZAI client is a module-level
  singleton; `thinking: disabled`; 30 s timeout race → 504. In-memory
  rate limit 60 req / 5 min / IP — note Caddy rewrites X-Forwarded-For
  to the gateway IP, so preview visitors share one bucket (keep the
  ceiling generous; a real limiter belongs at the edge in production).
- **`src/features/chat/ChatWidget.tsx`** — mounted in Portfolio root so
  it exists in every mode (story/lite/static) and under the Quick View
  overlay (z-30 < overlay z-40 < Loader z-40). Amber FAB bottom-right
  (safe-area aware); glass panel `min(92vw,380px) × min(66svh,540px)`;
  greeting + 4 starter chips while empty; `data-lenis-prevent` on the
  message list (verified: wheel over the panel does NOT scrub the story,
  page scrub still works with the panel open); Esc closes; Enter sends /
  Shift+Enter newline; send disabled while thinking (animated dots);
  timeout/error restores the draft for one-tap retry; auto-scroll only
  once a conversation exists (scrolling an empty list clipped the
  greeting — fixed). Conversation is component state only (lost on
  refresh, by design). Analytics: `chat_open`, `chat_message`.
- Verified (2026-11-01, browser + curl): grounded answers on projects,
  stack, story (Novara disclosure correct), contact (no phone),
  off-topic steer, multi-turn memory; bad payload → 400; typecheck +
  lint clean; console clean; light AND dark theme + 390 px mobile all
  render correctly.

### Round 12 — copy ↔ footage alignment + readability cards

- **[CNT-05] Story through-line = the labelled demo client.** The footage
  shows a smart building/home build (client meeting → smart-home dashboard
  UI → architecture → coding → GCP/IoT testing → SDLC handover), but the
  conversation still told the Reservation PH booking story. Rewritten to
  follow **Novara** (facts.ts `demoClient`, a FICTIONAL smart-home hub,
  disclosed on screen via the phase-1 caption — the process is real, the
  product is a stand-in): phase-1 dialogue (locks/lights must respond even
  offline), requirement chips (one app / real-time device state /
  offline-tolerant control / mobile-first), THE SPEC statement, Dip copy
  ("how a smart home goes from a first conversation…"), architecture node
  tips (household/rooms instead of bookings), commit-log lines (device
  registry, telemetry, room dashboard, scene automation). Real projects
  (Reservation PH etc.) still appear only in the phase-4 project cards.
  The old CONFIRM item about the Reservation PH problem sentence is moot.
- **[CARD-01] Readability cards** (`.story-card` in globals.css,
  theme-aware translucent surface + blur; mobile uses the solid scrim per
  PERF-06; tint overridable per instance via `--card-bg`/`--card-line`).
  Applied to: StageLabel (every phase's title + lede), statement beats,
  chips beats ("Requirements captured.", "Built piece by piece."), the
  dialogue (ONE compact lower-left card — previously full-width bubbles),
  counters, phase-3 ArchitectureDiagram (warm amber-tinted card so the
  diagram's near-black opaque node fills stay distinct — node fill raised
  to 0.92) and phase-6 PipelineStrip via the new `VisualShell card`
  prop. Cards are `w-fit`, hugging the lower-left column. Beat bottoms
  moved 11svh → 8svh and the label top 20 → 16 so cards never overlap on
  short viewports.
- **[STORY-02] Dip**: "THE STORY" raised to display size
  (clamp 1.7→3.2rem mono); the description COMPLETES WITH SCROLL —
  28 word spans brighten 0.14→1 staggered across the pin's last third
  (scrubbed: assembles forward, disassembles in reverse; no-JS shows the
  full sentence). Verified opacities at three scroll depths.
- Verified in-browser (production, 1280×577): dip reveal, phase-1
  dialogue/requirements/spec cards, phase-3 diagram card (bg
  rgba(32,26,16,.78) + amber border), phase-4 stack card, phase-6
  pipeline card, lite-mode light-theme card; typecheck clean; rebuilt +
  restarted.

## Media pipeline

- Sources delivered as `phase_{1..7}_raw_video.mp4` +
  `phase_{1..6}_transition_to_phase_{2..7}_raw_video.mp4` + 7 stills —
  13/13 clips, 7/7 stills complete (2026-10-31). Raw masters are
  **1280×720** h264 — nothing higher exists; crispness beyond that comes
  from the in-encode upscale [VID-01].
- Raw files live in `raw-assets/` (git-ignored; rebuilt 2026-11-01 by
  copying from `upload/folder/*/` — re-do that if a snapshot restore eats
  the folder).
- Encoded to `public/media/video/{phase,transition}-*.mp4` (+ `-m`
  variants; v4: 1920×1080 / 960×540), posters `-800/-1600.webp`, hero
  cutout webp. Report: `scripts/media/media-report.txt`.
- Continuity at every boundary measured (diff ≤ 4.2 → seamless; raw-based,
  so unchanged by the v4 clip re-encode).
- **Do not re-encode with different GOP settings** — driveScrub depends on
  g=12 closed GOP, no B-frames, 24 fps.
- **After every re-encode**: bump `CACHE` in `public/sw.js` AND
  `VIDEO_REV` in `src/lib/media/media.ts` together (see Round 15).

## Visitor feedback log (all rounds resolved)

1. Video ending had a long dead pause → hand-off pre-scrub [SCR-08].
2. "PHASE 01 / DISCOVERY" opener felt stiff → rewritten ledes [CNT-04],
   Dip opener.
3. Quick View couldn't scroll → lockScroll + data-lenis-prevent [SCR-09].
4. Lite mode couldn't scroll → destroyScrollEngine on mode exit [SCR-09].
5. PHASE 02/03 lacked explanations → ledes added [CNT-04].
6. Video laggy/stuttery → short-GOP re-encode v3 + driveScrub [SCR-10].
7. HEAD 403s on preview gateway → probeMedia uses 1-byte ranged GET.
8. Illustration centered, blocking video; scroll too fast to read →
   lower-left VisualShell + ~40% longer pins [SCR-11].
9. Video pauses/sticks while scrolling → boundary gap fix (-mt-[100svh]),
   tick-parity fix, buffer-headroom rate-assist, seek watchdog [SCR-11].
10. Wants a loading screen that fully loads assets (esp. video) on first
    visit/refresh → preloader + real-progress Loader [LOAD-01]. (Yes,
    refresh included: blobs must be rebuilt, but warm cache makes it fast.)
11. "Much better now, but still slow rendering of the video — cache? CDN?"
    → gateway measured (origin fast, headers pass on GETs, real cost is
    the proxy leg + 70 MB cold) → media Service Worker cache [CACHE-02]
    makes repeat visits/refreshes zero-network, slow-link desktops now
    fetch the 720w encodes (4× less bytes) [CACHE-03]. CDN = production
    deploy concern (see Delivery & caching above).
12. Nine-point round: story copy must match the IoT smart-home footage;
    bigger THE STORY with scroll-completed description; low-opacity
    readability cards on every phase title/description, the conversation
    (compact, lower-left), "Requirements captured", "Built piece by
    piece", phase-3 diagram and phase-6 illustration.
    → [CNT-05] + [CARD-01] + [STORY-02], see the Round 12 section above.
13. "I want to implement an AI Chatbot that knows all the details of my
    portfolio website" → [BOT-01], see the AI chatbot section above.
    Content-grounded assistant (knowledge compiled from the site's own
    content modules), floating widget in all modes, verified end-to-end.
14. Mobile visual bug: in all story phases the illustration overlapped
    the phase title/description; tablet/large screens must stay intact.
    → [MOB-01], see the Round 14 section above: three-band mobile layout
    (label top / beats+visuals bottom band / capped SDLC ring / snap-row
    project cards), desktop verified pixel-identical, tablet + lite
    re-verified.
15. "Improve the video clarity, it's a bit blurry — use the original raw
    video and add a resolution."
    → [VID-01], see the Round 15 section above: v4 encodes upscale inside
    ffmpeg (lanczos 1.5× → 1920×1080 full / 960×540 light) + unsharp, GOP
    untouched, SW bumped to media-v2 and video URLs versioned `?v=v4` so
    the new bytes actually reach visitors. Full payload 97 MB / light 28 MB.
16. "Add a Work section after story phase 07 and before Contact — products
    launched from zero, scroll-down moves it sideways; image + name +
    description + stacks + live link; screenshot the sites if you can."
    → [WORK-01], see the Round 16 section above: pinned horizontal shelf
    with centre-emphasis cards, rolling 01/09 counter, real screenshots
    for the five reachable sites + designed placeholders for the four
    that block headless capture, lite/static grid twin, chatbot grounded
    on the new work.ts; projects.ts stacks synced to the owner's list.
17. "Add a additional scroll/pause before going to the next section"
    (after the stack ledger shipped) → [HOLD-01], see the Round 20
    section above: ~35% of the active pin distance appended as pure
    stillness after the credits-roll, the header bar rests full during
    the beat so stillness never reads as stuck.
18. "The 'PHASE 09 / STACK' section overlapped the 'PHASE 08 / SHIPPED'
    or it scroll up immediately even the 'PHASE 08 / SHIPPED' is not
    done showing all the products website. i want to add a pause or
    additional scroll to stay in that section before transitioning to
    next section." → [HOLD-02], see the Round 21 section above: the
    ledger's `-mt` butt-joint was the overlap itself — removed (natural
    flow) — plus a 12% end-of-pin dwell on the shelf so card 09 rests
    at 09/09 before the section departs.
19. "add a toggle / button in navigation/menu beside of 'contact' to
    switch from 'Story' and 'Lite'. make it call animation when it
    changes the story and lite version." → [NAV-03], see the Round 23
    section above: segmented STORY/LITE pill beside Contact, cinematic
    curtain on switch, the new rendering re-anchored to the same
    narrative landmark, choice persisted.
20. "add a padding top or margin top in the first data '01 2014 – 2016
    OPERATIONS Operations Manager' because i cannot see it fully, when
    i scroll it, it will cover it immediately." → [LOG-02], see the
    Round 24 section above: clearance spacer inside the drifting wall
    (entry 01 landed inside the window's top mask fade at y=0 and slid
    under it immediately), route-line offset moved with it, measured
    drift absorbs the change.
21. "let's improve the contact section 'PHASE 11 / YOURS', let's create
    a form for the visitor... i will deploy this on vercel, and i will
    buy my domain name on cloudflare and connect it to resend... give
    me also a instruction if i need anything from my side." →
    [CONTACT-01], see the Round 25 section above: ledger-styled form
    panel in the contact section (every mode), POST /api/contact →
    Resend over plain fetch, honeypot + rate limit + graceful no-key
    degradation, owner setup guide in docs/CONTACT-SETUP.md.
22. "what can we do about 'PHASE 11 / YOURS …' or the whole contact
    section, can you make it a better UI/UX if you're going to be the
    visitor… i like your current design in contact section, but i feel
    it can be improve. maybe we can still improve the whole contact
    section." → [CONTACT-02], see the Round 26 section above: live
    Mandaluyong clock under the lede, DIRECT/ELSEWHERE micro-labels,
    form re-flow 01 reason → 02 message (reason-aware prompt, live
    counter) → 03/04 name+email, "same inbox" contract moved into the
    panel header, sent state says what happens next, one-time entrance
    reveal (static + reduced-motion skip); API untouched.
23. "in story mode: remove the button 'contact' and 'download my
    resume' in menu bar, keep only the toggle (Story/Lite) button. in
    lite mode: add a menu for home, process, projects, skills,
    experience, contact and the toggle (Story/Lite) button, make it
    hamburger menu when it in mobile screen." → [NAV-04], see the
    Round 27 section above: mode-aware chrome — the story bar keeps
    only the toggle; lite/static gains Home / Process / Projects /
    Skills / Experience / Contact (desktop row with scroll-spy, mobile
    hamburger overlay portalled above the chat launcher).
24. "i want to discuss the 'process' section in 'lite' mode, if i will
    not include the process and just add a portfolio information OR
    make the process simplified… I am okay with the current code in
    'Story' mode… do not change anything in 'Story' mode, please take
    care of it." → [LITE-01], see the Round 28 section above: the seven
    phase sections fold into one compact "PHASES 01–07 / HOW I WORK"
    ledger (#process) in lite/static — names + ledes, no posters, no
    beat script; FlowMenu/ModeVeil/knowledge rewired to #process; story
    mode byte-for-byte untouched.
25. "okay , let's finalize this for now , i will now push this initial
    commit to git and import to github. update the project state after."
    → [SHIP-01], see the "GitHub initial import" section above: the repo
    was cleaned for handoff (env / raw uploads / scratch frames /
    sandbox scaffolding untracked, media committed in full), the
    28-round history archived as a bundle and squashed to one clean
    "Initial import" commit.
26. "done. thank you. Read the project state. Next, can you update the
    resume base on the portfolio. update the project state after."
    → [RES-01], see the Round 29 section above: the generated resume
    resynced to the canonical content modules — logbook postings
    (Yellow Cab, Wallem, freelance, Tensei), first four Work-shelf
    projects verbatim, stack-ledger skill digest; still FACTS-only, the
    real-PDF replacement stays open.
27. "Read the project state. Next, can you make the resume ats friendly
    or is it already ats friendly? update the project state after."
    → [ATS-01], see the Round 30 section above: verdict "mostly already
    ATS-friendly" — the real fixes were table-free experience/skills
    rows, no U+3000 whitespace, Subject/Keywords metadata; no phone
    (FACTS rule) and no EDUCATION section (CONFIRM #7) stay deliberate.
28. "can you update the image placeholder of brilliantpos and duff-street
    in work section, here are the files. update the project state after."
    → [WORK-IMG-01], see the Round 31 section above: owner-supplied
    captures swapped in at the same paths (capture artifacts cropped),
    SWR self-heal instead of a media-v CACHE bump, work-images.mjs made
    rerun-safe; baganivpn + pinoyinternethub placeholders remain.
29. "can you optimize the SEO of my portfolio website and make it easy
    to search and find in google search. update the project state after."
    → [SEO-01], see the Round 32 section above: dynamic robots.ts
    advertising the sitemap, canonical URL, canonical-only sitemap.xml,
    JSON-LD url/image, server-side origin resolver working out of the
    box on Vercel; the owner's Search Console walkthrough lives in
    docs/SEO-SETUP.md.
30. "i already pushed this to github and import deploy in vercel. i
    tried the contact form and this is the error: POST
    https://eirelejovenboter.com/api/contact 502 (Bad Gateway) …
    {name: 'jayson navarro', email: 'navarrojayson69@gmail.com',
    reason: 'hello', message: 'gi', company: ''}"
    → [CONTACT-03], see the Round 33 section above: production probed
    (route healthy, RESEND_API_KEY set, Resend refusing the delivery);
    every failure path now answers with a safe ref code + fix hint,
    the form prints "ref: …" under the error line, GET /api/contact is
    a wiring self-check with the inbox masked; the owner reads the ref
    after redeploying. The deployment also predates SEO-01 — a pull +
    redeploy ships round 32.
31. "after i deployed it in vercel 'https://eirelejovenboter.com/', the
    chat ai assistance stopped working. can you fix it so i can use it
    in my deployed portfolio. update the project state after."
    → [BOT-02], see the Round 34 section above: the SDK's config-file
    credentials can never exist on Vercel — the route now takes
    AI_API_KEY → OpenAI-compatible fetch (Z.ai platform, glm-5.3)
    with the sandbox SDK as lazy fallback, ref codes + GET self-check,
    owner walkthrough in docs/AI-CHAT-SETUP.md; both paths verified
    live (sandbox grounded reply; invalid-key 401 → ai-auth).
32. "use only RAG chatbot in AI Chatbot, do not use any AI provider.
    make it working that only use the project. i do not have api key
    access."
    → [BOT-03], see the Round 35 section above: the entire [BOT-02]
    provider ladder removed and replaced by a local RAG engine — 39
    fact chunks compiled from the content modules + retrieval with IDF
    scoring, two-tier intent topics, tool lookup, honest misses and
    deterministic follow-ups; no env vars, no network egress,
    identical on Vercel; docs/AI-CHAT-SETUP.md rewritten for the
    no-key reality.

## GitHub initial import (2026-11-02) [SHIP-01]

Owner finalized the project and pushed it to GitHub as the initial
import. What the push contains:

- **One `Initial import` commit on `main`.** The 28 rounds of detailed
  local history (337 MB of git objects — mostly superseded video
  re-encodes) were archived FIRST to `.git/preimport-history.bundle`
  (restorable: `git clone .git/preimport-history.bundle`), then
  squashed: orphan branch → commit → renamed to `main`, reflogs
  expired, gc'd. Any commit hash mentioned in older round notes belongs
  to that archived history; PROJECT_STATE.md + the feedback log are the
  canonical narrative.
- **The full working tree, media included.** `public/media` is
  committed (63 files, largest 10 MB `transition-1-2.mp4` — far under
  GitHub's 100 MB per-file limit), so a fresh clone builds AND renders;
  the repo is Vercel-ready with no asset gymnastics.
- **Untracked before the push** (paths stay on disk, now git-ignored):
  `.env` (dev-only `DATABASE_URL=file:./db/custom.db`; NO real key was
  ever committed — Resend keys belong in `.env.local` / hosting env
  vars per `.env.example`), `upload/` (69 MB raw uploads — the
  re-encode source of truth), `scripts/media/scratch/` (~77 MB of
  working frames + screenshots; the encode pipeline `.mjs`/`.sh` stay
  tracked), `.zscripts/`, `db/`, `download/`, `examples/`,
  `mini-services/` (sandbox scaffolding).

Push commands: `git remote add origin git@github.com:<user>/<repo>.git`
then `git push -u origin main`. After the import: set the contact-form
env vars (RESEND_API_KEY etc., see docs/CONTACT-SETUP.md) in the
hosting provider, never in the repo.

## State persistence (important)

The sandbox once restored an older snapshot and wiped a day of work
(recovered from session records, then committed). Rule: **after every
finished change, `git add -A && git commit`** — since the GitHub
initial import [SHIP-01] `public/media` is COMMITTED (the repo deploys
as-is) while `raw-assets/`, `upload/` and `scripts/media/scratch/`
stay git-ignored, so keep `scripts/media/encode.mjs` able to
regenerate everything from raws. The raws were re-uploaded via
chat and live under `upload/folder/<hash>/` — `raw-assets/` is a flat
copy of them (rebuild with the `cp` loop in PROJECT_STATE history or by
hand); if a rollback eats BOTH, ask the owner to re-send or rely on the
encoded outputs surviving.

## Backlog (see TODO.md for detail)

- Replace generated FACTS-only resume with the owner's real PDF at
  `public/Eirele_Joven_Boter_Resume.pdf`.
- Custom domain: set `NEXT_PUBLIC_SITE_URL` once the domain is live
  (Vercel production/deployment URLs auto-resolve meanwhile [SEO-01]) +
  the Google Search Console steps in docs/SEO-SETUP.md.
- Cookieless analytics provider behind `lib/analytics.ts` facade [ANA-01].
- P2: `/work/[slug]` case studies, CI (Lighthouse + axe).
- CONFIRM items in TODO.md (owner-only facts: Reservation PH problem
  sentence, project result sentences, Duff Street URL check, AI example).
