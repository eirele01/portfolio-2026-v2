"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { phases, transitions } from "@/content/phases";
import type { PhaseConfig } from "@/content/schema";
import { MEDIA, mediaUrl } from "@/lib/media/media";
import { resolveVideoSrc, useMediaPreload } from "@/lib/media/preload";
import { pickVideoVariant } from "@/lib/media/variant";
import { CinematicBackdrop } from "./backdrops/CinematicBackdrop";
import { SEGMENT_ORDER, getSegment, useActiveSegment } from "./canvasStore";

/**
 * StoryCanvas [SCR-07] — the persistent, never-scrolling stage behind the
 * whole pinned story. All 13 clips (7 phases + 6 transitions) live here as
 * absolutely-stacked layers; each pinned section drives its own layer's
 * playhead and opacity through canvasStore, so at every boundary the footage
 * CROSSFADES IN PLACE instead of the old full-viewport roll (the transition
 * clips finally connect phase to phase, as intended).
 *
 * Layer opacity is written on the GSAP ticker (not React state) — scrubbing
 * never re-renders. Only segments within ±1 of the active one keep a mounted
 * <video> (preload=auto); the rest show their poster. Coarse pointers play
 * the active clip instead of scrubbing.
 */

interface SegmentMeta {
  key: string;
  kind: "phase" | "transition";
  scene: PhaseConfig["scene"];
  objectPosition: string;
  scrim: string;
  poster: string;
  video: string;
  videoMobile: string;
}

const seg = (key: string): SegmentMeta | null => {
  if (key.startsWith("p")) {
    const p = phases.find((x) => x.index === Number(key.slice(1)));
    if (!p) return null;
    return {
      key,
      kind: "phase",
      scene: p.scene,
      objectPosition: p.textAnchor === "bottom-left" ? "25% center" : "75% center",
      scrim: "h-[58svh] bg-gradient-to-t from-black/60 via-black/22 to-transparent",
      poster: mediaUrl(MEDIA.phasePosterLarge(p.index)),
      video: mediaUrl(MEDIA.phaseVideo(p.index)),
      videoMobile: mediaUrl(MEDIA.phaseVideoMobile(p.index)),
    };
  }
  const m = /^t(\d)-(\d)$/.exec(key);
  if (!m) return null;
  const t = transitions.find((x) => x.from === Number(m[1]) && x.to === Number(m[2]));
  if (!t) return null;
  return {
    key,
    kind: "transition",
    scene: t.scene,
    objectPosition: "75% center",
    scrim: "h-[42svh] bg-gradient-to-t from-black/60 via-black/20 to-transparent",
    poster: mediaUrl(MEDIA.transitionPosterLarge(t.from, t.to)),
    video: mediaUrl(MEDIA.transitionVideo(t.from, t.to)),
    videoMobile: mediaUrl(MEDIA.transitionVideoMobile(t.from, t.to)),
  };
};

/**
 * Scrub driver [SCR-10, revised SCR-11] — the per-tick control loop that
 * maps a normalized playhead onto a <video>. Three regimes, cheapest first:
 *
 *   settled      |target−time| < ½ frame → hold: pause, rate 1. Zero decode,
 *             perfectly still — what "glued to scroll" means.
 *   rate-assist  small FORWARD gap (≤ 0.5s, buffered WITH headroom, primary
 *             layer) → play natively with playbackRate = 1 + gap/0.14. The
 *             decoder pipelines frames end-to-end (no per-frame seek
 *             resets), which is what makes slow scrolling buttery; the loop
 *             converges onto the scroll target (~0.14s time constant) and
 *             the settle branch pauses it. The headroom requirement
 *             [SCR-11] means we never PLAY into the buffer edge — hitting
 *             that edge mid-play is what visitors read as "the video
 *             pauses or sticks"; without headroom we fall through to a
 *             seek, which paints the target frame instantly.
 *   seek      everything else (reverse moves, flicks, unbuffered) → precise
 *             seek to the FRAME-QUANTIZED target, single-flight: an
 *             in-flight seek is never interrupted EXCEPT by the watchdog
 *             [SCR-11] — a seek that hasn't landed within 350ms (slow
 *             proxy, unbuffered region) is superseded by the CURRENT
 *             target, so the clip can never hang on a stale frame.
 *             Quantization means we only re-seek when the grid position
 *             actually moved. Fading (secondary) layers seek at half rate
 *             via the per-TICK counter `tickNo`.
 *
 * Requires short-GOP encodes (g=12, no B-frames, scripts/media/encode.mjs
 * v3): a seek decodes ≤12 lightweight P-frames from the nearest keyframe,
 * and the ~3x smaller files fully buffer ahead so seeks never wait on I/O.
 */
const SCRUB_FRAME = 1 / 24; // matches the 24fps encode grid
const SCRUB_SETTLE = SCRUB_FRAME / 2;
const SCRUB_RATE_WINDOW = 0.5;
const SCRUB_RATE_MAX = 4; // decode demand stays ≤ 96fps @24fps source
const RATE_HEADROOM = 0.35; // buffered seconds required AHEAD of the target
const SEEK_STALL_MS = 350; // supersede a seek that hasn't landed in time

/** Timestamp of the last seek WE issued, for the watchdog. */
const seekStart = new WeakMap<HTMLVideoElement, number>();

/** End of the buffered range containing t (seconds), or -1 if unbuffered. */
function bufferedEndAt(v: HTMLVideoElement, t: number): number {
  const b = v.buffered;
  for (let i = 0; i < b.length; i++) {
    if (t >= b.start(i) - 0.05 && t <= b.end(i)) return b.end(i);
  }
  return -1;
}

export function driveScrub(
  v: HTMLVideoElement,
  playhead: number,
  primary: boolean,
  tickNo: number,
): void {
  const target = playhead * Math.max(0, v.duration - 0.05);
  const q = Math.round(target / SCRUB_FRAME) * SCRUB_FRAME;
  const diff = q - v.currentTime;

  // Watchdog [SCR-11]: while a seek is in flight, block new work — unless it
  // has been in flight past SEEK_STALL_MS, in which case fall through and
  // supersede it with the current target below (a stale frozen frame reads
  // as "stuck"; a re-targeted seek keeps up with the visitor's position).
  if (v.seeking) {
    const t0 = seekStart.get(v);
    if (t0 !== undefined && performance.now() - t0 < SEEK_STALL_MS) return;
  } else {
    seekStart.delete(v);
  }

  // Settled: hold the frame. (A clip that ran past its target into `ended`
  // is visually ON the last frame — settle it too instead of seek-looping.)
  const atEnd = v.ended || v.currentTime >= v.duration - 0.06;
  if (Math.abs(diff) < SCRUB_SETTLE || (atEnd && q >= v.duration - 0.06)) {
    if (v.playbackRate !== 1) v.playbackRate = 1;
    if (!v.paused) v.pause();
    return;
  }

  // Native rate-assist for forward moves (primary layer only) — only with
  // buffer HEADROOM past the target; otherwise fall through to the seek
  // branch, which paints the (already-buffered) target frame instantly.
  if (primary && !v.seeking && diff > 0 && diff <= SCRUB_RATE_WINDOW) {
    const bEnd = bufferedEndAt(v, q);
    if (bEnd >= q + RATE_HEADROOM) {
      const rate = Math.min(SCRUB_RATE_MAX, Math.max(0.4, 1 + diff / 0.14));
      if (v.playbackRate !== rate) v.playbackRate = rate;
      if (v.paused) void v.play().catch(() => {});
      return;
    }
  }

  // Single-flight precise seek (timestamped for the watchdog).
  if (!primary && tickNo % 2 === 1) return; // half rate while fading out
  if (!v.paused) v.pause();
  if (v.playbackRate !== 1) v.playbackRate = 1;
  seekStart.set(v, performance.now());
  v.currentTime = q;
}

export function StoryCanvas({
  phaseVideos,
  transitionVideos,
}: {
  phaseVideos: Record<number, boolean>;
  transitionVideos: Record<string, boolean>;
}) {
  const active = useActiveSegment();
  // [CACHE-03] The clip variant is a SESSION-stable pick (see variant.ts):
  // same function the preloader used, so every blob lookup hits. It does
  // NOT flip when the viewport class changes mid-journey — a mid-scrub src
  // swap would reload clips and stall the scrubber.
  const isMobile = pickVideoVariant() === "light";
  // [LOAD-01] Subscribing re-renders the (light) layer tree as blobs land,
  // so each <video> picks up its blob: src via resolveVideoSrc. Emissions
  // are rAF-coalesced and stop once the preload settles.
  useMediaPreload();
  const layerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  // Fine pointers scrub; coarse pointers play the active clip (as before).
  const scrubRef = useRef(true);

  // ±1 mounting window around the active segment (memory + bandwidth).
  const mountedKeys = useMemo(() => {
    const idx = SEGMENT_ORDER.indexOf((active ?? "p1") as (typeof SEGMENT_ORDER)[number]);
    if (idx < 0) return new Set<string>(["p1"]);
    return new Set<string>(
      SEGMENT_ORDER.slice(Math.max(0, idx - 1), idx + 2).map(String),
    );
  }, [active]);

  useGSAP(
    () => {
      // Scrub unless the device is actually touch (matches the original
      // ScrubVideo semantics: headless/unknown pointers are desktop-like).
      scrubRef.current = !window.matchMedia("(pointer: coarse)").matches;
      let tickN = 0;
      const tick = () => {
        // Style writes for every layer (cheap); decode work only for layers
        // on screen — and during a crossfade the decoder budget goes to the
        // PRIMARY (highest-opacity) layer, while the fading layer scrubs at
        // half rate, which reads as identical under a dissolving opacity.
        // [SCR-11] `tickNo` is a per-TICK counter (one increment per ticker
        // callback, shared by all layers) — the old per-call increment gave
        // each layer a FIXED parity, so the fading layer could freeze for
        // the whole crossfade instead of alternating.
        let primary: string | null = null;
        let primaryO = 0;
        for (const key of SEGMENT_ORDER) {
          const o = getSegment(key).opacity.o;
          if (o > primaryO) {
            primaryO = o;
            primary = key;
          }
        }
        const tickNo = tickN++;
        for (const key of SEGMENT_ORDER) {
          const s = getSegment(key);
          const layer = layerRefs.current[key];
          let visible = true;
          if (layer) {
            const o = s.opacity.o;
            visible = o > 0.002;
            const vis = visible ? "visible" : "hidden";
            if (layer.style.visibility !== vis) layer.style.visibility = vis;
            // Zero the style when hiding too — keeps the DOM honest and
            // avoids any stale-opacity flash on re-entry.
            const style = visible ? String(o) : "0";
            if (layer.style.opacity !== style) layer.style.opacity = style;
          }
          const v = videoRefs.current[key];
          if (!v || !v.duration || v.readyState < 1) continue;
          // Off-screen layers must not keep decoding — the rate loop below
          // can leave a clip playing as it dissolves out.
          if (!visible) {
            if (!v.paused) v.pause();
            continue;
          }
          if (!scrubRef.current) continue; // coarse pointers: effect below owns playback
          driveScrub(v, s.playhead.p, key === primary, tickNo);
        }
      };
      gsap.ticker.add(tick);
      return () => {
        gsap.ticker.remove(tick);
      };
    },
    [],
  );

  // Coarse pointers: play the active clip once, hold its last frame.
  useEffect(() => {
    if (scrubRef.current) return;
    for (const key of SEGMENT_ORDER) {
      const v = videoRefs.current[key];
      if (!v) continue;
      if (key === active) void v.play().catch(() => {});
      else v.pause();
    }
  }, [active, mountedKeys]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none sticky top-0 z-0 -mb-[100svh] h-svh overflow-hidden bg-[#0a0a0b]"
    >
      {SEGMENT_ORDER.map((key) => {
        const meta = seg(key);
        if (!meta) return null;
        const hasVideo =
          meta.kind === "phase"
            ? (phaseVideos[Number(key.slice(1))] ?? false)
            : (transitionVideos[key] ?? false);
        return (
          <CanvasSegment
            key={key}
            meta={meta}
            hasVideo={hasVideo}
            isMobile={isMobile}
            mounted={mountedKeys.has(key)}
            layerRef={(el) => {
              layerRefs.current[key] = el;
            }}
            videoRef={(el) => {
              videoRefs.current[key] = el;
            }}
          />
        );
      })}
    </div>
  );
}

function CanvasSegment({
  meta,
  hasVideo,
  isMobile,
  mounted,
  layerRef,
  videoRef,
}: {
  meta: SegmentMeta;
  hasVideo: boolean;
  isMobile: boolean;
  mounted: boolean;
  layerRef: (el: HTMLDivElement | null) => void;
  videoRef: (el: HTMLVideoElement | null) => void;
}) {
  const [fellBack, setFellBack] = useState(false);
  // [LOAD-01] blob: URL once the clip is fully fetched — scrubbing/seeking
  // then never waits on the network. Falls back to the network URL when the
  // clip was not preloaded (skipped preload, late mode switch).
  const picked = resolveVideoSrc(
    hasVideo && isMobile && !fellBack ? meta.videoMobile : meta.video,
  );
  return (
    <div
      ref={layerRef}
      className="absolute inset-0"
      style={{ opacity: 0, visibility: "hidden" }}
      data-canvas-segment={meta.key}
    >
      {hasVideo ? (
        <>
          <img
            src={meta.poster}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: meta.objectPosition }}
          />
          {mounted && (
            <video
              key={picked}
              ref={videoRef}
              src={picked}
              muted
              playsInline
              preload="auto"
              disablePictureInPicture
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: meta.objectPosition }}
              onError={() => {
                if (picked !== meta.video) setFellBack(true);
              }}
            />
          )}
          <div aria-hidden="true" className={`absolute inset-x-0 bottom-0 z-[5] ${meta.scrim}`} />
        </>
      ) : (
        <CinematicBackdrop scene={meta.scene} parallax={false} />
      )}
    </div>
  );
}
