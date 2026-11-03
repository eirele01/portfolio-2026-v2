# AI chat assistant — setup guide [BOT-03]

The floating "Ask the assistant" widget sends the conversation to the
site's own backend (`/api/chat`), which answers from the portfolio's own
content using **local RAG** — retrieval over pre-written fact chunks
compiled from the content modules. **No AI provider, no API key, no env
vars, nothing to configure.** This guide is just how it works and how to
verify it. Time to verify: ~2 minutes.

```
Visitor → widget → POST /api/chat (Vercel) → local retrieval over
            the site's own content chunks → reply
```

## Why there is no API key (owner decision, 2026-11-03)

The original build (round 1) called an LLM grounded by a system prompt.
Round 34 made that deployable by reading an `AI_API_KEY` env var. The
owner then decided: *"use only RAG chatbot in AI Chatbot, do not use any
AI provider … I do not have API key access."* So the entire provider
wiring was removed and replaced by a local retrieval engine:

- **The brain is `src/lib/ai/knowledge.ts`** — ~40 answer chunks
  ("topics") pre-composed from the canonical content modules
  (`facts.ts`, `projects.ts`, `work.ts`, `skills.ts`, `experience.ts`,
  `phases.ts`). Every claim in a chunk is published on the site; where
  the site omits a fact (per-project results, phone number), the bot
  omits it too.
- **The engine is `src/lib/ai/rag.ts`** — tokenizes the question, scores
  every chunk (keyword hits ≫ title ≫ body, corpus IDF, intent topics),
  and composes the reply from the winning chunk. Special paths: tool
  lookup ("does he know Flutter?" → discipline + shipped-in products),
  honest misses ("does he know Python?" → *isn't in the published
  stack*), deterministic follow-ups ("what stack does it use?" → the
  previous turn's chunk), greetings/identity, and an honest fallback
  that steers back to what it does know.
- Because everything is local, there is nothing that can 401 / 429 /
  time out or leak a key. The widget behaves identically in the dev
  sandbox and on any deployment, and costs nothing per question.

## Step 1 — Deploy

Nothing to set. Pull the latest main and deploy — no environment
variables exist for the chat (`.env.example` has none either). The
contact-form vars are unrelated and still apply
(docs/CONTACT-SETUP.md).

## Step 2 — Verify

1. **Self-check (sends nothing):** open `https://<your-domain>/api/chat`
   in a browser. Expected:

   ```json
   { "ok": true, "configured": true, "provider": "local-rag",
     "model": "portfolio-content", "knowledgeChunks": 39 }
   ```

   `configured` is always `true` — the brain ships with the repo.
2. Open the site, tap the amber chat bubble, and ask:
   - *"What has Eirele built?"* → the nine launched products
   - *"What's his tech stack?"* → the 74-tool ledger, then
     *"Does he know Flutter?"* → the Mobile discipline
   - *"What did he do at Tensei?"* → the logbook posting
   - *"What's the weather in Paris?"* → an honest "I only know Eirele's
     world" fallback
3. If a message ever fails, the error bubble prints a **`ref:`** code —
   there are only three possible ones now:

| ref | Meaning / fix |
| --- | --- |
| `rate-limited` | The site's own limit (60 questions / 5 min / IP) — by design. |
| `rag-error` | An unexpected engine error — the Vercel function log has the stack (Deployments → Functions → `/api/chat`). Should be unreachable; report it if seen. |
| *(no ref)* | Network/browser issue — retry; the widget restores your draft. |

## Editing the bot's knowledge

- **Site facts changed?** Edit the content module (`work.ts`, `skills.ts`,
  `experience.ts`, …) — the chunks recompile from them on the next build.
  Nothing else to touch.
- **Wording changed?** Edit the chunk `body` strings in
  `src/lib/ai/knowledge.ts` — that's copywriting, exactly like site copy.
- **New question type keeps missing?** Add keywords to the relevant
  chunk, or a new chunk; the engine picks it up automatically.

## Behavior notes (honest limitations)

- Answers come from the published content only — it will not
  paraphrase, opine, or answer anything outside that scope (by design;
  it declines and steers back).
- Replies are English. The engine has no translation ability.
- Replies are deterministic: the same question always yields the same
  answer.
- Stateless: each widget message sends the trimmed history (last 16
  turns); nothing is stored server-side. History is used only to resolve
  short follow-ups.
- The `z-ai-web-dev-sdk` dependency stays in `package.json` (sandbox
  tooling) but the chat no longer imports it anywhere.

## Where the code lives

- `src/features/chat/ChatWidget.tsx` — the floating panel (all modes)
- `src/app/api/chat/route.ts` — validation, rate limit, self-check
- `src/lib/ai/rag.ts` — the retrieval + composition engine
- `src/lib/ai/knowledge.ts` — the knowledge chunks (the brain)
- `scripts/probe-chat.sh` — the verification probe battery
- Project history: `PROJECT_STATE.md` rounds 1 (BOT-01), 34 (BOT-02)
  and 35 (BOT-03)
