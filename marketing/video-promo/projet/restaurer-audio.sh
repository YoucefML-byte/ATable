#!/bin/bash
# Archive allégée : l'audio est livré en FLAC (sans perte). Ce script recrée les WAV attendus par index.html.
cd "$(dirname "$0")/assets/audio" || exit 1
for f in soundtrack voiceover soundtrack-vo; do
  ffmpeg -y -loglevel error -i "$f.flac" -c:a pcm_s16le "$f.wav" && echo "ok $f.wav"
done
