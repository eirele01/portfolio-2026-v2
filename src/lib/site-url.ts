/**
 * Canonical site URL resolution [SEO-01] — server-side only (the Vercel
 * system vars below are NOT inlined into client bundles; every consumer
 * here — layout metadata, robots.ts, sitemap.ts — renders on the server).
 *
 * Order: explicit NEXT_PUBLIC_SITE_URL (owner's final domain, wins always)
 * → VERCEL_PROJECT_PRODUCTION_URL (the production domain Vercel injects
 * automatically) → VERCEL_URL (the per-deployment URL, always present on
 * Vercel) → "" (dev sandbox; callers fall back to localhost / omit).
 *
 * Why: canonical URLs, the sitemap entry, robots' Sitemap line and the
 * Person JSON-LD url/image all need an absolute origin. With this order
 * they work out of the box on the first Vercel deploy — before the owner
 * hand-sets any env var — and the explicit env var remains the override
 * once the custom domain is live (see docs/SEO-SETUP.md).
 */
function stripSlash(u: string): string {
  return u.replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return stripSlash(explicit);

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${stripSlash(production)}`;

  const deployment = process.env.VERCEL_URL?.trim();
  if (deployment) return `https://${stripSlash(deployment)}`;

  return "";
}
