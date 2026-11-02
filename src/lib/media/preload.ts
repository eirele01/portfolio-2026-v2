"use client";

import { useSyncExternalStore } from "react";
import { phases, transitions } from "@/content/phases";
import { MEDIA, mediaUrl } from "./media";
import { pickVideoVariant } from "./variant";
import { trackOnce } from "@/lib/analytics";

/**
 * Media preloader [LOAD-01].
 *
 * On a story-mode load, every asset the journey needs is fetched UP FRONT,
 * behind the loader overlay, instead of being streamed lazily while the
 * visitor scrubs:
 *
 *   - videos  → fetched fully and kept as in-memory Blobs; `resolveVideoSrc`
 *     hands each <video> its blob: URL, so scrubbing, seeking and the
 *     rate-assist loop NEVER wait on the network again (the whole class of
 *     "video pauses / sticks while scrolling" that comes from an
 *     un-buffered region is gone by construction). Blobs are disk-backed
 *     by the browser, so ~97 MB desktop / ~28 MB mobile (v4 clarity
 *     encodes) is fine.
 *   - posters + hero cutout → fetched to warm the HTTP cache (the <img>
 *     tags then hit disk cache; no blob plumbing needed for images).
 *
 * Behaviour:
 *   - singleton + idempotent (`startMediaPreload`), safe to call from both
 *     the loader path and ScrubStory's mount.
 *   - variant chosen by `pickVideoVariant` [CACHE-03] — the SAME function
 *     StoryCanvas uses to pick a layer's src, so the blob map and the
 *     <video> src can never disagree: touch/narrow devices and
 *     slow-link desktops (Network Information API) fetch the 960w `-m`
 *     clips, everyone else the 1080p ones.
 *   - byte-weighted progress via ReadableStream (Content-Length totals),
 *     emitted at most once per animation frame.
 *   - `skipMediaPreload()` ("Skip loading" button, Esc, or the Loader's
 *     25 s cap) reveals the site immediately but does NOT abort anything
 *     [CACHE-01]: reveal ≠ stop. The queue keeps draining in the
 *     background at a lower rate, so on a slow link the visitor starts
 *     scrubbing on whatever is already local while the remaining clips
 *     land one by one — each switching from network streaming to its blob
 *     the moment it completes (resolveVideoSrc). The old abort-on-skip
 *     behaviour is exactly what turned a slow first visit into "the video
 *     still renders slowly" afterwards: it threw away the queue and left
 *     every clip streaming lazily mid-journey.
 *   - videos fetch in JOURNEY order (p1, t1-2, p2 … p7) with a small
 *     concurrency cap. 13 parallel fetches on a constrained link split
 *     bandwidth 13 ways and everything finishes together, late; an
 *     ordered queue makes the first phases blob-ready early, which is
 *     what a skip should leave the visitor standing on.
 *   - availability results (ok / missing / unknown) replace the old idle
 *     HEAD-style probes when the preload completes — same semantics: a
 *     404'd clip falls back to its CinematicBackdrop, a transport error
 *     falls back to normal streaming.
 *   - blobs live for the page session (never revoked): a refresh rebuilds
 *     them, but `cache: "force-cache"` plus the 24 h media cache window
 *     (next.config headers [CACHE-01]) makes that a disk-speed refill.
 */

export type AssetResult = "ok" | "missing" | "unknown";

export interface PreloadState {
  status: "idle" | "loading" | "done" | "skipped";
  /** 0..1 byte-weighted progress across every asset. */
  progress: number;
  loadedBytes: number;
  totalBytes: number;
  videosDone: number;
  videosTotal: number;
}


/** Video fetch concurrency: foreground (behind the loader) vs background
 *  (after a skip/cap reveal — keep filling, but never fight the scrubber
 *  for bandwidth). [CACHE-01] */
const VIDEO_PARALLEL = 4;
const VIDEO_PARALLEL_BG = 2;

const IDLE: PreloadState = {
  status: "idle",
  progress: 0,
  loadedBytes: 0,
  totalBytes: 0,
  videosDone: 0,
  videosTotal: 0,
};

let state: PreloadState = IDLE;
/** Per-asset fetch outcome, kept outside the emitted state — only callers
 *  like `preloadAvailability` read it (the loader shows counts, not names). */
let results: Record<string, AssetResult> = {};
const blobUrls = new Map<string, string>();
const controllers = new Set<AbortController>();
const listeners = new Set<() => void>();
let started = false;
let t0 = 0;
let emitQueued = false;

const emit = () => listeners.forEach((l) => l());

/** Coalesce state pushes to one per animation frame — chunk callbacks can
 *  fire hundreds of times a second; nobody can see more than the frame. */
function push(next: PreloadState): void {
  state = next;
  if (emitQueued || typeof requestAnimationFrame !== "function") {
    if (typeof requestAnimationFrame !== "function") emit();
    return;
  }
  emitQueued = true;
  requestAnimationFrame(() => {
    emitQueued = false;
    emit();
  });
}

export function subscribePreload(l: () => void): () => void {
  listeners.add(l);
  return () => void listeners.delete(l);
}

export function getPreloadState(): PreloadState {
  return state;
}

/** React binding — re-renders the (light) canvas once per emitted frame. */
export function useMediaPreload(): PreloadState {
  return useSyncExternalStore(subscribePreload, getPreloadState, () => IDLE);
}

/** The src a <video> should use: the in-memory blob when preloaded. */
export function resolveVideoSrc(url: string): string {
  return blobUrls.get(url) ?? url;
}

export function hasPreloadedBlob(url: string): boolean {
  return blobUrls.has(url);
}

/**
 * Availability of one asset once the preload has SETTLED (status "done").
 * Returns null while loading/skipped — callers keep their lazy fallback
 * (the old probe) in that case. "missing" is the only hard negative: a
 * transport error or CORS rejection must NOT disable the clip, it should
 * just stream normally.
 */
export function preloadAvailability(url: string): boolean | null {
  if (state.status !== "done") return null;
  const r = results[url];
  if (r === undefined) return null;
  return r !== "missing";
}

/* ---- download machinery (module scope: `skipMediaPreload` must be able
 * ---- to re-pump the queue after reveal) --------------------------- */

let videoList: string[] = []; // journey-ordered video URLs
let videoSet = new Set<string>(); // == new Set(videoList)
const totals = new Map<string, number>();
const loads = new Map<string, number>();
const queue: string[] = []; // videos not yet started
const activeVideos = new Set<string>();
let pumping = false;

/** Start the next queued video fetches while below the concurrency cap.
 *  Spaced a tick so a completion's finally() doesn't nest starts. The cap
 *  tightens once status leaves "loading" (skip/cap reveal). */
function pump(): void {
  if (pumping) return;
  pumping = true;
  setTimeout(() => {
    pumping = false;
    const cap = state.status === "loading" ? VIDEO_PARALLEL : VIDEO_PARALLEL_BG;
    while (activeVideos.size < cap && queue.length > 0) {
      const url = queue.shift()!;
      activeVideos.add(url);
      void fetchAsset(url, true);
    }
  }, 0);
}

function recalc(): void {
  let total = 0;
  let loaded = 0;
  let videosDone = 0;
  totals.forEach((t, url) => {
    total += t;
    loaded += loads.get(url) ?? 0;
    if (videoSet.has(url) && results[url] === "ok") videosDone += 1;
  });
  push({
    ...state,
    progress: total > 0 ? Math.min(1, loaded / total) : 0,
    loadedBytes: loaded,
    totalBytes: total,
    videosDone,
    videosTotal: videoList.length,
  });
}

function finishLoad(skipped: boolean): void {
  if (state.status !== "loading") return; // skip already landed
  const ms = Math.round(performance.now() - t0);
  push({
    ...state,
    status: skipped ? "skipped" : "done",
    progress: skipped ? state.progress : 1,
  });
  trackOnce("preload", "preload_done", {
    ms,
    skipped,
    videos: state.videosDone,
    bytes: state.loadedBytes,
  });
}

async function fetchAsset(url: string, wantBlob: boolean): Promise<void> {
  const ac = new AbortController();
  controllers.add(ac);
  let result: AssetResult = "unknown";
  try {
    const res = await fetch(url, { signal: ac.signal, cache: "force-cache" });
    if (!res.ok) {
      // A genuinely absent file is "missing" (backdrop fallback);
      // gateway/auth errors (403/5xx) must not disable the clip.
      result = res.status === 404 ? "missing" : "unknown";
    } else {
      const total = Number(res.headers.get("Content-Length") ?? 0);
      if (total > 0) totals.set(url, total);
      const reader = res.body?.getReader();
      if (!reader) {
        // Ancient streaming-less browser: take it wholesale.
        const blob = await res.blob();
        loads.set(url, blob.size);
        if (wantBlob) blobUrls.set(url, URL.createObjectURL(blob));
        result = "ok";
      } else {
        const chunks: BlobPart[] = [];
        let received = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.byteLength;
            loads.set(url, received);
            recalc();
          }
        }
        if (wantBlob) {
          blobUrls.set(
            url,
            URL.createObjectURL(
              new Blob(chunks, {
                type: res.headers.get("Content-Type") ?? "video/mp4",
              }),
            ),
          );
        }
        result = "ok";
      }
    }
  } catch {
    // Transport/CORS failure (a skip no longer aborts — reveal ≠ stop):
    // "unknown" — never disable the clip, it just streams the old way.
    result = "unknown";
  } finally {
    controllers.delete(ac);
    // After a skip, completions land here with status "skipped" — the
    // fetch result isn't recorded (availability falls back to the lazy
    // probe) but the blob, if the body completed, is already usable.
    if (state.status === "loading" && result !== "unknown") {
      results[url] = result;
    }
    if (wantBlob) activeVideos.delete(url);
    recalc();
    if (wantBlob) pump();
    // Finish only when everything started AND everything queued is done
    // — early in the run, controllers can hit 0 between waves.
    if (controllers.size === 0 && queue.length === 0) finishLoad(false);
  }
}

export function startMediaPreload(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  t0 = performance.now();

  // [CACHE-03] Same decision the canvas makes at render time — see
  // variant.ts for why this must be one shared function.
  const mobile = pickVideoVariant() === "light";
  // [CACHE-01] Journey order: p1 → t1-2 → p2 → t2-3 → … → p7. Content
  // order (all phases, then all transitions) would fetch t1-2 last even
  // though it plays second — the queue must match what the visitor
  // actually scrolls through.
  const phaseUrl = (n: number) =>
    mediaUrl(mobile ? MEDIA.phaseVideoMobile(n) : MEDIA.phaseVideo(n));
  const transitionUrl = (from: number, to: number) =>
    mediaUrl(
      mobile ? MEDIA.transitionVideoMobile(from, to) : MEDIA.transitionVideo(from, to),
    );
  const videoUrls: string[] = [];
  phases.forEach((p, i) => {
    videoUrls.push(phaseUrl(p.index));
    const t = transitions[i];
    if (t && t.from === p.index) videoUrls.push(transitionUrl(t.from, t.to));
  });
  transitions.forEach((t) => {
    const url = transitionUrl(t.from, t.to);
    if (!videoUrls.includes(url)) videoUrls.push(url);
  });
  // Hero cutout first (above the fold on story start); posters warm the
  // canvas under-layers. Images go to the HTTP cache, not the blob map.
  const imageUrls: string[] = [
    mediaUrl(MEDIA.heroCutout),
    ...phases.map((p) => mediaUrl(MEDIA.phasePosterLarge(p.index))),
    ...transitions.map((t) => mediaUrl(MEDIA.transitionPosterLarge(t.from, t.to))),
  ];
  videoList = videoUrls;
  videoSet = new Set(videoUrls);
  results = {};
  totals.clear();
  loads.clear();
  queue.length = 0;
  queue.push(...videoUrls);
  activeVideos.clear();

  push({ ...IDLE, status: "loading", videosTotal: videoUrls.length });

  // Images (~1.3 MB total) go out immediately and warm the HTTP cache;
  // videos go through the ordered, capped queue.
  imageUrls.forEach((url) => void fetchAsset(url, false));
  pump();
}

/** Visitor pressed "Skip loading" (or Esc), or the Loader cap fired: reveal
 *  the site NOW, keep every blob that already finished, and let the queue
 *  keep draining in the background [CACHE-01] — clips keep converting to
 *  blobs as they land and take over from streaming via resolveVideoSrc.
 *  (Aborting here was the old behaviour; it discarded the very downloads
 *  that would have fixed the slow-video report.) */
export function skipMediaPreload(): void {
  if (state.status !== "loading") return;
  push({ ...state, status: "skipped" });
  pump();
  trackOnce("preload-skip", "preload_done", { skipped: true });
}
