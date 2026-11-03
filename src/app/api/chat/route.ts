/**
 * /api/chat — backend for the portfolio chatbot [BOT-01][BOT-03].
 *
 * POST { messages: [{ role: "user" | "assistant", content }, ...] }
 *   → 200 { reply: string }
 *
 * [BOT-03] RAG-only brain: replies are composed LOCALLY by lib/ai/rag.ts
 * from the site's own content modules (lib/ai/knowledge.ts) — retrieval
 * over pre-written fact chunks. No LLM, no API key, no network egress,
 * no env vars: the widget works identically in the sandbox and on any
 * deployment, and there is nothing left that can 401/429/time out. This
 * replaced the [BOT-02] provider wiring (AI_API_KEY → OpenAI-compatible
 * fetch → sandbox SDK fallback) by owner decision — "use only RAG
 * chatbot in AI Chatbot, do not use any AI provider … I do not have API
 * key access".
 *
 * Stateless: the client sends the trimmed conversation each time —
 * nothing is persisted. History is used only to resolve short follow-up
 * questions deterministically (see rag.ts). GET is a wiring self-check.
 */

import { NextResponse } from "next/server";
import { knowledgeChunks } from "@/lib/ai/knowledge";
import { answerFromMessages, type ChatTurn } from "@/lib/ai/rag";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGES = 24;
const MAX_CHARS = 2000;

/* --- Minimal in-memory rate limit: 60 req / 5 min / IP (best effort —
       Caddy rewrites X-Forwarded-For to the gateway's IP, so preview
       visitors share one bucket; keep the ceiling generous. A real
       limiter belongs to the edge/proxy in production). --- */
const WINDOW_MS = 5 * 60_000;
const WINDOW_MAX = 60;
const hits = new Map<string, { count: number; reset: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset <= now) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    if (hits.size > 500) {
      // Keep the map bounded; drop expired entries.
      for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
    }
    return false;
  }
  entry.count += 1;
  return entry.count > WINDOW_MAX;
}

/** Strict, dependency-free validation of the client payload. */
function parseMessages(input: unknown): ChatTurn[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_MESSAGES) {
    return null;
  }
  const turns: ChatTurn[] = [];
  for (const item of input) {
    if (typeof item !== "object" || item === null) return null;
    const { role, content } = item as { role?: unknown; content?: unknown };
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string" || content.trim().length === 0) return null;
    if (content.length > MAX_CHARS) return null;
    turns.push({ role, content: content.trim() });
  }
  if (turns[turns.length - 1]?.role !== "user") return null; // must end with a question
  return turns;
}

const UNAVAILABLE =
  "The assistant is unavailable right now. Please try again in a moment.";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const messages = parseMessages((body as { messages?: unknown } | null)?.messages);
  if (!messages) {
    return NextResponse.json(
      { error: "Expected { messages: [...] } ending with a user message (max 24 turns, 2000 chars each)." },
      { status: 400 },
    );
  }

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many questions — take a short break and try again.", detail: "rate-limited" },
      { status: 429 },
    );
  }

  try {
    return NextResponse.json({ reply: answerFromMessages(messages) });
  } catch (err) {
    // The engine is pure, synchronous and covered by probes below — this
    // path should be unreachable; keep a safe reply for it regardless.
    console.error("[api/chat] rag engine failed:", err);
    return NextResponse.json({ error: UNAVAILABLE, detail: "rag-error" }, { status: 500 });
  }
}

/** [BOT-03] Wiring self-check — open /api/chat in a browser or curl it.
 * The brain is local content, so it is ALWAYS configured; the response
 * states the provider and the knowledge-base size. Sends nothing. */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      configured: true,
      provider: "local-rag",
      model: "portfolio-content",
      knowledgeChunks: knowledgeChunks.length,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
