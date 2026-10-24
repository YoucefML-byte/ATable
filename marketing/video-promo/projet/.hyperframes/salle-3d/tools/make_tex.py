# Textures 2D : logo Atable, autocollants QR des plaques, gravure
import os, sys
from PIL import Image, ImageDraw, ImageFont
S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = S + "/build/tex"; os.makedirs(OUT, exist_ok=True)
INK = "#0C1613"; CREAM = "#F4EFE6"; CREAM2 = "#E7DCC6"; GREEN = "#1F4D3A"; GOLD = "#E0A33A"
MONO7 = S + "/fonts/JetBrainsMono-700.ttf"
QR = "11111110101001111111101111111,10000010010001001000001000001,10111010100010001100101011101,10111010101011011110101011101,10111010110011100000001011101,10000010101011000111101000001,11111110101010101010101111111,00000000010110011011000000000,00111111010001100110010111101,00010000101001101111100001011,00110011110101001010011001010,11101101111000001011001000111,00111011100010001001100100100,00001101000001110000011100011,00101110100101101001011010010,10001101110001111100011000100,10110110010110100101000101110,11010100100010101000100011001,10100110000100110110000101100,10111000110001000100001001101,11101111011101010100111110010,00000000010001001111100010101,11111110110001110100101010100,10000010110101100101100011100,10111010111101100101111110111,10111010100101010110000001100,10111010101011001000100011001,10000010010011010000110000110,11111110010001000100000110000".split(",")

def stroke_path(d, pts, w, fill):
    r = w / 2
    for a, b in zip(pts, pts[1:]):
        d.line([a, b], fill=fill, width=int(w))
    for p in pts:
        d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=fill)

def logo(size=1024, bg=True):
    k = 4; s = size * k / 512
    im = Image.new("RGBA", (size * k, size * k), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    if bg: d.rounded_rectangle([0, 0, size * k - 1, size * k - 1], radius=112 * s, fill=GREEN)
    cx, cy = 256 * s, 276 * s
    d.ellipse([cx - 146 * s, cy - 146 * s, cx + 146 * s, cy + 146 * s], fill="#FFFFFF")
    d.ellipse([cx - 118 * s, cy - 118 * s, cx + 118 * s, cy + 118 * s], fill=GREEN if bg else (0, 0, 0, 0))
    d.ellipse([cx - 74 * s, cy - 74 * s, cx + 74 * s, cy + 74 * s], fill=GOLD)
    import math
    fork = [(118, 96), (118, 180)] + [(148 - 30 * math.cos(a), 180 + 30 * math.sin(a)) for a in [i * math.pi / 16 for i in range(17)]] + [(178, 96)]
    stroke_path(d, [(x * s, y * s) for x, y in fork], 22 * s, "#FFFFFF")
    stroke_path(d, [(148 * s, 96 * s), (148 * s, 396 * s)], 22 * s, "#FFFFFF")
    p0, p1, p2, p3 = (394, 96), (360, 114), (348, 160), (348, 206)
    bez = [tuple((1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * e for a, b, c, e in zip(p0, p1, p2, p3)) for t in [i / 24 for i in range(25)]]
    knife = bez + [(394, 206), (394, 396)]
    stroke_path(d, [(x * s, y * s) for x, y in knife], 22 * s, "#FFFFFF")
    return im.resize((size, size), Image.LANCZOS)

def sticker(num, w=880, h=1000):
    """Autocollant QR crème (220×250 dans le dessin de référence) : QR + « TABLE n »."""
    k = w / 220
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=14 * k, fill=CREAM)
    m = 170 * k / 29; x0, y0 = 25 * k, 20 * k
    for r in range(29):
        for c in range(29):
            if QR[r][c] == "1": d.rectangle([x0 + c * m, y0 + r * m, x0 + (c + 1) * m + 0.5, y0 + (r + 1) * m + 0.5], fill=INK)
    f = ImageFont.truetype(MONO7, int(20 * k))
    d.text((w / 2, 222 * k), f"TABLE {num}", font=f, fill=INK, anchor="mm")
    return im

def engraving(w=1120, h=720):
    """Gravure « A T A B L E » + filet intérieur : masque (blanc = gravé) aux proportions de la plaque 560×360."""
    k = w / 560
    im = Image.new("L", (w, h), 0); d = ImageDraw.Draw(im)
    d.rounded_rectangle([5 * k, 5 * k, w - 5 * k, h - 5 * k], radius=22 * k, outline=255, width=int(5 * k))
    f = ImageFont.truetype(MONO7, int(15 * k))
    d.text((w / 2, 312 * k), "A T A B L E", font=f, fill=255, anchor="mm")
    return im

if __name__ == "__main__":
    logo(1024).save(OUT + "/logo.png")
    logo(1024, bg=False).save(OUT + "/logo_white.png")
    for n in range(1, 7): sticker(n).save(OUT + f"/sticker_{n}.png")
    engraving().save(OUT + "/engraving.png")
    print("ok")

def chalkboard(w=1200, h=1500):
    """Ardoise du jour : craie sur ardoise (texte du menu de démonstration)."""
    import random
    rnd = random.Random(7)
    im = Image.new("RGB", (w, h), (28, 36, 33)); d = ImageDraw.Draw(im)
    for _ in range(9000):  # voile de craie effacée
        x, y = rnd.randrange(w), rnd.randrange(h); a = rnd.randrange(8, 26)
        d.point((x, y), fill=(28 + a, 36 + a, 33 + a))
    SER = S + "/fonts/SourceSerif4-600.ttf"; SER4 = S + "/fonts/SourceSerif4-400.ttf"
    chalk = (226, 222, 210)
    d.text((w / 2, 150), "Ardoise du jour", font=ImageFont.truetype(SER, 96), fill=chalk, anchor="mm")
    d.line([(w * 0.25, 230), (w * 0.75, 230)], fill=(200, 170, 110), width=5)
    items = [("Velouté du moment", "7"), ("Tacos 2 viandes", "11,50"), ("Tartare de bœuf, frites", "18"),
             ("Risotto aux cèpes", "16"), ("Burrata, tomates anciennes", "12"), ("Tarte Tatin", "8"), ("Café gourmand", "7,50")]
    f = ImageFont.truetype(SER4, 62)
    for i, (a, p) in enumerate(items):
        y = 350 + i * 150
        d.text((110, y), a, font=f, fill=chalk, anchor="lm")
        d.text((w - 110, y), p + " €", font=f, fill=(232, 196, 120), anchor="rm")
    # grain de craie
    noise = Image.effect_noise((w, h), 60).point(lambda v: 255 if v > 150 else 0)
    base = Image.new("RGB", (w, h), (28, 36, 33))
    im = Image.composite(im, Image.blend(im, base, 0.45), noise)
    d = ImageDraw.Draw(im); d.rectangle([0, 0, w - 1, h - 1], outline=(20, 26, 24), width=6)
    return im

if __name__ == "__main__":
    chalkboard().save(OUT + "/chalkboard.png")
