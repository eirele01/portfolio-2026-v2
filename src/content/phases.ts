import { demoClient, metrics } from "./facts";
import {
  validateContent,
  type PhaseConfig,
  type TransitionConfig,
} from "./schema";

/**
 * Story copy — the through-line is the [CNT-01] demo client: Novara, a
 * fictional smart-home hub, labelled as a stand-in on screen. Visitor
 * round 12, item 1: the footage shows a smart building/home build (IoT),
 * so the conversation follows that build instead of the booking platform.
 * The PROCESS is real and matches the resume skill groups; product claims
 * stay inside the labelled demo. Scroll lengths are the desktop/mobile
 * defaults from blueprint section 8.5, raised ~40% across the board
 * [SCR-11]: a longer pin means the same wheel motion advances the story
 * less, so captions and visuals stay readable longer. `scene` drives
 * CinematicBackdrop (lite/static stand-in — docs/decisions/003).
 */
export const phases: PhaseConfig[] = [
  {
    index: 1,
    id: "phase-1",
    slug: "discovery",
    label: "PHASE 01 / DISCOVERY",
    name: "Discovery",
    lede: "Every system starts with listening — we use it to find what must never break and what “done” means.",
    scrollVh: { desktop: 420, mobile: 330 },
    textAnchor: "bottom-left", // Phase 1 subject sits left in the raw footage.
    scene: { x: 18, y: 72, size: 60, intensity: 0.45, tint: "warm", texture: "none" },
    caption: demoClient.note, // [CNT-01]
    beats: [
      {
        id: "p1-dialogue",
        kind: "dialogue",
        at: 0.05,
        until: 0.38,
        lines: [
          {
            speaker: "client",
            text: "We're making our home smart — lights, climate, security, the lot. Can all of it live in one app?",
          },
          {
            speaker: "me",
            text: "Who uses it every day, and what's the one thing that must never break?",
          },
          {
            speaker: "client",
            text: "Coming home at night. The locks and lights have to respond — even if the internet doesn't.",
          },
        ],
      },
      {
        id: "p1-requirements",
        kind: "chips",
        at: 0.4,
        until: 0.74,
        heading: "Requirements captured.",
        items: [
          "One app, every device",
          "Real-time device state",
          "Offline-tolerant control",
          "Mobile-first",
        ],
      },
      {
        // [CNT-01] The story's build is the labelled demo client (Novara,
        // a fictional smart-home hub) — the process is real, the product
        // is a stand-in, and the caption below says exactly that.
        id: "p1-proof",
        kind: "statement",
        at: 0.78,
        until: 0.97,
        eyebrow: "THE SPEC",
        text: "The answer becomes the spec. Meet Novara — the demo smart-home hub we'll build through this story. The process is real.",
      },
    ],
  },
  {
    index: 2,
    id: "phase-2",
    slug: "design",
    label: "PHASE 02 / UX & UI DESIGN",
    name: "UX & UI Design",
    lede: "Requirements become an interface here: sketches, wireframes and the visual system every screen of the control app will follow.",
    scrollVh: { desktop: 350, mobile: 280 },
    textAnchor: "left",
    scene: { x: 68, y: 30, size: 52, intensity: 0.4, tint: "amber", texture: "none" },
    beats: [
      {
        id: "p2-statement",
        kind: "statement",
        at: 0.05,
        until: 0.32,
        text: "Sketch it. Wireframe it. Make it real.",
      },
      {
        id: "p2-visual",
        kind: "visual",
        visual: "sketchToUi",
        at: 0.36,
        until: 0.84,
      },
      {
        id: "p2-proof",
        kind: "statement",
        at: 0.88,
        until: 0.98,
        eyebrow: "TOOLS",
        text: "Figma → components → code.",
      },
    ],
  },
  {
    index: 3,
    id: "phase-3",
    slug: "architecture",
    label: "PHASE 03 / PLANNING & ARCHITECTURE",
    name: "Planning & Architecture",
    lede: "The build gets a map before it starts: data models, APIs and the hardware-to-cloud flow, agreed up front.",
    scrollVh: { desktop: 420, mobile: 330 },
    textAnchor: "left",
    scene: { x: 60, y: 45, size: 58, intensity: 0.42, tint: "amber", texture: "grid" },
    beats: [
      {
        id: "p3-statement",
        kind: "statement",
        at: 0.05,
        until: 0.32,
        text: "Before code, a map.",
      },
      {
        id: "p3-visual",
        kind: "visual",
        visual: "architecture",
        at: 0.36,
        until: 0.76,
      },
      {
        id: "p3-proof",
        kind: "statement",
        at: 0.8,
        until: 0.97,
        eyebrow: "AGREED FIRST",
        text: "Schemas, APIs and hardware-to-cloud protocols agreed before the first commit.",
      },
    ],
  },
  {
    index: 4,
    id: "phase-4",
    slug: "development",
    label: "PHASE 04 / DEVELOPMENT",
    name: "Development",
    lede: "The build itself — frontend, backend, IoT and cloud assembled piece by piece, committed as it grows.",
    scrollVh: { desktop: 490, mobile: 390 },
    textAnchor: "left",
    scene: { x: 78, y: 68, size: 55, intensity: 0.5, tint: "ember", texture: "none" },
    beats: [
      {
        id: "p4-stack",
        kind: "chips",
        at: 0.05,
        until: 0.36,
        heading: "Built piece by piece.",
        groups: [
          {
            label: "Frontend",
            items: ["Vue", "Nuxt", "React", "Next.js", "Inertia", "Tailwind CSS", "TypeScript"],
          },
          { label: "Backend", items: ["PHP", "Laravel", "REST APIs", "WebSockets", "MySQL"] },
          { label: "IoT", items: ["MQTT", "Java (Android)", "Flutter", "SwitchBot", "LoRaWAN"] },
          { label: "Cloud", items: ["GCP", "Docker", "Cloud Run"] },
        ],
      },
      {
        id: "p4-commits",
        kind: "visual",
        visual: "commitLog",
        at: 0.42,
        until: 0.6,
      },
      { id: "p4-cards", kind: "cards", at: 0.66, until: 0.97, projectIds: ["reservation-ph", "duff-street-clinic", "brilliantpos"] },
    ],
  },
  {
    index: 5,
    id: "phase-5",
    slug: "testing",
    label: "PHASE 05 / TESTING & QA",
    name: "Testing & QA",
    lede: "The system gets broken on purpose here — latency, disconnects and retries are handled before visitors find them.",
    scrollVh: { desktop: 350, mobile: 280 },
    textAnchor: "left",
    scene: { x: 50, y: 35, size: 50, intensity: 0.38, tint: "ember", texture: "scan" },
    beats: [
      {
        id: "p5-statement",
        kind: "statement",
        at: 0.05,
        until: 0.28,
        text: "Break it before they do.",
      },
      {
        id: "p5-visual",
        kind: "visual",
        visual: "terminalTests",
        at: 0.32,
        until: 0.78,
      },
      {
        id: "p5-proof",
        kind: "statement",
        at: 0.82,
        until: 0.97,
        eyebrow: "RESULT",
        text: "Edge cases handled before launch: latency, disconnects, retries.",
      },
    ],
  },
  {
    index: 6,
    id: "phase-6",
    slug: "deployment",
    label: "PHASE 06 / DEPLOYMENT & LAUNCH",
    name: "Deployment & Launch",
    lede: "The finished system goes live — containerised, monitored and measured from its first minute in production.",
    scrollVh: { desktop: 350, mobile: 280 },
    textAnchor: "left",
    scene: { x: 50, y: 88, size: 62, intensity: 0.5, tint: "amber", texture: "none" },
    beats: [
      { id: "p6-statement", kind: "statement", at: 0.05, until: 0.26, text: "Ship it." },
      { id: "p6-visual", kind: "visual", visual: "pipeline", at: 0.3, until: 0.6 },
      {
        id: "p6-counters",
        kind: "counters",
        at: 0.64,
        until: 0.97,
        items: [
          { value: metrics.uptime.value, suffix: metrics.uptime.suffix, label: metrics.uptime.label },
          {
            value: metrics.dataPoints.value,
            suffix: metrics.dataPoints.suffix,
            label: metrics.dataPoints.label,
          },
        ],
        footnote: "Google Cloud Platform · Docker · Cloud Run",
      },
    ],
  },
  {
    index: 7,
    id: "phase-7",
    slug: "maintenance",
    label: "PHASE 07 / MAINTENANCE & IMPROVEMENT",
    name: "Maintenance & Improvement",
    lede: "Launch is a milestone, not a finish line — usage feeds fixes and improvements in a continuous loop.",
    scrollVh: { desktop: 560, mobile: 450 },
    textAnchor: "left",
    scene: { x: 22, y: 18, size: 64, intensity: 0.45, tint: "dawn", texture: "none" },
    beats: [
      {
        id: "p7-statement",
        kind: "statement",
        at: 0.04,
        until: 0.2,
        text: "Launch is not the end.",
      },
      { id: "p7-loop", kind: "visual", visual: "sdlcLoop", at: 0.26, until: 0.9 },
    ],
  },
];

export const transitions: TransitionConfig[] = [
  {
    id: "t-1-2",
    from: 1,
    to: 2,
    label: "PHASE 02 / UX & UI DESIGN",
    scrollVh: { desktop: 210, mobile: 170 },
    scene: { x: 50, y: 50, size: 40, intensity: 0.3, tint: "amber", texture: "none" },
  },
  {
    id: "t-2-3",
    from: 2,
    to: 3,
    label: "PHASE 03 / PLANNING & ARCHITECTURE",
    scrollVh: { desktop: 210, mobile: 170 },
    scene: { x: 50, y: 50, size: 40, intensity: 0.3, tint: "amber", texture: "none" },
  },
  {
    id: "t-3-4",
    from: 3,
    to: 4,
    label: "PHASE 04 / DEVELOPMENT",
    scrollVh: { desktop: 210, mobile: 170 },
    scene: { x: 50, y: 55, size: 40, intensity: 0.34, tint: "ember", texture: "none" },
  },
  {
    id: "t-4-5",
    from: 4,
    to: 5,
    label: "PHASE 05 / TESTING & QA",
    scrollVh: { desktop: 210, mobile: 170 },
    scene: { x: 50, y: 50, size: 40, intensity: 0.3, tint: "ember", texture: "none" },
  },
  {
    id: "t-5-6",
    from: 5,
    to: 6,
    label: "PHASE 06 / DEPLOYMENT & LAUNCH",
    scrollVh: { desktop: 210, mobile: 170 },
    scene: { x: 50, y: 62, size: 42, intensity: 0.34, tint: "amber", texture: "none" },
  },
  {
    id: "t-6-7",
    from: 6,
    to: 7,
    label: "PHASE 07 / MAINTENANCE & IMPROVEMENT",
    scrollVh: { desktop: 210, mobile: 170 },
    scene: { x: 50, y: 40, size: 42, intensity: 0.32, tint: "dawn", texture: "none" },
  },
];

// Fail fast in dev if the content model is ever broken. [CNT-02]
validateContent(phases);
