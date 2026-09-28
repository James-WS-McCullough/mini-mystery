#!/bin/sh
# Turns a recording of rain into a seamless loop.
#
#   scripts/make-rain-loop.sh [rain.mp3] [src/assets/rain-loop.mp3]
#
# The recording is cut in half and the halves swapped, so that its end
# crossfades into its beginning in the middle of the loop, and the loop's own
# two ends are a place where the recording simply carried on.
#
# An mp3 decodes with a little silence of its own at either end, so the loop
# is written with half a second of itself on both sides: the player loops the
# stretch between (see `RAIN_LOOP` in src/ui/audio.ts) and never meets an edge.
set -eu
SRC="${1:-rain.mp3}"
OUT="${2:-src/assets/rain-loop.mp3}"
FADE=6    # seconds of crossfade, end into beginning
PAD=0.5   # seconds of lead-in and lead-out
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

ffmpeg -v error -y -i "$SRC" -ar 48000 -ac 2 "$TMP/src.wav"
LEN=$(ffprobe -v error -show_entries stream=duration -of csv=p=0 "$TMP/src.wav")
HALF=$(echo "$LEN / 2" | bc -l)

ffmpeg -v error -y -ss "$HALF" -i "$TMP/src.wav" "$TMP/late.wav"
ffmpeg -v error -y -t "$HALF" -i "$TMP/src.wav" "$TMP/early.wav"
ffmpeg -v error -y -i "$TMP/late.wav" -i "$TMP/early.wav" \
  -filter_complex "[0:a][1:a]acrossfade=d=$FADE:c1=qsin:c2=qsin" "$TMP/loop.wav"
LOOP=$(ffprobe -v error -show_entries stream=duration -of csv=p=0 "$TMP/loop.wav")

ffmpeg -v error -y -sseof "-$PAD" -i "$TMP/loop.wav" "$TMP/in.wav"
ffmpeg -v error -y -t "$PAD" -i "$TMP/loop.wav" "$TMP/out.wav"
ffmpeg -v error -y -i "$TMP/in.wav" -i "$TMP/loop.wav" -i "$TMP/out.wav" \
  -filter_complex "[0:a][1:a][2:a]concat=n=3:v=0:a=1" \
  -map_metadata -1 -codec:a libmp3lame -q:a 5 "$OUT"

echo "loop: $LOOP s (RAIN_LOOP.length), padded by $PAD s each side -> $OUT"
