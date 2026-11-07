"use client";

import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Scroll engine [SCR-01][SCR-04][SCR-12]: native scroll smoothed by Lenis.
 * Wheel is eased (duration 1.15). Touch is virtualized too since [SCR-12]:
 * the drag still tracks the finger 1:1 (Lenis lerps with 1 while touching),
 * but the OS ballistic fling is replaced by a compressed release glide —
 * real-phone swipes now move at reading pace through the pinned story
 * instead of rocketing through 1-2 phases per flick. Touches on nested
 * scrollers are exempt via data-lenis-prevent (Quick View, chat panel,
 * the mobile card snap-row, textareas). Touching the screen mid-glide
 * stops the glide (Lenis reset — native-like), and prefers-reduced-motion
 * keeps native scrolling (Lenis default). Idempotent under React
 * StrictMode double-mounts and never initialized in static/quick contexts.
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
  // [SCR-12] Touch joins the engine. syncTouch:false left real phones on raw
  // OS fling momentum — one swipe covered thousands of px and blasted through
  // 1-2 pinned phases (mobile pins are 170-450vh). With syncTouch:true the
  // finger-down drag stays 1:1 (Lenis scrolls with lerp 1 while touching) and
  // only the release changes: the glide distance is |velocity|^exponent px,
  // where velocity is px/frame at liftoff. The 1.7 default is super-linear —
  // a 50px/frame flick glides ~430px, a 120px/frame flick ~3,200px (a whole
  // phase). 1.35 compresses the top end (~200px @ 50, ~640px @ 120) while
  // gentle releases keep a short natural tail; syncTouchLerp 0.075 then eases
  // the glide out over ~0.6s so it reads as a page settling, not a launch.
  // touchMultiplier stays 1 so the drag distance matches the finger exactly.
  lenis = new Lenis({
    duration: 1.15,
    smoothWheel: true,
    syncTouch: true,
    syncTouchLerp: 0.075,
    touchInertiaExponent: 1.35,
  });
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
