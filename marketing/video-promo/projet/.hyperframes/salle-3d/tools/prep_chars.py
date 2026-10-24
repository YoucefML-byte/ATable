# Normalise chaque personnage Renderpeople : mètres, Z-up, os sans préfixe, sauvegarde en .blend
import bpy, sys, os, re
from mathutils import Vector
S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
names = sys.argv[sys.argv.index("--")+1:]
for name in names:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = 30
    bpy.ops.import_scene.gltf(filepath=f"{S}/dl/{name}/scene.gltf")
    arm = [o for o in bpy.data.objects if o.type == "ARMATURE"][0]
    body = [o for o in bpy.data.objects if o.type == "MESH" and o.parent == arm][0]
    act = arm.animation_data.action if arm.animation_data else None
    # décrocher des empties en gardant la transformation monde
    for o in (arm, body):
        mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
    for o in list(bpy.data.objects):
        if o not in (arm, body): bpy.data.objects.remove(o)
    sc = arm.matrix_world.to_scale()[0]
    print(name, "scale", sc, "rot", arm.rotation_euler[:], "action", act.name if act else None)
    bpy.ops.object.select_all(action="DESELECT")
    for o in (arm, body): o.select_set(True)
    bpy.context.view_layer.objects.active = arm
    if arm.animation_data: arm.animation_data.action = None
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    arm.scale = (0.01, 0.01, 0.01); body.scale = (0.01, 0.01, 0.01); sc *= 0.01
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    body.parent = arm
    for m in body.modifiers:
        if m.type == "ARMATURE": m.object = arm
    # préfixes
    pre = None
    for b in arm.data.bones:
        m = re.match(r"(.*_)root_01$", b.name)
        if m: pre = m.group(1)
    if pre:
        for b in arm.data.bones:
            if b.name.startswith(pre): b.name = b.name[len(pre):]
    if act:
        for fc in act.fcurves:
            if pre: fc.data_path = fc.data_path.replace('"' + pre, '"')
            if fc.data_path.endswith("location"):
                for k in fc.keyframe_points:
                    k.co[1] *= sc; k.handle_left[1] *= sc; k.handle_right[1] *= sc
        act.name = name + os.environ.get("SUFFIX", "") + "_native"; act.use_fake_user = True
    arm.name = name + "_rig"; arm.data.name = name + "_rig"
    body.name = name + "_body"; body.data.name = name + "_body"
    for i, ms in enumerate(body.material_slots):
        ms.material.name = f"{name}_skin{i}"
    # os orientés articulation -> articulation (l'IK de Blender vise la queue de l'os) ; le skinning n'en dépend pas
    if not os.environ.get("NO_REORIENT"):
        bpy.ops.object.select_all(action="DESELECT"); arm.select_set(True); bpy.context.view_layer.objects.active = arm
        bpy.ops.object.mode_set(mode="EDIT")
        ebs = arm.data.edit_bones
        PREF = ("spine_01", "neck", "head_07", "upperarm", "lowerarm", "hand", "middle_01", "lowerleg", "foot", "ball")
        def main_child(eb):
            kids = [c for c in eb.children if "twist" not in c.name and "end" not in c.name or c.name.startswith(("thumb_end", "index_end", "middle_end", "ring_end", "pinky_end", "foot_end"))]
            kids = [c for c in kids if (c.head - eb.head).length > 1e-3 and c.head.length > 1e-3]
            if not kids: return None
            kids.sort(key=lambda c: min([i for i, p in enumerate(PREF) if c.name.startswith(p)] or [99]))
            return kids[0]
        newdir = {}
        for eb in ebs:
            if eb.name.startswith(("_rootJoint", "eye", "jaw", "mouth", "eyelid", "eyebrow")) or "end" in eb.name or "twist" in eb.name: continue
            if eb.name.startswith("head_07"):
                tgt = eb.head + Vector((0, 0, 0.2))
            else:
                c = main_child(eb)
                if c is None: continue
                tgt = c.head.copy()
            oz = eb.z_axis.copy()
            eb.tail = tgt; eb.align_roll(oz)
            newdir[eb.name] = (eb.tail - eb.head)
        for eb in ebs:  # os de torsion : parallèles à leur membre
            if "twist" in eb.name:
                base = eb.name.replace("_twist", "").rsplit("_", 1)[0]
                ref = [n for n in newdir if n.rsplit("_", 1)[0] == base]
                if ref:
                    oz = eb.z_axis.copy(); d = newdir[ref[0]].normalized() * 0.1
                    eb.tail = eb.head + d; eb.align_roll(oz)
        bpy.ops.object.mode_set(mode="OBJECT")
    hip = arm.data.bones["hip_02"]
    print(name, "height", round(body.dimensions.z, 3), "hip z", round(hip.head_local.z, 3))
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=f"{S}/build/chars/{name}{os.environ.get('SUFFIX', '')}.blend", compress=True)
