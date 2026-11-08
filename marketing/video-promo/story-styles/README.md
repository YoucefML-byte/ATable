# Trois stories animées, trois styles (1080 × 1920, musique seule)

| Style | Vidéo | Durée | Idée |
| --- | --- | --- | --- |
| Néon | `../stories/story-style-neon.mp4` | 15 s | La nuit des bars et chichas : « Minuit. Le bar est plein. », un verre et un téléphone en lignes lumineuses, l'enseigne « COMMANDE ENVOYÉE ✓ » qui grésille, le logo qui s'allume. |
| Éditorial | `../stories/story-style-editorial.mp4` | 15 s | Une page de magazine : « Le service, en chiffres. » puis 0 appli, 1 scan, 3 finitions, moins de 3 s ; pages qui se tournent, filets fins, « Moins de courses, plus de service. » |
| Pop | `../stories/story-style-pop.mp4` | 13 s | Aplats de couleurs et formes qui rebondissent : « Scan. Choix. Envoi. Servi ! », « Vos clients commandent tout seuls. », logo qui s'assemble. |

Les trois finissent sur « ↓ DEMANDEZ VOTRE DÉMO », au-dessus de l'emplacement du sticker « Lien ».

## Refaire les stories

```bash
cd marketing/video-promo/story-styles
python3 gen_styles.py ../projet/.hyperframes/logo/logo512.py      # écrit neon/, editorial/, pop/index.html
for n in neon editorial pop; do (cd $n && ffmpeg -i assets/audio/music.flac assets/audio/music.wav \
  && npx --yes hyperframes@0.8.164 render --quality high -o renders/$n-hf.mp4); done
```

Musique : extraits de la bande-son de la publicité (néon 2–17 s, éditorial 26–41 s, pop 70–83 s), fondus, -16 LUFS.
