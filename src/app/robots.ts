import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/**
 * robots.txt [SEO-01] — replaces the static public/robots.txt so the
 * Sitemap line can carry an absolute, correctly-resolved origin (the old
 * static file allowed everything but never pointed at the sitemap, so
 * Google had to learn the sitemap by hand).
 *
 * The Sitemap line is only emitted when a canonical origin resolves
 * (NEXT_PUBLIC_SITE_URL → Vercel production domain → deployment URL, see
 * lib/site-url.ts) — never a localhost URL.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: { userAgent: "*", allow: "/" },
    ...(base ? { sitemap: `${base}/sitemap.xml` } : {}),
  };
}
