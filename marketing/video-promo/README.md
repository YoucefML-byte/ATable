# Vidéo promotionnelle « À vos tables » — « Le ticket » (96 s)

Publicité en motion design de 96 secondes (1920 × 1080, 30 i/s, voix off française) qui présente À vos tables
aux patrons de restaurants, bars, chichas et cafés : le parcours d'une commande, de la table au tableau de bord,
raconté par un ticket de cuisine « Table 4 ». Elle existe aussi en **8 stories verticales** (9:16) pour
Instagram, Facebook et WhatsApp.

> **Changement de nom (24/10/2026)** : l'application s'appelait « Atable » ; elle s'appelle désormais
> **« À vos tables »**, avec le logo « À. » (un « À » crème et un point doré sur fond vert). La vidéo, la voix
> off, la scène 3D et les stories ont été mises à jour. Le code de l'application, lui, n'a pas encore été renommé.

## Contenu du dossier

| Chemin | Rôle |
| --- | --- |
| `avostables-promo-96s.mp4` | La vidéo finale, prête à publier (site, réseaux, présentation) — H.264 High 4.1, débit plafonné à ~6 Mbit/s, lecture progressive. |
| `stories/` | Les 8 stories verticales et le Reel (vidéo complète en vertical), tous en 1080 × 1920, la couverture du Reel, les **icônes des « À la une »** (`stories/icones/`), la **grille de 9 publications** qui forme le grand logo (`stories/grille-logo/`) et **`CONTENU-INSTAGRAM.md`** : quoi publier, dans quel ordre, quel sticker ajouter, et le texte du Reel prêt à copier. |
| `logo/` | Le logo « À. » vectorisé (SVG) : tuile arrondie, tuile carrée, marque seule crème ou verte, plus une version PNG 1024 px et l'image d'origine. |
| `projet/` | Le projet [HyperFrames](https://hyperframes.heygen.com) qui fabrique la vidéo (HTML + GSAP). |
| `projet/STORYBOARD.md` | Le découpage plan par plan, avec la voix off et les temps. |
| `projet/BRIEF.md` | Le brief et l'historique des modifications. |
| `projet/compositions/frames/` | Un fichier HTML par plan (01 à 11, plus 02a–02c et 03a). |
| `projet/assets/` | Captures d'écran de l'application, logo, polices, audio (FLAC) et vidéo du plan 3D. |
| `projet/.hyperframes/installation-gen/` | Générateurs Python des plans 02a–02c et de la voix off. |
| `projet/.hyperframes/salle-3d/` | Le plan 3D réaliste du restaurant (Blender) : scripts, notice et **crédits**. |
| `projet/.hyperframes/stories/` | Les scripts qui fabriquent les stories et le Reel à partir de la vidéo 96 s, les icônes des « À la une » (`icones.cjs`) et la grille du logo (`grille_logo.cjs`, `grille_decoupe.py`). |

## Les stories

| # | Fichier | Extrait | Durée |
| --- | --- | --- | --- |
| 1 | `story-01-le-rush.mp4` | 0 – 12 s | 12 s |
| 2 | `story-02-l-installation.mp4` | 12 – 26 s | 14 s |
| 3 | `story-03-la-tablette.mp4` | 26 – 40 s | 14 s |
| 4 | `story-04-cote-client.mp4` | 40 – 54 s | 14 s |
| 5 | `story-05-salle-et-cuisine.mp4` | 54 – 66 s | 12 s |
| 6 | `story-06-l-equipe-et-vous.mp4` | 66 – 78 s | 12 s |
| 7 | `story-07-vos-chiffres.mp4` | 78 – 90 s | 12 s |
| 8 | `story-08-demandez-une-demo.mp4` | 90 – 96 s | 6 s |
| Reel | `reel-avostables-96s.mp4` | 0 – 96 s (vidéo complète) | 1 min 36 |

Chaque story porte le logo, un titre, la vidéo au centre et les sous-titres de la voix off ; le haut et le bas
de l'écran sont laissés libres pour l'interface d'Instagram et les stickers. Le Reel reprend la même mise en
page sur toute la vidéo (le titre change à chaque partie) et garde le bas de l'écran libre pour la légende. Le mode d'emploi complet est dans
`stories/CONTENU-INSTAGRAM.md`.

## Le plan 3D (32–40 s)

Retour au vendredi soir dans un vrai restaurant en 3D, complet : vue de dessus (le plan de salle des 6
tables), plongée dans une salle pleine où les serveurs sont débordés (l'un traverse la salle au pas pressé
pendant que des clients lèvent la main pour l'appeler, l'autre sert la table 1), puis la table 4, où un client
prend son téléphone, vise la plaque dorée et scanne le QR code. La caméra entre ensuite dans l'écran. Rendu
dans Blender 4.5 (Cycles) avec des personnages réalistes animés en capture de mouvement. L'enseigne au mur, la
gravure des plaques et l'écran du téléphone portent le nouveau nom. Notice complète :
`projet/.hyperframes/salle-3d/README.md`.

La vidéo du plan est `projet/assets/video/03a-la-salle.mp4` ; la composition `projet/compositions/frames/03a-la-salle.html`
la joue sous les repères « VENDREDI · 20:34 » et « TABLE 4 ».

**Crédits obligatoires (licence CC BY 4.0)** — à reprendre dans la description de la vidéo partout où elle
est publiée : voir `projet/.hyperframes/salle-3d/CREDITS.md` (une ligne courte prête à copier s'y trouve).

## Refaire la vidéo et les stories

```bash
cd marketing/video-promo/projet
bash restaurer-audio.sh        # recrée les WAV attendus à partir des FLAC (ffmpeg)
npx --yes hyperframes@0.8.164 check      # contrôle (mise en page, contraste, minutage)
npx --yes hyperframes@0.8.164 render --quality high -o renders/avostables-promo-96s.mp4
# encodage final, débit plafonné pour une lecture fluide sur téléphone :
ffmpeg -i renders/avostables-promo-96s.mp4 -c:v libx264 -preset slow -crf 19 -maxrate 6M -bufsize 6M \
  -profile:v high -level 4.1 -pix_fmt yuv420p -c:a copy -movflags +faststart ../avostables-promo-96s.mp4
# stories (Playwright + ffmpeg) :
cd .hyperframes/stories
node make_assets.cjs stories.json ../.. assets
python3 build_stories.py stories.json ../../../avostables-promo-96s.mp4 assets ../../../stories
node icones.cjs ../.. ../../../stories/icones
node grille_logo.cjs ../../../logo /tmp/grille.png && python3 grille_decoupe.py /tmp/grille.png ../../../stories/grille-logo
```

Ce dossier est indépendant de l'application Next.js : il n'ajoute aucune dépendance au projet principal
et n'est ni compilé ni testé par la CI.
