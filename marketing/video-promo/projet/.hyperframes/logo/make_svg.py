import json
d = json.load(open("traced.json"))
A = d["A"]; cx, cy, r = d["dot"]; x0, y0, x1, _ = d["bboxA"]
# boîte de la marque (lettre + point)
mx0, my0, mx1, my1 = x0, y0, cx + r, max(d["bboxA"][3], cy + r)
mw, mh = mx1 - mx0, my1 - my0
GREEN, CREAM, GOLD = "#3D5742", "#EFEBE4", "#D5B162"
def mark(fill_a, fill_dot, scale, tx, ty):
    return (f'<g transform="translate({tx:.2f} {ty:.2f}) scale({scale:.5f}) translate({-mx0:.2f} {-my0:.2f})">'
            f'<path fill="{fill_a}" d="{A}"/><circle cx="{cx:.2f}" cy="{cy:.2f}" r="{r:.2f}" fill="{fill_dot}"/></g>')
# tuile 512 : la marque occupe 64 % de la largeur, centrée (comme le logo envoyé)
s = 512 * 0.643 / mw
tile = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="{GREEN}"/>'
        + mark(CREAM, GOLD, s, (512 - mw * s) / 2, (512 - mh * s) / 2) + "</svg>")
open("avostables-logo.svg", "w").write(tile)
# tuile carrée sans arrondi (fidèle à l'original, pour l'impression)
open("avostables-logo-carre.svg", "w").write(tile.replace(' rx="112"', ""))
# marque seule (sans fond), en deux couleurs : crème (sur vert) et verte (sur clair)
s2 = 1.0
for name, fa in (("avostables-marque-creme.svg", CREAM), ("avostables-marque-verte.svg", GREEN)):
    open(name, "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {mw:.2f} {mh:.2f}">' + mark(fa, GOLD, 1, 0, 0) + "</svg>")
print("mark", round(mw, 1), round(mh, 1), "ratio", round(mw / mh, 4))
