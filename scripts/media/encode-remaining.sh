#!/usr/bin/env bash
# Encode remaining clip variants one ffmpeg invocation at a time.
# The full encode.mjs run keeps getting killed mid-way in this sandbox
# (3 silent deaths), so each variant is its own short-lived process and is
# ffprobe-verified (fps must be 24) before moving on.
set -u
cd /home/z/my-project
RAW=raw-assets
OUT=public/media/video
V_DESK="scale='min(1280,iw)':-2:flags=lanczos,unsharp=5:5:0.35:5:5:0.0,fps=24"
V_MOB="scale='min(720,iw)':-2:flags=lanczos,fps=24"

enc() { # src out vf crf
  local src="$1" out="$2" vf="$3" crf="$4"
  if [ -f "$out" ]; then
    local fps
    fps=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$out")
    if [ "$fps" = "24/1" ]; then echo "SKIP (already 24fps): $out"; return 0; fi
  fi
  echo "ENC $out"
  ffmpeg -y -i "$src" -vf "$vf" -c:v libx264 -preset veryfast -g 1 -crf "$crf" \
    -pix_fmt yuv420p -an -movflags +faststart "$out" -loglevel error || { echo "FAIL $out"; return 1; }
  local chk
  chk=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$out")
  echo "OK $out ($chk, $(stat -c%s "$out") bytes)"
}

p6="$RAW/phase_6_raw_video.mp4"; p7="$RAW/phase_7_raw_video.mp4"
enc "$p6" "$OUT/phase-6.mp4"   "$V_DESK" 20
enc "$p6" "$OUT/phase-6-m.mp4" "$V_MOB"  24
enc "$p7" "$OUT/phase-7.mp4"   "$V_DESK" 20
enc "$p7" "$OUT/phase-7-m.mp4" "$V_MOB"  24
for n in 1 2 3 4 5 6; do
  m=$((n + 1))
  src="$RAW/phase_${n}_transition_to_phase_${m}_raw_video.mp4"
  enc "$src" "$OUT/transition-$n-$m.mp4"   "$V_DESK" 20
  enc "$src" "$OUT/transition-$n-$m-m.mp4" "$V_MOB"  24
done
echo ALL-DONE
