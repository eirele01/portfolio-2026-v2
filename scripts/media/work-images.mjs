#!/usr/bin/env node
/**
 * Work-section image assets [WORK-01]:
 *  - optimize the 5 captured screenshots → public/media/work/<id>.jpg
 *  - generate designed placeholders (ink bg, amber rule, monogram) for the
 *    sites the sandbox could not reach (DNS) or that sit behind a Cloudflare
 *    JS challenge (headless can't pass) — owner will replace with real shots.
 * Review sheet → scripts/media/scratch/work-sheet.png
 *
 * 2026-11-02 [WORK-IMG-01]: brilliantpos + duff-street were replaced by
 * OWNER-SUPPLIED captures — see scripts/media/swap-work-images.mjs (the
 * only writer of those two files; this script deliberately no longer
 * lists them, so a regenerate-everything run cannot clobber the swaps).
 */
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const SHOTS = "/tmp/shots";
const OUT = "/home/z/my-project/public/media/work";
mkdirSync(OUT, { recursive: true });
mkdirSync("/home/z/my-project/scripts/media/scratch", { recursive: true });

const W = 1280, H = 800;

// 5 real captures (brilliantpos renders unstyled in headless — placeholder;
// owner capture swapped in 2026-11-02, see swap-work-images.mjs)
const REAL = ["reservation-ph", "tensei", "reyes-gym", "cozycare", "upload2earn"];
// 2 remaining placeholders (id, initial, name, tag, reason)
const PLACEHOLDER = [
  { id: "baganivpn", initial: "B", name: "BAGANI VPN", tag: "VPN · SECURITY TOOL", note: "screenshot pending — domain unreachable from build sandbox" },
  { id: "pinoyinternethub", initial: "P", name: "PINOY INTERNET HUB", tag: "NETWORK TOOLING", note: "screenshot pending — domain unreachable from build sandbox" },
];

function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

function placeholderSvg({ initial, name, tag, note }) {
  // dotted texture + amber rule + huge monogram — matches the portfolio's
  // mono/label language; clearly a stand-in, still handsome on a card.
  const dots = [];
  for (let y = 40; y < H; y += 56) {
    for (let x = 40; x < W; x += 56) {
      dots.push(`<circle cx="${x}" cy="${y}" r="1.1" fill="#f4f2ee" opacity="0.07"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#101013"/>
      <stop offset="1" stop-color="#0a0a0b"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.78" cy="0.24" r="0.75">
      <stop offset="0" stop-color="#ffb454" stop-opacity="0.16"/>
      <stop offset="0.6" stop-color="#ffb454" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${dots.join("")}
  <text x="64" y="96" font-family="DejaVu Sans Mono, monospace" font-size="21" letter-spacing="6" fill="#9a968e">${esc(tag)}</text>
  <rect x="64" y="120" width="72" height="3" fill="#f0a13e"/>
  <text x="58" y="620" font-family="DejaVu Sans Mono, monospace" font-weight="bold" font-size="430" fill="#f4f2ee" opacity="0.10">${esc(initial)}</text>
  <text x="64" y="560" font-family="DejaVu Sans Mono, monospace" font-size="64" letter-spacing="2" fill="#f4f2ee">${esc(name)}</text>
  <text x="64" y="712" font-family="DejaVu Sans Mono, monospace" font-size="19" letter-spacing="2" fill="#7b776f">${esc(note)}</text>
</svg>`;
}

const results = [];
for (const id of REAL) {
  const src = join(SHOTS, `${id}.png`);
  if (!existsSync(src)) { results.push([id, "MISSING"]); continue; }
  const out = join(OUT, `${id}.jpg`);
  await sharp(src).resize(W, H, { fit: "cover", position: "top" }).jpeg({ quality: 80, progressive: true, mozjpeg: true }).toFile(out);
  results.push([id, "real"]);
}
for (const p of PLACEHOLDER) {
  const out = join(OUT, `${p.id}.jpg`);
  await sharp(Buffer.from(placeholderSvg(p))).jpeg({ quality: 88, mozjpeg: true }).toFile(out);
  results.push([p.id, "placeholder"]);
}

// contact sheet for one-shot review (3 cols × 3 rows of 320×200 thumbs)
const thumbs = [];
for (const r of results) {
  thumbs.push(await sharp(join(OUT, `${r[0]}.jpg`)).resize(320, 200, { fit: "cover" }).toBuffer());
}
const comps = thumbs.map((input, i) => ({ input, left: (i % 3) * 330 + 5, top: Math.floor(i / 3) * 210 + 5 }));
await sharp({ create: { width: 1000, height: 640, channels: 3, background: "#222" } })
  .composite(comps)
  .png()
  .toFile("/home/z/my-project/scripts/media/scratch/work-sheet.png");

console.log(results.map((r) => r.join(": ")).join("\n"));
const { statSync } = await import("node:fs");
for (const r of results) {
  const kb = Math.round(statSync(join(OUT, `${r[0]}.jpg`)).size / 1024);
  console.log(`${r[0]}.jpg ${kb} KB`);
}
