"use client";

import { matchesMobileQuery } from "@/lib/scroll/useIsMobile";

/**
 * Which mp4 variant the whole app should use for this session [CACHE-03].
 *
 * The preloader builds its blob map keyed by URL, and every <video> resolves
 * its src through the same map (resolveVideoSrc) — if the preloader fetched
 * the 1080p clip while a component rendered the 960w one, the lookup would
 * silently miss and the clip would stream from the network again. So the
 * decision lives in ONE function that the preloader, ScrubStory's
 * availability maps and StoryCanvas's layer selection all call.
 *
 * "light" (960w, ~28 MB total) when:
 *   - the device is touch/narrow (same breakpoint as useIsMobile), or
 *   - a desktop signals a slow connection via the Network Information API
 *     (Chromium-only; Safari/Firefox return "full" and keep full quality).
 *
 * Plain (non-hook) and read-per-render: it must stay STABLE within a
 * session (changing the variant mid-journey would swap every src and stall
 * the scrubber). Network type flips mid-session simply keep the initial
 * pick — the correct trade for a scrub-driven canvas.
 */
export type VideoVariant = "full" | "light";

export function pickVideoVariant(): VideoVariant {
  if (typeof window === "undefined") return "full";
  if (matchesMobileQuery()) return "light";

  const nav = navigator as Navigator & {
    connection?: {
      saveData?: boolean;
      effectiveType?: string;
      downlink?: number;
    };
  };
  const c = nav.connection;
  if (!c) return "full";
  if (c.saveData) return "light";
  if (c.effectiveType === "slow-2g" || c.effectiveType === "2g" || c.effectiveType === "3g") {
    return "light";
  }
  // downlink is an optimistic estimate in Mbps; anything under ~1.5 Mbps
  // cannot sustain 70 MB in a reasonable time — prefer the light encodes.
  if (typeof c.downlink === "number" && c.downlink > 0 && c.downlink < 1.5) {
    return "light";
  }
  return "full";
}
