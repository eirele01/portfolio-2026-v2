"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { track } from "@/lib/analytics";
import { person } from "@/content/facts";

/**
 * Chat assistant [BOT-01] — a floating "ask about Eirele" widget backed by
 * /api/chat (server-side only; see that route for the deployment wiring
 * [BOT-02]). The bot is grounded in the site's own content; here we only
 * render the conversation.
 *
 * Non-modal by design: the story keeps scrolling behind it. The message
 * list is exempt from Lenis via data-lenis-prevent (same pattern as the
 * Quick View overlay) so wheel-over-panel scrolls the chat, not the story.
 * Conversation lives in component state only — nothing persisted.
 *
 * [BOT-02] failure responses may carry a `detail` ref code; it renders as
 * a tiny "ref: …" line inside the error bubble so a live deployment can be
 * diagnosed from the chat itself (same pattern as the contact form).
 */

type Msg = { role: "user" | "assistant"; content: string; ref?: string };

const GREETING = `Hi — I'm ${person.name.split(" ")[0]}'s portfolio assistant. Ask me about his work, stack, projects or how to get in touch.`;

const STARTERS = [
  "What has Eirele built?",
  "What's his tech stack?",
  "Explain the story section",
  "How do I contact him?",
];

const MAX_HISTORY = 16; // turns sent to the API (greeting excluded)
const CLIENT_TIMEOUT_MS = 45_000;

/** Bubble icon (inline SVG — the site avoids icon-font dependencies). */
function BubbleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-6 w-6"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function ThinkingDots() {
  return (
    <span className="flex items-center gap-1 py-1" aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-mute motion-reduce:animate-none"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [thinking, setThinking] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // New content → keep the list pinned to the latest message. With an
  // empty conversation (fresh open) there is nothing to scroll to, and
  // scrolling would clip the greeting's first line.
  useEffect(() => {
    if (messages.length === 0 && !thinking) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, thinking]);

  // Focus the composer when the panel opens; Esc closes.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim().slice(0, 2000);
      if (!text || thinking) return;

      const history = [...messages, { role: "user" as const, content: text }];
      setMessages(history);
      setInput("");
      setThinking(true);
      track("chat_message", { chars: text.length });

      const ac = new AbortController();
      abortRef.current?.abort();
      abortRef.current = ac;
      const timer = setTimeout(() => ac.abort(), CLIENT_TIMEOUT_MS);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            messages: history.slice(-MAX_HISTORY).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: ac.signal,
        });
        const data: { reply?: unknown; error?: string; detail?: string } = await res
          .json()
          .catch(() => ({}));
        const reply = typeof data.reply === "string" ? data.reply.trim() : "";
        if (!res.ok || !reply) {
          // Server error payloads carry a visitor-safe message + a ref code
          // [BOT-02] — render the bubble directly instead of throwing.
          const errMsg =
            typeof data.error === "string" && data.error
              ? data.error
              : `Request failed (${res.status})`;
          const detail = typeof data.detail === "string" ? data.detail : "";
          setMessages([
            ...history,
            {
              role: "assistant",
              content: errMsg,
              ...(detail ? { ref: detail } : {}),
            },
          ]);
          return;
        }
        setMessages([...history, { role: "assistant", content: reply }]);
      } catch (err) {
        if (ac.signal.aborted) {
          // Timed out or cancelled — restore the draft so a retry is one tap.
          setInput(text);
        } else {
          setMessages([
            ...history,
            {
              role: "assistant",
              content:
                err instanceof Error && err.message !== "Failed to fetch"
                  ? err.message
                  : "Sorry — the assistant is unreachable right now. Please try again in a moment.",
            },
          ]);
        }
      } finally {
        clearTimeout(timer);
        setThinking(false);
      }
    },
    [messages, thinking],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const toggle = () => {
    setOpen((v) => {
      const next = !v;
      if (next) track("chat_open");
      return next;
    });
  };

  const close = useCallback(() => {
    setOpen(false);
    fabRef.current?.focus();
  }, []);

  return (
    <div className="no-print contents">
      {/* Launcher */}
      <button
        ref={fabRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="chat-panel"
        aria-label={open ? "Close chat assistant" : "Chat with the portfolio assistant"}
        className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-amber text-amber-ink shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 motion-reduce:transition-none ${
          open ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <BubbleIcon />
      </button>

      {/* Panel */}
      {open && (
        <div
          id="chat-panel"
          role="dialog"
          aria-modal="false"
          aria-label="Portfolio assistant chat"
          className="chat-panel fixed bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4.25rem)] right-[max(1rem,env(safe-area-inset-right))] z-30 flex h-[min(66svh,540px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-line bg-canvas/95 text-ink shadow-2xl backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full rounded-full bg-ok opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
              </span>
              <span className="label-mono text-ink">Ask the assistant</span>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close chat"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink hover:border-amber motion-reduce:transition-none"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="chat-scroll flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
            data-lenis-prevent
            aria-live="polite"
            aria-label="Conversation"
          >
            <p className="chat-bubble-bot max-w-[85%] self-start">{GREETING}</p>

            {messages.map((m, i) =>
              m.role === "user" ? (
                <p
                  key={i}
                  className="chat-bubble-user max-w-[85%] self-end"
                >
                  {m.content}
                </p>
              ) : (
                <p
                  key={i}
                  className="chat-bubble-bot max-w-[85%] self-start"
                >
                  {m.content}
                  {m.ref && (
                    <span className="label-mono mt-1.5 block text-mute">
                      ref: {m.ref}
                    </span>
                  )}
                </p>
              ),
            )}

            {thinking && (
              <div className="chat-bubble-bot self-start">
                <ThinkingDots />
              </div>
            )}

            {/* Starter questions — only while the conversation is empty */}
            {messages.length === 0 && !thinking && (
              <div className="mt-1 flex flex-col items-start gap-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="chip min-h-[36px] text-left hover:border-amber"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={onSubmit}
            className="flex items-end gap-2 border-t border-line px-3 py-3"
          >
            <textarea
              ref={inputRef}
              rows={1}
              // data-lenis-prevent [SCR-12]: touch scrolling inside the
              // composer stays native (same pattern as the messages list).
              data-lenis-prevent
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about Eirele…"
              aria-label="Your message"
              maxLength={2000}
              className="chat-input max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border border-line bg-transparent px-3 py-2.5 text-[0.9rem] text-ink placeholder:text-mute focus:border-amber focus:outline-none"
            />
            <button
              type="submit"
              disabled={thinking || input.trim().length === 0}
              aria-label="Send message"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber text-amber-ink transition-opacity disabled:opacity-40"
            >
              <SendIcon />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
