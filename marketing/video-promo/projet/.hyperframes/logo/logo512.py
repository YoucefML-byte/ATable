# Géométrie du logo « À. » dans un repère 512×512 (tuile) : lettre (contour + contre-forme), accent, point.
import json, re, os
D = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "traced.json")))
cx, cy, r = D["dot"]; x0, y0, x1, y1 = D["bboxA"]
mx0, my0, mx1, my1 = x0, y0, cx + r, max(y1, cy + r)
mw, mh = mx1 - mx0, my1 - my0
S_ = 512 * 0.643 / mw
TX, TY = (512 - mw * S_) / 2, (512 - mh * S_) / 2
def T(x, y): return (x - mx0) * S_ + TX, (y - my0) * S_ + TY
def tpath(d):
    nums = [float(v) for v in re.findall(r"-?\d+\.?\d*", d)]
    out, k = [], 0
    for cmd in re.findall(r"[MLCZ]", d):
        n = {"M": 2, "L": 2, "C": 6, "Z": 0}[cmd]
        pts = nums[k:k + n]; k += n
        xy = []
        for i in range(0, n, 2):
            a, b = T(pts[i], pts[i + 1]); xy.append(f"{a:.1f} {b:.1f}")
        out.append(cmd + " ".join(xy))
    return "".join(out)
subs = ["M" + s for s in D["A"].split("M") if s]
def bbox(d):
    nums = [float(v) for v in re.findall(r"-?\d+\.?\d*", d)]
    xs, ys = nums[0::2], nums[1::2]; return min(xs), min(ys), max(xs), max(ys)
bbs = [bbox(s) for s in subs]
acc = min(range(len(subs)), key=lambda i: bbs[i][3])          # l'accent : le plus haut
rest = [i for i in range(len(subs)) if i != acc]
LETTER = "".join(tpath(subs[i]) for i in rest)
ACCENT = tpath(subs[acc])
DOT = (*T(cx, cy), r * S_)
GREEN, CREAM, GOLD = "#3D5742", "#EFEBE4", "#D5B162"
if __name__ == "__main__":
    print(len(subs), "sous-chemins ; accent", acc, "point", [round(v, 1) for v in DOT])
