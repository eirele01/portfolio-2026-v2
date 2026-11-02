import { z } from "zod";

/**
 * Content model — validated at module load (see validateContent).
 * [CNT-02] Adding a beat kind without a renderer fails: the renderer switch
 * in features/story/beats is exhaustive with a `never` check, and this union
 * is the single source of truth for both sides.
 */
export const BeatBase = z.object({
  id: z.string(),
  at: z.number().min(0).max(1),
  until: z.number().min(0).max(1).optional(),
});

export const StatementBeat = BeatBase.extend({
  kind: z.literal("statement"),
  eyebrow: z.string().optional(),
  text: z.string(),
});

export const DialogueBeat = BeatBase.extend({
  kind: z.literal("dialogue"),
  lines: z.array(
    z.object({ speaker: z.enum(["client", "me"]), text: z.string() }),
  ),
});

export const ChipsBeat = BeatBase.extend({
  kind: z.literal("chips"),
  heading: z.string().optional(),
  /** Flat chip list (Phase 1 requirements). */
  items: z.array(z.string()).optional(),
  /** Grouped chip list (Phase 4 stack). */
  groups: z
    .array(z.object({ label: z.string(), items: z.array(z.string()) }))
    .optional(),
});

export const CardsBeat = BeatBase.extend({
  kind: z.literal("cards"),
  projectIds: z.array(z.string()),
});

export const CountersBeat = BeatBase.extend({
  kind: z.literal("counters"),
  items: z.array(
    z.object({
      value: z.number(),
      suffix: z.string().optional(),
      label: z.string(),
    }),
  ),
  footnote: z.string().optional(),
});

export const VisualBeat = BeatBase.extend({
  kind: z.literal("visual"),
  visual: z.enum([
    "sketchToUi",
    "architecture",
    "commitLog",
    "terminalTests",
    "pipeline",
    "sdlcLoop",
  ]),
});

export const Beat = z.discriminatedUnion("kind", [
  StatementBeat,
  DialogueBeat,
  ChipsBeat,
  CardsBeat,
  CountersBeat,
  VisualBeat,
]);
export type Beat = z.infer<typeof Beat>;

export const SceneSchema = z.object({
  /** Radial glow position in % of the stage. */
  x: z.number(),
  y: z.number(),
  size: z.number().min(20).max(120).default(55),
  intensity: z.number().min(0).max(1).default(0.5),
  tint: z.enum(["amber", "warm", "ember", "dawn"]).default("amber"),
  /** Faint texture overlay: grid/scan lines for texture in the dark acts. */
  texture: z.enum(["none", "grid", "scan"]).default("none"),
});
export type Scene = z.infer<typeof SceneSchema>;

export const PhaseConfigSchema = z.object({
  index: z.number().int().min(0).max(7),
  id: z.string(),
  /** Hash target, e.g. "discovery". */
  slug: z.string(),
  /** "PHASE 01 / DISCOVERY" — rendered as the section h2 (mono, accent rule). */
  label: z.string(),
  /** Short name for rail/announcements. */
  name: z.string(),
  /** One-line purpose of the phase, shown under the stage label so every
   * stage answers "what is this phase for" while it plays [CNT-04]. */
  lede: z.string().optional(),
  scrollVh: z.object({
    desktop: z.number().min(100),
    mobile: z.number().min(80),
  }),
  textAnchor: z.enum(["left", "bottom-left", "center"]),
  scene: SceneSchema,
  /** Persistent small caption inside the stage (e.g. the Novara note). */
  caption: z.string().optional(),
  beats: z.array(Beat),
});
export type PhaseConfig = z.infer<typeof PhaseConfigSchema>;

export const TransitionConfigSchema = z.object({
  id: z.string(),
  from: z.number().int().min(1).max(6),
  to: z.number().int().min(2).max(7),
  label: z.string(),
  scrollVh: z.object({ desktop: z.number(), mobile: z.number() }),
  scene: SceneSchema,
});
export type TransitionConfig = z.infer<typeof TransitionConfigSchema>;

const BANNED = /\baws\b/i; // [FACTS] Cloud wording: never write "AWS".

/** Walks every string in the content tree; throws on banned wording. */
function assertNoBannedWords(value: unknown, path: string): void {
  if (typeof value === "string") {
    if (BANNED.test(value)) {
      throw new Error(`[content] banned wording ("AWS") found at ${path}`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => assertNoBannedWords(v, `${path}[${i}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      assertNoBannedWords(v, `${path}.${k}`);
    }
  }
}

/** Beat windows must satisfy 0 <= at < until <= 1. */
function assertBeatPositions(phases: PhaseConfig[]): void {
  for (const phase of phases) {
    phase.beats.forEach((b, i) => {
      const until = b.until ?? 1;
      if (!(0 <= b.at && b.at < until && until <= 1)) {
        throw new Error(
          `[content] invalid beat window on ${phase.id}#${b.id}: at=${b.at} until=${b.until}`,
        );
      }
      const next = phase.beats[i + 1];
      if (next && !b.until && next.at <= b.at + 0.02) {
        throw new Error(
          `[content] beat ${phase.id}#${b.id} needs an 'until' before next beat ${next.id}`,
        );
      }
    });
  }
}

export function validateContent(phases: PhaseConfig[]): void {
  phases.forEach((p, i) => {
    PhaseConfigSchema.parse(p);
    assertNoBannedWords(p, `phases[${i}]`);
  });
  assertBeatPositions(phases);
}
