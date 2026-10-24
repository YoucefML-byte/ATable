# Part des sommets de la main droite du client visibles depuis la caméra (lancer de rayons), image par image
import bpy, sys
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
frames = [int(x) for x in sys.argv[sys.argv.index("--") + 1:]]
scn = bpy.context.scene; cam = scn.camera
arm = bpy.data.objects["hero_rig"]; body = [o for o in arm.children if o.type == "MESH"][0]
groups = {g.index: g.name for g in body.vertex_groups}
HV = [v.index for v in body.data.vertices if v.groups and (lambda n: "_r_" in n and n.startswith(("thumb", "index", "middle", "ring", "pinky", "hand")))(groups[max(v.groups, key=lambda g: g.weight).group])]
for f in frames:
    scn.frame_set(f); dg = bpy.context.evaluated_depsgraph_get()
    me = body.evaluated_get(dg).to_mesh(); mw = body.matrix_world; co = cam.matrix_world.translation
    vis = inframe = 0
    for vi in HV[::3]:
        p = mw @ me.vertices[vi].co; c = world_to_camera_view(scn, cam, p)
        if not (0 <= c.x <= 1 and 0 <= c.y <= 1 and c.z > 0): continue
        inframe += 1
        d = p - co; hit, loc, n, idx, ob, m = scn.ray_cast(dg, co, d.normalized(), distance=d.length - 0.003)
        if not hit or (ob and ob.original == body and (loc - p).length < 0.01): vis += 1
    body.evaluated_get(dg).to_mesh_clear()
    print(f"frame {f}: in-frame {inframe} visible {vis} / {len(HV[::3])}", flush=True)
