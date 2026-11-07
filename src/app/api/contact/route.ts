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
 *
 * [CONTACT-04] The env vars are typed by hand and Resend validates the
 * address shapes strictly — only `addr` or `Name <addr>` pass; anything
 * else is a 422 validation_error that rejects the WHOLE payload. A
 * half-copied "Name <addr>" template leaves exactly that kind of stray
 * bracket behind (live case: CONTACT_FROM="contact@eirelejovenboter.com>"
 * 502'd every production submission while the self-check showed the
 * culprit in plain sight). The route now repairs the unambiguous bracket
 * typos before sending (and logs the repair), the 422 hint names this
 * cause, and the self-check returns a `warnings` array naming the
 * malformed var and the exact fix — misconfiguration is now visible
 * without a failed test send.
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

/* --- [CONTACT-04] Env-var address hygiene. Resend accepts exactly two
       shapes for from/to — `name@domain.com` and `Name <name@domain.com>`
       — and 422s the whole payload on anything else. These helpers
       repair the unambiguous typos and let the self-check flag the rest. --- */
const ADDR_SRC = "[^\\s<>@]+@[^\\s<>@]+\\.[A-Za-z]{2,}";
/** `Name <addr>` — complete, or missing the closing `>`. Empty name
 * means the value was just the address wrapped in brackets. */
const RE_NAMED = new RegExp(`^([^<>]*?)\\s*<\\s*(${ADDR_SRC})\\s*>?\\s*$`);
/** Bare address with at most stray brackets around it. */
const RE_BARE = new RegExp(`^<?\\s*(${ADDR_SRC})\\s*>?$`);
/** The two shapes Resend accepts, for self-check warnings. */
const RE_VALID = new RegExp(`^([^<>]+\\s*<${ADDR_SRC}>|${ADDR_SRC})$`);

function repairAddressFormat(raw: string): { value: string; repaired: boolean } {
  const value = raw.trim();
  const named = value.match(RE_NAMED);
  if (named) {
    const name = named[1].trim();
    const fixed = name ? `${name} <${named[2]}>` : named[2];
    return { value: fixed, repaired: fixed !== value };
  }
  const bare = value.match(RE_BARE);
  if (bare) return { value: bare[1], repaired: bare[1] !== value };
  // Genuinely ambiguous (two addresses, stray text, nested brackets) —
  // leave it; Resend's 422 + the self-check warning name the fix.
  return { value, repaired: false };
}

/** One self-check warning per malformed env var. The sender value is
 * public by design and shown raw; the inbox value is masked. */
function addressWarning(kind: "CONTACT_FROM" | "CONTACT_TO", raw: string, fixed: string, repaired: boolean): string | null {
  const shown = kind === "CONTACT_FROM" ? raw : maskAddr(raw);
  if (!RE_VALID.test(fixed))
    return (
      `${kind} is not a valid email identity ("${shown}") — Resend accepts ` +
      "exactly name@domain.com or Name <name@domain.com> and rejects the " +
      "whole payload otherwise (422, ref: resend-rejected). Fix the env " +
      "var in Vercel → Settings → Environment Variables, then redeploy."
    );
  if (repaired)
    return (
      `${kind} was set to "${shown}" — a stray angle bracket, repaired ` +
      (kind === "CONTACT_FROM" ? `to "${fixed}"` : `to ${maskAddr(fixed)}`) +
      " automatically. Resend would have rejected every submission (422, " +
      "ref: resend-rejected). Fix the env var in Vercel → Settings → " +
      "Environment Variables and redeploy to make it official."
    );
  return null;
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
        "Resend refused the delivery (403) — domain-level: either the " +
        "sandbox sender (onboarding@resend.dev may only deliver to the " +
        "Resend account's own address) or eirelejovenboter.com is not " +
        "verified in Resend yet. Verify the domain (dashboard.resend.com " +
        "→ Domains → the DNS records go into Cloudflare — " +
        "docs/CONTACT-SETUP.md step 5), or for testing set CONTACT_TO to " +
        "the Resend account's own address. The Vercel function log has " +
        "the exact Resend message.",
    };
  if (status === 422)
    return {
      detail: "resend-rejected",
      hint:
        "Resend rejected the payload (422) — most often a malformed " +
        "CONTACT_FROM / CONTACT_TO env var: one stray < or > from a " +
        "half-copied Name <addr> template is enough (GET /api/contact " +
        "prints a warning when the shape is wrong). The Vercel function " +
        "log names the exact field.",
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

  // [CONTACT-04] The env vars are hand-typed; repair unambiguous bracket
  // typos before Resend sees them (it 422s the whole payload otherwise)
  // and log loudly — the self-check also warns, but this is the moment
  // the owner is looking at the function log.
  const fromRaw = process.env.CONTACT_FROM || "Portfolio <onboarding@resend.dev>";
  const fromFix = repairAddressFormat(fromRaw);
  if (fromFix.repaired)
    console.error(
      `[api/contact] CONTACT_FROM was malformed ("${fromRaw}") and was ` +
        `repaired to "${fromFix.value}" — fix the env var in Vercel → ` +
        "Settings → Environment Variables and redeploy (the value is " +
        "public by design; GET /api/contact warns as well).",
    );
  const toRaw = process.env.CONTACT_TO || person.email;
  const toFix = repairAddressFormat(toRaw);
  if (toFix.repaired)
    console.error(
      `[api/contact] CONTACT_TO was malformed ("${maskAddr(toRaw)}") and ` +
        `was repaired to ${maskAddr(toFix.value)} — fix the env var in ` +
        "Vercel → Settings → Environment Variables and redeploy.",
    );
  const from = fromFix.value;
  const to = toFix.value;
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
 * rate limit. `from` is shown as the effective value: it is designed to
 * be public. [CONTACT-04] `from`/`to` show the values the route would
 * actually send with (stray-bracket typos repaired) and `warnings` names
 * every malformed env var with the exact fix — so a misconfiguration is
 * readable without a failed test send (the live case sat in plain sight
 * here until the owner pasted the output). */
export function GET() {
  const apiKey = Boolean(process.env.RESEND_API_KEY);

  const fromRaw = process.env.CONTACT_FROM || "Portfolio <onboarding@resend.dev>";
  const fromFix = repairAddressFormat(fromRaw);
  const from = `${fromFix.value}${process.env.CONTACT_FROM ? "" : " (default — sandbox sender)"}`;

  const toRaw = process.env.CONTACT_TO || person.email;
  const toFix = repairAddressFormat(toRaw);
  const to = `${maskAddr(toFix.value)}${process.env.CONTACT_TO ? "" : " (default — facts.ts)"}`;

  const warnings: string[] = [];
  const fromWarning = addressWarning("CONTACT_FROM", fromRaw, fromFix.value, fromFix.repaired);
  if (fromWarning) warnings.push(fromWarning);
  const toWarning = addressWarning("CONTACT_TO", toRaw, toFix.value, toFix.repaired);
  if (toWarning) warnings.push(toWarning);

  return NextResponse.json(
    { ok: true, configured: apiKey, from, to, warnings },
    { headers: { "Cache-Control": "no-store" } },
  );
}
