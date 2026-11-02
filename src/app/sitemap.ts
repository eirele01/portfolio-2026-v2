import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/**
 * sitemap.xml [SEO-01] — the single canonical route only. `?view=quick` /
 * `?mode=` are render variants of the same document (canonical → "/"), and
 * parameter URLs must not compete with the clean URL in the index.
 *
 * Returns an empty sitemap until a canonical origin resolves
 * (NEXT_PUBLIC_SITE_URL → Vercel production domain → deployment URL, see
 * lib/site-url.ts) — never a localhost URL.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  if (!base) return [];
  return [{ url: `${base}/`, changeFrequency: "monthly", priority: 1 }];
}
