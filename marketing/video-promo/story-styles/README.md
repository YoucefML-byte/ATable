# Trois stories animées, trois styles (1080 × 1920, musique et voix off)

| Style | Vidéo | Durée | Idée |
| --- | --- | --- | --- |
| Néon | `../stories/story-style-neon.mp4` | 16 s | La nuit des bars et chichas : « Minuit. Le bar est plein. », un verre et un téléphone en lignes lumineuses, l'enseigne « COMMANDE ENVOYÉE ✓ » qui grésille, le logo qui s'allume. |
| Éditorial | `../stories/story-style-editorial.mp4` | 16 s | Une page de magazine : « Le service, en chiffres. » puis 0 appli, 1 scan, 3 finitions, moins de 3 s ; pages qui se tournent, filets fins, « Moins de courses, plus de service. » |
| Pop | `../stories/story-style-pop.mp4` | 13 s | Aplats de couleurs et formes qui rebondissent : « Scan. Choix. Envoi. Servi ! », « Vos clients commandent tout seuls. », logo qui s'assemble. |

Les trois finissent sur « ↓ DEMANDEZ VOTRE DÉMO », au-dessus de l'emplacement du sticker « Lien ».

## Refaire les stories

```bash
cd marketing/video-promo/story-styles
python3 gen_styles.py ../projet/.hyperframes/logo/logo512.py      # écrit neon/, editorial/, pop/index.html
for n in neon editorial pop; do (cd $n && ffmpeg -i assets/audio/music.flac assets/audio/music.wav \
  && npx --yes hyperframes@0.8.164 render --quality high -o renders/$n-hf.mp4); done
```

## Voix off

Même voix que la publicité (edge-tts, SSML en fr-FR). Les textes et les repères sont dans `<style>/voix.json` ;
`mix_voix.py` pose la voix sur un extrait de la musique de la publicité (néon 2–18 s, éditorial 26–42 s,
pop 70–83 s), baisse la musique sous la voix et normalise à -16 LUFS :
`python3 mix_voix.py ../projet/assets/audio/soundtrack.wav neon` (WAV restaurés depuis les FLAC).

Accent vérifié avec Whisper, phrase par phrase, dans les vidéos finales : toutes perçues en français
(0,89 à 1,00). Trois tournures ont été changées parce que la voix les lisait à l'anglaise : « Minuit. » seul
(→ « Il est minuit. »), « On scanne. / On choisit. / On envoie. » isolés (→ une seule prise « Le client scanne,
il choisit, il envoie, et c'est servi ! », découpée en quatre), et « Moins de courses, » (→ « Moins de courses
pour l'équipe, »).
