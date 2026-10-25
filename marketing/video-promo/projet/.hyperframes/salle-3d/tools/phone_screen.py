# Écran du téléphone, image par image (t = f/30) : éteint, puis viseur sur la plaque, scan, détection
import os, sys, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_tex import QR, MONO7, S, INK, CREAM, CREAM2, GOLD, tracked, BRAND_ENG
OUT = S + "/build/screen"; os.makedirs(OUT, exist_ok=True)
W, H = 1080, 2320; K = W / 512.0
OK_GREEN = "#047857"
def clamp(x, a, b): return max(a, min(b, x))
def seg(t, a, b): return clamp((t - a) / (b - a), 0, 1)
def ease(k):
    k = clamp(k, 0, 1); return 4 * k ** 3 if k < 0.5 else 1 - (-2 * k + 2) ** 3 / 2
def lerp(a, b, k): return a + (b - a) * k

def draw_plate(w, h):
    """La plaque dorée vue de dessus, même dessin que 02a–02c (560×360 de référence)."""
    ss = 2; W2, H2 = int(w * ss), int(h * ss); k = W2 / 560
    im = Image.new("RGBA", (W2, H2), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    mask = Image.new("L", (W2, H2), 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, W2 - 1, H2 - 1], radius=26 * k, fill=255)
    body = Image.new("RGBA", (W2, H2), "#D6AE57"); bd = ImageDraw.Draw(body)
    bd.polygon([(W2 * .09, 0), (W2 * .27, 0), (W2 * .12, H2), (-W2 * .06, H2)], fill="#E4C373")
    bd.polygon([(W2 * .31, 0), (W2 * .34, 0), (W2 * .19, H2), (W2 * .16, H2)], fill="#F2D893")
    bd.polygon([(W2 * .8, 0), (W2, 0), (W2, H2), (W2 * .66, H2)], fill="#C79E48")
    bd.rounded_rectangle([5 * k, 5 * k, W2 - 5 * k, H2 - 5 * k], radius=22 * k, outline="#A9832F", width=int(10 * k))
    im.paste(body, (0, 0), mask)
    d.rounded_rectangle([0, 0, W2 - 1, H2 - 1], radius=26 * k, outline=INK, width=max(2, int(4 * k)))
    sw, sh = 220 * k, 250 * k; sx, sy = (W2 - sw) / 2, 34 * k
    d.rounded_rectangle([sx, sy, sx + sw, sy + sh], radius=14 * k, fill=CREAM, outline=INK, width=max(2, int(3 * k)))
    m = 170 * k / 29; x0, y0 = sx + 25 * k, sy + 20 * k
    for r in range(29):
        for c in range(29):
            if QR[r][c] == "1": d.rectangle([x0 + c * m, y0 + r * m, x0 + (c + 1) * m + 0.5, y0 + (r + 1) * m + 0.5], fill=INK)
    d.text((W2 / 2, sy + 222 * k), "TABLE 4", font=ImageFont.truetype(MONO7, int(20 * k)), fill=INK, anchor="mm")
    # espacement réduit sur l'écran : le nom tient entre les coins du viseur
    tracked(d, (W2 / 2, 312 * k), BRAND_ENG, ImageFont.truetype(MONO7, int(15 * k)), 0.22 * 15 * k, "#584313")
    return im.resize((int(w), int(h)), Image.LANCZOS)

WOOD = Image.open(S + "/tex/wood_table_001_diff.jpg").convert("RGB")
WOOD = ImageEnhance.Brightness(WOOD.resize((1400, 1400))).enhance(0.8)
VIG = Image.radial_gradient("L").resize((W, H))
PLATE_CACHE = {}

def frame(t):
    if t < 3.95:
        im = Image.new("RGB", (W, H), "#05080A")
        return im
    # viseur : la table et la plaque, cadrage qui se pose
    settle = ease(seg(t, 4.75, 5.45))
    oy = lerp(-430, 0, settle) * K; ox = lerp(150, 0, settle) * K; sc = lerp(0.75, 1.0, settle)
    if t > 5.45:  # tenue à la main
        ox += 6 * math.sin(t * 7.1); oy += 5 * math.sin(t * 5.3 + 1)
    im = Image.new("RGB", (W, H))
    wsc = 1.0 + 0.35 * sc
    wood = WOOD.resize((int(1400 * wsc), int(1400 * wsc)))
    wx, wy = int(-200 + ox * 0.9), int(-300 + oy * 0.9)
    for i in (-1, 0, 1):
        for j in (-1, 0, 1, 2):
            im.paste(wood, (wx + i * wood.size[0], wy + j * wood.size[1]))
    pw, ph = 440 * sc * K, 283 * sc * K
    key = (round(pw), round(ph))
    if key not in PLATE_CACHE: PLATE_CACHE[key] = draw_plate(*key)
    pl = PLATE_CACHE[key]
    px, py = W / 2 - pw / 2 + ox, 550 * K - ph / 2 + oy
    shadow = Image.new("L", pl.size, 0); shadow.paste(pl.split()[3]); shadow = shadow.filter(ImageFilter.GaussianBlur(14))
    im.paste((20, 12, 6), (int(px + 10), int(py + 16)), shadow.point(lambda v: v * 0.55))
    im.paste(pl, (int(px), int(py)), pl)
    # éclairage chaud de la suspension + vignettage, légère mise au point qui se fait
    warm = Image.new("RGB", (W, H), (255, 196, 120))
    im = Image.blend(im, warm, 0.08)
    blur = 6 * (1 - seg(t, 4.6, 5.2)) + 2.5 * (1 - seg(t, 5.3, 5.5)) * seg(t, 4.85, 5.0)
    if blur > 0.2: im = im.filter(ImageFilter.GaussianBlur(blur))
    dark = Image.new("RGB", (W, H), (0, 0, 0))
    im = Image.composite(dark, im, VIG.point(lambda v: int(clamp((v - 150) * 0.9, 0, 255))))
    d = ImageDraw.Draw(im)
    okk = t >= 5.6
    bs = (230 + 14 * (1 - seg(t, 4.95, 5.25))) * K; bx = W / 2 - bs / 2; by = py + 30 * sc * K - 16 * K
    if t > 4.95:
        col = OK_GREEN if okk else "#F4EFE6"
        L = 46 * K; lw = int(8 * K)
        for cx0, cy0, sx_, sy_ in [(0, 0, 1, 1), (1, 0, -1, 1), (0, 1, 1, -1), (1, 1, -1, -1)]:
            cx, cy = bx + cx0 * bs, by + cy0 * bs
            d.line([(cx, cy + sy_ * L), (cx, cy), (cx + sx_ * L, cy)], fill=col, width=lw, joint="curve")
    if 5.05 < t < 5.6:
        sy = by + bs * seg(t, 5.05, 5.55)
        d.rectangle([bx + 10 * K, sy - 3 * K, bx + bs - 10 * K, sy + 3 * K], fill=GOLD)
    if t > 5.7:
        a = ease(seg(t, 5.7, 6.0)); dy = 20 * (1 - a) * K
        pill = Image.new("RGBA", (W, H), (0, 0, 0, 0)); pd = ImageDraw.Draw(pill)
        pd.rounded_rectangle([76 * K, 800 * K + dy, 470 * K, 864 * K + dy], radius=32 * K, fill=CREAM, outline=INK, width=int(3 * K))
        pd.ellipse([102 * K, 822 * K + dy, 122 * K, 842 * K + dy], fill=OK_GREEN)
        pd.text((136 * K, 833 * K + dy), "À vos tables · Table 4", font=ImageFont.truetype(MONO7, int(23 * K)), fill=INK, anchor="lm")
        al = pill.split()[3].point(lambda v: int(v * a)); pill.putalpha(al)
        im.paste(pill, (0, 0), pill)
    bar = Image.new("RGBA", (W, H), (0, 0, 0, 0)); bd = ImageDraw.Draw(bar)
    bd.rectangle([0, 0, W, 70 * K], fill=(12, 22, 19, 217)); bd.rectangle([0, 1030 * K, W, H], fill=(12, 22, 19, 217))
    bd.ellipse([W / 2 - 34 * K, 1065 * K - 34 * K, W / 2 + 34 * K, 1065 * K + 34 * K], outline=(244, 239, 230, 255), width=int(5 * K))
    bd.ellipse([W / 2 - 26 * K, 1065 * K - 26 * K, W / 2 + 26 * K, 1065 * K + 26 * K], fill=(244, 239, 230, 255))
    im.paste(bar, (0, 0), bar)
    return im

if __name__ == "__main__":
    a, b = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (0, 255)
    for f in range(a, b):
        frame(f / 30.0).save(f"{OUT}/scr_{f:04d}.png", optimize=False, compress_level=3)
    print("ok", a, b)
