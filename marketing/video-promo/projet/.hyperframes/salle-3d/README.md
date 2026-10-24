# Plan 03a « La salle » — scène 3D réaliste (Blender 4.5 LTS, Cycles)

Le plan 32–40 s de la pub n'est plus dessiné en three.js : c'est une vidéo rendue dans Blender
(`assets/video/03a-la-salle.mp4`, 8,5 s, 30 i/s) que `compositions/frames/03a-la-salle.html` joue sous deux
repères HTML (« VENDREDI · 20:34 » et l'étiquette « TABLE 4 », épinglée image par image grâce à la caméra Blender).
Même histoire et même minutage qu'avant : vue de dessus (= plan de salle 02c) → plongée → table 4 → le client
prend son téléphone (3,35–3,85 s du plan, soit ≈ 35,4 s), le lève, vise la plaque dorée (4,85–5,45 s ≈ 36,9 s),
scan validé (5,6 s ≈ 37,6 s) → la caméra entre dans l'écran (6,2–7,9 s) → fondu vers « Un scan » à 40 s.

## Contenu de la scène

- Salle 13,2 × 9,2 m (mêmes cotes que l'ancien plan three.js), murs du fond et de gauche visibles, mur de face,
  mur de droite et plafond invisibles pour la caméra mais présents pour la lumière (vue en coupe au début).
  Parquet à bâtons rompus, lambris vert à panneaux, plâtre crème, briques derrière le bar, corniche, deux fenêtres
  sur une rue de nuit, enseigne Atable (logo émaillé, lettres laiton), miroir doré, ardoise du jour.
- Les 6 tables du plan 02c, plaques dorées au bout indiqué (table 4 devant à gauche), autocollant QR « TABLE n »,
  gravure « A T A B L E » ; suspensions laiton, appliques, bougies, plantes, comptoir vert à plateau de marbre,
  tireuses, étagère à bouteilles éclairée, tablette du personnel (écran « Salle » de l'application).
- Salle comble : 33 personnages réalistes (scans Renderpeople) animés par capture de mouvement. Toutes les
  chaises sont occupées (la table 4 reste à deux pour le gros plan) : convives (Mixamo « Sitting Talking /
  Drinking / Idle »), serveuse au comptoir, trois clients au comptoir, un groupe qui attend debout près de
  l'entrée et un duo au bout du bar (« Texting » Mixamo, attente Renderpeople).
- Les serveurs sont débordés : l'un traverse la salle d'un pas pressé (marche Renderpeople accélérée de 30 %),
  plateau à l'épaule, et jette des coups d'œil aux trois clients qui lèvent la main pour l'appeler ; l'autre fait
  le service à la table 1 (il prend deux assiettes sur son plateau et les pose devant les clients, qui se
  tournent vers lui ; bras droit en IK sur 5 os pour se pencher, main gauche sous le plateau).
- Le client de la table 4 (« Sitting Idle », bras droit en IK sur le téléphone, tête qui suit l'écran) et son
  amie qui se tourne vers l'écran.
- Écran du téléphone : séquence d'images (`phone_screen.py`) — éteint, viseur sur la plaque, scan doré,
  cadre vert, pastille « atable · Table 4 » (mêmes temps que l'ancien plan).

## Refaire le rendu

Les scripts s'exécutent depuis un dossier de travail qui contient `tools/` (ce dossier), `mixamo/` (le zip
Mixamo décompressé), `fonts/` (les woff2 du projet convertis en ttf avec fontTools) et où ils créent `dl/`, `tex/`
et `build/`. `ATABLE_PROJECT` pointe vers le projet HyperFrames (pour l'écran de la tablette).

```bash
# 1) Blender 4.5 LTS (download.blender.org), Mesa n'est pas nécessaire (Cycles CPU)
# 2) modèles Sketchfab (SKETCHFAB_API_TOKEN) et textures Poly Haven : voir CREDITS.md (uid dans sf_dl.py)
bash download_assets.sh                  # glTF -> dl/<nom>/, textures -> tex/
blender -b -P tools/prep_chars.py -- eric nathan carla claudia sophia manuel     # mètres, os réorientés
NO_REORIENT=1 SUFFIX=_src blender -b -P tools/prep_chars.py -- nathan sophia     # squelettes d'origine (sources)
python3 tools/make_tex.py && python3 tools/phone_screen.py                      # logo, QR, ardoise, écran
blender -b -P tools/bake_actions.py      # retargeting Mixamo -> Renderpeople (mixamo/*.fbx)
blender -b -P tools/build_scene.py       # build/salle.blend + build/tag_t4.json
blender -b build/salle.blend -P tools/render_final.py -- 1600 900 16 0.04 0 254   # reprenable
ffmpeg -framerate 30 -i build/frames/f_%04d.png -vf scale=1920:1080:flags=lanczos -c:v libx264 -crf 15 -preset slow -pix_fmt yuv420p assets/video/03a-la-salle.mp4
python3 tools/gen_03a_html.py build/tag_t4.json compositions/frames/03a-la-salle.html
```

`tools/` : `retarget.py` (rotations monde + correction de pose de repos, Mixamo → Renderpeople ou squelette à
squelette), `assets.py` (import glTF normalisé + instances), `build_scene.py` (toute la scène, caméra comprise :
même trajectoire Catmull-Rom centripète et même interpolation monotone que l'ancien three.js).

## La main qui tient le téléphone

La prise est réglée automatiquement, pas à l'œil : `tools/optimize_grip.py` (lancé dans `build/salle.blend`)
ajuste la position de la paume et la flexion de chaque phalange en mesurant le maillage déformé réel :
aucun sommet de la main dans le téléphone (marge 1,5 mm) ni sous la table, aucun doigt devant l'écran,
doigts et pouce à moins de 5 mm des bords. Résultats : `grip_hold.json` et `grip_pick.json` (à copier dans
`build/`, lus par `build_scene.py`). Contrôles : `tools/check_grip.py -- <images>` (pénétration image par
image) et `tools/vis_hand.py -- <images>` (part de la main visible depuis la caméra). Entre la prise sur
la table et la tenue, la main s'ouvre et roule autour du bord droit du téléphone avant de se refermer.

## Ancienne version

`03a-la-salle.threejs.html` est l'ancien plan three.js cel-shadé (généré par `.hyperframes/installation-gen/gen_03a.py`),
gardé pour référence. Ne relancez pas `gen_03a.py` : il écraserait le nouveau `compositions/frames/03a-la-salle.html`.
