# Contrôle de la prise : sommets de la main du client à l'intérieur du téléphone, image par image
import bpy, sys
from mathutils import Vector
a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
frames = [int(x) for x in a] or list(range(118, 255, 8))
scn = bpy.context.scene
arm = bpy.data.objects["hero_rig"]; body = [o for o in arm.children if o.type == "MESH"][0]
ph = bpy.data.objects["phone"]
PW, PH, PT = 0.072, 0.152, 0.0082
groups = {g.index: g.name for g in body.vertex_groups}
hand_vs = []
for v in body.data.vertices:
    best = max(v.groups, key=lambda g: g.weight, default=None)
    if best is None: continue
    n = groups[best.group]
    if n.startswith(("thumb", "index", "middle", "ring", "pinky", "hand_r")) and ("_r_" in n):
        hand_vs.append((v.index, n.split("_")[0]))
print("hand verts", len(hand_vs))
for f in frames:
    scn.frame_set(f)
    dg = bpy.context.evaluated_depsgraph_get()
    ev = body.evaluated_get(dg); me = ev.to_mesh()
    inv = ph.matrix_world.inverted(); mw = body.matrix_world
    inside = {}; front = {}
    for vi, fn in hand_vs:
        p = inv @ (mw @ me.vertices[vi].co)
        if abs(p.x) < PW / 2 - 0.001 and abs(p.y) < PH / 2 - 0.001 and abs(p.z) < PT / 2:
            inside[fn] = inside.get(fn, 0) + 1
        elif abs(p.x) < PW / 2 - 0.004 and abs(p.y) < PH / 2 and p.z >= PT / 2:
            front[fn] = front.get(fn, 0) + 1   # devant l'écran (visible par-dessus)
    ev.to_mesh_clear()
    print(f"frame {f}: inside {inside or 0}  over-screen {front or 0}", flush=True)
