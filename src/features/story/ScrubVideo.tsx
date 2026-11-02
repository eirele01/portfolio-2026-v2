"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { mediaUrl } from "@/lib/media/media";
import { useIsMobile } from "@/lib/scroll/useIsMobile";
import { useStageTL } from "./PhaseStage";

gsap.registerPlugin(ScrollTrigger);

/**
 * ScrubVideo — the critical piece (blueprint 8.4).
 *
 * The stage timeline drives `state.target` (a NORMALIZED 0..1 playhead) via a
 * linear tween; a lerp loop on the GSAP ticker maps it to seconds and assigns
 * `video.currentTime` at most ~30×/s — never per scroll event. The poster
 * fades out on `loadeddata` and back in on error/stall. On touch devices
 * (`touchAutoplay`, SCRUB_ON_TOUCH) the clip plays once inline instead of
 * scrubbing, still pinned.
 *
 * `srcMobile` selects the -m variant on mobile class with a one-shot fallback
 * to the desktop file if it 404s. Renders nothing when `src` is null — the
 * parent falls back to CinematicBackdrop.
 */
export function ScrubVideo({
  src,
  srcMobile,
  poster,
  active,
  objectPosition = "75% center",
  highPriority = false,
  touchAutoplay = true,
}: {
  src: string | null;
  srcMobile?: string | null;
  poster: string;
  active: boolean;
  objectPosition?: string;
  highPriority?: boolean;
  touchAutoplay?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const state = useRef({ target: 0, current: 0 });
  const tl = useStageTL();
  const isMobile = useIsMobile();
  const [fellBack, setFellBack] = useState(false);

  const isCoarse =
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const useScrub = !touchAutoplay || !isCoarse;

  const picked = isMobile && srcMobile && !fellBack ? srcMobile : src;

  // Register the normalized playhead driver on the stage timeline [SCR-02].
  // fromTo pins the start value so reverse scrubbing reaches exactly 0
  // (a plain .to() would freeze the start at whatever value rendered first).
  useGSAP(
    () => {
      if (!tl) return;
      const s = state.current;
      const tween = tl.fromTo(s, { target: 0 }, { target: 1, duration: 1, ease: "none" }, 0);
      return () => {
        tween.kill();
      };
    },
    { scope: root, dependencies: [tl] },
  );

  // Lerp loop — runs only while the stage is active and scrubbing is used.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !active || !useScrub) return;
    const tick = () => {
      const s = state.current;
      if (!video.duration) return;
      const targetSec = s.target * Math.max(0, video.duration - 0.05);
      s.current += (targetSec - s.current) * 0.18;
      if (Math.abs(video.currentTime - s.current) > 1 / 30 && !video.seeking) {
        video.currentTime = s.current;
      }
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, [active, useScrub]);

  // Poster fade on loadeddata / error / stall [MED-01].
  useEffect(() => {
    const video = videoRef.current;
    const posterEl = posterRef.current;
    if (!video || !posterEl) return;
    const show = (v: boolean) => gsap.to(posterEl, { autoAlpha: v ? 1 : 0, duration: 0.4 });
    const onLoaded = () => show(false);
    const onError = () => show(true);
    video.addEventListener("loadeddata", onLoaded);
    video.addEventListener("error", onError);
    video.addEventListener("stalled", onError);
    return () => {
      video.removeEventListener("loadeddata", onLoaded);
      video.removeEventListener("error", onError);
      video.removeEventListener("stalled", onLoaded);
    };
  }, [picked]);

  // Touch: autoplay once when ≥ 40% visible, still pinned.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !touchAutoplay || !isCoarse) return;
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: "top 60%",
      end: "bottom 40%",
      onEnter: () => video.play().catch(() => {}),
    });
    return () => st.kill();
  }, [touchAutoplay, isCoarse]);

  if (!picked) return null;

  return (
    <div ref={root} aria-hidden="true" className="absolute inset-0 z-0">
      {/* Poster is decorative: alt="" [A11Y-02] */}
      <img
        ref={posterRef}
        src={poster}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition }}
        fetchPriority={highPriority ? "high" : "low"}
      />
      <video
        key={picked}
        ref={videoRef}
        src={picked}
        muted
        playsInline
        preload="metadata"
        disablePictureInPicture
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition }}
        onError={() => {
          // -m variant missing → one-shot fallback to the desktop file.
          if (picked !== src) setFellBack(true);
        }}
      />
    </div>
  );
}
