"use client";

import { useRef, type ReactNode, type RefObject } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import type { Beat } from "@/content/schema";
import { getProject } from "@/content/projects";
import { track } from "@/lib/analytics";
import { formatNumber } from "@/lib/math";
import { useBeat, useStageTL } from "../PhaseStage";
import { useFlow } from "../flowContext";
import { VisualBeatView } from "../visuals";

/**
 * Beat renderers — exhaustive switch on beat.kind with a `never` check, so
 * adding a kind without a renderer fails compilation [CNT-02].
 * Every beat is hidden with autoAlpha until its window [A11Y-05] and
 * registers its own entrance/exit on the stage timeline. Without a stage
 * timeline (static / lite / no-JS) beats render visible in final state.
 *
 * [CARD-01] Text beats sit inside a low-opacity readability card
 * (`.story-card`, visitor round 12) instead of directly on the footage —
 * titles, statements, requirement chips, dialogue and counters all keep
 * contrast over bright frames. Cards are `w-fit` and hug the lower-left
 * text column, never stretching edge to edge.
 *
 * [MOB-01] Visitor round 14: on phones the beats used to float in the
 * upper half (pb 45svh) while illustrations centred in the same zone —
 * both colliding with the phase title/lede card at the top. Now every
 * pinned beat (text AND visual) anchors to the BOTTOM band (pb-8svh,
 * same as desktop); beats never share a timeline window, so they can
 * share the anchor, and the top band belongs to the label alone.
 */

/** Shared card wrapper for beat content — hug-content, lower-left column. */
function BeatCard({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`story-card w-fit max-w-[92vw] p-4 lg:p-5 ${className}`}>
      {children}
    </div>
  );
}

function BeatShell({
  beat,
  className = "",
  children,
}: {
  beat: Beat;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const flow = useFlow();
  useBeat({ el: ref, at: beat.at, until: beat.until });
  return (
    <div
      className={
        flow
          ? `relative z-10 w-full ${className}`
          : `absolute inset-x-0 bottom-0 z-10 ${className}`
      }
      ref={ref}
    >
      {children}
    </div>
  );
}

function StatementView({ beat }: { beat: Extract<Beat, { kind: "statement" }> }) {
  const flow = useFlow();
  return (
    <BeatShell beat={beat}>
      <div className={flow ? "" : "px-clamp pb-[8svh]"}>
        <BeatCard>
          {beat.eyebrow && <p className="label-mono mb-3 text-mute">{beat.eyebrow}</p>}
          <p className="h3 max-w-[24ch] text-ink lg:max-w-[30ch]">{beat.text}</p>
        </BeatCard>
      </div>
    </BeatShell>
  );
}

function Bubble({ speaker, text }: { speaker: "client" | "me"; text: string }) {
  const isMe = speaker === "me";
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      {/* Bubbles sit INSIDE the dialogue card, so the card carries the
          surface [CARD-01] and bubbles only differentiate the speakers. */}
      <div
        className={`max-w-[34ch] rounded-md border-l-2 px-3 py-2.5 ${
          isMe ? "border-l-amber bg-[#efece6]/6" : "border-l-[rgba(239,236,230,0.35)]"
        }`}
      >
        <p className="label-mono mb-1 text-mute">{isMe ? "EIRELE" : "CLIENT"}</p>
        <p className="text-[0.95rem] leading-snug text-ink">{text}</p>
      </div>
    </div>
  );
}

function DialogueView({ beat }: { beat: Extract<Beat, { kind: "dialogue" }> }) {
  const flow = useFlow();
  return (
    <BeatShell beat={beat}>
      {/* [CARD-01] One compact conversation card anchored lower-left —
          previously the bubbles spanned the full clamp width end to end
          (visitor round 12, item 4). */}
      <div className={flow ? "" : "px-clamp pb-[8svh]"}>
        <BeatCard className="max-w-[min(92vw,46ch)]">
          <div className="flex flex-col gap-2">
            {beat.lines.map((line, i) => (
              <Bubble key={i} speaker={line.speaker} text={line.text} />
            ))}
          </div>
        </BeatCard>
      </div>
    </BeatShell>
  );
}

function ChipsView({ beat }: { beat: Extract<Beat, { kind: "chips" }> }) {
  const flow = useFlow();
  const groups = beat.groups ?? (beat.items ? [{ label: "", items: beat.items }] : []);
  return (
    <BeatShell beat={beat}>
      <div className={flow ? "" : "px-clamp pb-[8svh]"}>
        {/* [MOB-01] Tightened on phones so the 4-group stack clears the
            title card on short viewports (development phase). */}
        <BeatCard className="!py-3 lg:!py-5">
          {beat.heading && <p className="h3 mb-3 max-w-[30ch] text-ink lg:mb-4">{beat.heading}</p>}
          <div className="flex flex-col gap-2 lg:gap-3">
            {groups.map((g, gi) => (
              <div key={gi} className="flex flex-wrap items-center gap-1.5 lg:gap-2">
                {g.label && (
                  <span className="label-mono mr-1 w-20 shrink-0 text-mute">{g.label}</span>
                )}
                {g.items.map((item) => (
                  <span
                    key={item}
                    className="chip !px-2.5 !py-[0.2rem] lg:!px-3 lg:!py-[0.3rem]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </BeatCard>
      </div>
    </BeatShell>
  );
}

function CardsView({ beat }: { beat: Extract<Beat, { kind: "cards" }> }) {
  const flow = useFlow();
  // [MOB-01] On phones the 3 stacked project cards (~500px tall) could
  // never fit any band — they became a horizontal snap row; sm+ keeps the
  // grid (2 cols on tablets, 3 on desktop), all bottom-anchored.
  return (
    <BeatShell beat={beat}>
      <div
        // data-lenis-prevent [SCR-12]: with Lenis touch virtualization the
        // card snap-row keeps native touch — horizontal swipes page the
        // cards, vertical swipes chain to the page natively.
        data-lenis-prevent
        className={
          flow
            ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            : "no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-clamp pb-[8svh] sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3"
        }
      >
        {beat.projectIds.map((id) => {
          const p = getProject(id);
          return (
            <article
              key={id}
              className={`glass flex flex-col p-4 ${
                flow ? "" : "w-[min(86vw,320px)] shrink-0 snap-start sm:w-auto"
              }`}
            >
              <h3 className="text-base font-medium text-ink">{p.title}</h3>
              <p className="mt-1.5 text-[0.85rem] leading-snug text-mute">{p.oneLiner}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.stack.map((s) => (
                  <span key={s} className="chip !px-2 !py-0.5 !text-[0.6rem]">
                    {s}
                  </span>
                ))}
              </div>
              {p.metric && (
                <p className="label-mono mt-3 text-amber">
                  {formatNumber(p.metric.value)}
                  {p.metric.suffix} {p.metric.label}
                </p>
              )}
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="label-mono mt-4 inline-flex w-fit items-center gap-1 text-ink underline decoration-line underline-offset-4 hover:decoration-amber"
                onClick={() => track("project_click", { project: p.id })}
              >
                Visit <span aria-hidden="true">↗</span>
              </a>
            </article>
          );
        })}
      </div>
    </BeatShell>
  );
}

/** Scrub-linked counter: value follows the timeline; static shows the final. */
function Counter({
  value,
  suffix,
  window: [winStart, winEnd],
}: {
  value: number;
  suffix: string;
  window: [number, number];
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const tl = useStageTL();

  useGSAP(
    () => {
      if (!tl || !ref.current) return;
      const obj = { v: 0 };
      const write = () => {
        if (ref.current) ref.current.textContent = formatNumber(obj.v) + suffix;
      };
      tl.fromTo(obj, { v: 0 }, { v: value, duration: Math.max(winEnd - winStart, 0.05), ease: "none", onUpdate: write }, winStart);
      write();
      return () => {
        gsap.killTweensOf(obj);
      };
    },
    { dependencies: [tl, value, suffix, winStart, winEnd] },
  );

  // SSR / static / no-JS: the final value, directly.
  return (
    <span ref={ref}>
      {formatNumber(value)}
      {suffix}
    </span>
  );
}

function CountersView({ beat }: { beat: Extract<Beat, { kind: "counters" }> }) {
  const flow = useFlow();
  const end = beat.until ?? 0.97;
  return (
    <BeatShell beat={beat}>
      <div className={flow ? "" : "px-clamp pb-[8svh]"}>
        <BeatCard>
          <dl className="flex flex-wrap gap-x-14 gap-y-6">
            {beat.items.map((item, i) => (
              <div key={i}>
                <dt className="label-mono mb-1 max-w-[24ch] text-mute">{item.label}</dt>
                <dd className="h2 text-amber">
                  <Counter
                    value={item.value}
                    suffix={item.suffix ?? ""}
                    window={[beat.at, Math.min(end, beat.at + 0.2)]}
                  />
                </dd>
              </div>
            ))}
          </dl>
          {beat.footnote && (
            <p className="label-mono mt-8 text-mute opacity-70">{beat.footnote}</p>
          )}
        </BeatCard>
      </div>
    </BeatShell>
  );
}

export function BeatView({ beat }: { beat: Beat }) {
  switch (beat.kind) {
    case "statement":
      return <StatementView beat={beat} />;
    case "dialogue":
      return <DialogueView beat={beat} />;
    case "chips":
      return <ChipsView beat={beat} />;
    case "cards":
      return <CardsView beat={beat} />;
    case "counters":
      return <CountersView beat={beat} />;
    case "visual":
      return <VisualBeatView beat={beat} />;
    default: {
      const never: never = beat;
      return never;
    }
  }
}
