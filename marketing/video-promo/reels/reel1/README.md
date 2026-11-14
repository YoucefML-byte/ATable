# Reel 1 « Une appli ? Non merci » (28,5 s, 1080 × 1920)

Réalisé d'après le script plan par plan fourni (lundi 16 novembre, 10 h) : accroche « UNE APPLI ? NON MERCI. »
dès la première image, puis une étiquette « à l'écran » par plan (PAS D'APPLI, MERCI → COMMENTEZ DEMO), plan de
salle, logo, plaque en métal, scan, carte dans le navigateur, commande, cuisine, serveur, et la bulle du début qui
revient et se barre pour que la vidéo boucle.

Vidéo : `../reel1-une-appli-non-merci.mp4` · couverture : `../reel1-couverture.png`.

## Voix off

Même voix que la publicité (edge-tts, SSML fr-FR), une phrase par plan, enchaînées avec 0,24 s de respiration
(`timeline.json` donne le début de chaque phrase, qui sert aussi de repère à l'animation). Deux écarts avec le
texte du script, pour la prononciation :

- « Avostables » est lu « À vos tables » ;
- « Commentez DEMO » devient « Commentez le mot démo » : « Commentez démo. » seul était lu à l'anglaise
  (Whisper : anglais 0,97). Les 11 phrases sont perçues en français (0,99 à 1,00) dans la vidéo finale.

## Refaire le Reel

```bash
cd marketing/video-promo/reels/reel1
for f in assets/audio/music.flac assets/audio/voix/*.flac; do ffmpeg -i "$f" "${f%.flac}.wav"; done
python3 gen_reel1.py ../../projet/.hyperframes/logo/logo512.py
npx --yes hyperframes@0.8.164 render --quality high -o renders/reel1-hf.mp4
```

Bande-son : `python3 ../../story-styles/mix_voix.py <soundtrack.wav> .` (musique de la publicité 44–72,5 s).
