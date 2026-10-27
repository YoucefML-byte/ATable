#!/usr/bin/env bash
# Bande-son de la story : musique de la publicité (66–83 s), voix off (5 phrases) posée aux repères de l'animation,
# musique baissée sous la voix, normalisation -16 LUFS.  usage : bash mix_audio.sh soundtrack.wav dossier_voix sortie.wav
set -euo pipefail
M=$1; V=$2; OUT=$3
ffmpeg -nostdin -v error -y -ss 66 -t 17 -i "$M" -i "$V/l1.wav" -i "$V/l2.wav" -i "$V/l3.wav" -i "$V/l4.wav" -i "$V/l5.wav" -filter_complex "\
[1:a]adelay=241|241[a1];[2:a]adelay=3521|3521[a2];[3:a]adelay=6594|6594[a3];[4:a]adelay=9609|9609[a4];[5:a]adelay=13081|13081[a5];\
[a1][a2][a3][a4][a5]amix=inputs=5:normalize=0,apad,atrim=0:17,asplit=2[vo][key];\
[0:a]afade=t=in:st=0:d=0.25,afade=t=out:st=15.8:d=1.2,volume=0.36[mu];\
[mu][key]sidechaincompress=threshold=0.02:ratio=4:attack=15:release=350:makeup=1[duck];\
[duck][vo]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,atrim=0:17[out]" -map "[out]" -ar 48000 -ac 2 -c:a pcm_s16le "$OUT"
