# Story animée « À vos tables » (17 s, 1080 × 1920)

Story Instagram en motion design, pensée directement pour le format vertical, mais dans le même univers que la
publicité (vert, crème, doré, plaque, ticket, logo « À. »). Cinq scènes calées sur une courte voix off (même voix
que la publicité) :

1. **Le rush** (0–3,4 s) : « Vendredi soir. Tout le monde vous fait signe. » ; les demandes des tables s'empilent.
2. **Le scan** (3,4–6,5 s) : « Et si un scan suffisait ? » ; la plaque dorée est scannée.
3. **La commande** (6,5–9,5 s) : « La carte s'ouvre, votre client commande. » ; le téléphone, de la carte à
   « Commande envoyée ».
4. **Le ticket** (9,5–13 s) : « En salle, la commande arrive. Validée d'un geste. » ; le ticket sort, le tampon
   « VALIDÉE » tombe.
5. **La fin** (13–17 s) : le logo se dessine, « Vos clients commandent. Votre équipe sert. », puis
   « ↓ DEMANDEZ VOTRE DÉMO ↓ » au-dessus de l'emplacement du sticker « Lien ».

La vidéo finale est `../stories/story-motion-avostables.mp4`.

## Refaire la story

```bash
cd marketing/video-promo/story-motion
bash restaurer-audio.sh                    # recrée les WAV à partir des FLAC
python3 gen_index.py ../projet/.hyperframes/logo/logo512.py   # écrit index.html (logo vectorisé)
npx --yes hyperframes@0.8.164 render --quality high -o renders/story-motion-hf.mp4
ffmpeg -i renders/story-motion-hf.mp4 -c:v libx264 -preset slow -crf 19 -maxrate 8M -bufsize 12M \
  -profile:v high -level 4.1 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart ../stories/story-motion-avostables.mp4
```

`mix_audio.sh` refait la bande-son : musique de la publicité (66–83 s), voix off posée aux repères de
l'animation, musique baissée sous la voix, normalisation à -16 LUFS
(`bash mix_audio.sh ../projet/assets/audio/soundtrack.wav assets/audio/voix assets/audio/story-mix.wav`, après
`restaurer-audio.sh` dans les deux dossiers). Les textes et les repères de la voix sont
dans `assets/audio/voix/textes.txt`.
