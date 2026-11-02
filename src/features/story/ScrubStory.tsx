"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { phases, transitions } from "@/content/phases";
import type { PhaseConfig } from "@/content/schema";
import { MEDIA, mediaUrl, probeMedia } from "@/lib/media/media";
import {
  getPreloadState,
  preloadAvailability,
  startMediaPreload,
  subscribePreload,
} from "@/lib/media/preload";
import { isModeResolved } from "@/lib/mode/experience";
import { pickVideoVariant } from "@/lib/media/variant";
import {
  startScrollEngine,
  stopScrollEngine,
  initScrollEngine,
  jumpToHash,
} from "@/lib/scroll/engine";
import {
  setActivePhase,
  setStoryProgress,
  useActivePhase,
} from "@/lib/scroll/activePhase";
import { announce } from "@/lib/a11y/announce";
import { track, trackOnce } from "@/lib/analytics";
import { PhaseStage, StageLabel, useBeat } from "./PhaseStage";
import { TransitionStage } from "./TransitionStage";
import { Dip } from "./Dip";
import { StoryCanvas } from "./StoryCanvas";
import { BeatView } from "./beats/Beats";
import { Hero } from "../hero/Hero";
import { ContactSection } from "./ContactSection";
import { WorkSection } from "./WorkSection";
import { StackSection } from "./StackSection";
import { ExperienceSection } from "./ExperienceSection";

gsap.registerPlugin(ScrollTrigger);

/** Persistent caption inside a stage (e.g. the Novara note) [CNT-01]. */
function StageCaption({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useBeat({ el: ref, at: 0.02, until: 0.94, travel: 8 });
  return (
    <p
      ref={ref}
      className="label-mono absolute bottom-3 right-3 z-20 max-w-[30ch] text-right !text-[0.6rem] leading-relaxed text-mute opacity-80 lg:bottom-4 lg:right-clamp"
    >
      {text}
    </p>
  );
}

function PhaseSection({ config }: { config: PhaseConfig }) {
  return (
    <PhaseStage
      config={config}
      segmentKey={`p${config.index}`}
      fadeOutEnd={config.index === 7}
    >
      {/* Footage lives on the StoryCanvas [SCR-07] — this stage contributes
          only text, so nothing visual rolls between pins. */}
      <StageLabel config={config} />
      {config.caption && <StageCaption text={config.caption} />}
      {config.beats.map((b) => (
        <BeatView key={b.id} beat={b} />
      ))}
    </PhaseStage>
  );
}

/**
 * Story mode — the full pinned, scrubbed journey. Owns the scroll engine
 * lifecycle, story progress, deep links, phase announcements and the media
 * availability probe (videos auto-activate when they land — ADR-003).
 */
export function ScrubStory() {
  const main = useRef<HTMLElement>(null);
  const active = useActivePhase();
  const [videos, setVideos] = useState<Record<number, boolean>>({});
  const [transitionVideos, setTransitionVideos] = useState<Record<string, boolean>>({});
  // [LOG-01] bump → remounts the three late pinned sections so their pins
  // re-create LAST (see the pin-order guard below).
  const [latePinsKey, setLatePinsKey] = useState(0);
  const latePinsHeals = useRef(0);

  // Scroll engine lifecycle (idempotent; cleaned up on unmount). [SCR-04]
  useEffect(() => {
    startScrollEngine();
    return () => stopScrollEngine();
  }, []);

  // Media availability [MED-03, LOAD-01, CACHE-01]: the preloader fetches
  // every clip up-front (behind the loader) and reports which ones exist.
  // A preload that will never REPORT results itself — "skipped" (reveal ≠
  // stop: results aren't recorded once revealed) or "idle" (never started)
  // — falls back to the lazy probe: 1-byte ranged GETs, so absent videos →
  // backdrops with no 404 noise. The probe must NOT run while status is
  // "loading": the first idle callback can land mid-queue (observed: all
  // 13 clips revalidated behind the still-draining preloader), and the
  // settled pushes below apply the maps themselves.
  useEffect(() => {
    trackOnce("story", "story_start");
    // [LOAD-01] Only start when the mode is ALREADY resolved: on first
    // mount (SSR default "story") a ?mode=lite visitor would otherwise
    // download 70 MB of footage they're about to never see. The resolved
    // trigger lives in Portfolio's mode effect; this call covers late
    // story mounts (mode toggle, quick-view close) where mode is known.
    if (isModeResolved()) {
      startMediaPreload();
    }

    const applyFromPreload = (): boolean => {
      if (getPreloadState().status !== "done") return false;
      // The variant that CanvasSegment will actually use on this device —
      // [CACHE-03] one shared decision function, never re-derived here.
      const mobile = pickVideoVariant() === "light";
      const phaseMap: Record<number, boolean> = {};
      const transitionMap: Record<string, boolean> = {};
      phases.forEach((p) => {
        const url = mediaUrl(
          mobile ? MEDIA.phaseVideoMobile(p.index) : MEDIA.phaseVideo(p.index),
        );
        phaseMap[p.index] = preloadAvailability(url) ?? true;
      });
      transitions.forEach((t) => {
        const url = mediaUrl(
          mobile
            ? MEDIA.transitionVideoMobile(t.from, t.to)
            : MEDIA.transitionVideo(t.from, t.to),
        );
        transitionMap[`t${t.from}-${t.to}`] = preloadAvailability(url) ?? true;
      });
      setVideos(phaseMap);
      setTransitionVideos(transitionMap);
      return true;
    };

    // Fallback availability probe. Cancellable: a visitor resolving
    // straight into lite unmounts this component while it is still
    // pending — without the cancel, the probes fired anyway (13 pointless
    // ranged GETs).
    let cancelled = false;
    let probed = false;
    const probe = () => {
      if (cancelled || probed) return;
      if (getPreloadState().status === "loading") return; // wait for settle
      probed = true;
      void Promise.all([
        ...phases.map(async (p) => ({
          key: `p${p.index}`,
          index: p.index,
          ok: await probeMedia(mediaUrl(MEDIA.phaseVideo(p.index))),
        })),
        ...transitions.map(async (t) => ({
          key: `t${t.from}-${t.to}`,
          index: t.to,
          ok: await probeMedia(mediaUrl(MEDIA.transitionVideo(t.from, t.to))),
        })),
      ]).then((results) => {
        if (cancelled) return;
        const phaseMap: Record<number, boolean> = {};
        const transitionMap: Record<string, boolean> = {};
        results.forEach((r) => {
          if (r.key.startsWith("t")) transitionMap[r.key] = r.ok;
          else phaseMap[r.index] = r.ok;
        });
        setVideos(phaseMap);
        setTransitionVideos(transitionMap);
      });
    };

    const unsub = subscribePreload(() => {
      const st = getPreloadState().status;
      if (st === "done") {
        if (applyFromPreload()) unsub();
      } else if (st === "skipped") {
        // Probe at reveal — do NOT wait for the background queue to drain:
        // probeMedia coalesces with in-flight queue requests through the
        // HTTP cache, and probing now is what makes clips appear NOW.
        probe();
      }
    });
    // The preload may have settled before this effect ran (fast hydrate).
    if (applyFromPreload()) unsub();
    else if (getPreloadState().status === "skipped") probe();

    // Idle probe only covers the never-started case ("idle"): anything
    // running/settled is handled by the subscription above.
    let idleId = 0;
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => number;
    };
    const idleProbe = () => {
      if (cancelled || probed) return;
      if (getPreloadState().status !== "idle") return;
      probe();
    };
    idleId =
      w.requestIdleCallback?.(idleProbe) ??
      (window.setTimeout(idleProbe, 1200) as unknown as number);
    return () => {
      cancelled = true;
      unsub();
      if (w.cancelIdleCallback && idleId) w.cancelIdleCallback(idleId);
      else if (idleId) window.clearTimeout(idleId);
    };
  }, []);

  // [MED-02 → removed] The old per-phase prefetch links fired only when
  // the preload status was "skipped". With [CACHE-01] a skip no longer
  // stops the preloader: its journey-ordered queue keeps draining in the
  // background and always covers upcoming clips before the visitor gets
  // there. Prefetch links would just duplicate in-flight requests (the
  // phase-1 ×2 race, again) — so there is nothing left to do here.

  // Story-wide progress for the mobile bar (single trigger, no pin).
  useGSAP(
    () => {
      initScrollEngine();
      const st = ScrollTrigger.create({
        trigger: main.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => setStoryProgress(self.progress),
      });
      return () => st.kill();
    },
    { scope: main },
  );

  // Deep links: on load with a hash, land ON the pin start — and keep
  // following it until the pin layout has settled. The first frames render
  // sections at their natural offsets; pins, fonts and the viewport class all
  // shift trigger starts afterwards, so a single jump lands stale (NAV-01).
  // Re-jump while the target's start keeps moving; stop once it is stable
  // for ~1s, after 6s, or as soon as the visitor scrolls themselves.
  useEffect(() => {
    const onHash = () => jumpToHash(window.location.hash);
    window.addEventListener("hashchange", onHash);
    // Loading deep into the dark acts: sync the chrome theme.
    if (window.location.hash && window.location.hash !== "#myself") {
      document.documentElement.dataset.theme = "dark";
    }
    const hash = window.location.hash;
    if (!hash || hash === "#myself") {
      return () => window.removeEventListener("hashchange", onHash);
    }

    let userScrolled = false;
    const markUser = () => {
      userScrolled = true;
    };
    window.addEventListener("wheel", markUser, { passive: true });
    window.addEventListener("touchstart", markUser, { passive: true });
    window.addEventListener("keydown", markUser);

    const TICK = 150, BUDGET = 8000;
    let elapsed = 0;
    const follow = window.setInterval(() => {
      elapsed += TICK;
      if (userScrolled || elapsed > BUDGET) {
        window.clearInterval(follow);
        return;
      }
      const el =
        document.querySelector<HTMLElement>(hash) ?? document.getElementById(hash.slice(1));
      if (!el) return; // segment not mounted yet
      const trigger = ScrollTrigger.getAll().find((t) => t.trigger === el && t.vars?.pin);
      if (!trigger || typeof trigger.start !== "number") return; // pins not laid out yet
      const target = trigger.start + 2;
      // Re-jump until the position STICKS: during load the browser's own
      // fragment scroll and lenis's immediate-reset can override a jump that
      // was technically correct — verifying the landing is the only reliable
      // signal. Stops on user scroll or a quiet 6s budget (refresh resets it).
      if (Math.abs(window.scrollY - target) > 4) jumpToHash(hash);
    }, TICK);
    // Refreshes (loader unmount, fonts, resize) shift trigger starts after
    // the first jump — keep watching for a quiet BUDGET after the last one.
    const onRefresh = () => {
      if (!userScrolled) elapsed = 0;
    };
    ScrollTrigger.addEventListener("refresh", onRefresh);

    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("wheel", markUser);
      window.removeEventListener("touchstart", markUser);
      window.removeEventListener("keydown", markUser);
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      window.clearInterval(follow);
    };
  }, []);

  // [A11Y-06] announce phase changes, debounced inside announce().
  useEffect(() => {
    const phase = phases.find((p) => p.index === active);
    if (phase) {
      announce(`Phase ${phase.index} of 7: ${phase.name}`);
      trackOnce(`phase-${phase.index}`, "phase_reached", { phase: phase.index });
    }
  }, [active]);

  // [LOG-01] Pin-order guard for the three late pinned sections (Work /
  // Stack / Experience). The video stages re-create their pins on viewport
  // flips; if such a re-creation ever runs WITHOUT the late pins re-creating
  // too, GSAP's refresh pass (creation order) measures the late pins while
  // the video spacers above are still collapsed — their starts land ~24k px
  // too high (observed mid-session viewport flip: #work start 1402 vs its
  // spacer top 26220; #stack and #experience equally shifted, mobile only,
  // desktop loads always healthy). Later refreshes cannot repair it — the
  // pass re-measures in the same broken order every time, so the displaced
  // pins pin their sections OVER the video phases mid-story. Remounting the
  // three sections re-creates their pins LAST (document order), which
  // measures correctly and heals every pin at once. Verified start ≈ spacer
  // top is the invariant for these pins (start: "top top"), so a divergence
  // beyond 4px is exactly this corruption, never a healthy state. Capped at
  // five heals so a hypothetical non-healing cause can never loop.
  useGSAP(
    () => {
      const ids = ["work", "stack", "experience"] as const;
      let raf = 0;
      const check = () => {
        if (latePinsHeals.current >= 5) return;
        const broken = ids.some((id) => {
          const el = document.getElementById(id);
          const sp = el?.parentElement;
          if (!el || !sp || !sp.classList.contains("pin-spacer")) return false;
          const st = ScrollTrigger.getAll().find(
            (t) => t.trigger === el && t.vars?.pin,
          );
          if (!st) return false;
          const live = sp.getBoundingClientRect().top + window.scrollY;
          return Math.abs(st.start - live) > 4;
        });
        if (broken) {
          latePinsHeals.current += 1;
          setLatePinsKey((k) => k + 1);
        }
      };
      const onRefresh = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(check);
      };
      ScrollTrigger.addEventListener("refresh", onRefresh);
      return () => {
        ScrollTrigger.removeEventListener("refresh", onRefresh);
        cancelAnimationFrame(raf);
      };
    },
    { scope: main },
  );

  return (
    <main ref={main} id="main" data-mode="story">
      <Hero />
      <Dip />
      {/* [SCR-07] One persistent stage behind every pinned section: footage
          layers crossfade in place, so scrolling never rolls a video out of
          view. Sections are transparent text layers above it (z-10). */}
      <div className="relative" data-story-flow="">
        <StoryCanvas phaseVideos={videos} transitionVideos={transitionVideos} />
        {phases.map((p) => {
          const t = transitions.find((tr) => tr.to === p.index);
          return (
            <div key={p.id} data-segment={p.index}>
              {/* [SCR-11] Each wrapper pulls its pinned section up over the
                  previous pin-spacer's one-viewport tail (pinSpacing always
                  appends the section's own height AFTER the pin distance), so
                  every story pin starts EXACTLY where the previous one ends.
                  Without this, the incoming clip's playhead sits parked for a
                  full viewport of scrolling at every boundary — the footage
                  freezes while only text rolls, which visitors read as "the
                  video pauses / sticks". The margin lives on the wrapper,
                  never on the pinned element itself (GSAP measures pinned
                  elements via rects, which ignore margins). The negative
                  margin is invisible: outgoing sections' beats have all
                  faded by progress ~0.97, before the overlap begins. */}
              {t && (
                <div className="-mt-[100svh]">
                  <TransitionStage config={t} nextPhase={p.index} />
                </div>
              )}
              <div className={p.index > 1 ? "-mt-[100svh]" : undefined}>
                <PhaseSection config={p} />
              </div>
            </div>
          );
        })}
      </div>
      {/* [WORK-01] The shelf sits after phase 7's pin (its own -mt wrapper
          inside WorkSection keeps the boundary gap at zero). Not part of the
          phase count — no canvas segment, no rail node; deep-links via #work.
          Keys feed the pin-order guard [LOG-01]. */}
      <WorkSection key={`late-w-${latePinsKey}`} />
      {/* [STACK-01][HOLD-02] The stack ledger is pinned like the shelf but
          follows it in NATURAL FLOW (no -mt butt-joint): the shelf's ride
          and its end-of-pin rest must never be covered [owner feedback
          2026-11-01]. Deep link #stack. */}
      <StackSection key={`late-s-${latePinsKey}`} />
      {/* [LOG-01] The career logbook follows the ledger — also in NATURAL
          FLOW (same [HOLD-02] lesson: a butt-jointed pin would slide it
          over the ledger's hold). Pinned route-line act, deep link
          #experience; Contact below is un-pinned and needs no boundary. */}
      <ExperienceSection key={`late-e-${latePinsKey}`} />
      <ContactSection />
    </main>
  );
}
