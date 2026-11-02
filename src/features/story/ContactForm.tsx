"use client";

/**
 * The PHASE 11 message form [CONTACT-01], visitor-first re-flow [CONTACT-02].
 *
 * Design: the section's ledger language carried into a panel — numbered
 * mono fields, one amber action. Field order follows the visitor's brain,
 * not the database: 01 Reason (one tap) → 02 Message (the point, with a
 * live char counter and a placeholder that changes with the chosen
 * reason) → 03/04 Name + Email (identity last — cheap autofill, and the
 * reply needs it). States: idle → sending → sent, plus an inline error
 * line that always offers the direct email as the fallback route. The
 * header states the channel contract: same inbox as the email. A hidden
 * honeypot field ("company") silently absorbs bots; POST /api/contact
 * does the real validation, rate limiting and Resend delivery (wiring:
 * docs/CONTACT-SETUP.md).
 *
 * No GSAP here on purpose: this lives in the un-pinned closing section and
 * form feedback must be instant, calm and reduced-motion safe (CSS only).
 */

import { useRef, useState } from "react";
import { person } from "@/content/facts";
import { track } from "@/lib/analytics";

const REASONS = [
  { value: "work", label: "Work together" },
  { value: "hire", label: "Full-time role" },
  { value: "hello", label: "Just saying hi" },
] as const;

type Reason = (typeof REASONS)[number]["value"];
type Status = "idle" | "sending" | "sent" | "error";
type FieldErrors = { name?: string; email?: string; message?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LIMITS = { name: 120, email: 200, message: 5000 };
const COUNTER_WARN = LIMITS.message - 500; // last 500 chars read as "almost full"

/** The writing prompt follows the reason — concrete beats generic. */
const PLACEHOLDER: Record<Reason, string> = {
  work: "The project — what it must do, and by when…",
  hire: "The role — team, product, start date…",
  hello: "What's on your mind?",
};

const FIELD_ERR: Record<keyof Omit<FieldErrors, never>, string> = {
  name: "Tell me who's sending — a first name is enough.",
  email: "That email doesn't look deliverable — check for a typo.",
  message: "The message is empty — one sentence is enough.",
};

const LABEL = "label-mono text-mute";
const FIELD =
  "w-full rounded-lg border border-line bg-transparent px-4 py-3 text-[1rem] sm:text-[0.95rem] text-ink placeholder:text-mute/60 focus:border-amber focus:outline-none transition-colors";
const FIELD_ERR_TEXT = "mt-2 label-mono text-err";

export function ContactForm() {
  const [values, setValues] = useState({
    name: "",
    email: "",
    message: "",
    company: "", // honeypot — humans never see or fill this
  });
  const [reason, setReason] = useState<Reason>("work");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const set = (key: keyof typeof values) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    // Clear the field's own error as soon as the visitor edits it again.
    if (key !== "company") setErrors((e) => ({ ...e, [key]: undefined }));
  };

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    const name = values.name.trim();
    const email = values.email.trim();
    const message = values.message.trim();
    if (name.length < 2 || name.length > LIMITS.name) next.name = FIELD_ERR.name;
    if (!EMAIL_RE.test(email) || email.length > LIMITS.email) next.email = FIELD_ERR.email;
    if (message.length < 2 || message.length > LIMITS.message) next.message = FIELD_ERR.message;
    return next;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;

    const next = validate();
    setErrors(next);
    // Focus the first error in the visual order: 02 message, 03 name, 04 email.
    if (next.message || next.name || next.email) {
      (next.message ? messageRef : next.name ? nameRef : emailRef).current?.focus();
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          reason,
          message: values.message.trim(),
          company: values.company,
        }),
      });
      if (res.ok) {
        setStatus("sent");
        track("contact_form_sent", { reason });
        return;
      }
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setErrorMsg(
        data?.error ??
          "The message didn't go through. The direct email always works:",
      );
      setStatus("error");
      track("contact_form_error", { phase: `http-${res.status}` });
    } catch {
      setErrorMsg("The network ate the message. The direct email always works:");
      setStatus("error");
      track("contact_form_error", { phase: "network" });
    }
  }

  function resetForm() {
    setValues({ name: "", email: "", message: "", company: "" });
    setErrors({});
    setErrorMsg("");
    setStatus("idle");
    setReason("work");
  }

  const firstName = values.name.trim().split(/\s+/)[0] || "there";

  return (
    <div className="relative rounded-2xl border border-line bg-ink/[0.02] p-6 sm:p-8">
      <div className="mb-7 flex items-center justify-between gap-4">
        <p className="label-mono text-mute">Send a message</p>
        <p className="label-mono hidden text-mute sm:block">
          → same inbox as the email
        </p>
      </div>

      {/* One persistent live region for every state change — it sits above
          the panel switch so "sent" is announceable too. */}
      <p role="status" aria-live="polite" className="sr-only">
        {status === "sending"
          ? "Sending the message…"
          : status === "sent"
            ? "Message sent — it landed in Eirele's inbox."
            : status === "error"
              ? errorMsg
              : ""}
      </p>

      {status === "sent" ? (
        <div className="flex min-h-[380px] flex-col items-start justify-center">
          <p className="label-mono flex items-center gap-2.5 text-ok">
            <span className="inline-block h-2 w-2 rounded-full bg-ok" aria-hidden="true" />
            Message sent
          </p>
          <p className="body-copy mt-4 text-ink">
            Thanks, {firstName} — it landed in my inbox. I&rsquo;ll write back
            to {values.email.trim()}.
          </p>
          <p className="label-mono mt-3 text-mute">
            Same inbox as {person.email} — nothing gets lost.
          </p>
          <button
            type="button"
            onClick={resetForm}
            className="label-mono mt-8 inline-flex min-h-[44px] items-center rounded-full border border-line px-6 text-ink transition-colors hover:border-amber motion-reduce:transition-none"
          >
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate aria-label="Message form">
          {/* Honeypot [CONTACT-01]: off-screen, unfocusable. Bots fill it,
              humans can't — the API returns fake success for filled pots. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-[9999px] top-0 h-px w-px overflow-hidden"
          >
            <label htmlFor="contact-company">Leave this field empty</label>
            <input
              id="contact-company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={values.company}
              onChange={(e) => set("company")(e.target.value)}
            />
          </div>

          <div className="space-y-6">
            {/* 01 — the one-tap start: pick what this is about. */}
            <fieldset>
              <legend className={LABEL}>01 / Reason</legend>
              <div className="mt-2.5 flex flex-wrap gap-2.5">
                {REASONS.map((r) => (
                  <label key={r.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      className="sr-only"
                    />
                    <span
                      className={`label-mono inline-flex min-h-[44px] items-center rounded-full border px-4 transition-colors motion-reduce:transition-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)] ${
                        reason === r.value
                          ? "border-amber bg-amber/10 text-ink"
                          : "border-line text-mute hover:border-amber/60 hover:text-ink"
                      }`}
                    >
                      {r.label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* 02 — the point of the message, with a prompt that follows the
                reason and a live counter (warns in the last 500 chars). */}
            <div>
              <div className="mb-2.5 flex items-baseline justify-between gap-4">
                <label htmlFor="contact-message" className={LABEL}>
                  02 / Message
                </label>
                <p
                  className={`label-mono ${
                    values.message.length > COUNTER_WARN ? "text-err" : "text-mute"
                  }`}
                >
                  {values.message.length} / {LIMITS.message}
                </p>
              </div>
              <textarea
                ref={messageRef}
                id="contact-message"
                rows={5}
                placeholder={PLACEHOLDER[reason]}
                maxLength={LIMITS.message}
                value={values.message}
                onChange={(e) => set("message")(e.target.value)}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "contact-message-error" : undefined}
                className={`${FIELD} min-h-[140px] resize-y`}
              />
              {errors.message && (
                <p id="contact-message-error" className={FIELD_ERR_TEXT}>
                  {errors.message}
                </p>
              )}
            </div>

            {/* 03/04 — identity last: autofill makes it cheap, and the reply
                needs it. "First name is enough" lowers the bar on purpose. */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className={`${LABEL} mb-2.5 block`}>
                  03 / Name
                </label>
                <input
                  ref={nameRef}
                  id="contact-name"
                  type="text"
                  autoComplete="name"
                  placeholder="First name is enough"
                  maxLength={LIMITS.name}
                  value={values.name}
                  onChange={(e) => set("name")(e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "contact-name-error" : undefined}
                  className={FIELD}
                />
                {errors.name && (
                  <p id="contact-name-error" className={FIELD_ERR_TEXT}>
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="contact-email" className={`${LABEL} mb-2.5 block`}>
                  04 / Email
                </label>
                <input
                  ref={emailRef}
                  id="contact-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  maxLength={LIMITS.email}
                  value={values.email}
                  onChange={(e) => set("email")(e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "contact-email-error" : undefined}
                  className={FIELD}
                />
                {errors.email && (
                  <p id="contact-email-error" className={FIELD_ERR_TEXT}>
                    {errors.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {status === "error" && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-err/40 bg-err/[0.06] px-4 py-3"
            >
              <p className="text-[0.85rem] leading-relaxed text-err">{errorMsg}</p>
              <a
                href={`mailto:${person.email}`}
                className="label-mono mt-2 inline-flex min-h-[32px] items-center text-err underline decoration-err/50 underline-offset-4 hover:decoration-err"
              >
                {person.email} ↗
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={status === "sending"}
            className="mt-7 inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-amber px-7 font-mono text-[0.85rem] font-medium uppercase tracking-[0.04em] text-amber-ink transition-opacity disabled:opacity-60"
          >
            {status === "sending" ? (
              <>
                Sending
                <span aria-hidden="true" className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-ink motion-reduce:animate-none"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </span>
              </>
            ) : (
              "Send the message ↗"
            )}
          </button>
          <p className="label-mono mt-4 text-center text-mute">
            Straight to {person.email} — no lists, no newsletter.
          </p>
        </form>
      )}
    </div>
  );
}
