"use client";

import { useCallback, useEffect, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ensureModeResolved,
  useExperienceMode,
  type ExperienceMode,
} from "@/lib/mode/experience";
import { trackOnce } from "@/lib/analytics";
import { startMediaPreload } from "@/lib/media/preload";
import { startScrollEngine, destroyScrollEngine } from "@/lib/scroll/engine";
import { useIsMobile } from "@/lib/scroll/useIsMobile";
import { registerLiveRegion } from "@/lib/a11y/announce";
import { Chrome } from "./chrome/Chrome";
import { ModeHint } from "./chrome/ModeHint";
import { ModeVeil } from "./chrome/ModeVeil";
import { PhaseRail, ProgressBar } from "./chrome/PhaseRail";
import { Cursor } from "./chrome/Cursor";
import { Loader } from "./chrome/Loader";
import { ScrubStory } from "./story/ScrubStory";
import { FlowingStory } from "./story/FlowingStory";
import { QuickView } from "./quick/QuickView";
import { ChatWidget } from "./chat/ChatWidget";

const VALID_MODES: ExperienceMode[] = ["story", "lite", "static"];

/**
 * Portfolio root — one content model, four renderings [ARC-01]:
 * story (pinned scrub) / lite / static (flowing) + Quick View overlay.
 * Mode resolution: ?mode= > saved > reduced-motion > heuristics > story.
 */
export default function Portfolio({
  initialQuick = false,
  initialMode,
}: {
  initialQuick?: boolean;
  initialMode?: string | null;
}) {
  const mode = useExperienceMode();
  const isMobile = useIsMobile();
  const [quickOpen, setQuickOpen] = useState(initialQuick);

  // Resolve the mode once on mount (SSR default: story). The loader covers
  // the pre-hydration frame and dismisses itself; no extra state needed.
  // [LOAD-01] The up-front media preload starts HERE — after resolution —
  // so a visitor heading to lite/static never downloads the footage.
  // (ScrubStory's own mount runs before this effect can have resolved and
  // only starts the preload when mode was already known.)
  useEffect(() => {
    const m = ensureModeResolved(
      VALID_MODES.includes(initialMode as ExperienceMode) ? initialMode : null,
    );
    trackOnce("mode-initial", "mode_resolved", { mode: m });
    if (m === "story") {
      startMediaPreload();
    }
  }, [initialMode]);

  // Engine only runs in story mode. Leaving lite/static must DESTROY it,
  // not just stop the ticker: a live Lenis keeps intercepting wheel events
  // even when stopped, which froze scrolling in lite/static and the Quick
  // View overlay [SCR-09]. destroy() removes its listeners so native
  // scrolling takes over completely.
  useEffect(() => {
    if (mode === "story") startScrollEngine();
    else destroyScrollEngine();
  }, [mode]);

  // When the viewport class flips (phone ⇄ desktop), every stage re-creates
  // its ScrollTrigger with new pin lengths; a refresh after React settles
  // recalculates offsets from clean layout (prevents stale pin transforms).
  // Late-loading fonts shift text metrics AFTER these timeouts on a cold
  // cache — recalculate once fonts settle, plus one late safety pass.
  useEffect(() => {
    if (mode !== "story") return;
    let cancelled = false;
    const refresh = () => {
      if (!cancelled) ScrollTrigger.refresh();
    };
    const t1 = setTimeout(refresh, 150);
    const t2 = setTimeout(refresh, 600);
    const t3 = setTimeout(refresh, 1800);
    void document.fonts?.ready.then(() => {
      // Defer one frame so the new metrics are committed to layout first.
      if (!cancelled) requestAnimationFrame(refresh);
    });
    // Any late content growth (fonts, media metadata) shifts the pin
    // spacers — ScrollTrigger only recalculates on refresh, so observe the
    // body and recalculate on a quiet debounce.
    let roTimer = 0;
    const ro = new ResizeObserver(() => {
      if (cancelled) return;
      clearTimeout(roTimer);
      roTimer = window.setTimeout(refresh, 200);
    });
    ro.observe(document.body);
    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(roTimer);
      ro.disconnect();
    };
  }, [isMobile, mode]);

  // Quick View: history entry only — /?view=quick opens it (and Esc closes
  // it). There is no in-page button dispatching `ejb:quick` anymore: the
  // "Skip the story" buttons became the resume download [NAV-02, round 18].
  useEffect(() => {
    const onPop = () => {
      const isQuick = new URLSearchParams(window.location.search).get("view") === "quick";
      setQuickOpen(isQuick);
    };
    window.addEventListener("popstate", onPop);
    if (initialQuick) {
      window.history.replaceState(null, "", "/?view=quick");
    }
    return () => {
      window.removeEventListener("popstate", onPop);
    };
  }, [initialQuick]);

  const closeQuick = useCallback(() => {
    setQuickOpen(false);
    if (new URLSearchParams(window.location.search).get("view") === "quick") {
      window.history.pushState(null, "", "/");
    }
  }, []);

  // Register the polite live region for phase announcements. [A11Y-06]
  const liveRef = useCallback((el: HTMLDivElement | null) => registerLiveRegion(el), []);

  return (
    <>
      <a href="#main" className="skip-link no-print">
        Skip to main content
      </a>
      <Loader enabled={!initialQuick && initialMode !== "static"} />

      {mode === "story" && (
        <>
          <Chrome />
          <PhaseRail />
          <ProgressBar />
        </>
      )}
      {mode !== "story" && <Chrome />}

      {mode === "story" ? (
        <ScrubStory />
      ) : (
        <FlowingStory mode={mode} key={mode} />
      )}

      <QuickView open={quickOpen} onClose={closeQuick} />
      <ModeHint />
      <ModeVeil />
      <ChatWidget />

      <div ref={liveRef} aria-live="polite" className="sr-only" />
      <div className="grain no-print" aria-hidden="true" />
      <Cursor />
    </>
  );
}
