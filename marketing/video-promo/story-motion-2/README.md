# Story animée n° 2 « Lever la main, c'est fini » (21,5 s, 1080 × 1920)

Deuxième story en motion design : même univers que la marque (vert, crème, doré, typographies, logo « À. »),
mais une autre histoire, un autre texte et d'autres animations que la première story (`../story-motion/`).

1. **Lever la main** (0–3,6 s), fond crème : une main dessinée s'agite, « Lever la main. Attendre.
   Recommencer. » tombent comme des tampons, et le compteur « ATTENTE » défile jusqu'à 04:12. Deux portes vertes
   se referment.
2. **Ça, c'est fini** (3,6–7,4 s), fond vert : le titre apparaît derrière une barre dorée ; « Attendre la carte »,
   « Chercher un serveur », « Répéter sa commande » sont barrés un par un.
3. **Le QR se construit** (7,4–10,6 s), fond doré : le QR code apparaît case par case en diagonale, le viseur se
   referme, « Vos clients scannent… et commandent. » ; puis on plonge dans le QR code.
4. **3, 2, 1** (10,6–13,9 s), fond sombre : compte à rebours dans un cercle qui se vide, puis le cercle se
   referme sur une coche dorée : « Déjà en salle. »
5. **Sans appli, sans compte** (13,9–17,4 s), fond crème, ouvert par un cercle qui grandit : six pastilles
   surgissent ; « Installation incluse » et « Tablette fournie » passent en doré : « Et on installe tout. »
6. **La fin** (17,4–21,5 s) : la tuile du logo tombe et rebondit, le « À » jaillit, l'accent tombe, le point doré
   arrive en roulant ; « À vos tables », « Le service, sans courir. », puis « ↓ DEMANDEZ VOTRE DÉMO ↓ ».

La vidéo finale est `../stories/story-motion-2-lever-la-main.mp4`.

## Refaire la story

```bash
cd marketing/video-promo/story-motion-2
bash restaurer-audio.sh
python3 gen_index.py ../projet/.hyperframes/logo/logo512.py    # écrit index.html
npx --yes hyperframes@0.8.164 render --quality high -o renders/story-motion-2-hf.mp4
ffmpeg -i renders/story-motion-2-hf.mp4 -c:v libx264 -preset slow -crf 19 -maxrate 8M -bufsize 12M \
  -profile:v high -level 4.1 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart ../stories/story-motion-2-lever-la-main.mp4
```

Bande-son : `bash mix_audio.sh ../projet/assets/audio/soundtrack.wav assets/audio/voix assets/audio/story-mix.wav`
(musique de la publicité 40–61,5 s, voix off aux repères de `assets/audio/voix/textes.txt`, -16 LUFS).
