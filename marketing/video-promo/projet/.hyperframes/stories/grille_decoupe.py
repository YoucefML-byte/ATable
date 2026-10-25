# Ajoute un grain discret (comme l'image d'origine du logo), découpe la grande image en 9 publications
# 1080 × 1440 (3:4) nommées dans l'ordre de publication, et fabrique deux aperçus.
#   python3 grille_decoupe.py grande.png dossier_sortie
import sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
rng = np.random.default_rng(7)
grain = rng.normal(0, 2.6, im.shape[:2])[..., None]          # grain monochrome, même graine à chaque fois
im = np.clip(im + grain, 0, 255).astype(np.uint8)
big = Image.fromarray(im)
TW, TH = 1080, 1440
POS = {(0, 0): "haut-gauche", (0, 1): "haut-milieu", (0, 2): "haut-droite",
       (1, 0): "milieu-gauche", (1, 1): "centre", (1, 2): "milieu-droite",
       (2, 0): "bas-gauche", (2, 1): "bas-milieu", (2, 2): "bas-droite"}
# Instagram place la dernière publication en haut à gauche : on commence donc par le bas à droite.
order = [(r, c) for r in (2, 1, 0) for c in (2, 1, 0)]
tiles = {}
for n, (r, c) in enumerate(order, 1):
    t = big.crop((c * TW, r * TH, (c + 1) * TW, (r + 1) * TH))
    name = f"publication-{n}-sur-9_{POS[(r, c)]}.jpg"
    t.save(os.path.join(out, name), quality=95, subsampling=0); tiles[(r, c)] = (n, t)
    print(name)
# aperçus : la grille telle qu'elle apparaîtra (fins séparateurs blancs) et l'ordre de publication
G, S = 3, 360
def sheet(numbers):
    w, h = 3 * S + 2 * G, 3 * S * 4 // 3 + 2 * G
    c = Image.new("RGB", (w, h), (255, 255, 255)); d = ImageDraw.Draw(c)
    f = ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-SemiBold.otf", 64)
    for (r, cc), (n, t) in tiles.items():
        x, y = cc * (S + G), r * (S * 4 // 3 + G)
        c.paste(t.resize((S, S * 4 // 3), Image.LANCZOS), (x, y))
        if numbers:
            d.ellipse([x + S / 2 - 52, y + S * 2 / 3 - 52, x + S / 2 + 52, y + S * 2 / 3 + 52], fill=(224, 163, 58))
            d.text((x + S / 2, y + S * 2 / 3), str(n), font=f, fill=(12, 22, 19), anchor="mm")
    return c
sheet(False).save(os.path.join(out, "apercu-grille.png"))
sheet(True).save(os.path.join(out, "ordre-de-publication.png"))
