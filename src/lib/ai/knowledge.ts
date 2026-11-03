/**
 * Portfolio knowledge for the AI chatbot — the RAG knowledge base
 * [BOT-01][BOT-03].
 *
 * SERVER-SIDE ONLY — imported exclusively by /api/chat (via lib/ai/rag.ts).
 * It compiles the site's own content modules (facts.ts / projects.ts /
 * work.ts / skills.ts / experience.ts / phases.ts) into retrieval CHUNKS:
 * every answer the assistant can give is grounded in the blueprint FACTS
 * the site publishes. Nothing here invents claims — where the site omits
 * a fact (per-project result sentences, phone number), the bot omits it
 * too.
 *
 * [BOT-03] RAG-only brain: the chunks below are the WHOLE brain. No LLM,
 * no API key, no network egress — lib/ai/rag.ts retrieves the chunks that
 * match a question and composes the reply from their pre-written bodies.
 * Editing any content module updates the bot on the next rebuild; editing
 * a chunk body below is copywriting, exactly like editing site copy.
 */

import {
  person,
  heroBeats,
  metrics,
  demoClient,
} from "@/content/facts";
import { projects } from "@/content/projects";
import { work } from "@/content/work";
import { skills, skillTotal } from "@/content/skills";
import { experience, experienceYears } from "@/content/experience";
import { phases } from "@/content/phases";

/** One retrieval unit: a topic, its index terms, and a pre-written answer. */
export type KnowledgeChunk = {
  /** Stable id (debugging / GET self-check counts). */
  id: string;
  /** Broad topic — the composer uses it for framing and intent matching. */
  topic:
    | "person"
    | "location"
    | "projects" // the overview ("what has he built?")
    | "project" // one specific product
    | "stack" // the overview ("what's his stack?")
    | "stack-group" // one discipline
    | "experience" // the overview
    | "posting" // one specific job
    | "metrics"
    | "process" // the story overview
    | "phase" // one story phase
    | "website"
    | "resume"
    | "contact"
    | "availability";
  /** Human title — indexed with weight between keywords and body. */
  title: string;
  /** High-signal terms/phrases — weighted far above body text. */
  keywords: string[];
  /** The pre-composed plain-text answer body (facts only, "•" bullets). */
  body: string;
  /** One-line next-question suggestion the composer may append. */
  followUp?: string;
};

/* ------------------------------------------------------------------ */
/* Small compilers over the canonical content modules                  */
/* ------------------------------------------------------------------ */

/** Normalize a brand/stack string for equality checks ("Vue JS" → "vuejs"). */
function norm(s: string): string {
  return s.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
}

/** Alias fold so work.ts stack spellings match skills.ts brand casings. */
const STACK_ALIASES: Record<string, string> = {
  "vue js": "vue.js",
  nuxtjs: "nuxt.js",
  "next js": "next.js",
  "java android": "java",
  restapis: "rest apis",
};

/** tool key (norm'd) → canonical name + discipline + that discipline's list. */
export const skillToolIndex: Map<
  string,
  { tool: string; discipline: string; group: string[] }
> = new Map();
for (const cat of skills) {
  for (const tool of cat.skills) {
    const key = STACK_ALIASES[norm(tool)] ?? norm(tool);
    skillToolIndex.set(key, { tool, discipline: cat.label, group: cat.skills });
  }
}

/** tool key (norm'd) → the launched products whose stack ships it. */
export const toolUsage: Map<string, string[]> = new Map();
for (const w of work) {
  for (const item of w.stack) {
    const key = STACK_ALIASES[norm(item)] ?? norm(item);
    const entry = skillToolIndex.get(key);
    if (!entry) continue; // only tools the canonical stack claims
    const list = toolUsage.get(key) ?? [];
    if (!list.includes(w.name)) list.push(w.name);
    toolUsage.set(key, list);
  }
}

/** work.ts id → the projects.ts feature list for the same product. */
const featuresByWorkId: Record<string, string[]> = {
  "reservation-ph": projects.find((p) => p.id === "reservation-ph")?.features ?? [],
  brilliantpos: projects.find((p) => p.id === "brilliantpos")?.features ?? [],
  "duff-street":
    projects.find((p) => p.id === "duff-street-clinic")?.features ?? [],
};

/** First sentence of a description, for the compact overview list. */
function firstSentence(s: string): string {
  const cut = s.indexOf(". ");
  return (cut === -1 ? s : s.slice(0, cut + 1)).trim();
}

/* ------------------------------------------------------------------ */
/* The chunks                                                          */
/* ------------------------------------------------------------------ */

const personChunk: KnowledgeChunk = {
  id: "person",
  topic: "person",
  title: `${person.name} — ${person.role}`,
  keywords: [
    "eirele", "joven", "boter", "eirelejovenboter", "ejb", "who", "himself",
    "about", "intro", "introduce", "bio", "biography", "person", "owner",
    "engineer", "software", "developer", "portfolio", "name",
  ],
  body: [
    `${person.name} is a ${person.role.toLowerCase()} based in ${person.location}, working across three specialties: ${person.specialties.join(", ")}.`,
    `He builds enterprise systems end to end — web, IoT and AI — from the first conversation to the live deployment. Before engineering he ran restaurant operations, then served as an Able Seaman on international voyages. Different decks, same job: keep complex systems running under pressure.`,
  ].join("\n\n"),
  followUp: "Want the short version of his career, his stack, or his projects?",
};

const locationChunk: KnowledgeChunk = {
  id: "location",
  topic: "location",
  title: `Based in ${person.location}`,
  keywords: [
    "where", "based", "located", "location", "mandaluyong", "philippines",
    "ph", "city", "country", "timezone", "clock", "remote", "onsite",
  ],
  body: `He is based in ${person.location} (UTC+8). The contact section shows a live Mandaluyong clock, and his projects are deployed internationally — an Australian clinic site, SaaS platforms on Google Cloud, Vercel-hosted apps.`,
  followUp: "The fastest way to reach him is the contact section or his email.",
};

const projectsOverview: KnowledgeChunk = {
  id: "projects-overview",
  topic: "projects",
  title: "What has Eirele built?",
  keywords: [
    "built", "made", "created", "shipped", "launched", "products", "projects",
    "portfolio", "work", "clients", "deliveries", "saas", "apps", "websites",
  ],
  body: [
    `Nine products launched from zero — all planned, built, deployed and run by Eirele himself:`,
    work.map((w) => `• ${w.name} (${w.tag}) — ${firstSentence(w.description)}`).join("\n"),
  ].join("\n\n"),
  followUp: "Ask about any one by name — e.g. “Tell me about BrilliantPOS” — for the details.",
};

const projectChunks: KnowledgeChunk[] = work.map((w) => {
  const features = featuresByWorkId[w.id] ?? [];
  const metric = w.metric
    ? `Shown on the site: ${w.metric.value}${w.metric.suffix} ${w.metric.label}.`
    : "";
  const body = [
    `${w.name} — ${w.description}`,
    features.length
      ? `Features:\n${features.map((f) => `• ${f}`).join("\n")}`
      : "",
    `Stack: ${w.stack.join(", ")}.`,
    metric,
    `Live at ${w.url}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  return {
    id: `project-${w.id}`,
    topic: "project" as const,
    title: `${w.name} — ${w.tag}`,
    keywords: [
      ...w.name.toLowerCase().split(/\s+/),
      ...w.tag.toLowerCase().split(/[^a-z0-9+]+/),
      w.id.replace(/-/g, " "),
      w.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""),
    ],
    body,
    followUp: "Ask “what stack does it use?” or about its features for more.",
  };
});

const stackOverview: KnowledgeChunk = {
  id: "stack-overview",
  topic: "stack",
  title: `The stack — ${skillTotal} tools across ${skills.length} disciplines`,
  keywords: [
    "stack", "skills", "skill", "tools", "toolkit", "technologies", "tech",
    "languages", "frameworks", "uses", "knows", "proficient", "expertise",
  ],
  body: [
    `${skillTotal} tools across ${skills.length} disciplines — the full published stack:`,
    skills
      .map((c) => `• ${c.label} (${c.skills.length}) — ${c.skills.join(", ")}`)
      .join("\n"),
  ].join("\n\n"),
  followUp: "Name any tool — e.g. “Does he know Flutter?” — and I'll tell you where it sits.",
};

const stackGroupChunks: KnowledgeChunk[] = skills.map((c) => ({
  id: `stack-${c.id}`,
  topic: "stack-group" as const,
  title: `${c.label} — ${c.blurb}`,
  keywords: [
    ...c.label.toLowerCase().split(/[^a-z0-9]+/),
    ...c.blurb.toLowerCase().split(/[^a-z0-9]+/),
    ...c.skills.map((s) => s.toLowerCase()),
  ],
  body: `${c.label} — ${c.blurb}:\n• ${c.skills.join(" · ")}`,
  followUp: "The full ledger lives in the “PHASE 09 / STACK” section of the site.",
}));

const experienceOverview: KnowledgeChunk = {
  id: "experience-overview",
  topic: "experience",
  title: "Career logbook — the short version",
  keywords: [
    "experience", "career", "careers", "history", "background", "worked",
    "jobs", "logbook", "journey", "years", "previously", "before", "path",
    "switch", "transition", "seaman", "operations",
  ],
  body: [
    `${experienceYears} years across ${experience.length} postings, oldest first:`,
    experience
      .map((e) => `• ${e.period} — ${e.role}, ${e.company} (${e.tag.toLowerCase()})`)
      .join("\n"),
    `The through-line: ${heroBeats.beat2}`,
  ].join("\n\n"),
  followUp: "Ask about any posting — e.g. “What did he do at Tensei?” — for the details.",
};

const postingChunks: KnowledgeChunk[] = experience.map((e) => ({
  id: `posting-${e.id}`,
  topic: "posting" as const,
  title: `${e.role}, ${e.company} (${e.period})`,
  keywords: [
    ...e.company.toLowerCase().split(/[^a-z0-9]+/),
    ...e.role.toLowerCase().split(/[^a-z0-9]+/),
    ...e.tag.toLowerCase().split(/[^a-z0-9]+/),
    ...e.period.toLowerCase().split(/[^a-z0-9]+/),
  ],
  body: [
    `${e.period} — ${e.role}, ${e.company}:`,
    e.bullets.map((b) => `• ${b}`).join("\n"),
  ].join("\n\n"),
  followUp: "The full logbook is the “PHASE 10 / LOGBOOK” section of the site.",
}));

const metricsChunk: KnowledgeChunk = {
  id: "metrics",
  topic: "metrics",
  title: "Numbers published on the site",
  keywords: [
    "metrics", "numbers", "stats", "statistics", "scale", "devices",
    "uptime", "businesses", "achievements", "results", "kpi", "data",
    "connections", "impact",
  ],
  body: [
    `The numbers the site publishes (and the only ones I quote):`,
    Object.values(metrics)
      .map((m) => `• ${m.value}${m.suffix} ${m.label}`)
      .join("\n"),
  ].join("\n\n"),
};

const processOverview: KnowledgeChunk = {
  id: "process-overview",
  topic: "process",
  title: "The story — how he works",
  keywords: [
    "story", "process", "phases", "workflow", "method", "approach", "sdlc",
    "demo", "novara", "client", "section", "explains", "explain",
  ],
  body: [
    `The site's centerpiece is a scroll-driven cinematic story of how he works — seven phases: ${phases.map((p) => p.name).join(", ")}.`,
    demoClient.note,
  ].join("\n\n"),
  followUp: "Ask about any phase by name — e.g. “What happens in Discovery?” — for its one-liner.",
};

const phaseChunks: KnowledgeChunk[] = phases.map((p) => {
  const keyLines = p.beats
    .filter((b) => b.kind === "statement" && "text" in b)
    .map((b) => `“${"text" in b ? b.text : ""}”`);
  const checklist = p.beats.find(
    (b) => b.kind === "chips" && "items" in b && b.items?.length,
  );
  const body = [
    `${p.label} — ${p.lede}`,
    checklist && "items" in checklist
      ? `Checklist:\n${(checklist.items ?? []).map((i) => `• ${i}`).join("\n")}`
      : "",
    keyLines.length ? `Key line: ${keyLines[keyLines.length - 1]}` : "",
    `Deep link: #${p.slug} (story mode).`,
  ]
    .filter(Boolean)
    .join("\n\n");
  return {
    id: `phase-${p.index}`,
    topic: "phase" as const,
    title: `${p.label} — ${p.name}`,
    keywords: [
      ...p.name.toLowerCase().split(/[^a-z0-9]+/),
      ...p.label.toLowerCase().split(/[^a-z0-9]+/),
      p.slug,
      `phase ${p.index}`,
    ],
    body,
    followUp: "The full walk-through (dialogue, diagrams, counters) plays in story mode.",
  };
});

const websiteChunk: KnowledgeChunk = {
  id: "website",
  topic: "website",
  title: "This website",
  keywords: [
    "website", "site", "page", "modes", "mode", "story", "lite", "static",
    "quick", "view", "deep", "links", "link", "navigate", "navigation",
    "toggle", "rendering", "section",
  ],
  body: [
    `One page, four renderings: “story” (pinned cinematic video scrubbed by scrolling), “lite” (static posters, low data), “static” (reduced motion) and a Quick View overlay at /?view=quick with a resume-style summary. Force a mode with /?mode=story, /?mode=lite or /?mode=static.`,
    `Deep links: ${phases.map((p) => `#${p.slug}`).join(", ")}, plus #work (launched products), #stack (the toolkit) and #experience (the logbook). In lite/static the seven phases fold into one “How I work” ledger at #process. The STORY/LITE toggle sits at the right edge of the top bar; the choice is remembered.`,
  ].join("\n\n"),
};

const resumeChunk: KnowledgeChunk = {
  id: "resume",
  topic: "resume",
  title: "Resume PDF",
  keywords: ["resume", "cv", "pdf", "download"],
  body: `The resume is a one-page PDF at eirelejovenboter.com${person.resumePath} — every rendering has a “Download my Resume” button (hero, contact section) plus Quick View.`,
  followUp: "Prefer a chat answer? Ask “What's his experience?” for the short version.",
};

const contactChunk: KnowledgeChunk = {
  id: "contact",
  topic: "contact",
  title: "How to reach Eirele",
  keywords: [
    "contact", "email", "reach", "touch", "linkedin", "github", "message",
    "form", "inbox", "mail", "phone", "call", "number", "social",
  ],
  body: [
    `Direct email: ${person.email}`,
    `• LinkedIn: ${person.linkedin.replace(/^https?:\/\/(www\.)?/, "")}`,
    `• GitHub: ${person.github.replace(/^https?:\/\//, "")}`,
    `• Or the message form in the contact section (PHASE 11 / YOURS) — it sends straight to the same inbox.`,
    `There is no public phone number — email or LinkedIn is fastest.`,
  ].join("\n"),
  followUp: "For hiring or collaboration, the form and the email are the fastest routes.",
};

const availabilityChunk: KnowledgeChunk = {
  id: "availability",
  topic: "availability",
  title: "Availability, rates, hiring",
  keywords: [
    "hire", "hiring", "available", "availability", "open", "job",
    "opportunity", "opportunities", "rate", "rates", "price", "prices",
    "pricing", "cost", "quote", "budget", "salary", "compensation", "freelance",
  ],
  body: `His availability and rates aren't published — ask him directly. For hiring or collaboration, use the contact options: the message form in the contact section, ${person.email}, or LinkedIn.`,
  followUp: "Want the highlights to pitch him with? Ask “What has Eirele built?”",
};

/* ------------------------------------------------------------------ */

export const knowledgeChunks: KnowledgeChunk[] = [
  personChunk,
  locationChunk,
  projectsOverview,
  ...projectChunks,
  stackOverview,
  ...stackGroupChunks,
  experienceOverview,
  ...postingChunks,
  metricsChunk,
  processOverview,
  ...phaseChunks,
  websiteChunk,
  resumeChunk,
  contactChunk,
  availabilityChunk,
];

/* Shared facts the retrieval engine (lib/ai/rag.ts) composes with. */
export { person } from "@/content/facts";
export const stackFact = { tools: skillTotal, disciplines: skills.length };
