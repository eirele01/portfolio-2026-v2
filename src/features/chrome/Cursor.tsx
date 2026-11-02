"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * Cursor (desktop, fine pointer only): a 10px amber dot that grows to 40px
 * over interactive items. It never hides or replaces the system cursor on
 * touch, and is not rendered at all for prefers-reduced-motion.
 * Enabled/disabled via direct DOM style — no cascading state.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = dot.current;
    if (!el) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) {
      el.style.display = "none";
      return;
    }
    const xTo = gsap.quickTo(el, "x", { duration: 0.28, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.28, ease: "power3.out" });

    let shown = false;
    const onMove = (e: MouseEvent) => {
      if (!shown) {
        shown = true;
        gsap.to(el, { autoAlpha: 1, duration: 0.2 });
      }
      xTo(e.clientX);
      yTo(e.clientY);
      const interactive = (e.target as HTMLElement | null)?.closest?.(
        "a, button, [data-cursor='hover'], input, [role='button']",
      );
      gsap.to(el, {
        scale: interactive ? 4 : 1,
        opacity: interactive ? 0.55 : 1,
        duration: 0.25,
        ease: "power3.out",
      });
    };
    const onLeave = () => gsap.to(el, { autoAlpha: 0, duration: 0.2 });
    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={dot}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-50 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber opacity-0 will-change-transform"
    />
  );
}
