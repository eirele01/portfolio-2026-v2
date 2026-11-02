/** Shared math helpers. Pure — covered by unit-level assertions in tests. */

export const clamp = (v: number, min: number, max: number): number =>
  Math.min(Math.max(v, min), max);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const mapRange = (
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number => outMin + ((clamp(v, inMin, inMax) - inMin) / (inMax - inMin)) * (outMax - outMin);

export const formatNumber = (v: number): string =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(v);
