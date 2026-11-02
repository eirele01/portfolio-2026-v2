/**
 * /api/chat — backend for the portfolio chatbot [BOT-01].
 *
 * POST { messages: [{ role: "user" | "assistant", content }, ...] }
 *   → 200 { reply: string }
 *
 * z-ai-web-dev-sdk is server-only (never imported from the client). The
 * system prompt is compiled from the site's own content modules
 * (see lib/ai/knowledge.ts) so the bot is grounded in the same FACTS the
 * site publishes. History is stateless: the client sends the trimmed
 * conversation each time — nothing is persisted, no personal data stored.
 */

import { NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { buildSystemPrompt } from "@/lib/ai/knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGES = 24;
const MAX_CHARS = 2000;
const TIMEOUT_MS = 30_000;

type ChatTurn = { role: "user" | "assistant"; content: string };

/* --- ZAI singleton: one client for the process, reused per request --- */
let zaiPromise: Promise<Awaited<ReturnType<typeof ZAI.create>>> | null = null;
function getZAI() {
  zaiPromise ??= ZAI.create();
  return zaiPromise;
}

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
      { error: "Too many questions — take a short break and try again." },
      { status: 429 },
    );
  }

  try {
    const zai = await getZAI();
    const completion = (await Promise.race([
      zai.chat.completions.create({
        messages: [
          { role: "system", content: buildSystemPrompt() },
          ...messages,
        ],
        thinking: { type: "disabled" },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS),
      ),
    ])) as { choices?: Array<{ message?: { content?: string } }> };

    const reply = completion?.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("empty completion");

    return NextResponse.json({ reply });
  } catch (err) {
    const timedOut = err instanceof Error && err.message === "timeout";
    console.error("[api/chat]", timedOut ? "timeout" : err);
    return NextResponse.json(
      {
        error: timedOut
          ? "The assistant took too long to answer. Please try again."
          : "The assistant is unavailable right now. Please try again in a moment.",
      },
      { status: timedOut ? 504 : 500 },
    );
  }
}
