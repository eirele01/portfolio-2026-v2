/**
 * Media map [MED-03]. All media URLs go through `mediaUrl` so the files can
 * move to a bucket/CDN without touching components.
 *
 * The raw videos/posters were not present in this hand-off, so the story
 * renders CinematicBackdrop until they land (ADR-003). `probeMedia` checks
 * availability at runtime — when real files appear under public/media, the
 * ScrubVideo path activates with no code changes.
 */
export const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "";

/**
 * Cache-busting revision for the video encodes. MUST be bumped together
 * with the SW cache name (public/sw.js CACHE) on every re-encode: the SW
 * key includes the query, AND the browser HTTP cache (max-age 86400,
 * next.config headers [CACHE-01]) would otherwise keep feeding the old
 * bytes to the preloader's `cache: "force-cache"` fetches for up to a day
 * — the SW bump alone does not defeat it (verified 2026-11-01: after the
 * media-v2 activation, force-cache still served the pre-re-encode files
 * from the HTTP cache).
 * v4 = 2026-11-01 clarity re-encode — 1920×1080 full / 960×540 light
 * (upscaling moved inside the encode; see scripts/media/encode.mjs v4).
 */
const VIDEO_REV = "v4";

const videoUrl = (path: string): string => `${path}?v=${VIDEO_REV}`;

export const mediaUrl = (path: string): string => `${MEDIA_BASE}${path}`;

export const MEDIA = {
  heroCutout: "/media/hero/eirele-cutout.webp",
  heroCutoutSmall: "/media/hero/eirele-cutout-800.webp",
  phaseVideo: (n: number) => videoUrl(`/media/video/phase-${n}.mp4`),
  phaseVideoMobile: (n: number) => videoUrl(`/media/video/phase-${n}-m.mp4`),
  phasePoster: (n: number) => `/media/posters/phase-${n}-800.webp`,
  /** Full-viewport poster for the story canvas [SCR-07]. */
  phasePosterLarge: (n: number) => `/media/posters/phase-${n}-1600.webp`,
  transitionVideo: (from: number, to: number) => videoUrl(`/media/video/transition-${from}-${to}.mp4`),
  transitionVideoMobile: (from: number, to: number) => videoUrl(`/media/video/transition-${from}-${to}-m.mp4`),
  transitionPoster: (from: number, to: number) => `/media/posters/transition-${from}-${to}-800.webp`,
  transitionPosterLarge: (from: number, to: number) =>
    `/media/posters/transition-${from}-${to}-1600.webp`,
} as const;

const probeCache = new Map<string, boolean>();

/** Probe a media URL once; resolves false on any failure/404.
 *
 *  Uses a 1-byte ranged GET instead of HEAD on purpose: some preview
 *  gateways reject HEAD with 403 while serving plain and ranged GETs
 *  (observed on the space-z preview proxy, 2026-10-31). `res.ok` covers
 *  both 200 (full) and 206 (partial-content) answers. */
export async function probeMedia(url: string): Promise<boolean> {
  if (probeCache.has(url)) return probeCache.get(url) ?? false;
  const ok = await fetch(url, { method: "GET", headers: { Range: "bytes=0-0" } })
    .then((res) => res.ok)
    .catch(() => false);
  probeCache.set(url, ok);
  return ok;
}

export const hasVideos = (): boolean =>
  typeof window !== "undefined" && probeCache.get(mediaUrl(MEDIA.phaseVideo(1))) === true;
