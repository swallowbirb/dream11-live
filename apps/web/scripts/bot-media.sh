#!/usr/bin/env bash
# Placeholder clips for the bot streams (apps/web/public/bots/). Replace any of them with real footage under the
# same name: WebM (VP9 + Opus) plays everywhere the app runs, including Playwright's Chromium (no H.264 there).
#   match-ind-aus.webm, match-eng-nz.webm  main video + match audio (crowd)
#   cam-1.webm … cam-6.webm                 facecam + creator audio
# Loops: any length works (the player loops each file and starts every bot at a different point).
set -euo pipefail
OUT="$(dirname "$0")/../public/bots"
mkdir -p "$OUT"
FONT=/usr/share/fonts/liberation-sans-fonts/LiberationSans-Bold.ttf
q=(-c:v libvpx-vp9 -b:v 0 -crf 40 -deadline good -cpu-used 4 -row-mt 1 -c:a libopus -b:a 32k -y -loglevel error)

match() { # name, title
  ffmpeg -f lavfi -i "color=c=0x2f7d32:s=640x360:r=24:d=24" \
    -f lavfi -i "anoisesrc=c=brown:a=0.25:d=24,lowpass=f=900,volume='0.6+0.4*sin(2*PI*t/6)':eval=frame" \
    -vf "drawbox=x=0:y=0:w=640:h=180:color=0x388e3c@1:t=fill,
         drawbox=x=290:y=70:w=60:h=230:color=0xc8b07a@1:t=fill,
         drawbox=x='300+30*sin(2*PI*t/3)':y='300-230*mod(t\,3)/3':w=10:h=10:color=white@1:t=fill,
         drawtext=fontfile=$FONT:text='$2':x=16:y=14:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.45:boxborderw=8,
         drawtext=fontfile=$FONT:text='PLACEHOLDER FEED':x=w-tw-16:y=h-th-14:fontsize=14:fontcolor=white@0.7" \
    -shortest "${q[@]}" "$OUT/$1.webm"
}

cam() { # n, initials, colour
  ffmpeg -f lavfi -i "color=c=$3:s=480x270:r=24:d=12" -f lavfi -i "anullsrc=r=48000:cl=mono" \
    -vf "drawtext=fontfile=$FONT:text='$2':x=(w-tw)/2:y='(h-th)/2+6*sin(2*PI*t/2.5)':fontsize=96:fontcolor=white,
         drawtext=fontfile=$FONT:text='facecam':x=(w-tw)/2:y=h-40:fontsize=18:fontcolor=white@0.6" \
    -t 12 "${q[@]}" "$OUT/cam-$1.webm"
}

match match-ind-aus 'IND vs AUS  ·  T20'
match match-eng-nz 'ENG vs NZ  ·  pre-match'
cam 1 HH 0x8e1b1b
cam 2 BB 0x1b4f8e
cam 3 SS 0x5a1b8e
cam 4 CM 0x8e6a1b
cam 5 BA 0x1b8e6a
cam 6 SF 0x333333
ls -la "$OUT"
