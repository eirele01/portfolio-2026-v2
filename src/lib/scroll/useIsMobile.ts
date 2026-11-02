"use client";

import { useEffect, useState } from "react";

const QUERY = "(max-width: 767px), (pointer: coarse)";

/** Plain (non-hook) check for the same breakpoint — for module code such as
 *  the media preloader that runs outside React render. */
export function matchesMobileQuery(): boolean {
  return typeof window !== "undefined" && window.matchMedia(QUERY).matches;
}

/** Matches the blueprint's mobile pacing class (small screens + touch). */
export function useIsMobile(): boolean {
  // Lazy client init avoids a post-mount flip that would rebuild stages.
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia(QUERY).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}
