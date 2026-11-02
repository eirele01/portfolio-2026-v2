"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useStageTL } from "../PhaseStage";
import { VisualShell, type VisualProps } from "./SketchToUi";
import { flags } from "@/content/flags";

/**
 * Architecture diagram (SVG) [Phase 3, Beat 2]: Client → API (Laravel) →
 * Database / MQTT broker → Devices, plus a WebSocket edge back to Client.
 * Edges draw via stroke-dashoffset; as each completes, an accent "packet"
 * rides it via path.getPointAtLength. Nodes are focusable with one-line
 * tooltips (hover/focus). The optional AI layer renders only when
 * flags.showAiNode is true (FACTS: none yet → renders nothing).
 */

interface Node {
  id: string;
  label: string;
  tip: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const NODES: Node[] = [
  { id: "client", label: "Client", tip: "Where the household controls everything — mobile-first", x: 24, y: 168, w: 118, h: 56 },
  { id: "api", label: "API · Laravel", tip: "REST APIs and the WebSocket server", x: 250, y: 168, w: 150, h: 56 },
  { id: "db", label: "Database", tip: "Users, rooms and device data", x: 520, y: 36, w: 150, h: 56 },
  { id: "mqtt", label: "MQTT broker", tip: "Message broker for device telemetry", x: 520, y: 168, w: 150, h: 56 },
  { id: "devices", label: "Devices", tip: "SwitchBot · LoRaWAN hardware", x: 520, y: 300, w: 150, h: 56 },
];

const EDGES = [
  { id: "e1", d: "M142,196 L250,196" }, // Client → API
  { id: "e2", d: "M400,178 C440,120 470,84 520,64" }, // API → Database
  { id: "e3", d: "M400,196 L520,196" }, // API → MQTT broker
  { id: "e4", d: "M595,224 L595,300" }, // MQTT broker → Devices
];

// WebSocket edge: dashed accent curve back from API to Client.
const WS_EDGE = "M250,176 C190,108 130,108 84,168";

export function ArchitectureDiagram({ beat }: VisualProps) {
  const win: [number, number] = [beat.at, Math.min(beat.until ?? 0.76, 0.98)];
  const root = useRef<HTMLDivElement>(null);
  const tl = useStageTL();
  const packet = useRef<SVGCircleElement>(null);

  useGSAP(
    () => {
      if (!tl || !root.current) return;
      const [start, end] = win;
      const span = end - start;

      // Nodes fade in, staggered.
      const nodes = root.current.querySelectorAll<SVGGElement>("[data-node]");
      nodes.forEach((n, i) => {
        tl.fromTo(
          n,
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, duration: span * 0.06, ease: "power3.out" },
          start + span * 0.05 * i,
        );
      });

      // Edges draw one after another; a packet rides each completing edge.
      const paths = Array.from(
        root.current.querySelectorAll<SVGPathElement>("[data-edge]"),
      );
      const dot = packet.current;
      paths.forEach((p, i) => {
        const t0 = start + span * (0.2 + i * 0.14);
        tl.fromTo(
          p,
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: span * 0.09, ease: "none" },
          t0,
        );
        if (!dot) return;
        const len = p.getTotalLength();
        const state = { p: 0 };
        const place = () => {
          const pt = p.getPointAtLength(state.p * len);
          dot.setAttribute("cx", String(pt.x));
          dot.setAttribute("cy", String(pt.y));
        };
        tl.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: span * 0.015 }, t0);
        tl.fromTo(
          state,
          { p: 0 },
          { p: 1, duration: span * 0.1, ease: "none", onUpdate: place },
          t0 + span * 0.04,
        );
        if (i === paths.length - 1) {
          tl.to(dot, { autoAlpha: 0, duration: span * 0.02 }, end - span * 0.02);
        }
      });

      // WebSocket dashed edge draws last.
      const ws = root.current.querySelector<SVGPathElement>("[data-ws]");
      if (ws) {
        tl.fromTo(
          ws,
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: span * 0.1, ease: "none" },
          start + span * 0.78,
        );
      }
    },
    { scope: root, dependencies: [tl, win[0], win[1]] },
  );

  return (
    <VisualShell
      beat={beat}
      card
      /* [CARD-01] Warm dark tint so the card reads as a DIFFERENT surface
       * from the diagram's own near-black node fills (visitor round 12,
       * item 7: "make sure the diagram is readable, not same color of the
       * card") — node fills were bumped to 0.92 alpha to keep separation. */
      cardClassName="[--card-bg:rgba(32,26,16,0.78)] [--card-line:rgba(255,180,84,0.28)]"
    >
      {/* [VIS-01] Definite width — the old `w-full max-w-[680px]` shrink-wrapped
       * to the SVG's 300×150 default intrinsic size inside the fit-content
       * card, so the diagram rendered at 300px (visitor round 17: "make it
       * normal size"). The svh term guards short viewports (card must stay
       * clear of the StageLabel card above the lower-left anchor) and the
       * calc term caps at the shell's real content width (vw is NOT a bound
       * for a shrink-to-fit flex item — without it the card overflowed and
       * got clipped on phones). */}
      <div ref={root} className="w-[min(720px,86svh,calc(100vw_-_2*clamp(20px,_5vw,_72px)_-_40px))]">
        <svg
          viewBox="0 0 700 400"
          className="h-auto w-full"
          role="group"
          aria-label="System architecture: Client connects to a Laravel API, which stores data, talks to an MQTT broker, and reaches SwitchBot and LoRaWAN devices. A WebSocket streams updates back to the client."
        >
          {EDGES.map((e) => (
            <path
              key={e.id}
              data-edge
              d={e.d}
              fill="none"
              stroke="rgba(239,236,230,0.4)"
              strokeWidth="1.5"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={0}
            />
          ))}
          <path
            data-ws
            d={WS_EDGE}
            fill="none"
            stroke="#ffb454"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            pathLength={1}
            strokeDashoffset={0}
            opacity={0.9}
          />
          <circle ref={packet} r="4" fill="#ffb454" opacity={0} />

          {NODES.map((n) => (
            <g
              key={n.id}
              data-node
              tabIndex={0}
              role="img"
              aria-label={`${n.label}: ${n.tip}`}
              className="group cursor-help"
            >
              <rect
                x={n.x}
                y={n.y}
                width={n.w}
                height={n.h}
                rx={6}
                fill="rgba(8,8,10,0.92)"
                stroke="rgba(239,236,230,0.34)"
                strokeWidth={1}
                className="transition-colors group-focus-visible:stroke-[#ffb454] group-hover:stroke-[rgba(255,180,84,0.6)]"
              />
              <text
                x={n.x + n.w / 2}
                y={n.y + n.h / 2 + 4}
                textAnchor="middle"
                className="fill-[#efece6] font-mono text-[13px]"
              >
                {n.label}
              </text>
              <g className="pointer-events-none opacity-0 transition-opacity duration-200 group-focus-visible:opacity-100 group-hover:opacity-100">
                <rect
                  x={n.x}
                  y={n.y - 32}
                  width={Math.max(n.w, n.tip.length * 6.6 + 16)}
                  height={24}
                  rx={4}
                  fill="#1a1a1e"
                  stroke="rgba(239,236,230,0.2)"
                />
                <text x={n.x + 8} y={n.y - 16} className="fill-[#efece6]/80 font-mono text-[11px]">
                  {n.tip}
                </text>
              </g>
            </g>
          ))}

          <text x={112} y={138} className="fill-[#ffb454] font-mono text-[11px] opacity-90">
            WebSocket
          </text>

          {/* Optional AI layer — renders nothing while flags.showAiNode is false [FACTS] */}
          {flags.showAiNode && (
            <g data-node tabIndex={0} role="img" aria-label="AI layer: analysis and automation on top of the platform">
              <rect x={250} y={300} width={150} height={56} rx={6} fill="rgba(10,10,11,0.72)" stroke="#ffb454" strokeDasharray="4 4" />
              <text x={325} y={332} textAnchor="middle" className="fill-[#ffb454] font-mono text-[13px]">
                AI layer
              </text>
            </g>
          )}
        </svg>
      </div>
    </VisualShell>
  );
}
