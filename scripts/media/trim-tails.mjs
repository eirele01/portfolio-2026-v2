#!/usr/bin/env node
/**
 * Tail-trim pass [SCR-08] — visitor feedback: "every end of the video has a
 * long pause". Every encoded clip ends with a frozen hold (inter-frame
 * motion ≈ 0 for the last 0.5–1.5s); scrubbed, that reads as a dead pause
 * before the next clip fades in.
 *
 * For each of the 13 clips (desktop + -m variants) this measures per-0.25s
 * motion on the ENCODED file, finds the trailing frozen run, and cuts the
 * file at frozenStart + PAD. The clips are all-intra (g=1), so a stream-copy
 * cut (`-c copy`) is frame-exact and instant — no re-encode, no quality
 * loss, no size blow-up. The scrub maps playhead → duration, so shorter
 * files simply re-pace themselves.
 *
 *   node scripts/media/trim-tails.mjs [--dry]
 */

import { execFileSync } from "node:child_process";
import { existsSync, renameSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = resolve(join(dirname(fileURLToPath(import.meta.url)), "..", ".."));
const VIDEO = join(ROOT, "public", "media", "video");
const SCRATCH = join(ROOT, "scripts", "media", "scratch");
const DRY = process.argv.includes("--dry");

const CLIPS = [
  "phase-1", "phase-2", "phase-3", "phase-4", "phase-5", "phase-6", "phase-7",
  "transition-1-2", "transition-2-3", "transition-3-4",
  "transition-4-5", "transition-5-6", "transition-6-7",
];

// Frozen = mean abs frame diff below this (48px sampling, 0..255 scale).
const STILL = 0.8;
// Keep this much real time after the last moving frame.
const PAD = 0.45;
// Never trim more than this fraction of a clip (safety).
const MAX_TRIM_FRAC = 0.25;

const mb = (n) => (n / 1024 / 1024).toFixed(2) + " MB";

function probe(file) {
  const out = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
    { encoding: "utf8" },
  ).trim();
  return Number(out);
}

function frameAt(file, t) {
  const png = join(SCRATCH, "tt-frame.png");
  execFileSync("ffmpeg", ["-y", "-v", "error", "-ss", String(t), "-i", file, "-vframes", "1", png]);
  return sharp(png).resize(48, 27, { fit: "fill" }).removeAlpha().raw().toBuffer();
}

async function frozenTailStart(file, duration) {
  // Walk backward in 0.25s steps while frames stay still.
  let prev = await frameAt(file, duration - 0.05);
  let t = duration;
  const step = 0.25;
  while (t > 1) {
    const next = Math.max(0, t - step);
    const buf = await frameAt(file, next);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += Math.abs(buf[i] - prev[i]);
    const diff = sum / buf.length;
    if (diff >= STILL) break; // found motion between next and t
    prev = buf;
    t = next;
  }
  return t; // motion happens between t and t+step
}

for (const base of CLIPS) {
  const variants = [`${base}.mp4`, `${base}-m.mp4`].filter((f) => existsSync(join(VIDEO, f)));
  if (!variants.length) {
    console.log(`SKIP ${base}: no encoded variants`);
    continue;
  }
  const ref = join(VIDEO, variants[0]);
  const dur = probe(ref);
  const tailStart = await frozenTailStart(ref, dur);
  const cut = Math.min(dur, tailStart + PAD);
  const trim = dur - cut;
  if (trim < 0.3 || trim > dur * MAX_TRIM_FRAC) {
    console.log(`KEEP ${base}: ${dur.toFixed(2)}s (frozen tail ${trim.toFixed(2)}s — within tolerance)`);
    continue;
  }
  for (const v of variants) {
    const f = join(VIDEO, v);
    const before = statSync(f).size;
    if (DRY) {
      console.log(`DRY ${v}: ${dur.toFixed(2)}s → ${cut.toFixed(2)}s (${mb(before)})`);
      continue;
    }
    const tmp = f.replace(/\.mp4$/, ".trim.mp4");
    execFileSync("ffmpeg", [
      "-y", "-v", "error", "-i", f,
      "-t", cut.toFixed(3),
      "-c", "copy", "-movflags", "+faststart",
      tmp,
    ]);
    const newDur = probe(tmp);
    if (newDur < dur * 0.5) {
      console.log(`ABORT ${v}: trimmed probe ${newDur.toFixed(2)}s looks wrong`);
      execFileSync("rm", ["-f", tmp]);
      continue;
    }
    renameSync(tmp, f);
    console.log(
      `TRIM ${v}: ${dur.toFixed(2)}s → ${newDur.toFixed(2)}s  ${mb(before)} → ${mb(statSync(f).size)}`,
    );
  }
}
console.log("done");
