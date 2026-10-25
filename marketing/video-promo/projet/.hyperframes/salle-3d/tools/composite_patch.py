# Recolle les zones re-rendues (render_patch.py) dans les images d'origine, avec un bord fondu.
#   composite_patch.py dossier_origine dossier_patch dossier_sortie [premier dernier]
import sys, os, json
from PIL import Image, ImageChops, ImageDraw, ImageFilter
SRC, PATCH, OUT = sys.argv[1:4]
f0, f1 = (int(sys.argv[4]), int(sys.argv[5])) if len(sys.argv) > 5 else (0, 254)
os.makedirs(OUT, exist_ok=True)
INSET, FEATHER = 12, 6     # le débruitage diffère sur les bords d'une région : on ne garde que l'intérieur
for f in range(f0, f1 + 1):
    base = Image.open(f"{SRC}/f_{f:04d}.png").convert("RGBA")
    regs = json.load(open(f"{PATCH}/f_{f:04d}.json"))
    for r in regs:
        x0, y0, x1, y1 = r["rect"]; W, H = base.size
        full = (x0, y0, x1, y1) == (0, 0, W, H)
        im = Image.open(r["png"]).convert("RGBA")
        if full: base = im; continue
        m = Image.new("L", base.size, 0)
        ix0, iy0 = (x0 + INSET if x0 > 0 else 0), (y0 + INSET if y0 > 0 else 0)
        ix1, iy1 = (x1 - INSET if x1 < W else W), (y1 - INSET if y1 < H else H)
        if ix1 <= ix0 or iy1 <= iy0: ix0, iy0, ix1, iy1 = x0, y0, x1, y1   # bande étroite au bord de l'image
        ImageDraw.Draw(m).rectangle([ix0, iy0, ix1, iy1], fill=255)
        m = m.filter(ImageFilter.GaussianBlur(FEATHER / 2))
        hard = Image.new("L", base.size, 0); ImageDraw.Draw(hard).rectangle([x0, y0, x1 - 1, y1 - 1], fill=255)
        m = ImageChops.multiply(m, hard)        # rien hors de la région rendue
        base = Image.composite(im, base, m)
    base.save(f"{OUT}/f_{f:04d}.png", compress_level=3)
print("ok", f0, f1)
