# Re-rendu partiel après le changement de marque : pour chaque image, seules les zones où apparaissent
# l'enseigne, le miroir (qui la reflète), les gravures des plaques et l'écran du téléphone sont recalculées
# (rendu Cycles par région, mêmes réglages et même graine que le rendu final), puis recollées dans l'image
# d'origine avec un bord fondu.  -- premier dernier dossier_source dossier_sortie
import bpy, sys, os, time, json
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
a = sys.argv[sys.argv.index("--") + 1:]
f0, f1, SRC, OUT = int(a[0]), int(a[1]), a[2], a[3]
os.makedirs(OUT, exist_ok=True)
scn = bpy.context.scene; cy = scn.cycles; R = scn.render
W, H = 1600, 900
R.resolution_x, R.resolution_y, R.resolution_percentage = W, H, 100
cy.samples = 12; cy.adaptive_threshold = 0.05
cy.diffuse_bounces = 2; cy.glossy_bounces = 2; cy.max_bounces = 6; cy.transmission_bounces = 6
R.use_persistent_data = True
cam = scn.camera
O = bpy.data.objects
GROUPS = {"sign": [O["sign_frame"], O["sign_logo"], O["wordmark"]], "mirror": [O["mirror_glass"]], "phone": [O["phone_screen"]]}
for i in range(1, 7): GROUPS[f"plate{i}"] = [O[f"plate{i}_engrave"]]
if os.environ.get("ONLY"):                 # ex. ONLY=phone : ne recalculer que ces éléments
    GROUPS = {k: v for k, v in GROUPS.items() if k in os.environ["ONLY"].split(",")}
PAD = 28

EDGES = [(0, 1), (1, 2), (2, 3), (3, 0), (4, 5), (5, 6), (6, 7), (7, 4), (0, 4), (1, 5), (2, 6), (3, 7)]
NEAR = 0.02

def rect(objs, f):
    """Boîte écran (px) des objets, découpée au plan proche de la caméra, sur toute la durée d'obturation."""
    xs, ys = [], []
    for fr, sub in ((f - 1, 0.6), (f, 0.0), (f, 0.4)):   # obturateur : avant / pendant / après
        scn.frame_set(fr, subframe=sub)
        ci = cam.matrix_world.inverted()
        for o in objs:
            pw = [o.matrix_world @ Vector(c) for c in o.bound_box]
            pc = [ci @ p for p in pw]
            pts = [pw[i] for i in range(8) if -pc[i].z > NEAR]
            for i, j in EDGES:
                di, dj = -pc[i].z - NEAR, -pc[j].z - NEAR
                if (di > 0) != (dj > 0):
                    t = di / (di - dj); pts.append(pw[i].lerp(pw[j], t))
            for p in pts:
                v = world_to_camera_view(scn, cam, p)
                if v.z <= 0: continue
                xs.append(v.x * W); ys.append((1 - v.y) * H)
    if not xs: return None
    x0, x1 = max(0, min(xs) - PAD), min(W, max(xs) + PAD); y0, y1 = max(0, min(ys) - PAD), min(H, max(ys) + PAD)
    if x1 - x0 < 2 or y1 - y0 < 2: return None
    return (int(x0), int(y0), int(x1 + 0.999), int(y1 + 0.999))

def regions(f):
    out = []
    for name, objs in GROUPS.items():
        if name == "phone" and f < 117: continue          # écran éteint avant : inchangé
        r = rect(objs, f)
        if r is None: continue
        if name.startswith("plate") and (r[2] - r[0]) - 2 * PAD < 40: continue   # gravure illisible : inchangée
        out.append([name, r])
    # fusion des zones qui se chevauchent
    merged = True
    while merged:
        merged = False
        for i in range(len(out)):
            for j in range(i + 1, len(out)):
                a_, b_ = out[i][1], out[j][1]
                if a_[0] < b_[2] and b_[0] < a_[2] and a_[1] < b_[3] and b_[1] < a_[3]:
                    out[i] = [out[i][0] + "+" + out[j][0], (min(a_[0], b_[0]), min(a_[1], b_[1]), max(a_[2], b_[2]), max(a_[3], b_[3]))]
                    del out[j]; merged = True; break
            if merged: break
    return out

log = {}
for f in range(f0, f1 + 1):
    dst = f"{OUT}/f_{f:04d}.json"
    if os.path.exists(dst): continue
    regs = regions(f); scn.frame_set(f)
    if os.environ.get("DRY"):
        area = sum((r[2] - r[0]) * (r[3] - r[1]) for _, r in regs) / (W * H)
        print(f"dry {f} {area:.3f} " + " ".join(f"{n}:{(r[2]-r[0])*(r[3]-r[1])/(W*H):.2f}" for n, r in regs), flush=True); continue
    t0 = time.time(); done = []
    for k, (name, (x0, y0, x1, y1)) in enumerate(regs):
        full = (x1 - x0) * (y1 - y0) > 0.7 * W * H
        R.use_border = not full; R.use_crop_to_border = False
        R.border_min_x, R.border_max_x = x0 / W, x1 / W
        R.border_min_y, R.border_max_y = 1 - y1 / H, 1 - y0 / H
        p = f"{OUT}/f_{f:04d}_r{k}.png"; R.filepath = p
        bpy.ops.render.render(write_still=True)
        done.append({"name": name, "rect": [0, 0, W, H] if full else [x0, y0, x1, y1], "png": p})
    json.dump(done, open(dst, "w"))
    print(f"done {f} {len(done)} regions {time.time() - t0:.1f}s " + " ".join(d['name'] for d in done), flush=True)
print("ALL DONE", f0, f1, flush=True)
