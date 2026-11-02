# SEO setup — getting the portfolio into Google Search

Owner guide (like `CONTACT-SETUP.md`). Everything code-side is already
built and verified — the steps below are the parts only you can do:
deploy, verify ownership with Google, submit the sitemap.

---

## 1. What is already built [SEO-01] (no action needed)

| Piece | Where | What it does |
|---|---|---|
| Title + meta description | `src/content/facts.ts` → `src/app/layout.tsx` | The search-result headline and snippet |
| Keywords, author, creator | `src/app/layout.tsx` | Secondary ranking hints |
| Canonical URL | `src/app/layout.tsx` (`alternates.canonical`) | Tells Google `?mode=` / `?view=quick` are variants of one page, not duplicates |
| OpenGraph + Twitter card | `src/app/layout.tsx` | Link previews (WhatsApp/Messenger/LinkedIn/X) with the real portrait `og-image.jpg` |
| JSON-LD `Person` schema | `src/app/layout.tsx` | Structured data: name, job title, location, email, LinkedIn + GitHub (`sameAs`), skills (`knowsAbout`) — what rich results parse |
| `robots.txt` (dynamic) | `src/app/robots.ts` | Allows all crawlers **and advertises the sitemap URL** |
| `sitemap.xml` (dynamic) | `src/app/sitemap.ts` | The one canonical URL, change-frequency monthly |
| Server-rendered content | full React tree SSRs (no `ssr:false`) | Googlebot sees the hero name, role, projects without executing JS; a no-JS content block exists too |
| Real-text headings | `h1` = your name, sections `h2` | Clean heading hierarchy for crawlers |

The canonical origin resolves automatically: `NEXT_PUBLIC_SITE_URL` →
Vercel's production domain → the per-deployment URL (`src/lib/site-url.ts`).
A localhost URL is never written into canonical/sitemap/structured data.

## 2. Deploy (Vercel)

1. Import the GitHub repo on Vercel (framework auto-detect: Next.js).
2. Set env vars for the **contact form** first (see `CONTACT-SETUP.md`).
3. Deploy. Canonical/sitemap/JSON-LD immediately use the production URL —
   no env var needed yet.
4. Optional custom domain: add it in Vercel → Domains, then in Cloudflare
   DNS point `CNAME` → `cname.vercel-dns.com` (orange-cloud proxied is
   fine; Vercel handles certificates). Set
   `NEXT_PUBLIC_SITE_URL=https://<your-domain>` in Vercel → Settings →
   Environment Variables and redeploy — the explicit value always wins.

## 3. Google Search Console (the actual "make it findable" step)

1. Go to <https://search.google.com/search-console> → **Add property**.
2. Choose **Domain** property (covers www/apex/any subdomain) → Google
   shows a **TXT record** → add it in Cloudflare → DNS → TXT on the root
   (`@`), wait a few minutes → Verify.
   *Alternative:* URL-prefix property → "HTML tag" card → copy the
   `content="…"` token → set it as `GOOGLE_SITE_VERIFICATION` in Vercel →
   redeploy. The DNS method needs no code and is recommended.
3. Once verified: **Sitemaps** menu → enter `sitemap.xml` → Submit.
4. **URL Inspection** (top bar) → paste `https://<your-domain>/` →
   "Request indexing". First crawl usually lands within days.

## 4. Check the result

- **Rich Results Test** (<https://search.google.com/test/rich>): paste the
  URL → should detect the `Person` structured data.
- **`site:yourdomain.com`** in Google → after indexing, the page appears.
- Searching **"Eirele Joven Boter"** is the realistic win: a name this
  unique ranks quickly, especially with the LinkedIn/GitHub `sameAs`
  links cross-referencing it. Generic terms ("software engineer
  Mandaluyong") take longer and depend on backlinks — link the site from
  your LinkedIn profile, GitHub profile README and resume for a boost.
- Core content is server-rendered, but keep an eye on **PageSpeed
  Insights** after deploy; the story mode preloads ~70 MB of video on
  fast connections (lite/static is served to slow ones automatically) —
  crawlers and most first-time mobile visitors get the light rendering.

## 5. What NOT to expect

- No sitemap ping spam or search-submission services are needed — the
  `robots.txt` Sitemap line + Search Console submission is the whole job.
- Nothing in the repo invents facts for ranking (no fake reviews, hidden
  text, keyword stuffing) — the blueprint's FACTS rule stays: every word
  in the metadata/structured data traces to `src/content/facts.ts`.
