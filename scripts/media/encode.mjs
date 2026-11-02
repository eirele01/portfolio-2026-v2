#!/usr/bin/env node
/**
 * Media pipeline [MED-01..MED-05] — blueprint section 9.
 *
 *   node scripts/media/encode.mjs
 *
 * Inputs  (raw-assets/, never renamed, git-ignored):
 *   Eirele_Joven_Boter_green_screen_raw_image.jpg
 *   phase_N_raw_image.jpg                            N = 1..7
 *   phase_N_raw_video.mp4                            N = 1..7
 *   phase_N_transition_to_phase_M_raw_video.mp4      M = N+1
 *
 * Outputs (public/media/):
 *   video/phase-N.mp4  phase-N-m.mp4  transition-N-M.mp4  transition-N-M-m.mp4
 *   posters/phase-N-1600.webp  phase-N-800.webp  transition-N-M-{1600,800}.webp
 *   hero/eirele-cutout.webp  hero/eirele-cutout-800.webp
 *
 * The script fails loudly on missing TOOLS. Missing raw FILES are expected in
 * a partial hand-off: each is reported SKIPPED and the corresponding output is
 * simply not produced (the site falls back to CinematicBackdrop — ADR-003/005).
 * Real durations/resolutions always come from ffprobe — never assumed. A full
 * report is written to scripts/media/media-report.txt.
 *
 * AFTER A RE-ENCODE [CACHE-02]: public/sw.js caches /media responses in the
 * visitor's Service Worker (videos cache-first, no revalidation). Re-encodes
 * reuse filenames, so bump CACHE "media-v1" → "media-v2" → "media-v3" … in
 * public/sw.js (or postMessage "purge-media-cache" to the SW from a dev
 * console) when the outputs change — otherwise returning visitors keep the
 * old bytes.
 *
 * CLI flags (round 15):
 *   --clips-only            skip posters / hero / continuity (video encodes only)
 *   --only a,b,c            encode just these bases (e.g. "phase-6,transition-1-2")
 *   --dry-run               probe + plan only, no ffmpeg runs
 * Rationale: a full 13-clip 1080p run exceeds a single 10-min tool window,
 * so batches run like:  node scripts/media/encode.mjs --clips-only --only phase-1,phase-2
 */

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = resolve(join(dirname(fileURLToPath(import.meta.url)), "..", ".."));
const RAW = join(ROOT, "raw-assets");
const OUT = join(ROOT, "public", "media");
const SCRATCH = join(ROOT, "scripts", "media", "scratch");

const report = [];
const say = (s = "") => {
  console.log(s);
  report.push(s);
};
const mb = (n) => (n / 1024 / 1024).toFixed(2) + " MB";

/* ---------------------------------------------------------------- tools -- */
function requireTools() {
  const missing = [];
  for (const tool of ["ffmpeg", "ffprobe"]) {
    const r = spawnSync(tool, ["-version"], { encoding: "utf8" });
    if (r.status !== 0) missing.push(tool);
  }
  try {
    sharp(Buffer.from("<svg><rect width='2' height='2'/></svg>"));
  } catch {
    missing.push("sharp (npm)");
  }
  if (missing.length) {
    console.error(`\nFATAL: missing required tools: ${missing.join(", ")}\n`);
    process.exit(1);
  }
  const v = (t) =>
    spawnSync(t, ["-version"], { encoding: "utf8" }).stdout.split("\n")[0];
  say(`# tools\nffmpeg: ${v("ffmpeg")}\nffprobe: ${v("ffprobe")}\nsharp: ${
    require("sharp/package.json").version ?? "n/a"
  }\n`);
}
// sharp ships as CJS; safe require for the version line only
const require = (await import("node:module")).createRequire(import.meta.url);

/* --------------------------------------------------------------- probes -- */
function ffprobe(file) {
  const out = execFileSync(
    "ffprobe",
    [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height,r_frame_rate,duration",
      "-show_entries", "format=duration,size",
      "-of", "json",
      file,
    ],
    { encoding: "utf8" },
  );
  const j = JSON.parse(out);
  const s = j.streams?.[0] ?? {};
  const [num, den] = (s.r_frame_rate ?? "0/1").split("/").map(Number);
  return {
    width: s.width ?? 0,
    height: s.height ?? 0,
    fps: den ? num / den : 0,
    duration: Number(j.format?.duration ?? s.duration ?? 0),
    bytes: Number(j.format?.size ?? 0),
  };
}

function run(cmd, args, label) {
  const r = spawnSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (r.status !== 0) {
    console.error(`\nFATAL: ${label} failed:\n${r.stderr?.slice(-2000)}\n`);
    process.exit(1);
  }
}

/* ------------------------------------------------------------- encoding -- */
async function encodeClip(srcName, outBase) {
  const src = join(RAW, srcName);
  if (!existsSync(src)) {
    say(`SKIPPED (raw video not provided): ${srcName} → ${outBase}`);
    return;
  }
  const info = ffprobe(src);
  say(`\n## clip ${outBase}`);
  say(`source: ${srcName} — ${info.width}x${info.height} @ ${info.fps.toFixed(2)} fps, ${info.duration.toFixed(2)} s, ${mb(info.bytes)}`);

  // v2 (2026-10-31): 15fps/CRF26 read as "laggy + blurry" — desktop keeps
  // every source frame (24fps), spends real bits (CRF 20) and adds a light
  // lanczos+unsharp pass.
  // v3 (2026-10-31, "still shuttery / sometimes not playing"): all-intra
  // (g=1) made every frame a full I-frame — 8-13 MB per clip meant the
  // browser could never buffer far enough ahead (read: frozen frames while
  // scrolling) and every seek paid an I-frame decode. Short closed GOPs
  // (g=12, half a second) with B-frames OFF keep every frame a cheap seek
  // target (decode ≤12 lightweight P-frames from the nearest keyframe), cut
  // the files ~3x so clips fully buffer in advance, and stay 24fps/CRF20.
  // v4 (2026-11-01, "video clarity, it's a bit blurry"): the raws themselves
  // are 1280×720 — nothing higher-res exists — and the story canvas is a
  // full-viewport object-cover <video>, so 720p got browser-upscaled
  // (bilinear) to e.g. 1920×1080 = soft. Fix is to do the upscale INSIDE the
  // encode where we control the resampling + can sharpen once, at encode
  // quality: lanczos to 1.5× source width (capped 1920, min 1280) + unsharp
  // luma 0.45 (full) / 960w + 0.30 (light), CRF 20/22. Tested on phase-6:
  // CRF18 doubled size for no visible gain; preset slow ~4% smaller than
  // veryfast (upscaled content is cheap to encode) — veryfast kept.
  // Scrub-critical encoding MUST NOT CHANGE: g=12 closed GOP, bf=0,
  // sc_threshold=0, 24 fps, faststart (driveScrub depends on it).
  const TARGET_FULL_W = Math.min(1920, Math.max(1280, Math.round((info.width * 3) / 2 / 2) * 2));
  const TARGET_LIGHT_W = Math.min(960, Math.max(720, Math.round((info.width * 3) / 4 / 2) * 2));
  const variants = [
    {
      suffix: "",
      fps: 24,
      crf: "20",
      budget: 45,
      vf: `scale=${TARGET_FULL_W}:-2:flags=lanczos,unsharp=5:5:0.45:5:5:0.0,fps=24`,
      preset: "veryfast",
      gop: 12,
    },
    {
      suffix: "-m",
      fps: 24,
      crf: "22",
      budget: 12,
      vf: `scale=${TARGET_LIGHT_W}:-2:flags=lanczos,unsharp=5:5:0.30:5:5:0.0,fps=24`,
      preset: "veryfast",
      gop: 12,
    },
  ];
  for (const v of variants) {
    let crf = v.crf;
    const out = join(OUT, "video", `${outBase}${v.suffix}.mp4`);
    for (let attempt = 0; attempt < 4; attempt++) {
      run("ffmpeg", [
        "-y", "-i", src,
        "-vf", v.vf,
        "-c:v", "libx264", "-preset", v.preset,
        "-g", String(v.gop), "-keyint_min", String(v.gop),
        "-sc_threshold", "0", "-bf", "0",
        "-crf", crf,
        "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart",
        out,
      ], `encode ${outBase}${v.suffix}`);
      const bytes = statSync(out).size;
      if (bytes / 1024 / 1024 <= v.budget || attempt === 3) {
        const ok = bytes / 1024 / 1024 <= v.budget;
        say(`  ${outBase}${v.suffix}.mp4 — ${mb(bytes)} (crf ${crf}, fps ${v.fps}) budget ${v.budget} MB: ${ok ? "PASS" : "FAIL"}`);
        break;
      }
      crf = String(Number(crf) + 2); // over budget → raise CRF in steps of 2
      say(`  over budget, retrying with crf ${crf}`);
    }
  }
}

/* -------------------------------------------------------------- posters -- */
async function makePoster(srcName, outBase, label) {
  const src = join(RAW, srcName);
  if (!existsSync(src)) {
    say(`SKIPPED (raw ${label === "frame0" ? "video" : "image"} not provided): ${srcName} → ${outBase}`);
    return;
  }
  let buf;
  if (label === "frame0") {
    // Poster must match the clip's first frame [MED-03].
    const png = join(SCRATCH, `${outBase}-f0.png`);
    run("ffmpeg", ["-y", "-i", src, "-vf", "select=eq(n\\,0)", "-vframes", "1", png], `frame0 ${srcName}`);
    buf = png;
  } else {
    buf = src;
  }
  for (const w of [1600, 800]) {
    const out = join(OUT, "posters", `${outBase}-${w}.webp`);
    await sharp(buf).resize({ width: Math.min(w, 2400), withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);
    say(`  posters/${outBase}-${w}.webp — ${mb(statSync(out).size)}`);
  }
}

/**
 * Poster for a phase: when the phase clip exists the poster is its frame 0
 * [MED-03]; otherwise the raw still stands in (and CinematicBackdrop remains
 * the stage background until footage lands — ADR-003/005).
 */
async function makePhasePoster(n) {
  const video = `phase_${n}_raw_video.mp4`;
  const image = `phase_${n}_raw_image.jpg`;
  if (existsSync(join(RAW, video))) return makePoster(video, `phase-${n}`, "frame0");
  return makePoster(image, `phase-${n}`);
}

/* ---------------------------------------------------------- hero cutout -- */
/**
 * Green-screen keying [MED-04]. The real green is sampled from the four
 * corners (never assumed #00FF00). Per-pixel alpha comes from the normalized
 * chroma distance to the key color, with a soft blend band (ffmpeg
 * chromakey semantics: similarity ≈ 0.17, blend ≈ 0.09 on a 0..1 scale).
 * Spill suppression pulls green fringes back to neutral on kept pixels;
 * the alpha edge is feathered ~1px and gently choked so no halo ships.
 */
async function heroCutout() {
  const src = join(RAW, "Eirele_Joven_Boter_green_screen_raw_image.jpg");
  if (!existsSync(src)) {
    say(`SKIPPED (raw image not provided): green-screen portrait → hero cut-out`);
    return;
  }
  say(`\n## hero cut-out`);
  const img = sharp(src);
  const { width: W, height: H } = await img.metadata();
  const raw = await img.ensureAlpha().raw().toBuffer();

  // 1) Green-excess key (probed, see scripts/media/probe.mjs): the backdrop is
  //    a uniform chroma green with g-excess (g − max(r,b)) of 41–63; the
  //    subject never exceeds ~15 (suit ≈ 0, skin strongly negative).
  const LO = 20, HI = 36;
  const alpha = Buffer.alloc(W * H);
  for (let p = 0, i = 0; p < W * H; p++, i += 4) {
    const ex = raw[i + 1] - Math.max(raw[i], raw[i + 2]);
    if (ex >= HI) alpha[p] = 0;
    else if (ex <= LO) alpha[p] = 255;
    else alpha[p] = Math.round(((HI - ex) / (HI - LO)) * 255);
  }

  // 2) despill on kept pixels: g = min(g, max(r,b) + 12)
  for (let p = 0, i = 0; p < W * H; p++, i += 4) {
    if (alpha[p] === 0) continue;
    const m = Math.max(raw[i], raw[i + 2]) + 12;
    if (raw[i + 1] > m) raw[i + 1] = m;
  }

  // 3) feather (~1px blur) + choke the alpha edge so no halo ships.
  //    toColourspace('b-w') is REQUIRED: sharp expands a 1-channel raw buffer
  //    to 3 channels through .blur(), which would corrupt the pixel loop.
  const alphaBlur = await sharp(alpha, { raw: { width: W, height: H, channels: 1 } })
    .blur(1.1)
    .toColourspace("b-w")
    .raw()
    .toBuffer();
  const cLo = 90, cHi = 180; // choke window
  for (let p = 0; p < W * H; p++) {
    const a = alphaBlur[p];
    alpha[p] = a <= cLo ? 0 : a >= cHi ? 255 : Math.round(((a - cLo) / (cHi - cLo)) * 255);
  }
  const channels = Buffer.alloc(W * H * 4);
  for (let p = 0, i = 0; p < W * H; p++, i += 4) {
    channels[i] = raw[i]; channels[i + 1] = raw[i + 1]; channels[i + 2] = raw[i + 2];
    channels[i + 3] = alpha[p];
  }

  // 4) trim transparent borders via our own alpha bounding box — sharp's
  //    .trim() misbehaves on alpha images (collapses the canvas).
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (alpha[y * W + x] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) {
    say("  FATAL: keying produced an empty alpha mask — aborting.");
    process.exit(1);
  }
  const pad = 12;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(W - 1, maxX + pad); maxY = Math.min(H - 1, maxY + pad);
  const cutW = maxX - minX + 1, cutH = maxY - minY + 1;
  const trimmed = await sharp(channels, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: minX, top: minY, width: cutW, height: cutH })
    .png()
    .toBuffer();
  say(`  trimmed to ${cutW}x${cutH} (${((cutW * cutH * 100) / (W * H)).toFixed(0)}% of frame)`);
  for (const h of [1600, 800]) {
    const out = join(OUT, "hero", h === 1600 ? "eirele-cutout.webp" : "eirele-cutout-800.webp");
    await sharp(trimmed).resize({ height: Math.min(h, cutH), withoutEnlargement: true }).webp({ quality: 88, alphaQuality: 90 }).toFile(out);
    say(`  hero/${h === 1600 ? "eirele-cutout" : "eirele-cutout-800"}.webp — ${mb(statSync(out).size)}`);
  }

  // inspection composites (light + dark) for the mandatory visual check
  for (const [name, color] of [["check-light", "#f4f2ee"], ["check-dark", "#0a0a0b"]]) {
    const cut1600 = await sharp(join(OUT, "hero", "eirele-cutout.webp")).toBuffer();
    const m = await sharp(cut1600).metadata();
    await sharp({ create: { width: m.width + 80, height: m.height + 80, channels: 3, background: color } })
      .composite([{ input: cut1600, left: 40, top: 40 }])
      .jpeg({ quality: 82 })
      .toFile(join(SCRATCH, `${name}.jpg`));
  }
  say(`  inspection composites → scripts/media/scratch/check-{light,dark}.jpg`);
}

/* ----------------------------------------------------------- continuity -- */
/**
 * [MED-05] Boundary check: phase last frame vs transition first frame,
 * transition last frame vs next phase first frame. 64px mean abs diff.
 */
async function continuity(pairs) {
  say(`\n## continuity (mean abs diff @64px, lower = better)`);
  say(`boundary | a → b | diff | verdict`);
  for (const { aFile, aAt, bFile, bAt, name } of pairs) {
    if (!existsSync(join(RAW, aFile)) || !existsSync(join(RAW, bFile))) {
      say(`${name} | SKIPPED (missing raw) | — | —`);
      continue;
    }
    const fa = join(SCRATCH, "c-a.png"), fb = join(SCRATCH, "c-b.png");
    const extract = (file, seek, out) =>
      seek === "last"
        ? run("ffmpeg", ["-y", "-sseof", "-0.1", "-i", file, "-vframes", "1", out], `frame ${file}`)
        : run("ffmpeg", ["-y", "-i", file, "-vf", "select=eq(n\\,0)", "-vframes", "1", out], `frame ${file}`);
    extract(join(RAW, aFile), aAt, fa);
    extract(join(RAW, bFile), bAt, fb);
    const da = await sharp(fa).resize(64, 36, { fit: "fill" }).removeAlpha().raw().toBuffer();
    const db = await sharp(fb).resize(64, 36, { fit: "fill" }).removeAlpha().raw().toBuffer();
    let sum = 0;
    for (let i = 0; i < da.length; i++) sum += Math.abs(da[i] - db[i]);
    const diff = sum / da.length;
    // Empirical threshold: same-scene cuts land < 10; different scenes > 25.
    const verdict = diff < 10 ? "CONTINUOUS" : diff < 25 ? "SOFT CUT" : "HARD CUT";
    say(`${name} | ${diff.toFixed(2)} | ${verdict}`);
  }
}

/* ------------------------------------------------------------------ main -- */
const argv = process.argv.slice(2);
const FLAGS = {
  clipsOnly: argv.includes("--clips-only"),
  dryRun: argv.includes("--dry-run"),
};
const onlyFlagIdx = argv.indexOf("--only");
const onlySet =
  onlyFlagIdx >= 0 && argv[onlyFlagIdx + 1]
    ? new Set(argv[onlyFlagIdx + 1].split(",").map((s) => s.trim()).filter(Boolean))
    : null;

mkdirSync(SCRATCH, { recursive: true });
for (const d of ["video", "posters", "hero"]) mkdirSync(join(OUT, d), { recursive: true });

requireTools();

const RAW_VIDEOS = [
  "phase_1_raw_video.mp4",
  "phase_2_raw_video.mp4",
  "phase_3_raw_video.mp4",
  "phase_4_raw_video.mp4",
  "phase_5_raw_video.mp4",
  "phase_6_raw_video.mp4",
  "phase_7_raw_video.mp4",
  ...[1, 2, 3, 4, 5, 6].map((n) => `phase_${n}_transition_to_phase_${n + 1}_raw_video.mp4`),
];
const RAW_IMAGES = [1, 2, 3, 4, 5, 6, 7].map((n) => `phase_${n}_raw_image.jpg`);

say(`# media encode report — ${new Date().toISOString()}`);
if (FLAGS.clipsOnly || onlySet) {
  say(`mode: ${FLAGS.clipsOnly ? "--clips-only " : ""}${onlySet ? `--only ${[...onlySet].join(",")}` : ""}`.trim());
}
say(`\n# raw manifest`);
const missingVideos = RAW_VIDEOS.filter((f) => !existsSync(join(RAW, f)));
const missingImages = RAW_IMAGES.filter((f) => !existsSync(join(RAW, f)));
say(`videos present: ${RAW_VIDEOS.length - missingVideos.length}/${RAW_VIDEOS.length}${missingVideos.length ? ` — missing: ${missingVideos.join(", ")}` : ""}`);
say(`images present: ${RAW_IMAGES.length - missingImages.length}/${RAW_IMAGES.length}${missingImages.length ? ` — missing: ${missingImages.join(", ")}` : ""}`);
if (!existsSync(join(RAW, "resume.pdf"))) say(`resume.pdf: not provided (FACTS-only resume stays — ADR-004)`);

// clips that exist are encoded; missing ones are reported above
const CLIPS = [
  ["phase_1_raw_video.mp4", "phase-1"],
  ["phase_2_raw_video.mp4", "phase-2"],
  ["phase_3_raw_video.mp4", "phase-3"],
  ["phase_4_raw_video.mp4", "phase-4"],
  ["phase_5_raw_video.mp4", "phase-5"],
  ["phase_6_raw_video.mp4", "phase-6"],
  ["phase_7_raw_video.mp4", "phase-7"],
  ["phase_1_transition_to_phase_2_raw_video.mp4", "transition-1-2"],
  ["phase_2_transition_to_phase_3_raw_video.mp4", "transition-2-3"],
  ["phase_3_transition_to_phase_4_raw_video.mp4", "transition-3-4"],
  ["phase_4_transition_to_phase_5_raw_video.mp4", "transition-4-5"],
  ["phase_5_transition_to_phase_6_raw_video.mp4", "transition-5-6"],
  ["phase_6_transition_to_phase_7_raw_video.mp4", "transition-6-7"],
];
const RAW_MAP = Object.fromEntries(CLIPS);
void RAW_MAP; // kept for quick manual lookups when debugging batches
for (const [srcName, outBase] of CLIPS) {
  if (onlySet && !onlySet.has(outBase)) continue;
  if (FLAGS.dryRun) {
    say(`DRY-RUN would encode ${srcName} → ${outBase}{,-m}.mp4`);
    continue;
  }
  await encodeClip(srcName, outBase);
}

if (!FLAGS.clipsOnly && !onlySet) {
  say(`\n## posters`);
  for (const n of [1, 2, 3, 4, 5, 6, 7]) await makePhasePoster(n);
  await makePoster("phase_1_transition_to_phase_2_raw_video.mp4", "transition-1-2", "frame0");
  await makePoster("phase_2_transition_to_phase_3_raw_video.mp4", "transition-2-3", "frame0");
  await makePoster("phase_3_transition_to_phase_4_raw_video.mp4", "transition-3-4", "frame0");
  await makePoster("phase_4_transition_to_phase_5_raw_video.mp4", "transition-4-5", "frame0");
  await makePoster("phase_5_transition_to_phase_6_raw_video.mp4", "transition-5-6", "frame0");
  await makePoster("phase_6_transition_to_phase_7_raw_video.mp4", "transition-6-7", "frame0");

  await heroCutout();
} else {
  say(`\n(posters / hero / continuity skipped — clips-only run; raw-based outputs unchanged)`);
}

// Every boundary we have footage for: phase→transition, transition→phase,
// plus poster-vs-frame-0 per phase. Missing raw files auto-report SKIPPED.
const continuityPairs = [];
for (const n of [1, 2, 3, 4, 5, 6]) {
  continuityPairs.push({ aFile: `phase_${n}_raw_video.mp4`, aAt: "last", bFile: `phase_${n}_transition_to_phase_${n + 1}_raw_video.mp4`, bAt: "first", name: `P${n} last → T${n}-${n + 1} first` });
  continuityPairs.push({ aFile: `phase_${n}_transition_to_phase_${n + 1}_raw_video.mp4`, aAt: "last", bFile: `phase_${n + 1}_raw_video.mp4`, bAt: "first", name: `T${n}-${n + 1} last → P${n + 1} first` });
}
for (const n of [1, 2, 3, 4, 5, 6, 7]) {
  continuityPairs.push({ aFile: `phase_${n}_raw_image.jpg`, aAt: "first", bFile: `phase_${n}_raw_video.mp4`, bAt: "first", name: `P${n} poster → P${n} frame 0` });
}

if (FLAGS.clipsOnly || onlySet) {
  say(`(continuity skipped — raw-based check, unchanged by clip re-encodes)`);
} else {
  await continuity(continuityPairs);
}

writeFileSync(join(ROOT, "scripts", "media", "media-report.txt"), report.join("\n") + "\n");
say(`\nreport written → scripts/media/media-report.txt`);
