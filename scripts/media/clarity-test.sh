#!/usr/bin/env bash
# Clarity test matrix on phase-6 (busiest clip) — round 15.
# Baseline is the current live encode. Candidates upscale 720p→1080p.
set -e
RAW=/home/z/my-project/upload/folder/7d86b20c/phase_6_raw_video.mp4
OUT=/tmp/vtest
cd "$OUT"

enc() { # name, crf, preset, extra-vf
  local name=$1 crf=$2 preset=$3 vf=$4
  ffmpeg -y -v error -i "$RAW" -vf "$vf" \
    -c:v libx264 -preset "$preset" -crf "$crf" \
    -g 12 -keyint_min 12 -sc_threshold 0 -bf 0 \
    -pix_fmt yuv420p -an -movflags +faststart "$name.mp4"
  printf "%-22s %8s\n" "$name" "$(du -m "$name.mp4" | cut -f1) MB"
}

# baseline (current live settings, for reference)
cp /home/z/my-project/public/media/video/phase-6.mp4 baseline-1280-crf20.mp4
printf "%-22s %8s\n" "baseline-1280-crf20" "$(du -m baseline-1280-crf20.mp4 | cut -f1) MB"

UP="scale=1920:-2:flags=lanczos"
enc a1080-crf20-vf     20 veryfast "$UP,unsharp=5:5:0.45:5:5:0.0,fps=24"
enc b1080-crf18-vf     18 veryfast "$UP,unsharp=5:5:0.45:5:5:0.0,fps=24"
enc c1080-crf20-slow   20 slow     "$UP,unsharp=5:5:0.45:5:5:0.0,fps=24"
enc d1080-crf20-nosharp 20 veryfast "$UP,fps=24"
enc e1080-crf22-vf     22 veryfast "$UP,unsharp=5:5:0.45:5:5:0.0,fps=24"
echo done
