# Vidéo promotionnelle Atable — « Le ticket » (96 s)

Publicité en motion design de 96 secondes (1920 × 1080, 30 i/s, voix off française) qui présente Atable aux
patrons de restaurants, bars, chichas et cafés : le parcours d'une commande, de la table au tableau de bord,
raconté par un ticket de cuisine « Table 4 ».

## Contenu du dossier

| Chemin | Rôle |
| --- | --- |
| `atable-promo-96s.mp4` | La vidéo finale, prête à publier (site, réseaux, présentation) — H.264 High 4.1, débit plafonné à ~6 Mbit/s, lecture progressive. |
| `projet/` | Le projet [HyperFrames](https://hyperframes.heygen.com) qui fabrique la vidéo (HTML + GSAP). |
| `projet/STORYBOARD.md` | Le découpage plan par plan, avec la voix off et les temps. |
| `projet/BRIEF.md` | Le brief et l'historique des modifications. |
| `projet/compositions/frames/` | Un fichier HTML par plan (01 à 11, plus 02a–02c et 03a). |
| `projet/assets/` | Captures d'écran de l'application, logo, polices, audio (FLAC) et vidéo du plan 3D. |
| `projet/.hyperframes/installation-gen/` | Générateurs Python des plans 02a–02c et de la voix off. |
| `projet/.hyperframes/salle-3d/` | Le plan 3D réaliste du restaurant (Blender) : scripts, notice et **crédits**. |

## Le plan 3D (32–40 s)

Retour au vendredi soir dans un vrai restaurant en 3D, complet : vue de dessus (le plan de salle des 6
tables), plongée dans une salle pleine où les serveurs sont débordés (l'un traverse la salle au pas pressé
pendant que des clients lèvent la main pour l'appeler, l'autre sert la table 1), puis la table 4, où un client
prend son téléphone, vise la plaque dorée et scanne le QR code. La caméra entre ensuite dans l'écran. Rendu dans Blender 4.5 (Cycles) avec des personnages
réalistes animés en capture de mouvement. Notice complète : `projet/.hyperframes/salle-3d/README.md`.

La vidéo du plan est `projet/assets/video/03a-la-salle.mp4` ; la composition `projet/compositions/frames/03a-la-salle.html`
la joue sous les repères « VENDREDI · 20:34 » et « TABLE 4 ».

**Crédits obligatoires (licence CC BY 4.0)** — à reprendre dans la description de la vidéo partout où elle
est publiée : voir `projet/.hyperframes/salle-3d/CREDITS.md` (une ligne courte prête à copier s'y trouve).

## Refaire la vidéo

```bash
cd marketing/video-promo/projet
bash restaurer-audio.sh        # recrée les WAV attendus à partir des FLAC (ffmpeg)
npx --yes hyperframes@0.8.164 check      # contrôle (mise en page, contraste, minutage)
npx --yes hyperframes@0.8.164 render --quality high -o renders/atable-promo-96s.mp4
# encodage final, débit plafonné pour une lecture fluide sur téléphone :
ffmpeg -i renders/atable-promo-96s.mp4 -c:v libx264 -preset slow -crf 19 -maxrate 6M -bufsize 6M \
  -profile:v high -level 4.1 -pix_fmt yuv420p -c:a copy -movflags +faststart ../atable-promo-96s.mp4
```

Ce dossier est indépendant de l'application Next.js : il n'ajoute aucune dépendance au projet principal
et n'est ni compilé ni testé par la CI.
