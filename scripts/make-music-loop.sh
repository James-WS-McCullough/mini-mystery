#!/bin/sh
# Readies a track that already loops for playing in the browser.
#
#   scripts/make-music-loop.sh ["Walking Along.mp3"] [src/assets/walking-along.mp3]
#   scripts/make-music-loop.sh "Gloom Horizon.mp3" src/assets/gloom-horizon.mp3
#
# An mp3 decodes with a little silence of its own at either end, which would
# be heard as a hiccup each time round. So the track is written with half a
# second of itself on both sides: the player loops the stretch between (see
# `tunes` in src/ui/audio.ts) and never meets an edge.
set -eu
SRC="${1:-Walking Along.mp3}"
OUT="${2:-src/assets/walking-along.mp3}"
PAD=0.5   # seconds of lead-in and lead-out
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

ffmpeg -v error -y -i "$SRC" -ar 44100 -ac 2 "$TMP/loop.wav"
LOOP=$(ffprobe -v error -show_entries stream=duration -of csv=p=0 "$TMP/loop.wav")

ffmpeg -v error -y -sseof "-$PAD" -i "$TMP/loop.wav" "$TMP/in.wav"
ffmpeg -v error -y -t "$PAD" -i "$TMP/loop.wav" "$TMP/out.wav"
ffmpeg -v error -y -i "$TMP/in.wav" -i "$TMP/loop.wav" -i "$TMP/out.wav" \
  -filter_complex "[0:a][1:a][2:a]concat=n=3:v=0:a=1" \
  -map_metadata -1 -codec:a libmp3lame -q:a 4 "$OUT"

echo "loop: $LOOP s (its loop length in `tunes`), padded by $PAD s each side -> $OUT"
