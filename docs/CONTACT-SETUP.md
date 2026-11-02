# Contact form — setup guide [CONTACT-01]

The message form in **PHASE 11 / YOURS** sends email through the site's own
backend (`/api/contact` → [Resend](https://resend.com)) to your inbox. This
guide is everything you need to do on your side, in order. Total time:
about 30 minutes, most of it waiting for DNS.

```
Visitor → form → POST /api/contact (Vercel) → Resend API → your inbox
```

## What already works without any setup

- The form renders, validates, and **fails gracefully**: without a key the
  visitor sees *"The form isn't connected to a mailbox yet"* plus your
  direct email as a fallback. Nothing breaks — but no email arrives.
- Spam protection is built in: a hidden honeypot field (bots get a fake
  success) and a rate limit (5 messages per 10 minutes per IP).

## Step 1 — Create the Resend API key

1. Sign up at **resend.com** (free tier: 3,000 emails/month, 100/day).
2. Dashboard → **API Keys** → *Create API Key* → full access → copy it
   (`re_...`).

## Step 2 — Test locally (optional but quick)

```bash
cp .env.example .env.local
# put your key in .env.local:
#   RESEND_API_KEY=re_xxx
#   CONTACT_TO=your-own-address@gmail.com
npm run dev
```

While your domain is **not yet verified**, Resend's sandbox sender can only
deliver to the email address you signed up with — so set `CONTACT_TO` to
that address for this test. Submit the form; the email should arrive
(check spam). Delete `.env.local` afterwards if you keep secrets out of the
repo.

## Step 3 — Deploy to Vercel and set the env vars

1. Push this repo to GitHub, then *Add Project* on **vercel.com** (framework
   auto-detected as Next.js — defaults are fine; no build overrides).
2. Project → **Settings → Environment Variables** → add (Production):

   | Variable          | Value                                | Notes                                              |
   | ----------------- | ------------------------------------ | -------------------------------------------------- |
   | `RESEND_API_KEY`  | `re_...`                             | required — without it the form shows the fallback  |
   | `CONTACT_TO`      | `eirelejovenboter2@gmail.com`        | where submissions are delivered                    |
   | `CONTACT_FROM`    | see Step 5                           | add this once the domain is verified               |
   | `NEXT_PUBLIC_SITE_URL` | `https://eirelejovenboter.com`  | canonical URL for metadata                         |

3. Deploy. Test the live form once (it will use the sandbox sender and
   only reach your own address until Step 5 is done).

### Wiring self-check (no tools needed)

Open **`https://<your-domain>/api/contact`** in a browser (a plain GET —
it sends nothing). Expected while the form works:

```json
{ "ok": true, "configured": true,
  "from": "Portfolio <onboarding@resend.dev> (default — sandbox sender)",
  "to": "e***@gmail.com (default — facts.ts)" }
```

- `configured: false` → `RESEND_API_KEY` is not reaching the deployment
  (wrong environment scope on Vercel, typo in the name, or it was added
  after the last deploy — env changes need a redeploy).
- `from` says the sandbox sender → the form works but only delivers to
  your Resend account's own address until Step 5 is done.
- If a submission still fails, the form's error box prints a
  **`ref: <code>`** line — look it up in the Troubleshooting table below.

## Step 4 — Point the domain at Vercel (Cloudflare DNS)

1. Buy **eirelejovenboter.com** on Cloudflare.
2. Vercel → Project → **Settings → Domains** → add `eirelejovenboter.com`.
3. Vercel shows the records to create — in Cloudflare → **DNS → Records**:

   - `A` record: `@` → `76.76.21.21`
   - `CNAME` record: `www` → `cname.vercel-dns.com`

   Leave the Cloudflare proxy **off (grey cloud / DNS only)** for these —
   Vercel issues the HTTPS certificate itself and proxying breaks it.
4. Wait for the checkmarks in Vercel's domain panel (usually minutes).

## Step 5 — Verify the domain in Resend (this is "connecting it to Resend")

1. Resend → **Domains** → *Add Domain* → `eirelejovenboter.com`.
2. Resend lists the DNS records to publish. Add each one in
   **Cloudflare → DNS → Records** exactly as shown — typically:
   - `TXT` `send` (SPF)
   - `TXT` `resend._domainkey` (DKIM — long string, paste carefully)
   - `TXT` `_dmarc` (DMARC)
   - optional `MX` `send` + `TXT` `send._domainkey` for bounce handling
     (Resend shows them; add them too)
3. Back in Resend, click **Verify**. DNS propagation can take from a few
   minutes to a few hours.
4. Once verified, set on Vercel:

   ```
   CONTACT_FROM = Eirele Joven Boter <hello@eirelejovenboter.com>
   ```

   (any address `@eirelejovenboter.com` works — `hello@`, `me@`,
   `noreply@`…) and redeploy. Replies to form emails go straight to the
   visitor's address (the route sets `reply_to`), so "Reply" in your mail
   app just works.

## Step 6 — Final check

Submit the live form from an incognito window with a different email
address. Expected: *"Message sent"* panel → email arrives in your inbox →
hit Reply and it addresses the visitor.

## Troubleshooting

A failed submission shows an error line plus a **`ref:` code** (the same
JSON body is visible in DevTools → Network → the `/api/contact` request).
Look the code up here — the exact Resend response is always in the Vercel
function log (Deployments → Functions → `/api/contact`):

| ref | Meaning / fix |
| --- | --- |
| `not-configured` | `RESEND_API_KEY` missing on Vercel — add it (Step 3), redeploy. |
| `resend-auth` | Resend rejected the key (401) — re-copy a full-access key from dashboard.resend.com → API Keys into `RESEND_API_KEY`, redeploy. |
| `resend-forbidden` | Resend refused the delivery (403) — almost always the sandbox sender: until the domain is verified it can only reach your Resend account's own address. Set `CONTACT_TO` to that address for testing, or finish Step 5 and set `CONTACT_FROM`. |
| `resend-rejected` | Resend rejected the payload (422) — read the Vercel function log for the exact field. |
| `resend-quota` | Resend quota hit (429) — free tier: 100 emails/day, 3,000/month. |
| `resend-unavailable` | Resend itself errored (5xx) — retry; status.resend.com. |
| `network` | The server couldn't reach api.resend.com (12 s timeout) — check the Vercel function log. |
| `rate-limited` | The site's own rate limit (5 messages / 10 min / IP) — by design; wait or redeploy to clear it. |
| *(no ref)* | Client-side validation — the offending fields are highlighted in the form. |

Older symptoms, same map:

| Symptom | Cause / fix |
| --- | --- |
| Form says *"isn't connected to a mailbox yet"* (`ref: not-configured`) | `RESEND_API_KEY` missing on Vercel — add it, redeploy. |
| 502 in the server log with Resend `403` (`ref: resend-forbidden`) | You're sending from the sandbox sender to someone else's address — finish Step 5 (domain verification) or, for testing, send only to your Resend account address. |
| Resend domain won't verify | Records not exact (paste the full DKIM string), or DNS not propagated yet — Cloudflare's DNS page shows them instantly; retry Verify after ~1 h. |
| Too many messages error | Rate limit (5 / 10 min / IP) — by design; wait or clear it by redeploying (the limiter is in-memory). |

## Where the code lives

- `src/features/story/ContactForm.tsx` — the form (all modes share it)
- `src/app/api/contact/route.ts` — validation, honeypot, rate limit, Resend
- `.env.example` — the variables, documented
- Project history: `PROJECT_STATE.md` round 25
