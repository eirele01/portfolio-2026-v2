#!/usr/bin/env node
// Probe raw sources vs current encodes — for the clarity round (round 15).
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const UP = "/home/z/my-project/upload/folder";
const VID = "/home/z/my-project/public/media/video";

const RAW = {
  "phase-1": "80aaf055/phase_1_raw_video.mp4",
  "phase-2": "0974cbc2/phase_2_raw_video.mp4",
  "phase-3": "c82b39b6/phase_3_raw_video.mp4",
  "phase-4": "9310de12/phase_4_raw_video.mp4",
  "phase-5": "1c8ac819/phase_5_raw_video.mp4",
  "phase-6": "7d86b20c/phase_6_raw_video.mp4",
  "phase-7": "ee987bd0/phase_7_raw_video.mp4",
  "transition-1-2": "1d247a36/phase_1_transition_to_phase_2_raw_video.mp4",
  "transition-2-3": "0b300858/phase_2_transition_to_phase_3_raw_video.mp4",
  "transition-3-4": "ddd1b6d7/phase_3_transition_to_phase_4_raw_video.mp4",
  "transition-4-5": "8381e31d/phase_4_transition_to_phase_5_raw_video.mp4",
  "transition-5-6": "2bbadb5a/phase_5_transition_to_phase_6_raw_video.mp4",
  "transition-6-7": "71aec005/phase_6_transition_to_phase_7_raw_video.mp4",
};

function probe(f) {
  const out = execFileSync("ffprobe", [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height,r_frame_rate,bit_rate,codec_name",
    "-show_entries", "format=duration,size,bit_rate",
    "-of", "json", f,
  ], { encoding: "utf8" });
  const j = JSON.parse(out);
  const s = j.streams?.[0] ?? {};
  const [n, d] = (s.r_frame_rate ?? "0/1").split("/").map(Number);
  const size = Number(j.format?.size ?? 0);
  const dur = Number(j.format?.duration ?? s.duration ?? 0);
  return {
    w: s.width, h: s.height, fps: d ? n / d : 0, codec: s.codec_name,
    dur: dur.toFixed(1), mb: (size / 1048576).toFixed(2),
    kbps: dur > 0 ? Math.round(size * 8 / 1000 / dur) : 0,
  };
}

console.log("base        | raw                        | full (desktop)              | light (-m)                  ");
console.log("------------|----------------------------|-----------------------------|------------------------------");
let rawTot = 0, fullTot = 0, mTot = 0;
for (const [base, rel] of Object.entries(RAW)) {
  const r = probe(join(UP, rel));
  const f = probe(join(VID, `${base}.mp4`));
  const m = probe(join(VID, `${base}-m.mp4`));
  rawTot += Number(r.mb); fullTot += Number(f.mb); mTot += Number(m.mb);
  console.log(
    `${base.padEnd(11)} | ${`${r.w}x${r.h}@${r.fps.toFixed(0)}`} ${`${r.dur}s`.padStart(5)} ${`${r.mb}MB`.padStart(8)} ${r.codec.padEnd(4)} | ${`${f.w}x${f.h}`} ${`${f.kbps}kbps`.padStart(8)} ${`${f.mb}MB`.padStart(8)} | ${`${m.w}x${m.h}`} ${`${m.kbps}kbps`.padStart(7)} ${`${m.mb}MB`.padStart(7)}`,
  );
}
console.log(`TOTALS      | raw ${rawTot.toFixed(1)} MB               | full ${fullTot.toFixed(1)} MB                  | light ${mTot.toFixed(1)} MB`);
