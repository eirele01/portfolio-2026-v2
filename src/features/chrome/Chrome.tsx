"use client";

import { person } from "@/content/facts";
import { scrollToTarget } from "@/lib/scroll/engine";
import { useExperienceMode } from "@/lib/mode/experience";
import { ModeToggle } from "./ModeToggle";
import { FlowMenuLinks, FlowMenuMobile } from "./FlowMenu";

/**
 * Fixed chrome (z-20), mode-aware [NAV-04]:
 *  - story: wordmark left, the STORY/LITE toggle right — nothing else.
 *    The pinned story navigates by narrative (rail, progress, scrub), and
 *    contact + the resume download live at the end of it, so the bar
 *    carries no links (owner round 27; supersedes the round-18 decision
 *    that put the resume link here in every mode).
 *  - lite/static: wordmark left; the FlowMenu [NAV-04] (section links on
 *    desktop, hamburger overlay below sm) + the toggle right. "static"
 *    rides the LITE side [NAV-03], so both flow renderings share this bar.
 *    Order matters: the toggle anchors the right edge on desktop, the
 *    hamburger takes the right edge on mobile (thumb reach).
 */
export function Chrome() {
  const mode = useExperienceMode();
  const story = mode === "story";

  return (
    <header className="no-print pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center justify-between px-clamp py-4">
      <button
        type="button"
        onClick={() => scrollToTarget(0)}
        className="label-mono pointer-events-auto min-h-[44px] text-ink"
        aria-label="Back to start"
      >
        {person.monogram}
      </button>
      <nav
        className="pointer-events-auto flex items-center gap-x-4 sm:gap-x-6"
        aria-label="Site"
      >
        {!story && <FlowMenuLinks />}
        <ModeToggle />
        {!story && <FlowMenuMobile />}
      </nav>
    </header>
  );
}
