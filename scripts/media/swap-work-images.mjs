#!/usr/bin/env node
/**
 * Owner-supplied work-card captures [WORK-IMG-01] (2026-11-02).
 *
 * Swaps the two designed placeholder cards for real screenshots the owner
 * pasted into chat (originals under upload/, git-ignored):
 *   - brilliantpos  ← upload/pasted_image_1793614832880.png (1904×945)
 *       artifact: cookie-consent banner bottom-left (~y>674) + white
 *       content strip below the hero (~y>746) → crop above the banner.
 *   - duff-street   ← upload/pasted_image_1793507399619.png (1919×942)
 *       artifacts: browser scrollbar on the right edge (x≥1904) and a
 *       reCAPTCHA badge bottom-left (x≤64) → crop both edges off.
 *
 * Output: public/media/work/<id>.jpg — 1280×720, mozjpeg q80 (same
 * conventions as work-images.mjs). Caching: the work jpgs are ≤2 MB, so
 * the media SW serves them stale-while-revalidate and the swap self-heals
 * on the next visit — NO media-v CACHE bump (that would also evict every
 * returning visitor's cached video; see public/sw.js POLICY).
 *
 * Rerun safety: work-images.mjs no longer lists these two ids as
 * placeholders, so a regenerate-everything run cannot clobber them.
 * Review sheet → scripts/media/scratch/work-swap-sheet.png (this run) —
 * work-images.mjs keeps writing the full 3×3 sheet for the whole shelf.
 */
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const UP = "/home/z/my-project/upload";
const OUT = "/home/z/my-project/public/media/work";
const SCRATCH = "/home/z/my-project/scripts/media/scratch";
mkdirSync(OUT, { recursive: true });
mkdirSync(SCRATCH, { recursive: true });

const W = 1280, H = 720;

/** cover-resize an already-cropped region to the card raster */
async function card(src, region, out, position = "centre") {
  let img = sharp(src);
  if (region) img = img.extract(region);
  await img
    .resize(W, H, { fit: "cover", position })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 80, progressive: true, mozjpeg: true })
    .toFile(out);
}

// --- candidates (review before keeping) -----------------------------------
// brilliantpos — A: crop above banner, centred (loses navbar logo)
await card(`${UP}/pasted_image_1793614832880.png`,
  { left: 0, top: 0, width: 1904, height: 670 }, `${SCRATCH}/bA.jpg`);
// brilliantpos — B: crop above banner, left-anchored (keeps navbar logo)
await card(`${UP}/pasted_image_1793614832880.png`,
  { left: 0, top: 0, width: 1904, height: 670 }, `${SCRATCH}/bB.jpg`, "left");
// brilliantpos — C: crop banner column + white strip away (keeps most)
await card(`${UP}/pasted_image_1793614832880.png`,
  { left: 470, top: 0, width: 1434, height: 746 }, `${SCRATCH}/bC.jpg`);
// duff-street — A: trim scrollbar (right) + reCAPTCHA badge (left)
await card(`${UP}/pasted_image_1793507399619.png`,
  { left: 64, top: 0, width: 1840, height: 942 }, `${SCRATCH}/dA.jpg`);

// --- 2×2 review sheet ------------------------------------------------------
const thumbs = [];
for (const id of ["bA", "bB", "bC", "dA"]) {
  thumbs.push(await sharp(`${SCRATCH}/${id}.jpg`).resize(620, 349, { fit: "cover" }).toBuffer());
}
const label = (t) => Buffer.from(
  `<svg width="620" height="40"><rect width="620" height="40" fill="#111"/><text x="12" y="27" font-family="monospace" font-size="20" fill="#ffb454">${t}</text></svg>`);
const comps = thumbs.flatMap((input, i) => [
  { input, left: (i % 2) * 630 + 5, top: Math.floor(i / 2) * 394 + 5 },
  { input: label(["bA centre", "bB left-anchored", "bC banner-column cropped", "dA edges trimmed"][i]),
    left: (i % 2) * 630 + 5, top: Math.floor(i / 2) * 394 + 5 + 349 },
]);
await sharp({ create: { width: 1270, height: 793, channels: 3, background: "#222" } })
  .composite(comps).png().toFile(`${SCRATCH}/work-swap-sheet.png`);
console.log("candidates written: bA bB bC dA + work-swap-sheet.png");

// --- FINAL (picked after review: bA centre / dA) ---------------------------
await card(`${UP}/pasted_image_1793614832880.png`,
  { left: 0, top: 0, width: 1904, height: 670 }, `${OUT}/brilliantpos.jpg`);
await card(`${UP}/pasted_image_1793507399619.png`,
  { left: 64, top: 0, width: 1840, height: 942 }, `${OUT}/duff-street.jpg`);

const { statSync } = await import("node:fs");
for (const id of ["brilliantpos", "duff-street"]) {
  const kb = Math.round(statSync(`${OUT}/${id}.jpg`).size / 1024);
  console.log(`${id}.jpg written — ${kb} KB`);
}
