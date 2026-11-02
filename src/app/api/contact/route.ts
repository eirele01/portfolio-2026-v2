/**
 * /api/contact — backend for the PHASE 11 message form [CONTACT-01].
 *
 * POST { name, email, reason: "work" | "hire" | "hello", message, company }
 *   → 200 { ok: true }
 *
 * Delivery is the Resend REST API over plain fetch — no SDK dependency,
 * same dependency-free validation style as /api/chat. Nothing is stored:
 * validate → rate-limit → one POST to Resend. The "company" field is the
 * form's honeypot: filled ⇒ the request is a bot, answered with a real
 * 200 so it learns nothing.
 *
 * Env (wiring walkthrough: docs/CONTACT-SETUP.md):
 *   RESEND_API_KEY  required — dashboard.resend.com → API Keys
 *   CONTACT_TO      optional — inbox that receives submissions
 *                   (defaults to the address in src/content/facts.ts)
 *   CONTACT_FROM    optional — verified sender identity; defaults to
 *                   Resend's sandbox sender (onboarding@resend.dev),
 *                   which can only deliver to the Resend account's own
 *                   address until eirelejovenboter.com is verified
 *
 * [CONTACT-03] Debuggability: a 502 used to be a dead end — the exact
 * Resend rejection was only in the Vercel function log. Now every
 * failure path carries a safe `detail` code (no secrets, no addresses)
 * plus an owner-facing `hint`; the form prints "ref: <detail>" under the
 * error line, so the cause is readable straight from the browser. GET
 * /api/contact is a wiring self-check: { configured, from, to } with the
 * private inbox masked — it never sends anything and leaks nothing.
 */

import { NextResponse } from "next/server";
import { person } from "@/content/facts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 10 * 60_000;
const WINDOW_MAX = 5; // 5 messages / 10 min / IP — every hit is a real email
const TIMEOUT_MS = 12_000;

const LIMITS = { name: 120, email: 200, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REASONS: Record<string, string> = {
  work: "Work together",
  hire: "Full-time role",
  hello: "Just saying hi",
};

type Submission = {
  name: string;
  email: string;
  reason: string;
  message: string;
};
type FieldErrors = Partial<Record<"name" | "email" | "reason" | "message", string>>;
type ParseResult = { ok: true; submission: Submission } | { ok: false; fields: FieldErrors } | null;

/* --- Best-effort in-memory rate limit (same caveat as /api/chat: per
       serverless instance; the real ceiling belongs to the edge). --- */
const hits = new Map<string, { count: number; reset: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset <= now) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    if (hits.size > 500) {
      for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
    }
    return false;
  }
  entry.count += 1;
  return entry.count > WINDOW_MAX;
}

/** Dependency-free validation of the client payload. */
function parseSubmission(input: unknown): ParseResult {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Record<string, unknown>;

  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const email = typeof raw.email === "string" ? raw.email.trim() : "";
  const reason = typeof raw.reason === "string" && REASONS[raw.reason] ? raw.reason : "";
  const message = typeof raw.message === "string" ? raw.message.trim() : "";

  const fields: FieldErrors = {};
  if (name.length < 2 || name.length > LIMITS.name) fields.name = "Name is missing or too long.";
  if (!EMAIL_RE.test(email) || email.length > LIMITS.email) fields.email = "Email is not deliverable.";
  if (!reason) fields.reason = "Reason must be work, hire or hello.";
  if (message.length < 2 || message.length > LIMITS.message)
    fields.message = "Message is empty or too long.";
  if (Object.keys(fields).length > 0) return { ok: false, fields };

  return { ok: true, submission: { name, email, reason, message } };
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  );

/** Strip header-control characters so a crafted name can't forge the subject. */
const headerSafe = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

/** Mask a private inbox for the GET self-check: local part to one char.
 * The sender identity is NOT masked — it is designed to be public. */
function maskAddr(addr: string): string {
  const at = addr.indexOf("@");
  if (at <= 0) return "***";
  return `${addr[0]}***@${addr.slice(at + 1)}`;
}

/** Map a Resend error status to a safe ref code + owner-facing hint.
 * The code is what the form prints; the hint names the fix. Neither
 * carries the Resend response body (it can quote the account address) —
 * that stays in the Vercel function log, which this route already writes. */
function resendFailure(status: number): { detail: string; hint: string } {
  if (status === 401)
    return {
      detail: "resend-auth",
      hint:
        "Resend rejected the API key (401). On Vercel, re-set RESEND_API_KEY " +
        "from dashboard.resend.com → API Keys (full access, copied whole — " +
        "no stray spaces), then redeploy.",
    };
  if (status === 403)
    return {
      detail: "resend-forbidden",
      hint:
        "Resend refused the delivery (403) — almost always the sandbox " +
        "sender: until eirelejovenboter.com is verified in Resend, " +
        "onboarding@resend.dev may only deliver to the Resend account's own " +
        "address. For testing set CONTACT_TO to that address, or finish " +
        "domain verification and set CONTACT_FROM (docs/CONTACT-SETUP.md " +
        "steps 3/5). The Vercel function log has the exact Resend message.",
    };
  if (status === 422)
    return {
      detail: "resend-rejected",
      hint:
        "Resend rejected the payload (422) — the Vercel function log has " +
        "the exact field it complained about.",
    };
  if (status === 429)
    return {
      detail: "resend-quota",
      hint:
        "Resend quota/rate limit (429) — free tier is 100 emails/day, " +
        "3,000/month. Wait, or upgrade in the Resend dashboard.",
    };
  if (status >= 500)
    return {
      detail: "resend-unavailable",
      hint:
        `Resend itself errored (${status}) — retry shortly; check ` +
        "status.resend.com.",
    };
  return {
    detail: `resend-${status}`,
    hint: `Resend returned ${status} — the Vercel function log has the full response.`,
  };
}

const DELIVERY_ERROR = "The message couldn't be delivered. The direct email always works:";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseSubmission(body);
  if (parsed === null) {
    return NextResponse.json(
      { error: "Expected { name, email, reason, message, company }." },
      { status: 400 },
    );
  }
  if (!parsed.ok) {
    return NextResponse.json(
      { error: "Some fields didn't pass validation.", fields: parsed.fields },
      { status: 400 },
    );
  }
  const { name, email, reason, message } = parsed.submission;

  // Honeypot: pretend success before anything else runs.
  const company =
    typeof (body as Record<string, unknown>).company === "string"
      ? ((body as Record<string, unknown>).company as string).trim()
      : "";
  if (company.length > 0) {
    return NextResponse.json({ ok: true });
  }

  if (rateLimited(ip)) {
    return NextResponse.json(
      {
        error: "Too many messages from this connection — try again in a little while.",
        detail: "rate-limited",
      },
      { status: 429 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(
      "[api/contact] RESEND_API_KEY is not set — the form cannot deliver. See docs/CONTACT-SETUP.md.",
    );
    return NextResponse.json(
      {
        error:
          "The form isn't connected to a mailbox yet. The direct email always works:",
        detail: "not-configured",
        hint:
          "RESEND_API_KEY is not set on this deployment — add it in Vercel " +
          "→ Settings → Environment Variables, then redeploy " +
          "(docs/CONTACT-SETUP.md step 3).",
      },
      { status: 503 },
    );
  }

  const from = process.env.CONTACT_FROM || "Portfolio <onboarding@resend.dev>";
  const to = process.env.CONTACT_TO || person.email;
  const reasonLabel = REASONS[reason];
  const subject = `Portfolio message — ${reasonLabel} — ${headerSafe(name)}`;

  const html = `<div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;line-height:1.6;color:#111111">
<p style="margin:0 0 4px"><strong>From:</strong> ${esc(name)} &lt;${esc(email)}&gt;</p>
<p style="margin:0 0 16px"><strong>Reason:</strong> ${esc(reasonLabel)}</p>
<hr style="border:none;border-top:1px solid #dddddd;margin:0 0 16px" />
<div style="white-space:pre-wrap">${esc(message)}</div>
</div>`;
  const text = `From: ${name} <${email}>\nReason: ${reasonLabel}\n\n${message}`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject,
        html,
        text,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[api/contact] Resend ${res.status}: ${body.slice(0, 400)}`);
      const { detail, hint } = resendFailure(res.status);
      return NextResponse.json({ error: DELIVERY_ERROR, detail, hint }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/contact] delivery failed:", err);
    return NextResponse.json(
      {
        error: DELIVERY_ERROR,
        detail: "network",
        hint:
          "The server could not reach api.resend.com (network error or the " +
          "12 s timeout fired) — check the Vercel function log.",
      },
      { status: 502 },
    );
  }
}

/** [CONTACT-03] Wiring self-check — open /api/contact in a browser or
 * curl it. States whether the key is set and where submissions would go,
 * with the private inbox masked. Sends nothing, stores nothing, needs no
 * rate limit. `from` is shown as-is: it is designed to be public. */
export function GET() {
  const apiKey = Boolean(process.env.RESEND_API_KEY);
  const contactTo = process.env.CONTACT_TO || person.email;
  const to = `${maskAddr(contactTo)}${process.env.CONTACT_TO ? "" : " (default — facts.ts)"}`;
  const from = `${
    process.env.CONTACT_FROM || "Portfolio <onboarding@resend.dev>"
  }${process.env.CONTACT_FROM ? "" : " (default — sandbox sender)"}`;

  return NextResponse.json(
    { ok: true, configured: apiKey, from, to },
    { headers: { "Cache-Control": "no-store" } },
  );
}
