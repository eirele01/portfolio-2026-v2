/**
 * The chatbot brain [BOT-01][BOT-03] — retrieval + composition, 100% local.
 *
 * A tiny RAG engine over the knowledge base in lib/ai/knowledge.ts: it
 * tokenizes the visitor's question, scores every chunk (keyword hits ≫
 * title hits ≫ body hits, with corpus IDF so rare terms dominate), and
 * composes the reply from the winning chunk's pre-written body. No LLM,
 * no API key, no network egress — identical behavior in the sandbox and
 * on Vercel, nothing to configure, nothing that can 401/429/time out.
 * It replaced the [BOT-02] provider wiring (AI_API_KEY → OpenAI-compatible
 * fetch → sandbox SDK) by owner decision: "use only RAG chatbot … do not
 * use any AI provider".
 *
 * Beyond plain retrieval, four composer refinements keep answers specific:
 *   1. Tool lookup — a question naming a tool in the canonical stack gets
 *      its discipline + the launched products shipping it (not just the
 *      discipline dump).
 *   2. Honest misses — "does he know <X>?" where <X> is a plausible tool
 *      NOT in the stack answers that it isn't listed (never invents).
 *   3. Follow-ups — the engine is stateless, but deterministic: it
 *      re-retrieves the previous turn to recover its chunk and answers
 *      short references ("what stack does it use?") from that chunk's
 *      matching block.
 *   4. Soft confidence — below the confident threshold the reply is
 *      framed as "closest thing I know"; below the floor it honestly
 *      declines and steers back to what it does know.
 */

import {
  knowledgeChunks,
  skillToolIndex,
  toolUsage,
  person,
  stackFact,
  type KnowledgeChunk,
} from "./knowledge";

export type ChatTurn = { role: "user" | "assistant"; content: string };

/* ------------------------------------------------------------------ */
/* Query analysis                                                      */
/* ------------------------------------------------------------------ */

const STOPWORDS = new Set([
  "the", "and", "for", "are", "was", "were", "been", "being", "have",
  "has", "had", "having", "does", "did", "doing", "done", "can", "could",
  "would", "should", "will", "shall", "may", "might", "must", "its",
  "his", "her", "him", "they", "them", "their", "she", "he", "you",
  "your", "yours", "our", "ours", "me", "my", "mine", "we", "us", "i",
  "it", "this", "that", "these", "those", "there", "here", "of", "in",
  "on", "at", "to", "from", "by", "with", "about", "into", "over",
  "after", "before", "between", "out", "off", "up", "down", "not", "no",
  "yes", "any", "some", "such", "own", "same", "other", "another",
  "also", "just", "very", "too", "more", "most", "much", "many", "lot",
  "bit", "please", "thanks", "thank", "thanx", "sorry", "ok", "okay",
  "yeah", "hey", "hello", "hi", "yo", "sup", "hmm", "uh", "um",
  "what", "whats", "which", "who", "whos", "whom", "whose", "when",
  "where", "wheres", "why", "how", "hows", "what's", "how's", "who's",
  "where's", "is", "am", "are", "be", "a", "an", "the", "as", "if",
  "or", "and", "but", "so", "than", "then", "because", "while",
  "tell", "give", "show", "let", "know", "want", "wanna", "need",
  "like", "get", "got", "make", "made", "see", "say", "said", "ask",
  "u", "ur", "im", "ive", "ill", "id", "dont", "doesnt", "cant",
  "wont", "isnt", "arent", "wasnt", "werent", "havent", "hasnt",
]);

/** Plural folding — second-chance lookup only ("projects" → "project"). */
function variants(token: string): string[] {
  if (token.endsWith("ies") && token.length > 4)
    return [token, `${token.slice(0, -3)}y`];
  if (token.endsWith("es") && token.length > 4) return [token, token.slice(0, -2)];
  if (token.endsWith("s") && token.length > 3 && !token.endsWith("ss"))
    return [token, token.slice(0, -1)];
  return [token];
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9.#+\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^[.\-+]+|[.\-+]+$/g, ""))
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

/** Query intents → the topic they're asking about (topic bonus). */
const INTENTS: Array<{ re: RegExp; topic: KnowledgeChunk["topic"] }> = [
  {
    re: /(has|have|did)\s+(he|eirele)\s+(built|made|created|shipped|launched|delivered|build|building)|his\s+(projects|products|portfolio|work|apps|websites)|show\s+(me\s+)?(his|the)\s+(projects|products|work)/i,
    topic: "projects",
  },
  { re: /\b(stack|tech|technolog(?:y|ies)|toolkit|tools|skills?)\b/i, topic: "stack" },
  {
    re: /\b(experience|background|career|careers|history|logbook|journey|worked|previously)\b/i,
    topic: "experience",
  },
  {
    // Employment phrasing — "what did he do at X?" asks about the JOB,
    // not a same-named product (e.g. Tensei is both a posting and a shelf
    // item); the topic bonus lets posting chunks win that clash.
    re: /\bwhat\s+(did|does|has)\s+(he|eirele)\s+(do|does|did|done|work)\b|\b(worked?|job|role|position)\s+(at|for|with)\b|\bhis\s+(job|role|position)\b/i,
    topic: "experience",
  },
  { re: /\b(story|process|workflow|phases?|sdlc|method|approach)\b/i, topic: "process" },
  {
    re: /\b(contact|email|reach|touch|message|linkedin|github|inbox|phone|call)\b/i,
    topic: "contact",
  },
  {
    re: /\b(hire|hiring|available|availability|job|opportunit\w*|rates?|price[ds]?|pricing|cost|quote|budget|salary)\b/i,
    topic: "availability",
  },
  { re: /where.*(based|located|from)|\b(location|city|country)\b/i, topic: "location" },
  { re: /\b(resume|cv)\b/i, topic: "resume" },
  { re: /\b(who|about|intro|introduce|himself|bio)\b/i, topic: "person" },
  {
    re: /\b(metrics|numbers|stats|statistics|scale|uptime|devices|businesses|achievements)\b/i,
    topic: "metrics",
  },
  {
    re: /\b(website|site|modes?|deep\s?links?|quick\s?view|navigate|navigation|toggle)\b/i,
    topic: "website",
  },
];

/** Tool-ish words that make "does he know X" a stack question. */
const TECH_HINTS = new Set([
  "python", "rust", "kotlin", "swift", "ruby", "golang", "django", "flask",
  "spring", "angular", "svelte", "solidjs", "astro", "deno", "bun", "graphql",
  "redis", "kafka", "rabbitmq", "terraform", "ansible", "jenkins", "airflow",
  "unity", "unreal", "expo", "prisma", "drizzle", "jest", "vitest", "cypress",
  "playwright", "selenium", "puppeteer", "c++", "c#", "perl", "scala", "elixir",
  "haskell", "matlab", "wordpress", "shopify", "squarespace", "webflow",
  "blender", "photoshop", "illustrator", "excel", "notion", "slack", "zapier",
]);

const TOOL_QUESTION =
  /\b(does|do|did|is|has|have|can)\b[^.?!]*\b(he|eirele)\b[^.?!]*\b(know|knows|use|uses|used|familiar|experienced|proficient|good|work|works|worked|specialize|specializes)\b/i;
const TOOL_CONTEXT =
  /\b(tech|stack|tool|language|framework|library|program|coding|code|develop)\b/i;
const QUESTION_VERBS = new Set([
  "know", "knows", "knew", "use", "uses", "used", "using", "work", "works",
  "worked", "working", "familiar", "experienced", "experience", "proficient",
  "good", "well", "great", "specialize", "specializes", "stack", "tech",
  "tools", "tool", "technologies", "technology", "skills", "skill",
  "language", "languages", "framework", "frameworks", "library",
]);

/* ------------------------------------------------------------------ */
/* Corpus index                                                        */
/* ------------------------------------------------------------------ */

type IndexedChunk = {
  chunk: KnowledgeChunk;
  kw: Set<string>;
  phrases: string[];
  title: Set<string>;
  body: Map<string, number>;
};

function indexChunk(chunk: KnowledgeChunk): IndexedChunk {
  const kw = new Set<string>();
  const phrases: string[] = [];
  for (const keyword of chunk.keywords) {
    if (/\s/.test(keyword)) {
      phrases.push(keyword.toLowerCase());
      for (const t of tokenize(keyword)) kw.add(t);
    } else {
      kw.add(keyword.toLowerCase());
    }
  }
  const title = new Set(tokenize(chunk.title));
  const body = new Map<string, number>();
  for (const t of tokenize(chunk.body)) body.set(t, (body.get(t) ?? 0) + 1);
  return { chunk, kw, phrases, title, body };
}

const INDEX: IndexedChunk[] = knowledgeChunks.map(indexChunk);
const N = INDEX.length;

/** term → number of chunks mentioning it anywhere (for IDF). */
const DF = new Map<string, number>();
for (const ic of INDEX) {
  const seen = new Set<string>();
  const count = (t: string) => {
    if (!seen.has(t)) {
      seen.add(t);
      DF.set(t, (DF.get(t) ?? 0) + 1);
    }
  };
  for (const t of ic.kw) count(t);
  for (const t of ic.title) count(t);
  for (const t of ic.body.keys()) count(t);
}

function idf(term: string): number {
  return Math.log((N + 1) / ((DF.get(term) ?? 0) + 1)) + 1;
}

/* ------------------------------------------------------------------ */
/* Retrieval                                                           */
/* ------------------------------------------------------------------ */

type WeightedTerm = { term: string; weight: number };

function weightedTokens(tokens: string[], base: number): WeightedTerm[] {
  const counts = new Map<string, number>();
  for (const t of tokens) counts.set(t, Math.min((counts.get(t) ?? 0) + 1, 2));
  return [...counts].map(([term, count]) => ({
    term,
    weight: base * Math.min(1 + 0.5 * (count - 1), 2),
  }));
}

function intentTopics(raw: string): Set<KnowledgeChunk["topic"]> {
  const topics = new Set<KnowledgeChunk["topic"]>();
  for (const { re, topic } of INTENTS) if (re.test(raw)) topics.add(topic);
  return topics;
}

type Hit = { ic: IndexedChunk; score: number };

/**
 * Intent topic → per-topic bonus. Two tiers: the overview topic gets +7,
 * its SPECIFIC tier +9 — so "what did he do at Tensei?" (experience
 * intent) lifts the posting above a same-named shelf product, while
 * "what's his experience?" still lifts the overview above everything.
 */
const TOPIC_FAMILY: Partial<Record<KnowledgeChunk["topic"], KnowledgeChunk["topic"]>> = {
  projects: "project",
  stack: "stack-group",
  experience: "posting",
  process: "phase",
};

function bonusFor(topics: Set<KnowledgeChunk["topic"]>): Map<KnowledgeChunk["topic"], number> {
  const bonus = new Map<KnowledgeChunk["topic"], number>();
  for (const t of topics) {
    bonus.set(t, 7);
    const specific = TOPIC_FAMILY[t];
    if (specific) bonus.set(specific, 9);
  }
  return bonus;
}

function retrieve(
  query: WeightedTerm[],
  bonus: Map<KnowledgeChunk["topic"], number>,
  rawLower: string,
): Hit[] {
  const hits: Hit[] = INDEX.map((ic) => {
    let score = 0;
    for (const { term, weight } of query) {
      for (const v of variants(term)) {
        if (ic.kw.has(v)) {
          score += 4 * idf(v) * weight;
          break;
        }
        if (ic.title.has(v)) {
          score += 2.5 * idf(v) * weight;
          break;
        }
        if (ic.body.has(v)) {
          score += 1 * idf(v) * weight;
          break;
        }
      }
    }
    score += bonus.get(ic.chunk.topic) ?? 0;
    for (const phrase of ic.phrases) {
      if (rawLower.includes(phrase)) score += 5;
    }
    return { ic, score };
  });
  return hits.sort((a, b) => b.score - a.score);
}

/* ------------------------------------------------------------------ */
/* Composer helpers                                                    */
/* ------------------------------------------------------------------ */

function normSpace(s: string): string {
  return ` ${s.toLowerCase().replace(/[^a-z0-9.#+\s-]/g, " ").replace(/\s+/g, " ").trim()} `;
}

/** Tools explicitly named in the question, in canonical-stack order. */
function findTools(rawLower: string): Array<{
  tool: string;
  discipline: string;
  group: string[];
}> {
  const haystack = normSpace(rawLower);
  const found: Array<{ tool: string; discipline: string; group: string[] }> = [];
  for (const [key, entry] of skillToolIndex) {
    if (haystack.includes(` ${key} `)) found.push(entry);
  }
  return found;
}

function toolReply(
  matches: Array<{ tool: string; discipline: string; group: string[] }>,
): string {
  if (matches.length === 1) {
    const { tool, discipline, group } = matches[0];
    const usage = toolUsage.get(
      [...skillToolIndex].find(([, v]) => v.tool === tool)?.[0] ?? "",
    );
    return [
      `${tool} sits in his ${discipline} discipline: ${group.join(" · ")}.`,
      usage?.length ? `He has shipped it in: ${usage.join(", ")}.` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }
  return [
    matches.map((m) => `• ${m.tool} — ${m.discipline} discipline`).join("\n"),
    `All from his published stack (${stackFact.tools} tools across ${stackFact.disciplines} disciplines) — name one for details.`,
  ].join("\n\n");
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "Does he know X?" where X isn't in the stack → an honest miss. */
function notInStackReply(candidate: string): string {
  return `${cap(candidate)} isn't in his published stack — the site lists ${stackFact.tools} tools across ${stackFact.disciplines} disciplines, and that one isn't among them. Ask “What's his tech stack?” for the full list.`;
}

/**
 * Follow-up resolution. The engine is stateless but deterministic, so the
 * previous turn's chunk is recovered by re-running retrieval on it; a
 * short resource question ("what stack does it use?", "link?") is then
 * answered from that chunk's matching block instead of a generic dump.
 */
const FOLLOWUP_RESOURCE =
  /\b(stack|tools?|tech|technolog(?:y|ies)|features?|built with|made with|url|link|live|website|metrics?|numbers?|details?)\b/i;
const SPECIFIC_TOPICS = new Set<KnowledgeChunk["topic"]>([
  "project",
  "posting",
  "phase",
  "stack-group",
  "person",
]);

function composeFollowUp(prevChunk: KnowledgeChunk, raw: string): string | null {
  if (!FOLLOWUP_RESOURCE.test(raw) || !SPECIFIC_TOPICS.has(prevChunk.topic))
    return null;
  const blocks = prevChunk.body.split("\n\n");
  const want = raw.toLowerCase();
  const pick = (prefix: string) =>
    blocks.find((b) => b.toLowerCase().startsWith(prefix));
  const extract =
    pick("stack:") ??
    pick("features:") ??
    pick("shown on the site:") ??
    (/\b(url|link|live|website)\b/.test(want)
      ? blocks.find((b) => /^live at\b/i.test(b) || /https?:\/\//.test(b))
      : undefined) ??
    (/\b(metrics?|numbers?)\b/.test(want)
      ? blocks.find((b) => /•/.test(b))
      : undefined);
  if (!extract) return null;
  return `${prevChunk.title}\n\n${extract}`;
}

/* ------------------------------------------------------------------ */
/* Fixed replies                                                       */
/* ------------------------------------------------------------------ */

const GREETING = `Hi! Ask me about ${person.name.split(" ")[0]}'s work — his projects, stack, experience, or how to reach him.`;
const THANKS = "You're welcome! Anything else about his work, stack or projects?";
const BOT_IDENTITY = `I'm this site's portfolio assistant — a small retrieval bot answering from the content published right here on eirelejovenboter.com: Eirele's projects, stack, experience and contact options. No external AI service behind it. Ask me about any of that.`;
const FALLBACK = `I only know Eirele's world — his projects, stack, experience, this site and how to reach him — so I can't answer that one. Try one of those instead, e.g. “What has Eirele built?” or “How do I contact him?”`;

/** Below this the reply gets the "closest thing I know" framing. */
const CONFIDENT = 9;
/** Below this the bot honestly declines. */
const FLOOR = 3;
/** A short reference query ("what about its stack?") tries follow-up logic. */
const SHORT_QUERY_TOKENS = 5;

function compose(chunk: KnowledgeChunk, score: number): string {
  const followUp = chunk.followUp ? `\n\n${chunk.followUp}` : "";
  if (score < CONFIDENT)
    return `Not sure I follow exactly — the closest thing I know about that:\n\n${chunk.body}${followUp}`;
  return `${chunk.body}${followUp}`;
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

export function answerFromMessages(messages: ChatTurn[]): string {
  const last = messages[messages.length - 1];
  const raw = last.content.trim();
  const lower = raw.toLowerCase();

  if (/^(hi+|hello+|hey+|yo|sup|howdy|good\s*(morning|afternoon|evening)|kumusta|musta)[\s!.,?]*$/i.test(lower))
    return GREETING;
  if (/\b(thanks|thank you|thankyou|salamat|appreciate it|much appreciated)\b/i.test(lower))
    return THANKS;
  if (
    /(what|who)\s*(are|r)\s*(you|u)\b|are you (a\s*)?(bot|ai|robot|human|llm|gpt|chatgpt)|\bchatgpt\b|\bopenai\b|\bclaude\b|\bgemini\b|how (do|does) (you|this|it) work/i.test(
      lower,
    )
  )
    return BOT_IDENTITY;

  const tokens = tokenize(raw);
  const topics = intentTopics(raw);
  const normed = normSpace(raw);
  // Tool lookup beats generic retrieval — it always gives the sharper answer.
  const tools = findTools(raw);
  if (tools.length) return toolReply(tools);

  // "Does he know X?" with a plausible-but-absent tool → honest miss.
  if (TOOL_QUESTION.test(lower) || (TOOL_CONTEXT.test(lower) && /\b(know|uses?|familiar|experienced|proficient)\b/i.test(lower))) {
    const candidates = tokens.filter(
      (t) =>
        t.length >= 3 &&
        !QUESTION_VERBS.has(t) &&
        !skillToolIndex.has(t.replace(/\./g, "")) &&
        !skillToolIndex.has(normSpace(t).trim()),
    );
    const candidate = candidates[candidates.length - 1];
    if (
      candidate &&
      (TECH_HINTS.has(candidate) ||
        TECH_HINTS.has(candidate.replace(/\./g, "")) ||
        TOOL_CONTEXT.test(lower))
    )
      return notInStackReply(candidate);
  }

  // Discipline drill-down — a discipline label in the question ("what's in
  // his IoT toolkit?") goes straight to that stack group; a same-named
  // keyword elsewhere must not drag the generic 74-tool dump in instead.
  const DRILL_LABELS: Record<string, string> = {
    frontend: "stack-frontend",
    backend: "stack-backend",
    mobile: "stack-mobile",
    iot: "stack-iot",
    hardware: "stack-iot",
    devops: "stack-devops",
    cloud: "stack-devops",
    cms: "stack-cms",
    ai: "stack-ai",
  };
  const drillId = tokens.map((t) => DRILL_LABELS[t]).find(Boolean);
  if (drillId && (topics.has("stack") || topics.size === 0)) {
    const chunk = knowledgeChunks.find((c) => c.id === drillId);
    if (chunk) return compose(chunk, CONFIDENT);
  }

  const query = weightedTokens(tokens, 1);
  let bonus = bonusFor(topics);
  let top = retrieve(query, bonus, lower)[0];

  // Follow-up: recover the previous turn's chunk and try its blocks first.
  const prevUser = [...messages]
    .slice(0, -1)
    .reverse()
    .find((m) => m.role === "user");
  if (prevUser && tokens.length <= SHORT_QUERY_TOKENS) {
    const prevTokens = tokenize(prevUser.content);
    const prevTopics = intentTopics(prevUser.content);
    const prevTop = retrieve(weightedTokens(prevTokens, 1), bonusFor(prevTopics), prevUser.content.toLowerCase())[0];
    if (prevTop && prevTop.score >= CONFIDENT) {
      const extracted = composeFollowUp(prevTop.ic.chunk, raw);
      if (extracted) return extracted;
      // Merged retry — short references ("and the one before it?") lean on
      // the previous question's terms at lower weight.
      if (top.score < CONFIDENT) {
        const mergedTopics = new Set([...topics, ...prevTopics]);
        bonus = bonusFor(mergedTopics);
        const merged = [...query, ...weightedTokens(prevTokens, 0.7)];
        const mergedTop = retrieve(merged, bonus, `${prevUser.content.toLowerCase()} ${lower}`)[0];
        if (mergedTop.score > top.score) top = mergedTop;
      }
    }
  }

  if (top.score < FLOOR) return FALLBACK;
  return compose(top.ic.chunk, top.score);
}
