"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import type { Scene } from "@/content/schema";
import { useStageTL } from "../PhaseStage";

/**
 * CinematicBackdrop — the dark "stage lighting" that stands in for footage
 * until raw videos are encoded (ADR-003). Abstract light only: it never
 * pretends to be content. Subtle parallax drift is registered on the stage
 * timeline so scrubbing feels connected; static/lite render it still.
 */
const TINTS: Record<Scene["tint"], string> = {
  amber: "255, 180, 84",
  warm: "255, 196, 120",
  ember: "255, 138, 76",
  dawn: "255, 170, 96",
};

export function CinematicBackdrop({
  scene,
  parallax = true,
}: {
  scene: Scene;
  parallax?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const tl = useStageTL();

  useGSAP(
    () => {
      if (!parallax || !tl || !glow.current) return;
      // Very slow drift with the scroll — ease none, ≤ 24px.
      tl.fromTo(
        glow.current,
        { yPercent: -3 },
        { yPercent: 3, duration: 1, ease: "none" },
        0,
      );
    },
    { scope: root, dependencies: [tl, parallax] },
  );

  const rgb = TINTS[scene.tint];
  const glowSize = `${scene.size}vmax`;

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="absolute inset-0 z-0 overflow-hidden bg-[#0a0a0b]"
    >
      <div
        ref={glow}
        className="absolute inset-0"
        style={{
          background: `radial-gradient(${glowSize} ${glowSize} at ${scene.x}% ${scene.y}%, rgba(${rgb}, ${scene.intensity * 0.28}) 0%, rgba(${rgb}, ${scene.intensity * 0.1}) 34%, rgba(10,10,11,0) 68%)`,
        }}
      />
      {/* Second, cooler counter-light keeps the frame from feeling flat */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: `radial-gradient(70vmax 70vmax at ${100 - scene.x}% ${100 - scene.y}%, rgba(120,140,170,0.07) 0%, rgba(10,10,11,0) 60%)`,
        }}
      />
      {/* Vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 45%, rgba(10,10,11,0) 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      {scene.texture === "grid" && (
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(239,236,230,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(239,236,230,0.5) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage:
              "radial-gradient(80% 80% at 50% 50%, black 30%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(80% 80% at 50% 50%, black 30%, transparent 100%)",
          }}
        />
      )}
      {scene.texture === "scan" && (
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(239,236,230,0.6) 0 1px, transparent 1px 5px)",
          }}
        />
      )}
    </div>
  );
}
