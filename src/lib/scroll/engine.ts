"use client";

import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Scroll engine [SCR-01][SCR-04]: native scroll smoothed by Lenis; the
 * scrollbar, keyboard scrolling and touch are never hijacked
 * (syncTouch: false). Idempotent under React StrictMode double-mounts and
 * never initialized in static/quick contexts.
 */
let lenis: Lenis | null = null;
let configDone = false;
let started = false;

const tick = (t: number) => {
  lenis?.raf(t * 1000);
};

export function initScrollEngine(): Lenis | null {
  if (typeof window === "undefined") return null;
  gsap.registerPlugin(ScrollTrigger);
  if (!configDone) {
    ScrollTrigger.config({ ignoreMobileResize: true });
    configDone = true;
  }
  if (lenis) return lenis;
  lenis = new Lenis({ duration: 1.15, smoothWheel: true, syncTouch: false });
  lenis.on("scroll", ScrollTrigger.update);
  return lenis;
}

export function startScrollEngine(): void {
  const l = initScrollEngine();
  if (!l || started) return;
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  started = true;
}

export function stopScrollEngine(): void {
  if (!started) return;
  gsap.ticker.remove(tick);
  started = false;
}

export function destroyScrollEngine(): void {
  stopScrollEngine();
  if (!lenis) return;
  lenis.destroy();
  lenis = null;
}

export const getLenis = (): Lenis | null => lenis;

export const lockScroll = (): void => lenis?.stop();
export const unlockScroll = (): void => {
  if (lenis) lenis.start();
  else document.documentElement.style.overflow = "";
};

/** Smooth scroll to a target; falls back to native in static mode. */
export function scrollToTarget(
  target: string | HTMLElement | number,
  opts: { immediate?: boolean } = {},
): void {
  if (lenis) {
    // force: programmatic navigation (deep links, chrome buttons) must work
    // even while the loader holds the scroll lock — the lock exists to stop
    // USER input, not app-level positioning. [NAV-01]
    lenis.scrollTo(target, {
      immediate: opts.immediate,
      force: true,
      ...(opts.immediate ? {} : { duration: 1.6 }),
    });
    return;
  }
  if (typeof target === "number") {
    window.scrollTo({ top: target, behavior: opts.immediate ? "auto" : "smooth" });
    return;
  }
  const el =
    typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  el?.scrollIntoView({ behavior: opts.immediate ? "auto" : "smooth", block: "start" });
}

/** Jump (no animation) to a hash target after layout/pins are ready. */
export function jumpToHash(hash: string): void {
  if (!hash || hash === "#") return;
  const el = document.querySelector<HTMLElement>(hash) ?? document.getElementById(hash.slice(1));
  if (!el) return;
  // Pinned sections: land exactly on the pin start (the element's flow
  // position sits differently inside its pin-spacer).
  const trigger = ScrollTrigger.getAll().find((t) => t.trigger === el && t.vars?.pin);
  if (trigger && typeof trigger.start === "number") {
    scrollToTarget(trigger.start + 2, { immediate: true });
    return;
  }
  scrollToTarget(el, { immediate: true });
}
