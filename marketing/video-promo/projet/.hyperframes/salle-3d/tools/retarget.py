# Retargeting Mixamo -> squelette Renderpeople (rotations monde + correction de pose de repos)
import bpy, os
from mathutils import Matrix, Vector, Quaternion

S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIX = S + "/mixamo"

MAP = {"Hips": "hip_02", "Spine": "spine_01_03", "Spine1": "spine_02_04", "Spine2": "spine_03_05",
       "Neck": "neck_06", "Head": "head_07"}
for side, s, n in (("Left", "l", 0), ("Right", "r", 1)):
    o = 25 * n  # décalage des indices Renderpeople côté droit
    MAP.update({f"{side}Shoulder": f"shoulder_{s}_{23+o:03d}", f"{side}Arm": f"upperarm_{s}_{24+o:03d}",
                f"{side}ForeArm": f"lowerarm_{s}_{25+o:03d}", f"{side}Hand": f"hand_{s}_{26+o:03d}"})
    for k, f in enumerate(("Thumb", "Index", "Middle", "Ring", "Pinky")):
        for j in range(3):
            MAP[f"{side}Hand{f}{j+1}"] = (f.lower(), j + 1, s, 27 + o + 4 * k + j)
    lo = 7 * n
    MAP.update({f"{side}UpLeg": f"upperleg_{s}_{74+lo:03d}", f"{side}Leg": f"lowerleg_{s}_{75+lo:03d}",
                f"{side}Foot": f"foot_{s}_{76+lo:03d}", f"{side}ToeBase": f"ball_{s}_{77+lo:03d}"})

def resolve_map(tgt):
    names = {b.name for b in tgt.data.bones}
    out = {}
    for src, t in MAP.items():
        if isinstance(t, tuple):  # doigts : les suffixes numériques varient d'un modèle à l'autre
            f, j, s, _ = t
            cand = [n for n in names if n.startswith(f"{f}_{j:02d}_{s}_")]
            if not cand: continue
            t = cand[0]
        if t in names: out["mixamorig:" + src] = t
    return out

def load_char(name, cache={}):
    if name in cache:
        a0, b0 = cache[name]
        arm = a0.copy(); arm.animation_data_clear(); body = b0.copy()
        for pb in arm.pose.bones:   # une copie ne doit pas hériter des contraintes (IK, regard) de l'original
            for c in list(pb.constraints): pb.constraints.remove(c)
        for c in list(arm.constraints): arm.constraints.remove(c)
        bpy.context.scene.collection.objects.link(arm); bpy.context.scene.collection.objects.link(body)
        body.parent = arm
        for m in body.modifiers:
            if m.type == "ARMATURE": m.object = arm
        return arm, body
    with bpy.data.libraries.load(f"{S}/build/chars/{name}.blend") as (src, dst):
        dst.objects = [n for n in src.objects]
        dst.actions = [n for n in src.actions]
    arm = body = None
    for o in dst.objects:
        bpy.context.scene.collection.objects.link(o)
        if o.type == "ARMATURE": arm = o
        else: body = o
    cache[name] = (arm, body)
    return arm, body

def load_mixamo(anim, cache={}):
    if anim in cache: return cache[anim]
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=f"{MIX}/{anim}.fbx")
    new = [o for o in bpy.data.objects if o not in before]
    arm = [o for o in new if o.type == "ARMATURE"][0]
    for o in new:
        if o is not arm: bpy.data.objects.remove(o)
    arm.name = "SRC_" + anim
    arm.hide_render = True
    cache[anim] = arm
    return arm

def _rot(m):
    return m.to_3x3().normalized()

def retarget(src, tgt, frame_pairs, action_name, hip_scale=None, mirror=False, bmap=None, hips=("mixamorig:Hips", "hip_02")):
    """frame_pairs : liste (frame cible, frame source). Crée une action sur tgt."""
    scn = bpy.context.scene
    bmap = bmap or resolve_map(tgt)
    sw, tw = src.matrix_world, tgt.matrix_world
    tw_rot = tw.to_quaternion().to_matrix(); tw_inv = tw.inverted()
    # repos
    srest = {s: _rot(sw @ src.data.bones[s].matrix_local) for s in bmap}
    trest = {t.name: _rot(tw @ t.matrix_local) for t in tgt.data.bones}
    corr = {}
    tnames = set(bmap.values())
    def under(tb, name):  # name est-il un descendant de tb ?
        b = tgt.data.bones[name].parent
        while b is not None:
            if b == tb: return True
            b = b.parent
        return False
    PREF = ("Spine", "Neck", "Head", "Middle1", "Arm", "ForeArm", "Hand", "Leg", "Foot", "ToeBase")
    for s, t in bmap.items():
        sb, tb = src.data.bones[s], tgt.data.bones[t]
        kids = [c for c in sb.children if c.name in bmap and under(tb, bmap[c.name])]
        if kids:
            kids.sort(key=lambda c: min([i for i, p in enumerate(PREF) if c.name.endswith(p)] or [99]))
            c = kids[0]
            vs = src.data.bones[c.name].head_local - sb.head_local
            vt = tgt.data.bones[bmap[c.name]].head_local - tb.head_local
        else:  # os terminal : vers l'os « _end » du côté cible, la queue côté source
            ends = [c for c in tb.children if c.name.startswith("head_end")] or [c for c in tb.children if "end" in c.name]
            vs = (sb.children[0].head_local if sb.children else sb.tail_local) - sb.head_local
            vt = (ends[0].head_local - tb.head_local) if ends else (tb.tail_local - tb.head_local)
        ds = (_rot(sw) @ vs).normalized(); dt = (tw_rot @ vt).normalized()
        if not kids and (vt.length > 0.4 or vt.length < 1e-4): dt = ds  # os « _end » mal placé : pas de correction
        corr[t] = dt.rotation_difference(ds).to_matrix()
    s_hip0 = sw @ src.data.bones[hips[0]].head_local
    t_hip0 = tw @ tgt.data.bones["hip_02"].head_local
    if hip_scale is None:
        hip_scale = t_hip0.z / max(s_hip0.z, 1e-6)
    inv_map = {t: s for s, t in bmap.items()}
    order = []
    def walk(b):
        order.append(b)
        for c in b.children: walk(c)
    for b in tgt.data.bones:
        if b.parent is None: walk(b)
    rel = {b.name: (b.parent.matrix_local.inverted() @ b.matrix_local if b.parent else b.matrix_local) for b in order}
    keys = {b.name: [] for b in order}
    hipkeys = []
    for tf, sf in frame_pairs:
        scn.frame_set(int(sf), subframe=sf - int(sf))
        pose = {}
        for b in order:
            n = b.name
            base = (pose[b.parent.name] @ rel[n]) if b.parent else rel[n].copy()
            if n in inv_map:
                s = inv_map[n]
                spw = _rot(sw @ src.pose.bones[s].matrix)
                D = spw @ srest[s].inverted()
                desired_w = D @ corr[n] @ trest[n]
                R = (tw_rot.inverted() @ desired_w)  # espace armature
                M = R.to_4x4(); M.translation = base.translation
                if n == "hip_02":
                    sp = sw @ src.pose.bones[s].head
                    wpos = t_hip0 + (sp - s_hip0) * hip_scale
                    M.translation = tw_inv @ wpos
            else:
                M = base
            pose[n] = M
            basis = rel[n].inverted() @ ((pose[b.parent.name].inverted() @ M) if b.parent else M)
            q = basis.to_quaternion()
            keys[n].append((tf, q))
            if n == "hip_02": hipkeys.append((tf, basis.translation.copy()))
    act = bpy.data.actions.new(action_name)
    for n, ks in keys.items():
        if n not in inv_map: continue
        pb = tgt.pose.bones[n]; pb.rotation_mode = "QUATERNION"
        prev = None
        for i in range(4):
            fc = act.fcurves.new(f'pose.bones["{n}"].rotation_quaternion', index=i, action_group=n)
            fc.keyframe_points.add(len(ks))
            co = []
            pq = None
            for tf, q in ks:
                if pq is not None and pq.dot(q) < 0: q = -q
                pq = q
                co += [tf, q[i]]
            fc.keyframe_points.foreach_set("co", co)
            for k in fc.keyframe_points: k.interpolation = "LINEAR"
            fc.update()
    for i in range(3):
        fc = act.fcurves.new('pose.bones["hip_02"].location', index=i, action_group="hip_02")
        fc.keyframe_points.add(len(hipkeys))
        co = []
        for tf, v in hipkeys: co += [tf, v[i]]
        fc.keyframe_points.foreach_set("co", co)
        for k in fc.keyframe_points: k.interpolation = "LINEAR"
        fc.update()
    if not tgt.animation_data: tgt.animation_data_create()
    tgt.animation_data.action = act
    return act
