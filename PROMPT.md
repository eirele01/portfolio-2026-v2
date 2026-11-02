# PORTFOLIO BLUEPRINT & ENGINEERING GUIDELINES
### Eirele Joven Boter: "Every system starts with a conversation."
**Document type:** product spec + design system + engineering standards, for an AI web developer.
**Status:** v1.0, single source of truth. Where this document conflicts with any earlier prompt, **this document wins**.

---

## 0. How to use this document (read first)

You are the lead engineer and creative technologist for this project. Read the whole document before writing code.

**Requirement language.** MUST / MUST NOT = mandatory. SHOULD = do it unless you have a written reason. MAY = optional.
**Requirement IDs.** Items look like `[SCR-03][P0]`. Priority: **P0** = required for launch, **P1** = should ship, **P2** = stretch (only after all P0/P1 pass). Reference IDs in commits, tests and reports.

**Source-of-truth order (highest wins):**
1. Section 4 **FACTS**. Never invent anything outside it.
2. This blueprint.
3. Your own judgment. Log every judgment call as a short ADR in `docs/decisions/NNN-title.md` (context, decision, alternatives, consequences).

**Working agreement**
- Work in **milestones** (section 19). Finish one, run its acceptance checks, write the report (section 22), commit, then **STOP and wait for the owner's approval**. Never start the next milestone on your own.
- Never claim "done" without evidence: commands run, output seen, screenshots or measurements.
- When something is unclear, choose the safest default, log it in `docs/decisions/`, and list it under "Questions for owner" in your report. Do not stall.
- Ask for missing facts through `TODO.md` entries tagged `CONFIRM`. Never fill a gap with plausible-sounding content.
- If skills named `storytelling` or `scroll-experience` exist in your environment, use them for copy refinement and scroll choreography. If not, proceed; this document is sufficient.

---

## 1. Vision and success criteria

### 1.1 The idea
A portfolio that **is** a software project. The visitor plays the **client**. Scrolling plays the **project journey** through the 8 stages of the software development life cycle (SDLC). Each stage is a cinematic video of me at work, scrubbed by scroll, with minimal text beats and small, meaningful interactive visuals on top. By the end, the visitor has experienced how I work, not read a list of claims about it.

### 1.2 Why it must be better than a typical "scrollytelling" site
Most scroll sites are beautiful and unusable: slow, heavy, inaccessible, and hostile to someone with 30 seconds. This one must be **cinematic AND respectful**:
- Cinematic for people who want to be moved.
- Fast and skippable for people who want facts. (Quick View, section 5.)
- Robust on weak phones and slow networks. (Lite mode, section 5.)
- Accessible without a separate "lesser" site. (Static mode, section 12.)

### 1.3 Success criteria (measurable)
| Goal | Metric | Target |
|---|---|---|
| Feels premium | Scroll smoothness | ≥ 55 fps average on a mid-range laptop; no frame stalls > 50ms during scrubbing |
| Loads fast | LCP (mobile, Slow 4G, mid-range Android) | ≤ 2.5s; the first screen shows text and portrait before any video loads |
| Stable | CLS | ≤ 0.05 |
| Responsive | INP | ≤ 200ms |
| Accessible | WCAG 2.2 AA; axe-core serious/critical issues | 0 |
| Discoverable | Lighthouse SEO / Best Practices / Accessibility | ≥ 95 each |
| Performs | Lighthouse Performance | ≥ 85 desktop, ≥ 65 mobile (heavy video is expected; explain any shortfall, never cut the concept to chase a score) |
| Converts | Contact actions (email click, copy, resume download, LinkedIn/GitHub) | Tracked, reported weekly after launch |
| Credible | Every claim | Traceable to FACTS, defensible in an interview |

### 1.4 The 30-second test (UX acceptance)
A recruiter who lands on the site must be able to learn **who I am, what I do, 3 proofs, and how to contact me** in 30 seconds without watching the story. The **Quick View** route plus a visible "Skip the story" link exist for this reason. [UX-01][P0]

---

## 2. Design principles (use these to settle any dispute)

1. **The video is the hero; the UI is the subtitle.** Text and widgets support the footage, never smother it.
2. **One idea per screen.** If a beat needs two sentences of explanation, split it.
3. **Slow in, quick out.** Entrances ease gently; exits are brisk. Nothing bounces.
4. **Proof over adjectives.** Prefer a number, a stack tag, or a working diagram to "passionate" or "innovative". Banned words: *passionate, results-driven, innovative, cutting-edge, leverage, synergy, rockstar, ninja, seamless*.
5. **Every animation earns its place.** If removing it loses no meaning, remove it.
6. **Fail gracefully.** Video fails → poster. WebGL fails → static background. JS fails → readable content. Slow device → Lite mode.
7. **Respect the visitor's control.** Native scrollbar stays, back button works, links deep-link, motion preferences are honored, the story can be skipped.
8. **Care for the code.** Readable, typed, tested, documented, deletable. (Section 15.)

---

## 3. Audience and journeys

| Persona | Wants | Arrives via | Best path |
|---|---|---|---|
| **Recruiter / hiring manager** | Role fit, stack, proof, contact, in under a minute | LinkedIn, resume link | Hero → "Skip the story" → Quick View → resume |
| **Prospective client** | Can this person run my project end to end? | Referral, GitHub | Full story → Phase 7 CTA → email |
| **Engineer peer** | How was this built? Is the craft real? | Social share | Full story → "Behind the build" panel (P2) → GitHub |
| **Mobile visitor on slow network** | Something that works | Any | Auto Lite mode, readable immediately |
| **Assistive-tech / reduced-motion user** | Equal access to all content | Any | Static mode (all content, no motion) |

---

## 4. FACTS (single source of truth)

> **Owner:** edit the `ANSWER:` values before handing this to the developer. Items marked `CONFIRM` stay flagged in `TODO.md`, render as a clearly visible placeholder in development, and **fail the production build** while unresolved (section 14.6).

**Person**
- Name: Eirele Joven Boter. Role line: **Software Engineer**.
- Specialties: Web Development, IoT Smart-Device Development, AI Engineering. Positioning: "I develop enterprise systems end to end."
- Location: Mandaluyong, Philippines (city-level only; no street address).
- Email: eirelejovenboter2@gmail.com · LinkedIn: https://www.linkedin.com/in/eirele-joven-boter/ · GitHub: https://github.com/eirele01
- Phone shown publicly: ANSWER: no
- Resume file: `/Eirele_Joven_Boter_Resume.pdf` (from `raw-assets/resume.pdf`).
- Career path, in this order: Operations Manager (2014-2016) → Seafarer, Able Seaman (2016-2019) → Software Engineer (2019-present; freelance full-stack from 2019; IoT and enterprise systems at Tensei Philippines Inc. from 2024).
- Core skills: Vue, Nuxt, React, Next, Inertia, Tailwind, TypeScript; PHP, Laravel; REST APIs, WebSockets, MQTT; Java (Android), Flutter; SwitchBot and LoRaWAN devices; GCP (App Engine, Compute Engine, Cloud Run, Cloud Tasks), Docker; MySQL, Firebase, Firestore, Supabase.

**Top 3 projects**
1. **Reservation PH** (https://www.reservationph.com/): multi-tenant SaaS booking platform for service businesses; real-time scheduling, PayMongo payments (GCash, Maya), loyalty programs, automated email notifications, analytics dashboards. Stack: Laravel 12, Next JS, Inertia JS, Tailwind CSS, ShadCN, GCP. Problem sentence: ANSWER: CONFIRM. Result sentence: ANSWER: CONFIRM.
2. **Duff Street Clinic** (URL: ANSWER: https://duffstreetcomplex.com.au/ , CONFIRM: my resume says duffstreetclinic.com.au): high-traffic, mobile-responsive site for an Australian medical centre with 50+ doctors; online booking, telehealth access, dynamic service directories. Stack: WordPress, Elementor. Result sentence: ANSWER: CONFIRM.
3. **BrilliantPOS** (https://brilliantpos.com/): multi-tenant SaaS point-of-sale with cloud inventory replenishment and workforce management, used by 250 retail and service businesses. Stack: Laravel 7, Tailwind CSS, MySQL, cPanel. Result sentence: ANSWER: CONFIRM.

**Metrics (render only those marked keep)**
- 1,000+ concurrent IoT device connections: keep · 99.9% uptime: keep · 1,000+ data points/minute on GCP: keep · 250 businesses on BrilliantPOS: keep · 100,000+ daily downloads: delete.

**Client names / logos:** none. Copy may say "enterprise and hospitality clients" only.
**AI Engineering example:** ANSWER: none yet → build the optional AI node behind `flags.showAiNode = false`; claim AI work nowhere else.
**Cloud wording:** GCP, Docker, Cloud Run. **Never** write "AWS" in any text, alt text or metadata (one video's console UI may resemble it).
**Fictional demo client:** "Novara", a smart-home hub shown on screens in the videos. The site MUST state it is a fictional stand-in for demonstrating the process. [CNT-01][P0]
**Accent color:** ANSWER: amber `#FFB454`. **Language:** TypeScript. **Hosting:** Firebase Hosting (primary), Cloud Run (documented alternative).

---

## 5. Experience architecture

### 5.1 Experience modes
One content model, four renderings. A single hook `useExperienceMode()` resolves the mode; all components branch on it, never on ad-hoc checks. [ARC-01][P0]

| Mode | When | What the visitor gets |
|---|---|---|
| **story** (default) | Capable desktop and phone | Full pinned, scrubbed video story, transitions, particles, cursor |
| **lite** | `saveData`, effective connection ≤ 3g, `deviceMemory ≤ 2`, `hardwareConcurrency ≤ 2`, or the visitor chooses it | Same story as normal flowing sections: poster images (no video), text beats stacked, light fade-in reveals, diagrams in final state, no transitions, no particles |
| **static** | `prefers-reduced-motion: reduce`, or `?mode=static` | All content as plain stacked sections, no motion at all, no smooth scroll, no pinning |
| **quick** | Route `/quick` or the "Skip the story" link | A fast, printable one-page summary: who, what, 3 projects, skills, timeline, contact. No scroll effects |

Resolution order: explicit URL param `?mode=` > saved visitor choice (`localStorage`, wrapped in try/catch) > reduced motion > device/network heuristics > default. Expose a small "Experience: Story / Lite" toggle in the footer and in Quick View. [ARC-02][P0]

### 5.2 Routes
| Route | Purpose | Priority |
|---|---|---|
| `/` | The story (all modes except quick) | P0 |
| `/quick` | Quick View | P0 |
| `/resume` | Redirect to the PDF | P1 |
| `/work/[slug]` | Case-study pages (Reservation PH, Duff Street, BrilliantPOS). Scaffold only; content requires owner input | P2 |
| `404` | On-brand not-found with links back to `/` and `/quick` | P1 |

### 5.3 Story order (the spine)
```
Phase 0  Myself (hero, still portrait)
  dip     (no clip)
Phase 1  Discovery
  T 1→2   transition clip
Phase 2  UX & UI Design
  T 2→3
Phase 3  Planning & Architecture
  T 3→4
Phase 4  Development
  T 4→5
Phase 5  Testing & QA
  T 5→6
Phase 6  Deployment & Launch
  T 6→7
Phase 7  Maintenance & Improvement  →  Contact block (un-pinned)  →  Footer
```
Deep links: `/#discovery`, `/#design`, `/#architecture`, `/#development`, `/#testing`, `/#deployment`, `/#maintenance`, `/#contact`. On load with a hash, jump to the matching phase after assets are ready. [NAV-01][P0]

---

## 6. Narrative blueprint

### 6.1 Three acts
- **Act I, The Brief (Phases 0-3):** curiosity → trust. Who am I, what does the client need, what do we design, how is it structured. Daylight, meetings, paper and screens.
- **Act II, The Build (Phases 4-6):** craft → awe. Night shift. Code, breakage, fixes, launch. The work is solitary, focused, a little dramatic.
- **Act III, The Handover (Phase 7 and contact):** confidence → invitation. Back in daylight; the system is alive and maintained; the visitor is invited to start their own project.

### 6.2 Beat framework (every phase follows it)
Each phase is a micro-story with three beats on the scroll timeline (positions are fractions of the phase's scroll length):
1. **Question / setup** (~0.05): what the client needs at this stage.
2. **Action / craft** (~0.40): what I do, shown as an interactive visual, not paragraphs.
3. **Proof / outcome** (~0.78): one concrete result, number or artifact.

### 6.3 Voice
First person, plain words, short sentences, concrete nouns, active verbs. Confident, not boastful. No buzzwords (list in section 2). Sentences ≤ 20 words. Labels in mono caps. Numbers always with a unit and a verified source from FACTS.

---

## 7. Phase storyboards (final copy: reproduce exactly)

Common to all phases: label `PHASE 0N / NAME` (mono, accent rule), beats fade in with `autoAlpha` so hidden beats are not focusable [A11Y-05], text sits on a scrim (section 10.5), and **no text ever covers the face or hands**: open each `phase_N_raw_image.jpg` and set `textAnchor` accordingly (Phase 1 subject is on the left → `bottom-left`; others default `left`). Mobile uses a bottom panel (section 11).

Scroll lengths below are the **desktop defaults in viewport heights (vh)**; mobile ≈ 80%. Tune after measuring (section 8.5).

### Phase 0: Myself · 120vh · hero
- **Media:** still cut-out portrait (`hero/eirele-cutout.webp`); no video. Light canvas.
- **Layout (desktop):** text left, portrait right (88svh tall, bottom-aligned) with a soft elliptical contact shadow under the shoes. Mobile: text on top, portrait bottom (~55svh).
- **Idle life:** breathing scale 1 → 1.012 → 1 over 6s (`sine.inOut`), mouse parallax ≤ 8px. Disabled in lite/static.
- **Name** types in, 40ms/char, mono cursor blinking twice: **EIRELE JOVEN BOTER**. Role: **Software Engineer**. Chips: `WEB` · `IoT` · `AI`.
- **Beat 1:** "I build enterprise systems end to end: web, IoT and AI, from the first conversation to the live deployment."
- **Beat 2:** "Operations manager. Seafarer. Engineer. Different decks, same job: keep complex systems running under pressure."
- **Beat 3:** "Scroll to begin. You're the client." plus an animated thin down-line.
- **Persistent small links:** LinkedIn · GitHub · **Skip the story →** (goes to `/quick`). [UX-01]
- **Background:** HeroParticles (section 14.4): ~1,200 tiny dark points behind the portrait; converge and dissolve as the page dims.
- **Exit:** portrait lifts 40px and fades while the dip takes over.

### Dip (Phase 0 → 1) · 100vh · no clip
Dark panel; hero fades out; `--bg`/`--fg` tween from light to dark; label `PHASE 01 / DISCOVERY` with `01 / 07`. Starts preloading Phase 1 video.

### Phase 1: Discovery · 300vh
- **Caption (persistent, bottom-right, small mono):** "Demo client: Novara, a fictional smart-home hub. The process is real; the product is a stand-in." [CNT-01]
- **Beat 1 (0.05-0.35) dialogue** (glass bubbles; client left, me right with an accent edge): Client: "We need customers to book without calling us." → Me: "Who are they, and what's the one thing that must never break?" → Client: "Payments. And it has to work on a phone."
- **Beat 2 (0.40-0.70) requirement chips** appear one by one: `Multi-tenant` · `Real-time scheduling` · `GCash & Maya payments` · `Mobile-first`. Heading: "Requirements captured."
- **Beat 3 (0.78+) proof:** Reservation PH problem sentence (if confirmed; otherwise omit and log `CONFIRM`).

### Transition 1→2 · 150vh · label `PHASE 02 / UX & UI DESIGN`

### Phase 2: UX & UI Design · 250vh
- **Beat 1:** "Sketch it. Wireframe it. Make it real."
- **Beat 2 visual, "Sketch → Wireframe → UI":** a centered 16:10 frame crossfades three CSS/SVG states (never screenshots): (1) dashed sketch outlines with mono notes `hero`, `device list`, `cta`; (2) solid gray wireframe boxes; (3) polished dark dashboard skeleton (sidebar, temperature dial, two sparklines) in the accent color, labeled "Novara".
- **Beat 3:** caption "Figma → components → code."

### Transition 2→3 · 150vh · label `PHASE 03 / PLANNING & ARCHITECTURE`

### Phase 3: Planning & Architecture · 300vh
- **Beat 1:** "Before code, a map."
- **Beat 2 visual, architecture diagram (SVG):** nodes `Client` → `API (Laravel)` → `Database` → `MQTT broker` → `Devices (SwitchBot · LoRaWAN)`, plus a `WebSocket` edge from API back to Client. Edges draw via `stroke-dashoffset` (no paid plugins); when an edge completes, an accent "packet" dot travels it using `path.getPointAtLength()`. Nodes are focusable and show a one-line tooltip on hover/focus (what each does).
- **Beat 3:** "Schemas, APIs and hardware-to-cloud protocols agreed before the first commit."
- **Optional:** `AI layer` node only if `flags.showAiNode` is true; otherwise render nothing.

### Transition 3→4 · 150vh · label `PHASE 04 / DEVELOPMENT`

### Phase 4: Development · 350vh
- **Beat 1:** "Built piece by piece." Stack chips grouped Frontend / Backend / IoT / Cloud (from FACTS).
- **Beat 2:** mono "commit log" types five lines (`feat: device registry`, `feat: realtime telemetry`, `feat: booking flow`, `feat: payments`, `fix: reconnect handling`); `aria-hidden`.
- **Beat 3, three project cards** (row on desktop, stack on mobile): title, one line, stack tags, kept metric, `Visit ↗` (`target="_blank" rel="noopener noreferrer"`). Counter: `250 businesses` on BrilliantPOS.

### Transition 4→5 · 150vh · label `PHASE 05 / TESTING & QA`

### Phase 5: Testing & QA · 250vh
- **Beat 1:** "Break it before they do."
- **Beat 2 visual, terminal panel:** red lines appear (`✕ device latency timeout`, `✕ websocket dropped`, `✕ mobile layout overflow`); each flips to green (`✓`) as scroll advances. Then a checklist ticks: `Unit` · `Integration` · `End-to-end` · `Device latency` · `Device disconnects` · `Mobile responsive`.
- **Beat 3:** "Edge cases handled before launch: latency, disconnects, retries." No bug counts.
- **P2 upgrade:** replace the checklist with this site's real Lighthouse and test results, written by CI to `src/generated/quality.json`. [ENH-02]

### Transition 5→6 · 150vh · label `PHASE 06 / DEPLOYMENT & LAUNCH`

### Phase 6: Deployment & Launch · 250vh
- **Beat 1:** "Ship it."
- **Beat 2 visual, pipeline strip:** 5 nodes light in sequence `Commit` → `Build (Docker)` → `Test` → `Deploy (Cloud Run)` → `Live`, connected by a thin line with a travelling packet.
- **Beat 3 counters (kept metrics only):** `99.9%` uptime · `1,000+` data points per minute. Footer line: "Google Cloud Platform · Docker · Cloud Run".

### Transition 6→7 · 150vh · label `PHASE 07 / MAINTENANCE & IMPROVEMENT`

### Phase 7: Maintenance & Improvement → Contact · 400vh
- **Beat 1:** "Launch is not the end."
- **Beat 2 visual, SDLC loop:** the video dims to ~40% behind a centered glass panel with a **7-node loop** (Myself, Discovery, Design, Architecture, Development, Testing, Deployment → Maintenance, arrow looping to the start, `SDLC` in the center). Nodes light in sequence. **Each node is a button that scrolls back to that phase** (the loop doubles as navigation). Caption: "Monitor. Learn. Improve. Repeat."
- **Beat 3, contact (un-pinned):** headline **"Let's build yours."** Email (mailto plus a "Copy email" button with a polite live-region confirmation), LinkedIn, GitHub, **Download resume**. Phone only if FACTS says so. Footer: "Designed and built by Eirele Joven Boter · © 2026" plus the experience toggle.

### Quick View (`/quick`) content
Name, role, one-paragraph summary (use Phase 0 Beat 1), specialties, the 3 projects (same data module as Phase 4), skills grouped, the career timeline (3 entries), contact links, resume download, a link back to "Watch the story". Zero motion, print-friendly stylesheet [P1], semantic HTML.

---

## 8. Scroll choreography system

### 8.1 Principles
- Scroll is **native**. We smooth wheel input with Lenis but never replace the scrollbar, never snap-force, never hijack touch (`syncTouch: false`). Keyboard (Space, PageUp/Down, Home/End, arrows) MUST work. [SCR-01][P0]
- One **master timeline of normalized duration 1** per pinned section; the scroll position maps to timeline progress. All beats, widgets and the video playhead live on that timeline at positions `at ∈ [0,1]`. [SCR-02][P0]
- Video playhead is a **linear** tween; all text/visual easing is local to each beat.
- Never set React state inside a scroll callback. Mutate DOM through GSAP/refs. [SCR-03][P0]

### 8.2 Engine (reference implementation)
```ts
// lib/scroll/engine.ts   ('use client' consumers only)
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let lenis: Lenis | null = null;
const tick = (t: number) => lenis?.raf(t * 1000);

export function initScrollEngine(): Lenis {
  if (lenis) return lenis;
  gsap.registerPlugin(ScrollTrigger);
  lenis = new Lenis({ duration: 1.15, smoothWheel: true, syncTouch: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function destroyScrollEngine(): void {
  if (!lenis) return;
  gsap.ticker.remove(tick);
  lenis.destroy();
  lenis = null;
}

export const scrollToTarget = (target: string | HTMLElement | number) =>
  lenis?.scrollTo(target, { duration: 1.6 });
```
The engine MUST be idempotent (React StrictMode mounts twice) and MUST NOT initialize in `static` or `quick` mode. [SCR-04][P0]

### 8.3 `PhaseStage` pattern (pinned section)
```tsx
'use client';
export function PhaseStage({ config, children }: Props) {
  const root = useRef<HTMLElement>(null);
  // Lazy init so child components can add tweens before this component's effect runs.
  const [tl] = useState(() => gsap.timeline({ paused: true, defaults: { ease: 'none' } }));

  useGSAP(() => {
    tl.set({}, {}, 1); // pin total duration to exactly 1
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: 'top top',
      end: `+=${config.scrollVh}%`,   // 100% = one viewport height
      pin: true,
      anticipatePin: 1,
      scrub: true,
      animation: tl,
      invalidateOnRefresh: true,
      onToggle: (self) => setActive(config.id, self.isActive),
    });
    return () => st.kill();
  }, { scope: root });

  return (
    <TimelineContext.Provider value={tl}>
      <section ref={root} id={config.slug} aria-labelledby={`${config.id}-h`} className="stage">
        {children}
      </section>
    </TimelineContext.Provider>
  );
}
```
Dev-only assertion: after mount, `console.assert(tl.duration() === 1)`. Children register with `useGSAP(() => { tl.fromTo(el, {autoAlpha:0, y:24}, {autoAlpha:1, y:0, duration:0.08, ease:'power3.out'}, at) })`. Every beat MUST also tween back out so reverse scrolling is clean.

### 8.4 `ScrubVideo` behavior (the critical piece)
- Markup: `<video muted playsInline preload="metadata" disablePictureInPicture>` over a poster `<img>`; the poster fades out on `loadeddata` and fades back in on error. [MED-01][P0]
- **Smooth the playhead with a lerp loop** on the GSAP ticker (never assign `currentTime` per scroll event); run it only while the stage is active:
```ts
const s = { target: 0, current: 0 };
// timeline onUpdate:  s.target = progress * Math.max(0, video.duration - 0.05);
const tick = () => {
  if (!video.duration) return;
  s.current += (s.target - s.current) * 0.18;
  if (Math.abs(video.currentTime - s.current) > 1 / 30 && !video.seeking) {
    video.currentTime = s.current;
  }
};
```
- **Preload chain:** while Phase N is active, preload `transition-N-(N+1)`; while that transition is active, preload Phase N+1. Never more than **2 video elements hold a source at once**; release far ones (`removeAttribute('src'); load()`). [MED-02][P0]
- **Touch devices:** default `SCRUB_ON_TOUCH = false` → autoplay the clip once (muted, inline) when ≥ 40% visible, still pinned, same beat timings. Flip the flag if real-device testing shows scrubbing is smooth.
- **Fallback `ScrubCanvas` (P1):** pre-extracted WebP frames (~60/clip at ~720px) drawn to a `<canvas>` by progress. Enabled per device class by flag if video scrubbing stutters (notably iOS Safari). Encode option `--frames` in the media script.
- **Experimental (P2):** WebCodecs frame decoding for frame-perfect scrubbing; only with an ADR and a proven benefit.

### 8.5 Pacing table (starting point; tune by feel and measure)
| Section | Desktop vh | Mobile vh |
|---|---|---|
| P0 hero | 120 | 100 |
| Dip | 100 | 80 |
| P1 | 300 | 240 |
| T1→2 | 150 | 120 |
| P2 | 250 | 200 |
| T2→3 | 150 | 120 |
| P3 | 300 | 240 |
| T3→4 | 150 | 120 |
| P4 | 350 | 280 |
| T4→5 | 150 | 120 |
| P5 | 250 | 200 |
| T5→6 | 150 | 120 |
| P6 | 250 | 200 |
| T6→7 | 150 | 120 |
| P7 + contact | 400 | 320 |
| **Total** | **≈ 3,220** | **≈ 2,580** |

Pacing test: scrolling the entire story at normal reading speed should take **under 3 minutes**. If it takes longer, shorten lengths before cutting content. [SCR-05][P1]

### 8.6 Transitions
`TransitionStage` reuses `PhaseStage` with `kind: 'transition'`: pinned, clip scrubbed 0→1, **no body text**, one label beat (mono `PHASE 0N / NAME`, accent line, `0N / 07`) bottom-left on a scrim, fading in ~0.45, out by ~0.85. The rail's active dot advances at 50%. **Continuity:** the first frame of each transition should equal the previous phase's last frame, and its last frame the next phase's first frame. The media script measures and reports this (section 9.4). Add an optional 8% crossfade (`bridge: true`) only where flagged. [SCR-06][P0]

### 8.7 Micro-motion polish (P1)
- **Velocity feel:** text beats may skew/translate by ≤ 2° / 6px proportional to scroll velocity, clamped, eased back to zero. Disabled in lite/static.
- **Cursor (desktop, fine pointer only):** a 10px dot that grows to 40px over interactive items and becomes a "scroll" hint in hero. Never replaces the system cursor on touch. MUST be hidden when `prefers-reduced-motion`.
- **Magnetic CTA:** the "Let's build yours" button drifts ≤ 6px toward the pointer.
- **Film grain:** static SVG noise at ~4% opacity (`pointer-events: none`). Remove if it costs frames.

---

## 9. Media pipeline and asset map

### 9.1 Raw files (place in `raw-assets/`, git-ignored; never rename them)
```
Eirele_Joven_Boter_green_screen_raw_image.jpg   hero portrait on GREEN SCREEN
phase_N_raw_image.jpg           N = 1..7   first frame / poster
phase_N_raw_video.mp4           N = 1..7   phase clip
phase_N_transition_to_phase_M_raw_video.mp4    N = 1..6, M = N+1
resume.pdf
(optional) hero-cutout.png      manual cut-out; used instead of keying if present
```

### 9.2 Script: `scripts/media/encode.mjs` (`pnpm media`)
| Input | Output in `public/media/` |
|---|---|
| `phase_N_raw_video.mp4` | `video/phase-N.mp4`, `video/phase-N-m.mp4` |
| `phase_N_transition_to_phase_M_raw_video.mp4` | `video/transition-N-M.mp4`, `-m.mp4` |
| `phase_N_raw_image.jpg` | `posters/phase-N-1600.webp`, `-800.webp` |
| frame 0 of each transition | `posters/transition-N-M-1600.webp`, `-800.webp` |
| green-screen photo (or `hero-cutout.png`) | `hero/eirele-cutout.png`, `.webp`, `-800.webp` |

The script MUST fail loudly and list every missing tool or file (`ffmpeg`, `ffprobe`, raw files). It MUST read real durations/resolutions with `ffprobe` (never assume 10s) and write `media-report.txt`. [MED-03][P0]

### 9.3 Encoding recipes
- **Scrub clips, desktop** (all-intra so every frame is a keyframe; this is what makes scrubbing smooth). Do not upscale:
  `ffmpeg -y -i IN -vf "scale='min(1280,iw)':-2,fps=15" -c:v libx264 -preset slow -g 1 -crf 26 -pix_fmt yuv420p -an -movflags +faststart OUT`
- **Scrub clips, mobile (`-m`):** `scale='min(720,iw)':-2,fps=12 … -crf 28`.
- **Posters:** `sharp` → WebP (quality ≈ 80) at 1600w and 800w. A poster MUST match its video's first frame.
- **Budgets:** each desktop clip ≤ 10 MB, mobile ≤ 4 MB; total desktop ≤ ~130 MB, mobile ≤ ~50 MB. Over budget → raise CRF in steps of 2, then lower fps, then width; report each change.
- Strip audio (`-an`). The site has no sound by default.
- All media URLs go through `lib/media.ts`, which prefixes `NEXT_PUBLIC_MEDIA_BASE_URL ?? ''`, so media can move to a bucket/CDN without touching components.

### 9.4 Hero cut-out from the green screen
1. If `raw-assets/hero-cutout.png` exists, use it as-is.
2. Otherwise sample the real green from the image corners with `sharp` (do not assume `#00FF00`), apply ffmpeg `chromakey` (start similarity ≈ 0.15-0.2, blend ≈ 0.08-0.1), then `despill=type=green`.
3. Choke and feather the alpha edge ~1px to avoid halos; trim transparent borders; export PNG plus WebP (alpha) at 1600px and 800px tall.
4. **Inspect the result yourself** over `#f4f2ee` and over `#0a0a0b`; check hair, white collar, tie, shoe edges. If you cannot get a clean result, record it in `TODO.md` and ask the owner for `hero-cutout.png`. **Never ship a halo.** [MED-04][P0]

### 9.5 Continuity report
For every boundary (phase N last frame vs transition first frame; transition last frame vs phase N+1 first frame): extract frames (`-sseof -0.1 -vframes 1`), downscale to 64px, compute mean absolute difference, print a table in `media-report.txt`, and flag pairs above a proposed (and explained) threshold. Report; do not silently fix. [MED-05][P1]

---

## 10. Visual design system

### 10.1 Style statement
Minimal. Cinematic. Quiet confidence. Think film titles on dark, with a single warm accent. Thin lines, generous negative space, slow easing. The footage carries the emotion; the interface stays out of the way.

### 10.2 Color tokens (`styles/tokens.css`)
```css
:root {                                  /* light: Phase 0 only */
  --bg: #f4f2ee;  --fg: #111111;
  --muted: rgba(17,17,17,.58);  --line: rgba(17,17,17,.16);
  --accent: #FFB454;  --accent-ink: #1a1203;
  --ok: #4ADE80;  --err: #F87171;
  --glass: rgba(244,242,238,.6);  --glass-line: rgba(17,17,17,.12);
}
:root[data-theme="dark"] {
  --bg: #0a0a0b;  --fg: #efece6;
  --muted: rgba(239,236,230,.62);  --line: rgba(239,236,230,.16);
  --glass: rgba(10,10,11,.55);  --glass-line: rgba(239,236,230,.14);
}
```
Rules: amber MUST NOT be used as text color on the light canvas (insufficient contrast); on light use `--fg` for text and amber only for non-text accents. All body text ≥ 4.5:1, large text and UI ≥ 3:1, verified over the **worst frame** of each video with its scrim applied. [UI-01][P0]

### 10.3 Typography
- **Sans:** Geist (or Inter Tight); **Mono:** Geist Mono (or JetBrains Mono). Self-hosted via the framework's font loader; no third-party font requests. Provide a system fallback stack and `font-display: swap` with size-adjusted fallbacks to avoid layout shift.
- Scale (fluid): display `clamp(3rem, 8vw, 7.5rem)` / 500 / -0.03em; h2 `clamp(2rem, 5vw, 4.5rem)` / 500 / -0.02em; h3 `clamp(1.25rem, 2vw, 1.75rem)`; body `1.0625rem` / 1.55; label (mono, caps) `0.75rem` / 0.14em tracking.
- Max line length 52ch. No text shadows. No justified text.

### 10.4 Spacing, grid, shape
- 4px base unit; scale `4 8 12 16 24 32 48 64 96 144`.
- 12-column grid, outer margin `clamp(20px, 5vw, 72px)`, gutter `clamp(12px, 2vw, 24px)`.
- Corners: 6px (panels), 999px (chips). Borders: always 1px. No drop shadows except the soft contact shadow under the hero portrait.

### 10.5 Legibility over video
- Every stage has a `Scrim`: a gradient (`rgba(0,0,0,.65)` → transparent) behind the text anchor, direction set by `textAnchor`.
- `backdrop-filter: blur()` is **expensive over video**. Use it only on small panels (chat bubbles, cards), cap at `blur(12px)`, and on mobile or in lite mode replace it with a solid translucent fill. [PERF-06][P0]

### 10.6 Layering (z-index map; no other values allowed)
`0` video/poster · `1` scrim · `2` grain · `10` beats and widgets · `20` chrome (wordmark, Quick View link) · `30` phase rail · `40` loader · `50` cursor.

### 10.7 Layout sketches
```
DESKTOP (story)                                   MOBILE (story)
┌──────────────────────────────────────────┐      ┌───────────────────────┐
│ EJB                  Skip story  Contact │      │ EJB            03 / 07│
│                                       ○  │      │ ──────────────────────│
│  PHASE 03 / ARCHITECTURE              ○  │      │                       │
│  ──────                               ●  │      │      (video, subject  │
│  Before code, a map.                  ○  │      │       right-weighted  │
│                         [ video:      ○  │      │       object-position │
│   ◻──◻──◻──◻  diagram   subject right]   │      │       75% center)     │
│                                       ○  │      │                       │
│  scrim ◀── text zone      rail ──▶       │      │ ┌───────────────────┐ │
└──────────────────────────────────────────┘      │ │ bottom text panel │ │
                                                  │ │ max 45svh         │ │
                                                  └─┴───────────────────┴─┘
```

### 10.8 Component inventory (each: typed props, one responsibility, stories/tests)
`Chrome` · `PhaseRail` (desktop) / `ProgressBar` (mobile) · `PhaseStage` · `TransitionStage` · `ScrubVideo` · `Scrim` · `Beat` (renders by `kind`) · `Label` · `GlassPanel` · `Chip` · `DialogueBubble` · `ProjectCard` · `Counter` · `Terminal` · `ArchitectureDiagram` · `PipelineStrip` · `SdlcLoop` · `SketchToUi` · `HeroPortrait` · `HeroParticles` · `Cursor` · `Loader` · `ExperienceToggle` · `CopyEmailButton` · `ErrorBoundary`.

### 10.9 Motion language
Durations: micro 120ms, small 240ms, medium 480ms, large 960ms. Easings: `--ease-out: cubic-bezier(.16,1,.3,1)`, `--ease-inout: cubic-bezier(.65,0,.35,1)`; GSAP equivalents `power3.out` / `power2.inOut`. Entrances translate ≤ 24px. **No bounce, elastic, or overshoot.** Scrubbed motion uses `ease: 'none'`.

### 10.10 States to design (not optional)
Loading (loader, poster-first), video error (poster stays, no broken icon), slow network (lite suggestion toast), hover/focus/active/disabled on every interactive element, empty `CONFIRM` placeholder (dev-only red outline), copy-success, 404.

---

## 11. Responsive and touch
- Breakpoints: `sm 480 · md 768 · lg 1100 · xl 1440`. Fluid first; breakpoints only for layout changes.
- Use `svh`/`dvh`, never `vh`, for stages (iOS toolbars). Call `ScrollTrigger.config({ ignoreMobileResize: true })`. `ScrollTrigger.normalizeScroll(true)` MAY be tested on iOS but is off by default (side effects).
- Subject sits right in most videos: `object-position: 75% center` on mobile. Phase 1's subject is left: use `25% center`. Per-phase value lives in config.
- Touch targets ≥ 44×44px. Rail becomes a top progress bar + `03 / 07`.
- Test matrix (minimum): iPhone Safari (current and previous major), Android Chrome mid-range, desktop Chrome, Firefox, Safari, Edge; widths 360, 390, 768, 1024, 1440, 1920; one very wide (2560) and one short (1366×640) viewport.

---

## 12. Accessibility (WCAG 2.2 AA)
- **[A11Y-01][P0]** Semantic structure: one `<h1>` (name), one `<h2>` per phase, `<main>`, `<nav aria-label="Story phases">`, `<section aria-labelledby>`, `<footer>`. "Skip to main content" and "Skip the story" links are the first focusables.
- **[A11Y-02][P0]** Videos and canvases are decorative: `aria-hidden="true"`, poster `alt=""`. All meaning exists as DOM text.
- **[A11Y-03][P0]** Visible focus rings (2px accent, 2px offset) on everything focusable. Never `outline: none` without replacement.
- **[A11Y-04][P0]** `prefers-reduced-motion: reduce` → **static mode**: no Lenis, pinning, scrubbing, particles, typing, parallax, cursor. Content stacks normally with posters; widgets render in final state.
- **[A11Y-05][P0]** Hidden beats MUST be non-focusable and non-readable (`autoAlpha`/`visibility:hidden` or `inert`), so tab order and screen readers only see what is visible.
- **[A11Y-06][P1]** A polite `aria-live` region announces "Phase 3 of 7: Planning and architecture" on phase change (debounced ≥ 800ms).
- **[A11Y-07][P0]** Keyboard operation of the whole story, the rail, the SDLC loop buttons and the copy-email button. No keyboard traps.
- **[A11Y-08][P0]** Color is never the only signal (red/green terminal lines also carry `✕`/`✓` and text).
- **[A11Y-09][P1]** Target size and focus-not-obscured (WCAG 2.2): fixed chrome MUST NOT cover a focused element; use `scroll-padding`.
- **[A11Y-10][P0]** `<noscript>` shows name, role, links and project list.

---

## 13. Performance engineering

### 13.1 Budgets
| Item | Budget |
|---|---|
| Initial route JS (gzip), excluding lazy chunks | ≤ 200 KB |
| Hero particles chunk (lazy) | ≤ 200 KB. If exceeded, swap to Canvas2D or a tiny WebGL lib (e.g., OGL) with an ADR |
| First-screen payload before interaction (HTML, CSS, fonts, cut-out, JS) | ≤ 600 KB |
| Videos in flight | ≤ 2 sources at once |
| Long tasks during scroll | none > 50ms |
| Fonts | ≤ 2 families, ≤ 4 files, preloaded |

### 13.2 Tactics (all P0 unless noted)
- First paint is text + cut-out; video, Three and analytics load after `requestIdleCallback`/interaction.
- `fetchpriority="high"` on the hero cut-out only. Lazy everything else.
- Prerender all text into static HTML so content is visible before hydration. Reserve space (fixed `svh` stages, `aspect-ratio`) so hydration causes no shift.
- Read-then-write DOM discipline; no layout thrash in tickers; `will-change: transform` only on the active stage and removed after.
- Pause every ticker, particle loop and observer when offscreen or the tab is hidden (`document.visibilityState`).
- Debounce `ScrollTrigger.refresh()` and call it once after fonts and each clip's metadata load.
- Cache headers: `immutable, max-age=31536000` for hashed assets and `/media/**`; `no-cache` for HTML.
- Verify servers honor **HTTP Range** requests for MP4 (required for seeking). [PERF-07][P0]
- Measure on a real mid-range Android and a throttled profile, not only a fast laptop. Record results in `QA-REPORT.md`.

---

## 14. Technical architecture

### 14.1 Stack decision (no stack limit, decided)
| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router), static export** (`output: 'export'`), TypeScript strict | Prerendered HTML for SEO and instant text, per-route metadata, `next/font`, familiar to the owner. All pinned/animated parts are client components |
| Package manager / runtime | pnpm, Node 22 LTS | Fast, strict, reproducible |
| Styling | Tailwind CSS (latest stable) + CSS variables for tokens | Utility speed, tokens remain the source of truth |
| Animation | **GSAP 3 + ScrollTrigger + `@gsap/react`**, **Lenis** | Industry standard for scrubbed, pinned timelines. One animation system only |
| 3D | `three` + `@react-three/fiber`, **hero particles only**, lazy, `ssr: false` | Owner's chosen tool, tightly scoped. Budget guard in 13.1 |
| Media | ffmpeg + sharp scripts | Deterministic, scripted, reproducible |
| Content | Typed TS modules validated with **Zod** | Content as data, build-time validation |
| Tests | Vitest (unit), Playwright (e2e + visual), `@axe-core/playwright`, Lighthouse CI | Covers logic, flows, a11y, performance |
| Quality | ESLint (flat config, `react-hooks`, `jsx-a11y`), Prettier, `tsc --noEmit`, Husky + lint-staged, Conventional Commits | Gate every commit |
| Analytics | Plausible or Umami (cookieless) | Privacy-friendly, no consent banner needed |
| Hosting | Firebase Hosting (CDN) primary; Cloud Run + nginx alternative | Fits the GCP story; CDN for heavy media |
| CI/CD | GitHub Actions + Firebase preview channels | Preview per PR, deploy on `main` |

**Escape hatch:** if pinned ScrollTrigger layouts fight Next's hydration in a way that cannot be resolved cleanly, switch to Vite + React with prerendering and record an ADR. Do not hack around it.

Do not add Framer Motion, a second scroll library, a UI kit, or a global state library. A tiny external store via `useSyncExternalStore` is allowed for `activePhase`, mode and preferences. Versions: latest stable that satisfy peer dependencies; verify React ↔ R3F ↔ Three compatibility and record versions in the first report.

### 14.2 Folder structure
```
eirele-portfolio/
  docs/ ARCHITECTURE.md  decisions/NNN-*.md  CONTENT-GUIDE.md
  raw-assets/                     (git-ignored)
  public/ media/{hero,video,posters}  Eirele_Joven_Boter_Resume.pdf  og-image.jpg  favicon.svg
  scripts/media/ encode.mjs  keying.mjs  continuity.mjs
  src/
    app/ layout.tsx  page.tsx  quick/page.tsx  not-found.tsx  sitemap.ts  robots.ts
    content/ facts.ts  phases.ts  transitions.ts  projects.ts  flags.ts  schema.ts
    features/
      story/      (Story.tsx, PhaseStage.tsx, TransitionStage.tsx, Dip.tsx, beats/*)
      visuals/    (ArchitectureDiagram, PipelineStrip, SdlcLoop, SketchToUi, Terminal)
      hero/       (HeroPortrait.tsx, HeroParticles.tsx)
      quick/      (QuickView.tsx)
      chrome/     (Chrome, PhaseRail, ProgressBar, ExperienceToggle, Cursor, Loader)
    lib/ scroll/{engine,useStageTimeline}.ts  media/{url,preload}.ts  mode/useExperienceMode.ts
         math.ts (clamp, lerp, mapRange)  analytics.ts  a11y/announce.ts
    styles/ tokens.css  globals.css
    generated/ quality.json        (written by CI, P2)
  tests/ unit/  e2e/  visual/
  .github/workflows/ ci.yml  deploy.yml
  TODO.md  README.md  CHANGELOG.md  PROMPT.md (this document)
```
Rule: **features own their UI; `lib` owns framework-agnostic logic; `content` owns words and numbers.** No component contains copy; no content file contains JSX.

### 14.3 Content model (typed, validated)
```ts
export type BeatBase = { id: string; at: number; until?: number }; // fractions 0..1

export type Beat =
  | (BeatBase & { kind: 'statement'; eyebrow?: string; text: string })
  | (BeatBase & { kind: 'dialogue'; lines: { speaker: 'client' | 'me'; text: string }[] })
  | (BeatBase & { kind: 'chips'; heading?: string; items: string[] })
  | (BeatBase & { kind: 'cards'; projectIds: string[] })
  | (BeatBase & { kind: 'counters'; items: { value: number; suffix?: string; label: string }[] })
  | (BeatBase & { kind: 'visual'; visual: 'sketchToUi' | 'architecture' | 'terminalTests' | 'pipeline' | 'sdlcLoop' });

export interface PhaseConfig {
  index: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  slug: string;                       // hash target, e.g. "architecture"
  label: string;                      // "PHASE 03 / PLANNING & ARCHITECTURE"
  heading: string;                    // visible h2
  scrollVh: { desktop: number; mobile: number };
  media: { video?: string; videoMobile?: string; poster: string };
  objectPosition: { desktop: string; mobile: string };
  textAnchor: 'left' | 'bottom-left' | 'center';
  beats: Beat[];
}
```
Rendering uses an **exhaustive switch** on `beat.kind` with a `never` check, so adding a kind without a renderer fails compilation. A Zod schema validates `facts.ts`/`phases.ts` at build; invalid data or any unresolved `CONFIRM` in a production build fails with a clear message. [CNT-02][P0]

### 14.4 HeroParticles (scoped, optional-by-design)
~1,200 dark points (1.5px) with a slow sine-field drift and slight mouse parallax, **behind** the portrait. On scroll they converge to the center line then dissolve. `dpr` capped `[1, 1.5]`; count halved on mobile or `hardwareConcurrency ≤ 4`; render loop paused offscreen; unmounted entirely in lite/static; wrapped in an `ErrorBoundary` whose fallback is a plain background. [HERO-01][P0]

### 14.5 Analytics events (cookieless, no personal data)
`story_start`, `phase_reached {phase}` (once per phase per session), `skip_story_click`, `quick_view_open`, `project_click {project}`, `contact_click {channel}`, `resume_download`, `mode_resolved {mode}`, `lite_suggested_accept/decline`. All calls go through `lib/analytics.ts` (no-ops in dev). [ANA-01][P1]

### 14.6 Build-time guards
- `pnpm build` fails when: any `CONFIRM` remains (`NODE_ENV=production`), any text contains "AWS", a required media file is missing, content fails the Zod schema, or the media budget script reports an over-budget file without an acknowledged waiver in `docs/decisions/`.

---

## 15. Code quality standards (care for the code)

### 15.1 Principles
1. **Content is data, presentation is components, motion is isolated hooks.** Never mix.
2. **One source of truth** for every number (scroll lengths, colors, durations, copy, URLs). No magic numbers; name them or put them in config/tokens.
3. **Pure logic gets unit tests** (`clamp`, `lerp`, `mapRange`, mode resolution, content validation, label formatting).
4. **Effects clean up after themselves.** Every ticker, listener, observer, ScrollTrigger and video source created in an effect is released in its cleanup. Components MUST be correct under React StrictMode double-mount. [CODE-01][P0]
5. **SSR-safe.** No `window`/`document` access during render; guard in effects or client-only modules.
6. **Small, named, typed.** Components ≤ ~200 lines; functions do one thing; prefer composition over flags.
7. **Comments explain *why*,** not *what*. Anything non-obvious (gotchas, browser quirks) gets a comment with the reason.
8. **Boring over clever.** Prefer the obvious implementation; clever code requires an ADR.

### 15.2 Conventions
- TypeScript `strict`, `noUncheckedIndexedAccess`, no `any`, no `@ts-ignore` (use `@ts-expect-error` with a reason and an issue/TODO reference). Non-null assertions (`!`) need a comment.
- Names: components `PascalCase`, hooks `useThing`, files match their default export, constants `SCREAMING_SNAKE` only for true constants, booleans `isX/hasX/shouldX`.
- Imports: absolute alias `@/…`, grouped (framework, libs, internal, relative, styles). No circular dependencies (enforced by lint rule or `madge` in CI).
- Styling: Tailwind utilities for layout/spacing; tokens via CSS variables for color/type/motion; no inline style except dynamic values; no `!important`.
- Accessibility lint (`jsx-a11y`) set to error. `react-hooks/exhaustive-deps` set to error.
- No `console.log` in committed code (a dev logger is allowed behind a flag).
- Errors: `ErrorBoundary` per stage so one broken visual never blanks the story; media failures degrade to posters.

### 15.3 Git and review hygiene
- Conventional Commits (`feat(story): …`, `fix(video): …`, `perf: …`, `docs: …`, `chore: …`), small and atomic. Reference requirement IDs when relevant (`feat(hero): typed name [HERO-01]`).
- Husky pre-commit: `lint-staged` (format + eslint on changed files) and `tsc --noEmit`. Pre-push: unit tests.
- PR template: what/why, screenshots or screen recording, requirement IDs covered, test evidence, perf impact, a11y notes.
- Never commit secrets, raw assets, or build output. Keep `.env.example` current.

### 15.4 Documentation
- `README.md`: install, `pnpm dev`, `pnpm media`, `pnpm build`, `pnpm test`, env vars, deploy, troubleshooting (e.g., "video scrub is choppy").
- `docs/ARCHITECTURE.md`: diagram of modes, timeline model, media chain, data flow; update with every milestone.
- `docs/CONTENT-GUIDE.md`: how to edit copy, add a project, change scroll lengths, swap media.
- TSDoc on every exported function/component (purpose, params, gotchas).
- `CHANGELOG.md` per milestone.

### 15.5 Anti-patterns (reject in review)
- `setState` inside a scroll/ticker callback. · Setting `video.currentTime` on every scroll event. · Animating `top/left/width/height` (use `transform`/`opacity`). · `vh` for full-screen stages. · Reading layout in the same loop that writes it. · Copy inside JSX. · Hard-coded colors outside tokens. · `localStorage` read without try/catch. · Autoplaying audio. · Text only in canvas/images. · Disabling focus outlines. · Adding a dependency for a 10-line helper. · Scroll-jacking that removes the scrollbar or blocks keyboard scrolling. · Silent `catch {}`.

---

## 16. Testing and QA strategy

| Layer | Tool | What |
|---|---|---|
| Unit | Vitest | math helpers, mode resolution (reduced-motion, saveData, URL param precedence), content schema, label formatting, beat-position validation (`0 ≤ at < until ≤ 1`) |
| Component | Vitest + Testing Library | Beat renderers, `CopyEmailButton`, `SdlcLoop` keyboard behavior, `ExperienceToggle` |
| E2E | Playwright (1440×900, 390×844) | every section exists; rail jump lands on the right phase; deep links; Quick View renders; `?mode=static` shows all content with no pinned elements; `?mode=lite` loads no video; no console errors; link `rel` attributes |
| A11y | axe via Playwright | 0 serious/critical on `/`, `/quick`, static and lite modes; keyboard-only walkthrough script |
| Visual | Playwright screenshots | key frames of each phase (poster state) and quick view; diff threshold documented |
| Performance | Lighthouse CI + manual traces | targets in 1.3; Chrome Performance trace of a full scroll (no long tasks > 50ms) |
| Real devices | Manual checklist in `QA-REPORT.md` | iPhone Safari, Android Chrome; scrub vs fallback decision recorded |
| Build guards | CI | section 14.6 |

Manual exploratory checklist each milestone: scroll slowly, fast, reverse, jump via rail, resize mid-scroll, background the tab, throttle network, disable cache, toggle reduced motion, tab through with keyboard.

---

## 17. SEO, privacy, security

**SEO** [P0]: `<title>` "Eirele Joven Boter — Software Engineer (Web, IoT, AI)"; meta description < 160 chars; canonical; Open Graph + Twitter card with a 1200×630 `og-image.jpg` (hero cut-out on `#f4f2ee` with name and role); `lang="en"`; sitemap and robots; favicon (EJB monogram, accent); JSON-LD `Person` (name, jobTitle, url, `sameAs` = LinkedIn + GitHub, `knowsAbout`); no street address. All content is real prerendered HTML.

**Privacy** [P0]: cookieless analytics only; no fingerprinting; no third-party embeds; phone number hidden unless FACTS says otherwise; email is a `mailto:` link (no form, no backend, no spam surface).

**Security headers** (in `firebase.json`/nginx) [P0]: `Content-Security-Policy` (default-src 'self'; script/style/img/media/font 'self' plus the analytics host only; `frame-ancestors 'none'`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (deny camera, mic, geolocation), HSTS via host. All external links: `rel="noopener noreferrer"`. Run `pnpm audit` in CI; no dependency with a known high-severity advisory.

---

## 18. Deployment, CI/CD and operations

- **Build:** `pnpm build` → static `out/`.
- **Firebase Hosting (primary):** `firebase.json` with headers (cache, security), clean URLs, 404 page. Media: if total > ~100 MB, do not commit `public/media/`; choose (a) deploy from the owner's machine (`pnpm build && firebase deploy --only hosting`) or (b) a public Cloud Storage bucket behind a CDN with `NEXT_PUBLIC_MEDIA_BASE_URL`. **Ask the owner which before wiring CI.**
- **Cloud Run (documented alternative):** multi-stage `Dockerfile` (node build → `nginx:alpine`), `nginx.conf` with gzip, long cache for hashed assets and media, **Range requests enabled**, SPA/404 fallback. Provide workflow as `deploy-cloudrun.yml.disabled`.
- **CI (`ci.yml`):** install → typecheck → lint → unit → build → Playwright → Lighthouse CI → upload reports. **Preview channel** per PR. **`deploy.yml`:** on `main`, after all gates pass.
- **Post-launch:** uptime check (free), Lighthouse re-run on the live URL, analytics review after 7 days, a short "Build notes" write-up for LinkedIn (optional).
- **Do not deploy** until the owner approves (milestone M11).

---

## 19. Milestones (stop and report after each)

| # | Milestone | Deliverables | Acceptance |
|---|---|---|---|
| **M0** | Foundation and quality gates | Repo, Next + TS strict, Tailwind, tokens, fonts, ESLint/Prettier/Husky, Vitest, Playwright, CI skeleton, `docs/`, `TODO.md`, seeded `content/*` from FACTS, build guards | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` green; CI green; `CONFIRM` guard demonstrably fails a prod build |
| **M1** | Design system and chrome | Tokens, type, `Chrome`, `Label`, `GlassPanel`, `Chip`, `Loader` (basic), mode hook with tests | Style page (dev-only) shows all components in both themes; contrast verified |
| **M2** | Scroll engine and placeholders | Lenis+GSAP engine, `PhaseStage`, `TransitionStage`, `Dip`, `PhaseRail`/`ProgressBar`, hash deep links; 8 placeholder phases + 6 placeholder transitions | Pin, rail tracking, click-jump, deep links, StrictMode clean, keyboard scrolling works, no console errors |
| **M3** | Media pipeline | `pnpm media` (all of section 9 except hero keying), `media-report.txt` with sizes, durations, continuity | Budgets met or waived with ADR; report lists every clip |
| **M4** | Vertical slice | T3→4, **Phase 4 fully built**, T4→5 with `ScrubVideo`, preload chain, touch fallback flag | Smooth scrub both directions; boundaries continuous or reported; ≤ 2 video sources alive; real-phone test noted |
| **M5** | Hero, loader, dip | Hero keying (9.4), `HeroPortrait`, typing, breathing, `HeroParticles` (lazy), final loader, dip with theme tween | No green fringe on light/dark; first paint is text + cut-out; particles pause offscreen; dim reverses on scroll up |
| **M6** | Phases 1-3 | Dialogue, chips, `SketchToUi`, `ArchitectureDiagram`, transitions 1→2, 2→3 | Copy exact; widgets scrubbed and reversible; tooltips keyboard-accessible |
| **M7** | Phases 5-7 + contact | `Terminal`, `PipelineStrip`, `SdlcLoop` (navigation buttons), counters, contact block, T5→6, T6→7 | Only kept metrics shown; SDLC nodes scroll to phases; copy-email works with live-region feedback |
| **M8** | Quick View, Lite, Static | `/quick`, `ExperienceToggle`, lite mode, static mode, noscript, announce region | `?mode=quick|lite|static` each pass e2e + axe; lite loads zero video bytes |
| **M9** | Polish | Continuity bridges (only where flagged), velocity feel, cursor, magnetic CTA, grain (if cheap), label timing, ErrorBoundaries, `ScrubCanvas` (disabled by default) | Frame budget held; reduced-motion disables all polish |
| **M10** | QA and performance | Full test suite, Lighthouse CI, real-device pass, `QA-REPORT.md`, fixes | All targets in 1.3 met or explained; no open P0 |
| **M11** | Deploy config (and deploy after approval) | Firebase/Cloud Run files, workflows, headers, README, analytics wiring | Preview channel works; owner approves before production deploy |

---

## 20. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Video scrubbing stutters (esp. iOS Safari) | High | High | All-intra encode, lerped playhead, touch autoplay fallback, `ScrubCanvas` fallback, lite mode |
| Heavy media hurts load and bandwidth | High | High | Budgets, mobile variants, preload chain, lazy release, CDN, lite mode |
| Green-screen halo on hero | Medium | High | Sample-based keying, despill, edge feather, manual `hero-cutout.png` path, never ship a halo |
| Clip boundaries don't match visually | Medium | Medium | Continuity report, optional bridges, owner decision |
| AI-generated video artifacts or garbled screen text | Medium | Medium | Avoid zooming into screens, crop for subject, owner regenerates bad clips |
| Next hydration vs pinned layout friction | Medium | Medium | Client-only stages, fixed `svh` layout, escape hatch to Vite (ADR) |
| Three.js bundle weight | Medium | Medium | Lazy, scoped, budget guard, swap to Canvas2D/OGL |
| Unverifiable or wrong claims | Medium | High | FACTS only, `CONFIRM` build guard, owner reviews all copy |
| AWS shown in a video while the story says GCP | High | Medium | Owner regenerates Phase 6 clip, or Phase 6 copy stays cloud-agnostic |
| Scroll-jacking annoys users | Medium | High | Native scroll, skip links, Quick View, lite mode, honest pacing test |
| Memory pressure on low-end phones | Medium | High | ≤ 2 live video sources, release far sources, lite auto-detection |

---

## 21. Enhancement backlog (only after all P0/P1 pass)

- **[ENH-01][P2] "Behind the build" panel:** footer link opens a panel with the stack, architecture diagram of the site, and quality numbers.
- **[ENH-02][P2] Live quality proof:** Phase 5 shows this site's real Lighthouse/test results from CI (`quality.json`).
- **[ENH-03][P2] Personalized brief:** at Phase 1 the visitor picks a client type (Hospitality/IoT, Retail, Healthcare); Phase 4 highlights the most relevant project. Static content swap, no tracking.
- **[ENH-04][P2] Case-study pages** `/work/[slug]` once the owner supplies problem/approach/result text.
- **[ENH-05][P2] Optional sound:** off by default, toggle in chrome, only with licensed assets provided by the owner; never autoplay.
- **[ENH-06][P2] Printable résumé stylesheet** for Quick View.
- **[ENH-07][P2] WebCodecs scrubbing** if a measured benefit exists (ADR required).
- **[ENH-08][P2] Japanese (日本語) greeting easter egg** (owner is studying JLPT N5), only if the owner provides the text.

---

## 22. Definition of Done and report format

### 22.1 A milestone is DONE only when
1. Its acceptance criteria pass, with evidence.
2. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass with zero errors and zero warnings.
3. The browser console is clean in story, lite, static and quick modes (as applicable).
4. No new a11y violations (axe) and no keyboard regressions.
5. Bundle and media budgets are met or waived in an ADR.
6. Docs and `TODO.md` are updated; commits follow Conventional Commits.
7. The report below has been delivered.

### 22.2 Report (end every milestone with exactly this, then STOP)
1. **Done:** what was built, mapped to requirement IDs.
2. **How to verify:** exact commands and what the owner should see (include `pnpm dev --hostname 0.0.0.0` for phone testing).
3. **Acceptance check:** each criterion pass/fail with evidence (outputs, measurements, screenshots).
4. **Dependencies added** with versions and the reason for each.
5. **Open items:** `TODO.md` / `CONFIRM` list, and "Questions for owner".
6. **Decisions made** (links to ADRs) and any risks that changed.
7. **Commit(s)** created.
8. End with: "Approve milestone M#, or tell me what to change."

---

## Appendix A: Start sequence for the very first reply
Before writing code, reply in at most 15 lines with: (1) the 5 biggest risks you see and how you will handle them, (2) the exact versions you plan to install and why, (3) any FACTS or asset questions you need answered. Then begin **M0 only**.

## Appendix B: Glossary
**Scrub:** tie a video's playhead to scroll position. **Pin:** hold a section fixed while scroll distance elapses. **Beat:** a timed piece of text or visual on a stage's timeline. **Stage:** a pinned section (phase or transition). **All-intra:** video where every frame is a keyframe, enabling smooth random seeking. **Dip:** the dark panel that bridges Phase 0 and Phase 1. **Lite / Static / Quick:** the alternative experience modes. **ADR:** architecture decision record.
