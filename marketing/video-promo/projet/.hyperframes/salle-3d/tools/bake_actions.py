# Cuit toutes les actions des personnages (retargeting Mixamo -> Renderpeople) dans build/actions.blend
import bpy, sys, os, math, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import retarget as R
from mathutils import Quaternion, Vector
NF = 255

def pingpong(x, a, b):
    L = b - a; u = (x - a) % (2 * L)
    return a + u if u <= L else b - (u - L)

# (nom d'action, personnage, animation Mixamo, fonction frame cible -> frame source)
def loop_pp(a, b, start, rate=1.0): return lambda f: pingpong(start + f * rate, a, b)
def lin(start, rate=1.0): return lambda f: start + f * rate
JOBS = [
    # convives
    ("t1_bl", "carla", "Sitting Talking", lin(30)),
    ("t1_br", "manuel", "Sitting Drinking", lin(140)),
    ("t2_bl", "sophia", "Sitting Laughing", loop_pp(1, 251, 40)),
    ("t2_fr", "nathan", "Sitting Talking", lin(420)),
    ("t3_br", "claudia", "Sitting Idle", loop_pp(1, 193, 20)),
    ("t3_fl", "manuel", "Sitting Talking", lin(760)),
    ("t5_bl", "sophia", "Sitting Talking", lin(1000)),
    ("t5_br", "manuel", "Sitting Laughing", loop_pp(1, 251, 150)),
    ("t5_fl", "carla", "Sitting Drinking", lin(170)),
    ("t6_bl", "carla", "Sitting Idle", loop_pp(1, 193, 90)),
    ("t6_fr", "nathan", "Sitting Drinking", lin(195)),
    # table 4
    ("friend", "claudia", "Sitting Talking", lin(560)),
    ("hero", "nathan", "Sitting Idle", loop_pp(1, 193, 60, 0.85)),
    ("hero_txt", "nathan", "Texting", lin(150)),
    # comptoir
    ("staff", "carla", "Texting", lin(60)),
]
FINGERS = ("thumb", "index", "middle", "ring", "pinky")

def fc_arrays(act):
    out = {}
    for fc in act.fcurves:
        n = len(fc.keyframe_points); co = [0.0] * (2 * n); fc.keyframe_points.foreach_get("co", co)
        out[(fc.data_path, fc.array_index)] = (fc, co)
    return out

def hip_stats(arm, act):
    arm.animation_data.action = act
    hs = []; fz = []
    for f in range(0, NF, 6):
        bpy.context.scene.frame_set(f)
        hs.append(arm.matrix_world @ arm.pose.bones["hip_02"].head)
        for b in ("foot_l_076", "foot_r_083"):
            if b in arm.pose.bones: fz.append((arm.matrix_world @ arm.pose.bones[b].head).z)
    m = sum(hs, Vector()) / len(hs)
    return [m.x, m.y, m.z], min(fz) if fz else 0.0

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scn = bpy.context.scene; scn.render.fps = 30
    rigs = {}
    stats = {}
    for name, char, anim, fmap in JOBS:
        src = R.load_mixamo(anim)
        if char not in rigs:
            rigs[char] = R.load_char(char)[0]
            bpy.context.view_layer.update()
        arm = rigs[char]
        act = R.retarget(src, arm, [(f, fmap(f)) for f in range(NF)], name)
        act.use_fake_user = True
        stats[name] = hip_stats(arm, act)
        print("baked", name, [round(v, 3) for v in stats[name][0]], round(stats[name][1], 3), flush=True)
    # le client : doigts de la main droite pris sur « Texting » (tenue du téléphone) à partir de 3,6 s
    A = bpy.data.actions["hero"]; B = bpy.data.actions["hero_txt"]
    fa, fb = fc_arrays(A), fc_arrays(B)
    for (path, idx), (fc, co) in fa.items():
        bone = path.split('"')[1]
        if not (bone.endswith(tuple(f"_r_{i:03d}" for i in range(50, 75))) and bone.split("_")[0] in FINGERS): continue
        if (path, idx) not in fb: continue
        cb = fb[(path, idx)][1]
        for k in range(0, len(co), 2):
            f = co[k]; w = min(max((f / 30.0 - 3.55) / 0.35, 0), 1)
            co[k + 1] = co[k + 1] * (1 - w) + cb[k + 1] * w
        fc.keyframe_points.foreach_set("co", co); fc.update()
    # le client se penche vers la plaque (4,75–5,45 s)
    def ease(k): k = min(max(k, 0), 1); return 4 * k ** 3 if k < 0.5 else 1 - (-2 * k + 2) ** 3 / 2
    for bone, amt in (("spine_02_04", 0.10), ("spine_03_05", 0.08)):
        fcs = [fa[(f'pose.bones["{bone}"].rotation_quaternion', i)] for i in range(4)]
        n = len(fcs[0][1]) // 2
        for k in range(n):
            f = fcs[0][1][2 * k]; t = f / 30.0
            a = amt * (0.3 + ease((t - 3.3) / 0.5) * 0.4 + ease((t - 4.75) / 0.7) * 0.6)
            q = Quaternion([fcs[i][1][2 * k + 1] for i in range(4)])
            q = Quaternion((1, 0, 0), a) @ q
            for i in range(4): fcs[i][1][2 * k + 1] = q[i]
        for fc, co in fcs: fc.keyframe_points.foreach_set("co", co); fc.update()
    # le serveur : marche de Nathan (Renderpeople, squelette d'origine) retargetée sur Eric, en boucle (67 images = 2 pas)
    src, _ = R.load_char("nathan_src"); walk = bpy.data.actions["nathan_src_native"]
    src.animation_data_create(); src.animation_data.action = walk
    if getattr(src.animation_data, "action_slot", None) is None and len(walk.slots): src.animation_data.action_slot = walk.slots[0]
    bpy.context.view_layer.update()
    eric = rigs.get("eric") or R.load_char("eric")[0]
    tm = R.resolve_map(eric); bm = {t: t for t in tm.values() if t in src.data.bones}
    act = R.retarget(src, eric, [(f, (f * 1.0) % 67.0) for f in range(NF)], "waiter_walk", hip_scale=1.0, bmap=bm, hips=("hip_02", "hip_02"))
    act.use_fake_user = True
    stats["walk_speed"] = 1.16
    # cliente debout au comptoir : attente naturelle de Sophia (Renderpeople) retargetée sur le squelette réorienté
    ssrc, _ = R.load_char("sophia_src"); idle = bpy.data.actions["sophia_src_native"]
    ssrc.animation_data_create(); ssrc.animation_data.action = idle
    if getattr(ssrc.animation_data, "action_slot", None) is None and len(idle.slots): ssrc.animation_data.action_slot = idle.slots[0]
    bpy.context.view_layer.update()
    soph = rigs.get("sophia") or R.load_char("sophia")[0]
    tm = R.resolve_map(soph); bm = {t: t for t in tm.values() if t in ssrc.data.bones}
    act = R.retarget(ssrc, soph, [(f, 40 + f) for f in range(NF)], "bar_idle", hip_scale=1.0, bmap=bm, hips=("hip_02", "hip_02"))
    act.use_fake_user = True; stats["bar_idle"] = hip_stats(soph, act)
    man = rigs.get("manuel") or R.load_char("manuel")[0]
    act = R.retarget(R.load_mixamo("Texting"), man, [(f, 200 + f) for f in range(NF)], "bar_text")
    act.use_fake_user = True; stats["bar_text"] = hip_stats(man, act)
    bpy.data.actions["hero"]["stats"] = json.dumps(stats)
    for a in bpy.data.actions:
        if not a.use_fake_user and a.name != "nathan_native": a.use_fake_user = False
    json.dump(stats, open(R.S + "/build/actions_stats.json", "w"), indent=1)
    # ne garder que les actions
    for o in list(bpy.data.objects): bpy.data.objects.remove(o)
    bpy.ops.outliner.orphans_purge(do_recursive=True)
    bpy.ops.wm.save_as_mainfile(filepath=R.S + "/build/actions.blend")

main()
