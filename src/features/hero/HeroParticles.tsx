"use client";

import { useEffect, useRef } from "react";
import { heroExitState } from "@/lib/scroll/heroExit";

/**
 * HeroParticles [HERO-01][ADR-001]: ~1,200 tiny dark points (1.5px) with a
 * slow sine-field drift and slight mouse parallax, behind the portrait. On
 * the hero's exit they converge toward the center line and dissolve.
 *
 * Implemented with Canvas2D instead of three.js/R3F: identical visual for
 * this particle count at a fraction of the payload (blueprint 13.1 budget
 * guard explicitly allows the swap). dpr capped [1, 1.5]; count halved on
 * mobile or hardwareConcurrency ≤ 4; the loop pauses when hidden/offscreen;
 * a canvas failure leaves the plain background (no ErrorBoundary needed —
 * every call is guarded here).
 */
const COUNT_BASE = 1200;

export function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowCores = (navigator.hardwareConcurrency || 8) <= 4;
    const small = window.matchMedia("(max-width: 767px)").matches;
    const count = reduced ? 0 : Math.round(COUNT_BASE * (small || lowCores ? 0.5 : 1));
    if (count === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    let running = true;

    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

    interface P {
      x: number;
      y: number;
      fx: number;
      fy: number;
      ph: number;
      amp: number;
      size: number;
    }
    const pts: P[] = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      fx: 0.12 + Math.random() * 0.5,
      fy: 0.1 + Math.random() * 0.4,
      ph: Math.random() * Math.PI * 2,
      amp: 0.008 + Math.random() * 0.028,
      size: 0.9 + Math.random() * 0.9,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMouse = (e: MouseEvent) => {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMouse, { passive: true });

    const onVis = () => {
      visible = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVis);

    let t0 = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || !running) return;
      const t = (now - t0) / 1000;
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;

      const exit = heroExitState.p;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = `rgba(17, 17, 17, ${0.5 * (1 - exit)})`;

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        let x = p.x + Math.sin(t * p.fx + p.ph) * p.amp;
        let y = p.y + Math.cos(t * p.fy + p.ph * 1.7) * p.amp;
        // mouse parallax ≤ 8px
        x += (mouse.x - 0.5) * 0.012;
        y += (mouse.y - 0.5) * 0.008;
        // exit: converge toward the vertical center line, then dissolve
        if (exit > 0) {
          const k = 1 - exit * 0.9;
          x = 0.5 + (x - 0.5) * k;
          y = 0.5 + (y - 0.5) * (1 - exit * 0.55);
        }
        const px = x * w;
        const py = y * h;
        const s = p.size * (1 - exit * 0.8);
        if (s <= 0.1) continue;
        ctx.fillRect(px, py, s, s);
      }
    };
    raf = requestAnimationFrame(frame);

    // Pause entirely when the hero scrolls far out of view.
    const io = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting;
        if (running) t0 = performance.now() - 1000; // avoid a time jump
      },
      { threshold: 0.05 },
    );
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("mousemove", onMouse);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 z-0 h-full w-full"
    />
  );
}
