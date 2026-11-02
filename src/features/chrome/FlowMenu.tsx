"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { person } from "@/content/facts";
import { track } from "@/lib/analytics";
import { scrollToTarget } from "@/lib/scroll/engine";

/**
 * FlowMenu [NAV-04] — the lite/static navigation (story mode never mounts
 * it; its chrome stays wordmark + toggle only). Two halves share one item
 * list and one scroll-spy:
 *  - FlowMenuLinks: the desktop row (sm+) — mono labels with an amber dash
 *    marking the section in view (IntersectionObserver over a thin band at
 *    the viewport middle, mirroring the theme observer in FlowingStory).
 *  - FlowMenuMobile: the hamburger (below sm) — a full-screen always-dark
 *    ledger overlay: numbered rows, hairline dividers, scroll locked while
 *    open, Esc closes, focus is kept inside. The overlay is PORTALLED to
 *    document.body: it must escape the header's z-20 stacking context, or
 *    the chat launcher (z-30) would paint over it. CSS-only motion, so
 *    reduced motion just gets instant states (same rule as the ModeToggle
 *    thumb).
 *
 * "Process" targets the flow-only #process ledger [LITE-01] — the seven
 * story phases fold into that one section in lite/static (their slugs are
 * story-only). Anchors scroll via scrollToTarget, which degrades to
 * native smooth scrolling here (Lenis is destroyed outside story mode).
 */

type MenuItem = { key: string; label: string; target: number | string };

const ITEMS: MenuItem[] = [
  { key: "home", label: "Home", target: 0 },
  { key: "process", label: "Process", target: "#process" },
  { key: "projects", label: "Projects", target: "#work" },
  { key: "skills", label: "Skills", target: "#stack" },
  { key: "experience", label: "Experience", target: "#experience" },
  { key: "contact", label: "Contact", target: "#contact" },
];

/** Document order of the spied sections (hero → process ledger → shelf → …).
 *  [LITE-01] the seven phase slugs are story-only; the flow spy watches
 *  the folded #process ledger instead. */
const SPY_ORDER: string[] = [
  "myself",
  "process",
  "work",
  "stack",
  "experience",
  "contact",
];

const KEY_BY_SECTION: Record<string, string> = {
  myself: "home",
  process: "process",
  work: "projects",
  stack: "skills",
  experience: "experience",
  contact: "contact",
};

/** Marks the menu item whose section crosses the viewport's middle band. */
function useActiveSection(): string {
  const [active, setActive] = useState("home");

  useEffect(() => {
    const inBand = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = e.target.id;
          if (e.isIntersecting) inBand.add(id);
          else inBand.delete(id);
        }
        const current = SPY_ORDER.find((id) => inBand.has(id));
        if (current) setActive(KEY_BY_SECTION[current] ?? current);
      },
      // A thin horizontal band at the middle — one contiguous section at a time.
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    for (const id of SPY_ORDER) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  return active;
}

const go = (item: MenuItem, channel: "flow_menu" | "flow_menu_overlay") => {
  track("nav_click", { channel, item: item.key });
  scrollToTarget(item.target);
};

export function FlowMenuLinks() {
  const active = useActiveSection();
  return (
    <nav aria-label="Sections" className="hidden items-center gap-x-5 sm:flex">
      {ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          aria-current={active === item.key ? "true" : undefined}
          onClick={() => go(item, "flow_menu")}
          className={`label-mono group flex min-h-[44px] items-center gap-1.5 text-[0.68rem] transition-colors duration-200 ${
            active === item.key ? "text-ink" : "text-mute hover:text-ink"
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-px bg-amber transition-all duration-300 motion-reduce:transition-none ${
              active === item.key ? "w-3" : "w-0 group-hover:w-2"
            }`}
          />
          {item.label}
        </button>
      ))}
    </nav>
  );
}

export function FlowMenuMobile() {
  const [open, setOpen] = useState(false);
  const active = useActiveSection();
  const btnRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    setOpen(false);
    btnRef.current?.focus();
  };

  const jump = (item: MenuItem) => {
    track("nav_click", { channel: "flow_menu_overlay", item: item.key });
    // setOpen unmounts the panel, whose cleanup releases the overflow lock
    // before the smooth scroll gets under way (flushed pre-paint).
    setOpen(false);
    scrollToTarget(item.target);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-controls="flow-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => (open ? close() : setOpen(true))}
        className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] sm:hidden"
      >
        <span
          aria-hidden="true"
          className={`h-px w-5 bg-ink transition-transform duration-300 motion-reduce:transition-none ${
            open ? "translate-y-[3px] rotate-45" : ""
          }`}
        />
        <span
          aria-hidden="true"
          className={`h-px w-5 bg-ink transition-transform duration-300 motion-reduce:transition-none ${
            open ? "-translate-y-[3px] -rotate-45" : ""
          }`}
        />
      </button>

      {open &&
        createPortal(
          <MenuPanel active={active} onClose={close} onJump={jump} />,
          document.body,
        )}
    </>
  );
}

/**
 * The overlay itself — mounted only while open, so its one-frame fade state
 * (shown) resets naturally on every open and the scroll lock's cleanup always
 * runs, even if a mode switch tears the whole menu down mid-visit.
 */
function MenuPanel({
  active,
  onClose,
  onJump,
}: {
  active: string;
  onClose: () => void;
  onJump: (item: MenuItem) => void;
}) {
  const [shown, setShown] = useState(false); // one frame after mount → CSS fade
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll lock without Lenis (this menu only exists in lite/static, where
    // the engine is destroyed) — native overflow lock, like Quick View.
    document.documentElement.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => setShown(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Minimal focus trap: Tab wraps inside the panel.
      if (e.key === "Tab" && panelRef.current) {
        const els = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>("button, a[href]"),
        );
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <>
      <div
        ref={panelRef}
        id="flow-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        tabIndex={-1}
        className={`pointer-events-auto fixed inset-0 z-[35] flex flex-col bg-[#0a0a0b] text-[#f4f2ee] transition-opacity duration-300 outline-none motion-reduce:transition-none ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Top row mirrors the chrome bar, so the close sits where the
            hamburger was. */}
        <div className="flex items-center justify-between px-clamp py-4">
          <span className="label-mono text-[0.68rem] text-white/50">
            {person.monogram}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-11 w-11 flex-col items-center justify-center gap-[5px]"
          >
            <span aria-hidden="true" className="h-px w-5 translate-y-[3px] rotate-45 bg-[#f4f2ee]" />
            <span aria-hidden="true" className="h-px w-5 -translate-y-[3px] -rotate-45 bg-[#f4f2ee]" />
          </button>
        </div>

        <nav
          aria-label="Sections"
          className={`flex flex-1 flex-col justify-center px-clamp transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
            shown ? "translate-y-0" : "translate-y-3"
          }`}
        >
          <ul>
            {ITEMS.map((item, i) => (
              <li key={item.key} className="border-b border-white/10 first:border-t">
                <button
                  type="button"
                  aria-current={active === item.key ? "true" : undefined}
                  onClick={() => onJump(item)}
                  className="flex min-h-[64px] w-full items-baseline gap-4 py-4 text-left"
                >
                  <span className="label-mono text-[0.62rem] text-amber">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`label-mono text-[1.3rem] uppercase tracking-[0.16em] transition-colors duration-200 ${
                      active === item.key ? "text-amber" : "text-[#f4f2ee]"
                    }`}
                  >
                    {item.label}
                  </span>
                  {active === item.key && (
                    <span aria-hidden="true" className="label-mono ml-auto text-[0.58rem] text-white/40">
                      here
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          <p className="label-mono mt-8 text-[0.6rem] text-white/40">
            {person.name} — {person.role}
          </p>
        </nav>
      </div>
    </>
  );
}
