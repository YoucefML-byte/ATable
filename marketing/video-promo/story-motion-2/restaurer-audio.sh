#!/usr/bin/env bash
# Recrée les WAV attendus par la composition (index.html, mix_audio.sh) à partir des FLAC versionnés.
set -euo pipefail
cd "$(dirname "$0")/assets/audio"
for f in story-mix.flac voix/*.flac; do ffmpeg -nostdin -v error -y -i "$f" "${f%.flac}.wav"; done
echo "ok"
