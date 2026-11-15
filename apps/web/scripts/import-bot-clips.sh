#!/usr/bin/env bash
# Converts real footage into the bot clips the player loops (apps/web/public/bots/).
#   apps/web/scripts/import-bot-clips.sh <folder>
# The folder holds any video files (mp4, mov, webm…) named by slot:
#   match-1 … match-6   cricket footage, the main video of bot streams 1–6 (landscape works best)
#   cam-1   … cam-6     a person reacting / talking, the facecam of bot streams 1–6
# Only the slots present are replaced. Each clip is cut to MAX seconds, scaled to fill 16:9 (centre crop),
# and encoded WebM VP9 + Opus. A clip with no audio gets a silent track so the volume sliders still work.
# Bot order is PERSONAS in apps/server/src/bots/script.ts.
set -euo pipefail
SRC="${1:?usage: import-bot-clips.sh <folder>}"
OUT="$(dirname "$0")/../public/bots"
MAX="${MAX:-40}"
mkdir -p "$OUT"

shopt -s nullglob nocaseglob
for f in "$SRC"/match-[1-6].* "$SRC"/cam-[1-6].*; do
  slot="$(basename "${f%.*}" | tr 'A-Z' 'a-z')"
  case "$slot" in match-*) w=960 h=540 crf=36 ;; cam-*) w=640 h=360 crf=38 ;; esac
  if ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$f" | grep -q .; then
    audio=(-map 0:v:0 -map 0:a:0)
  else
    audio=(-f lavfi -i "anullsrc=r=48000:cl=stereo" -map 0:v:0 -map 1:a:0 -shortest)
  fi
  echo "$slot  <-  $(basename "$f")"
  ffmpeg -loglevel error -y -t "$MAX" -i "$f" "${audio[@]}" -t "$MAX" \
    -vf "scale=$w:$h:force_original_aspect_ratio=increase,crop=$w:$h,fps=24" \
    -c:v libvpx-vp9 -b:v 0 -crf "$crf" -deadline good -cpu-used 4 -row-mt 1 -c:a libopus -b:a 64k \
    "$OUT/$slot.webm"
done
ls -la "$OUT"
