# Optimise la prise du téléphone (tenue) : aucun sommet de la main dans le téléphone, écran dégagé,
# doigts au contact du bord gauche, pouce au contact du bord droit, paume contre le dos.
# Évalue le maillage déformé réel (armature + IK) dans build/salle.blend, à une image de la tenue.
import bpy, sys, os, math, json
from mathutils import Vector, Matrix, Quaternion
args = sys.argv[sys.argv.index("--") + 1:]
MODE = args[0] if args else "hold"          # hold | pick
FRAME = int(args[1]) if len(args) > 1 else (190 if MODE == "hold" else 108)
OUT = args[2] if len(args) > 2 else None
scn = bpy.context.scene
arm = bpy.data.objects["hero_rig"]; body = [o for o in arm.children if o.type == "MESH"][0]
ph = bpy.data.objects["phone"]; ht = bpy.data.objects["hero_hand_tgt"]
PW, PH, PT = 0.072, 0.152, 0.0082
FINGERS = ("thumb", "index", "middle", "ring", "pinky")
b = arm.data.bones
def bone(n): return [x for x in b if x.name.startswith(n)][0]

# --- repères de repos (mêmes formules que build_scene.py)
h0 = b["hand_r_051"].head_local
F0 = (bone("middle_01_r_").head_local - h0).normalized()
Aa = (bone("index_01_r_").head_local - bone("pinky_01_r_").head_local).normalized()
N0 = Aa.cross(F0).normalized(); T0 = F0.cross(N0).normalized()
B0 = Matrix((F0, N0, T0)).transposed()
PALM = (bone("middle_01_r_").head_local - h0).length

def hand_rot(F, P):
    F = F.normalized(); P = (P - F * P.dot(F)).normalized()
    armrot = arm.matrix_world.to_3x3().normalized()
    Fa = armrot.inverted() @ F; Pa = armrot.inverted() @ P
    Bt = Matrix((Fa, Pa, Fa.cross(Pa))).transposed()
    return armrot @ (Bt @ B0.transposed()) @ b["hand_r_051"].matrix_local.to_3x3()

def finger_quats(curls, thumb):
    out = {}
    for f in FINGERS:
        segs = [bone(f"{f}_0{i}_r_") for i in (1, 2, 3)]
        d = (segs[1].head_local - segs[0].head_local).normalized(); A = d.cross(N0).normalized()
        for k, sg in enumerate(segs):
            M = sg.matrix_local.to_3x3().normalized()
            if f == "thumb":
                if k == 0:
                    qa = Quaternion(N0, math.radians(-thumb[0])) @ Quaternion(F0, math.radians(-thumb[1]))
                    q = (M.inverted() @ qa.to_matrix() @ M).to_quaternion()
                else:
                    q = Quaternion(M.inverted() @ A, math.radians(thumb[k + 1]))
            else:
                q = Quaternion(M.inverted() @ A, math.radians(curls[f][k]))
            out[sg.name] = q
    return out

# --- neutralise l'animation des doigts et de la cible pour piloter à la main
act = arm.animation_data.action
for fc in act.fcurves:
    n = fc.data_path.split('"')[1] if '"' in fc.data_path else ""
    if n.startswith(FINGERS) and "_r_" in n: fc.mute = True
ht.animation_data_clear()
scn.frame_set(FRAME)
PM = ph.matrix_world.copy(); R3 = PM.to_3x3().normalized()

groups = {g.index: g.name for g in body.vertex_groups}
HV = []
for v in body.data.vertices:
    best = max(v.groups, key=lambda g: g.weight, default=None)
    if best is None: continue
    n = groups[best.group]
    if "_r_" in n and n.startswith(FINGERS + ("hand",)): HV.append((v.index, n.split("_")[0]))

def box_dist(p):
    dx = max(abs(p.x) - PW / 2, 0); dy = max(abs(p.y) - PH / 2, 0); dz = max(abs(p.z) - PT / 2, 0)
    return math.sqrt(dx * dx + dy * dy + dz * dz)

def evaluate(P):
    F = Vector((math.cos(math.radians(P["ang"])), math.sin(math.radians(P["ang"])), 0)) * -1  # angle depuis −x
    F = Vector((-math.cos(math.radians(P["ang"])), math.sin(math.radians(P["ang"])), 0))
    Pn = Vector((0, 0, 1)) if MODE == "hold" else Vector((0, 0, -1))
    mcp = Vector((P["mx"], P["my"], P["dz"]))
    wrist = mcp - F * PALM
    m = Matrix.Translation(PM @ wrist) @ hand_rot(R3 @ F, R3 @ Pn).to_4x4()
    ht.matrix_world = m
    curls = {f: (P[f + "1"], P[f + "2"], P[f + "3"]) for f in FINGERS[1:]}
    qs = finger_quats(curls, (P["t0"], P["t1"], P["t2"], P["t3"]))
    for n, q in qs.items():
        pb = arm.pose.bones[n]; pb.rotation_mode = "QUATERNION"; pb.rotation_quaternion = q
    dg = bpy.context.evaluated_depsgraph_get(); dg.update()
    ev = body.evaluated_get(dg); me = ev.to_mesh()
    inv = PM.inverted(); mw = body.matrix_world
    inside = {}; over = {}; dmin = {}
    for vi, fn in HV:
        p = inv @ (mw @ me.vertices[vi].co)
        M_ = 0.0015  # marge de sécurité (imprécision de l'IK d'une image à l'autre)
        if abs(p.x) < PW / 2 + M_ * 0.3 and abs(p.y) < PH / 2 + M_ * 0.3 and abs(p.z) < PT / 2 + M_:
            inside[fn] = inside.get(fn, 0) + 1
        if abs(p.x) < PW / 2 - 0.0045 and abs(p.y) < PH / 2 - 0.004 and p.z > (PT / 2 if MODE == "hold" else -9) and MODE == "hold":
            over[fn] = over.get(fn, 0) + 1
        d = box_dist(p); dmin[fn] = min(dmin.get(fn, 9), d)
        if (mw @ me.vertices[vi].co).z < 0.7495:  # sous le plateau de la table
            inside["table"] = inside.get("table", 0) + 1
    ev.to_mesh_clear()
    gap = sum(max(0, dmin.get(f, 9) - 0.0045) for f in ("middle", "ring", "pinky", "index")) + max(0, dmin.get("thumb", 9) - 0.005) + max(0, dmin.get("hand", 9) - 0.0055)
    cost = 50 * sum(inside.values()) + 20 * sum(over.values()) + 400 * gap
    return cost, inside, over, dmin

if MODE == "hold":
    P = {"ang": 43.8, "mx": -0.004, "my": -0.006, "dz": -(PT / 2 + 0.017),
         "index1": 16, "index2": 58, "index3": 30, "middle1": 14, "middle2": 66, "middle3": 32,
         "ring1": 18, "ring2": 70, "ring3": 32, "pinky1": 22, "pinky2": 72, "pinky3": 30,
         "t0": 24, "t1": 14, "t2": 12, "t3": 10}
else:
    P = {"ang": 8.5, "mx": -0.006, "my": 0.004, "dz": PT / 2 + 0.03,
         "index1": 12, "index2": 30, "index3": 20, "middle1": 14, "middle2": 34, "middle3": 22,
         "ring1": 16, "ring2": 38, "ring3": 24, "pinky1": 18, "pinky2": 40, "pinky3": 24,
         "t0": 10, "t1": 20, "t2": 15, "t3": 10}
STEP = {"ang": 4, "mx": 0.003, "my": 0.004, "dz": 0.002}
for k in P:
    if k not in STEP: STEP[k] = 6
LIM = {"dz": (-0.06, -0.006) if MODE == "hold" else (0.006, 0.06)}
best = evaluate(P); print("start", round(best[0], 2), best[1], best[2], {k: round(v, 4) for k, v in best[3].items()}, flush=True)
for it in range(14):
    improved = False
    for k in list(P):
        for sgn in (1, -1):
            for mult in (1, 2):
                Q = dict(P); Q[k] = P[k] + sgn * STEP[k] * mult
                if k in LIM: Q[k] = min(max(Q[k], LIM[k][0]), LIM[k][1])
                if k[-1] in "123" and k[:-1] in FINGERS[1:]: Q[k] = min(max(Q[k], -5), 95)
                r = evaluate(Q)
                if r[0] < best[0] - 1e-6:
                    P, best, improved = Q, r, True
                    break
            else:
                continue
            break
    print(f"iter {it} cost {best[0]:.2f} inside {best[1]} over {best[2]} gaps", {k: round(v, 4) for k, v in best[3].items()}, flush=True)
    if not improved:
        for k in STEP: STEP[k] *= 0.5
        if STEP["mx"] < 0.0007: break
print("RESULT", json.dumps({k: round(v, 4) for k, v in P.items()}))
if OUT: json.dump(P, open(OUT, "w"), indent=1)
