#!/usr/bin/env bash
# Bande-son de la story « Lever la main » : musique de la publicité (40–61,5 s), 6 phrases de voix off posées
# aux repères de l'animation, musique baissée sous la voix, normalisation -16 LUFS.
#   bash mix_audio.sh soundtrack.wav dossier_voix sortie.wav
set -euo pipefail
M=$1; V=$2; OUT=$3; D=21.5
ffmpeg -nostdin -v error -y -ss 40 -t $D -i "$M" -i "$V/l1.wav" -i "$V/l2.wav" -i "$V/l3.wav" -i "$V/l4.wav" -i "$V/l5.wav" -i "$V/l6.wav" -filter_complex "\
[1:a]adelay=250|250[a1];[2:a]adelay=3750|3750[a2];[3:a]adelay=7650|7650[a3];[4:a]adelay=10850|10850[a4];[5:a]adelay=14100|14100[a5];[6:a]adelay=17550|17550[a6];\
[a1][a2][a3][a4][a5][a6]amix=inputs=6:normalize=0,apad,atrim=0:$D,asplit=2[vo][key];\
[0:a]afade=t=in:st=0:d=0.25,afade=t=out:st=20.2:d=1.3,volume=0.36[mu];\
[mu][key]sidechaincompress=threshold=0.02:ratio=4:attack=15:release=350:makeup=1[duck];\
[duck][vo]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,atrim=0:$D[out]" -map "[out]" -ar 48000 -ac 2 -c:a pcm_s16le "$OUT"
