import sys, json, math
import numpy as np
from PIL import Image, ImageFilter
import potrace
im = Image.open(sys.argv[1]).convert("RGB")
W, H = im.size
S = 3
big = im.resize((W * S, H * S), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.2 * S / 2))
a = np.asarray(big).astype(float)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
cream = (r > 150) & (g > 150) & (b > 140) & (abs(r - b) < 40)
gold = (r > 150) & (g > 120) & (b < 140) & (r - b > 60)
# fond : moyenne hors formes
bgm = ~(cream | gold)
print("bg mean", a[bgm].mean(axis=0).round(1), "cream", a[cream].mean(axis=0).round(1), "gold", a[gold].mean(axis=0).round(1))
# couleurs du centre (zone de fond proche de la lettre)
def trace(mask):
    bm = potrace.Bitmap(mask)
    pl = bm.trace(turdsize=50, alphamax=1.0, opticurve=True, opttolerance=0.2)
    d = []
    for c in pl:
        sp = c.start_point; d.append(f"M{sp.x/S:.2f} {sp.y/S:.2f}")
        for seg in c.segments:
            if seg.is_corner:
                d.append(f"L{seg.c.x/S:.2f} {seg.c.y/S:.2f}L{seg.end_point.x/S:.2f} {seg.end_point.y/S:.2f}")
            else:
                d.append(f"C{seg.c1.x/S:.2f} {seg.c1.y/S:.2f} {seg.c2.x/S:.2f} {seg.c2.y/S:.2f} {seg.end_point.x/S:.2f} {seg.end_point.y/S:.2f}")
        d.append("Z")
    return "".join(d)
dA = trace(~cream)
ys, xs = np.nonzero(gold)
cx, cy = xs.mean() / S, ys.mean() / S; rad = math.sqrt(gold.sum() / math.pi) / S
ys2, xs2 = np.nonzero(cream)
bb = [xs2.min() / S, ys2.min() / S, xs2.max() / S, ys2.max() / S]
print("dot", round(cx, 2), round(cy, 2), round(rad, 2), "A bbox", [round(v, 1) for v in bb])
json.dump({"A": dA, "dot": [cx, cy, rad], "bboxA": bb, "W": W, "H": H}, open(sys.argv[2], "w"))
