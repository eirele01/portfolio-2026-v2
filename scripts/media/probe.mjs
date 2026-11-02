import sharp from "sharp";
import { execFileSync } from "node:child_process";

const GS = "raw-assets/Eirele_Joven_Boter_green_screen_raw_image.jpg";
const img = sharp(GS);
const { width: W, height: H } = await img.metadata();
console.log(`green screen: ${W}x${H}`);
const raw = await img.raw().toBuffer();
const px = (x, y) => {
  const i = (y * W + x) * 3;
  return [raw[i], raw[i + 1], raw[i + 2]];
};
const gEx = ([r, g, b]) => g - Math.max(r, b);

// sample a grid across the background edges and the subject
const pts = [];
for (const f of [0.02, 0.08, 0.25, 0.5, 0.75, 0.92, 0.98]) {
  pts.push([`top ${f}`, Math.round(W * f), Math.round(H * 0.02)]);
  pts.push([`bot ${f}`, Math.round(W * f), Math.round(H * 0.98)]);
  pts.push([`left ${f}`, Math.round(W * 0.02), Math.round(H * f)]);
  pts.push([`right ${f}`, Math.round(W * 0.98), Math.round(H * f)]);
}
pts.push(["center (subject)", Math.round(W * 0.5), Math.round(H * 0.45)]);
pts.push(["face", Math.round(W * 0.5), Math.round(H * 0.18)]);
pts.push(["suit", Math.round(W * 0.5), Math.round(H * 0.35)]);
for (const [label, x, y] of pts) {
  const [r, g, b] = px(x, y);
  console.log(`${label.padEnd(16)} (${String(x).padStart(4)},${String(y).padStart(4)}) rgb(${r},${g},${b}) g-excess=${gEx([r, g, b])}`);
}

// histogram of g-excess over the whole image
const hist = new Array(32).fill(0);
for (let i = 0; i < raw.length; i += 3) {
  const ex = raw[i + 1] - Math.max(raw[i], raw[i + 2]);
  const bin = Math.max(0, Math.min(31, Math.round((ex + 40) / 8)));
  hist[bin]++;
}
const total = raw.length / 3;
console.log("\ng-excess histogram (bin: count%, range):");
hist.forEach((c, i) => {
  const pct = ((c / total) * 100).toFixed(2);
  if (c / total > 0.001) console.log(`  ${String(i).padStart(2)}: ${pct.padStart(5)}%  ex ∈ [${i * 8 - 40}, ${i * 8 - 33}]`);
});

// frame-0 sanity: extract video frames and compare to raw image
for (const [name, args] of [
  ["p1-f0", ["-y", "-i", "raw-assets/phase_1_raw_video.mp4", "-vf", "select=eq(n\\,0)", "-vframes", "1", "scripts/media/scratch/p1-f0.png"]],
  ["p1-mid", ["-y", "-i", "raw-assets/phase_1_raw_video.mp4", "-vf", "select=eq(n\\,120)", "-vframes", "1", "scripts/media/scratch/p1-mid.png"]],
  ["p1-last", ["-y", "-sseof", "-0.1", "-i", "raw-assets/phase_1_raw_video.mp4", "-vframes", "1", "scripts/media/scratch/p1-last.png"]],
  ["t12-f0", ["-y", "-i", "raw-assets/phase_1_transition_to_phase_2_raw_video.mp4", "-vf", "select=eq(n\\,0)", "-vframes", "1", "scripts/media/scratch/t12-f0.png"]],
  ["t12-last", ["-y", "-sseof", "-0.1", "-i", "raw-assets/phase_1_transition_to_phase_2_raw_video.mp4", "-vframes", "1", "scripts/media/scratch/t12-last.png"]],
  ["p2-f0", ["-y", "-i", "raw-assets/phase_2_raw_video.mp4", "-vf", "select=eq(n\\,0)", "-vframes", "1", "scripts/media/scratch/p2-f0.png"]],
]) {
  execFileSync("ffmpeg", args, { stdio: "ignore" });
  console.log(`extracted ${name}`);
}
const stat = async (f) => {
  const s = await sharp(f).resize(64, 36, { fit: "fill" }).removeAlpha().raw().toBuffer();
  return s;
};
const diff = async (a, b) => {
  const da = await stat(a), db = await stat(b);
  let sum = 0;
  for (let i = 0; i < da.length; i++) sum += Math.abs(da[i] - db[i]);
  return (sum / da.length).toFixed(2);
};
console.log("\ndiffs:");
console.log("  p1 image vs p1-f0:  ", await diff(GS.replace(/^/, ""), "scripts/media/scratch/p1-f0.png"));
console.log("  p1 image vs p1-mid: ", await diff("scripts/media/scratch/p1-mid.png", "scripts/media/scratch/p1-f0.png"));
console.log("  p1-f0 vs t12-f0:    ", await diff("scripts/media/scratch/p1-f0.png", "scripts/media/scratch/t12-f0.png"));
console.log("  p1-last vs t12-f0:  ", await diff("scripts/media/scratch/p1-last.png", "scripts/media/scratch/t12-f0.png"));
console.log("  t12-last vs p2-f0:  ", await diff("scripts/media/scratch/t12-last.png", "scripts/media/scratch/p2-f0.png"));
