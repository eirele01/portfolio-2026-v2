import { execFileSync } from "node:child_process";
import sharp from "sharp";
const clips = [
  ["phase-1", "public/media/video/phase-1.mp4"],
  ["phase-2", "public/media/video/phase-2.mp4"],
  ["phase-6", "public/media/video/phase-6.mp4"],
  ["transition-1-2", "public/media/video/transition-1-2.mp4"],
  ["transition-6-7", "public/media/video/transition-6-7.mp4"],
];
for (const [name, f] of clips) {
  let prev = null, out = [];
  for (let s = 0; s <= 10; s += 0.5) {
    execFileSync("ffmpeg", ["-y","-v","error","-ss",String(s),"-i",f,"-vframes","1","scripts/media/scratch/m.png"]);
    const buf = await sharp("scripts/media/scratch/m.png").resize(48,27,{fit:"fill"}).removeAlpha().raw().toBuffer();
    if (prev) {
      let sum=0; for (let i=0;i<buf.length;i++) sum+=Math.abs(buf[i]-prev[i]);
      out.push((s-0.5).toFixed(1)+"-"+s.toFixed(1)+":"+(sum/buf.length).toFixed(1));
    }
    prev = buf;
  }
  console.log(name, "→", out.join("  "));
}
