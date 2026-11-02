import type { MetadataRoute } from "next";
import { site } from "@/content/facts";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!site.url) return [];
  return [
    { url: site.url, changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/?view=quick`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
