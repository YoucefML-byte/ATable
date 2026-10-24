#!/bin/bash
# Télécharge les modèles Sketchfab (glTF, CC BY 4.0) et les textures Poly Haven (CC0) utilisés par la scène.
# Nécessite SKETCHFAB_API_TOKEN. À lancer depuis le dossier de travail (voir README.md).
set -e
mkdir -p dl tex
python3 tools/sf_dl.py dl \
  eric=a46bc9f67aaa415bb4f3241eef900e7f nathan=143a2b1ea5eb4385ae90a73657aca3bc \
  carla=acf520f450d14dd799f98a6fede3edf5 sophia=dc448c3be0e74f96a55fb475a13433cf \
  claudia=c659bd0accab47c6bbe390cf822a2b92 manuel=e65e0fef4e0743868c8d5bff36d61116 \
  chair=6b0a51cfa9784a60ae82e05db38f9ec0 pendant=2ba27702aabe4d37822956a2b7bf43d8 \
  backbar=a1961b9e5a7043fb9a70b855e947e27f walllamp=487c69d1748c46d2b3cc433fe6885a5e \
  monstera=1ab9bf841df04c07b1819be596327629 palm=92f75abd656049608248cf76a8c88136 \
  glasses=c466971661f04251b159319b7dcc50a5 wine=13027525814d4c4ea07d4e12549cb9ef \
  pizza=40d50989fec1460f8838b608d999ccd0 pasta=59dd03bd03484b248dff1961de2ef625 \
  silverware=76a43250dd694d2fa1e109124d75b6ad beertap=0786303b90ab413e9123481b528655cc
python3 tools/ph_dl.py tex herringbone_parquet painted_plaster_wall wood_table_001 marble_01 velour_velvet red_brick_03 cobblestone_street_night
# textures réduites (personnages 4K, accessoires 2K) pour tenir en mémoire et accélérer Cycles
python3 - <<'PY'
from PIL import Image; import glob
Image.MAX_IMAGE_PIXELS = None
for f in glob.glob('dl/*/textures/*'):
    im = Image.open(f); ch = f.split('/')[1] in ('eric', 'nathan', 'carla', 'claudia', 'sophia', 'manuel'); lim = 4096 if ch else 2048
    if im.size[0] > lim: im.resize((lim, lim), Image.LANCZOS).save(f, quality=93) if f.endswith('jpeg') else im.resize((lim, lim), Image.LANCZOS).save(f)
PY
