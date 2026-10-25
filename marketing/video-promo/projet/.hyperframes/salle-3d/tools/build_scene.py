# Plan 03a « La salle » — scène Blender réaliste (Cycles), 8,5 s à 30 i/s (images 0–254, t = image / 30)
# Repère Blender : X = x three.js, Y = −z three.js, Z = y three.js (le plan de salle 02c vu de dessus a +Y vers le haut).
import bpy, sys, os, math, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import retarget as R
import assets as A
from mathutils import Vector, Matrix, Quaternion, Euler

S = R.S
B = S + "/build"
FPS, NF = 30, 255
STATS = json.load(open(B + "/actions_stats.json"))

def clamp(x, a, b): return max(a, min(b, x))
def seg(t, a, b): return clamp((t - a) / (b - a), 0, 1)
def ease(k):
    k = clamp(k, 0, 1); return 4 * k ** 3 if k < 0.5 else 1 - (-2 * k + 2) ** 3 / 2
def lerp(a, b, k): return a + (b - a) * k
def srgb(h):
    h = h.lstrip("#"); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c) + (1.0,)

bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene
scn.render.fps = FPS; scn.frame_start = 0; scn.frame_end = NF - 1
COL = scn.collection

# ============================================================ matériaux
IMGS = {}
def img(path, data=False):
    if path not in IMGS:
        im = bpy.data.images.load(path, check_existing=True)
        if data: im.colorspace_settings.name = "Non-Color"
        IMGS[path] = im
    return IMGS[path]

def new_mat(name):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; bsdf = nt.nodes["Principled BSDF"]
    return m, nt, bsdf

def mat_flat(name, color, rough=0.5, metal=0.0, **kw):
    m, nt, b = new_mat(name)
    b.inputs["Base Color"].default_value = srgb(color) if isinstance(color, str) else color
    b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    for k, v in kw.items(): b.inputs[k].default_value = v
    return m

def mat_tex(name, tex, size=1.0, rough_mul=1.0, tint=None, metal=0.0, nor_strength=1.0, box=True, bright=1.0, sat=1.0, rot=0.0):
    """Texture Poly Haven en projection boîte (coordonnées objet), `size` = mètres par répétition."""
    m, nt, b = new_mat(name); N = nt.nodes; L = nt.links
    tc = N.new("ShaderNodeTexCoord"); mp = N.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / size,) * 3; mp.inputs["Rotation"].default_value = (0, 0, rot)
    L.new(tc.outputs["Object"], mp.inputs["Vector"])
    def tx(path, data):
        t = N.new("ShaderNodeTexImage"); t.image = img(path, data)
        if box: t.projection = "BOX"; t.projection_blend = 0.2
        L.new(mp.outputs["Vector"], t.inputs["Vector"]); return t
    d = tx(f"{S}/tex/{tex}_diff.jpg", False)
    col = d.outputs["Color"]
    if tint or bright != 1.0 or sat != 1.0:
        hs = N.new("ShaderNodeHueSaturation"); hs.inputs["Saturation"].default_value = sat; hs.inputs["Value"].default_value = bright
        L.new(col, hs.inputs["Color"]); col = hs.outputs["Color"]
        if tint:
            mx = N.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"; mx.inputs[0].default_value = 1.0
            mx.inputs[7].default_value = srgb(tint); L.new(col, mx.inputs[6]); col = mx.outputs[2]
    L.new(col, b.inputs["Base Color"])
    if os.path.exists(f"{S}/tex/{tex}_rough.jpg"):
        r = tx(f"{S}/tex/{tex}_rough.jpg", True)
        mth = N.new("ShaderNodeMath"); mth.operation = "MULTIPLY"; mth.inputs[1].default_value = rough_mul
        L.new(r.outputs["Color"], mth.inputs[0]); L.new(mth.outputs[0], b.inputs["Roughness"])
    if os.path.exists(f"{S}/tex/{tex}_nor.jpg"):
        n = tx(f"{S}/tex/{tex}_nor.jpg", True); nm = N.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = nor_strength
        L.new(n.outputs["Color"], nm.inputs["Color"]); L.new(nm.outputs["Normal"], b.inputs["Normal"])
    b.inputs["Metallic"].default_value = metal
    return m

def mat_img(name, path, rough=0.5, emission=0.0, alpha=False, metal=0.0, coat=0.0, seq=None):
    m, nt, b = new_mat(name); N = nt.nodes; L = nt.links
    t = N.new("ShaderNodeTexImage"); t.image = img(path); t.interpolation = "Cubic"
    if seq:
        t.image.source = "SEQUENCE"; t.image_user.frame_duration = seq; t.image_user.frame_start = 0
        t.image_user.frame_offset = -1; t.image_user.use_auto_refresh = True; t.image_user.use_cyclic = False
    L.new(t.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    b.inputs["Coat Weight"].default_value = coat
    if emission:
        L.new(t.outputs["Color"], b.inputs["Emission Color"]); b.inputs["Emission Strength"].default_value = emission
    if alpha:
        L.new(t.outputs["Alpha"], b.inputs["Alpha"])
    return m, t

GREEN, GREEN_DEEP, CREAM, CREAM2, GOLD, INK = "#1F4D3A", "#173B2D", "#F4EFE6", "#E7DCC6", "#E0A33A", "#0C1613"
M = {}
M["parquet"] = mat_tex("parquet", "herringbone_parquet", size=2.2, rough_mul=2.4, bright=0.85, sat=1.05)
M["parquet"].node_tree.nodes["Principled BSDF"].inputs["Specular IOR Level"].default_value = 0.32
M["plaster"] = mat_tex("plaster", "painted_plaster_wall", size=2.5, tint="#E2D2B4", rough_mul=1.0, bright=0.95)
M["brick"] = mat_tex("brick", "red_brick_03", size=2.0, bright=0.75, nor_strength=1.2)
M["wood_top"] = mat_tex("wood_top", "wood_table_001", size=1.6, rough_mul=0.6, bright=1.15, sat=0.9)
M["marble"] = mat_tex("marble", "marble_01", size=1.4, rough_mul=0.35)
M["velvet"] = mat_tex("velvet", "velour_velvet", size=0.8, tint="#2E6B52")
M["paint_green"] = mat_flat("paint_green", GREEN, rough=0.32, **{"Coat Weight": 0.15})
M["paint_green_d"] = mat_flat("paint_green_d", GREEN_DEEP, rough=0.38)
M["cream_trim"] = mat_flat("cream_trim", CREAM2, rough=0.35)
M["brass"] = mat_flat("brass", (0.78, 0.55, 0.26, 1), rough=0.22, metal=1.0)
M["gold_plate"] = mat_flat("gold_plate", (0.80, 0.58, 0.25, 1), rough=0.24, metal=1.0, **{"Anisotropic": 0.6})
M["gold_engrave"] = mat_flat("gold_engrave", (0.33, 0.22, 0.07, 1), rough=0.5, metal=0.6)
M["black_metal"] = mat_flat("black_metal", (0.02, 0.02, 0.02, 1), rough=0.35, metal=0.9)
M["ceramic"] = mat_flat("ceramic", (0.86, 0.85, 0.82, 1), rough=0.12, **{"Coat Weight": 0.3})
M["glass"] = mat_flat("glass", (1, 1, 1, 1), rough=0.0, **{"Transmission Weight": 1.0, "IOR": 1.45})
M["water"] = mat_flat("water", (0.9, 0.95, 1, 1), rough=0.0, **{"Transmission Weight": 1.0, "IOR": 1.33})
M["phone_body"] = mat_flat("phone_body", (0.015, 0.016, 0.018, 1), rough=0.25, metal=0.7)
M["paper"] = mat_flat("paper", CREAM, rough=0.7)
M["ceiling"] = mat_flat("ceiling", "#2A1D14", rough=0.8)
M["napkin"] = mat_flat("napkin", "#EDE6DA", rough=0.85)

def emit_mat(name, color, strength):
    m, nt, b = new_mat(name)
    b.inputs["Base Color"].default_value = color; b.inputs["Emission Color"].default_value = color
    b.inputs["Emission Strength"].default_value = strength
    return m
WARM = (1.0, 0.72, 0.42, 1)
M["bulb"] = emit_mat("bulb", (1.0, 0.78, 0.5, 1), 25.0)
M["led"] = emit_mat("led", (1.0, 0.7, 0.4, 1), 6.0)

# ============================================================ géométrie de base
def box(name, size, loc, mat, bevel=0.0, rot=(0, 0, 0), parent=None, coll=None):
    me = bpy.data.meshes.new(name)
    import bmesh
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); o.location = loc; o.rotation_euler = rot
    (coll or COL).objects.link(o)
    me.materials.append(mat)
    if bevel:
        md = o.modifiers.new("bevel", "BEVEL"); md.width = bevel; md.segments = 3; md.limit_method = "ANGLE"
    for p in me.polygons: p.use_smooth = bool(bevel)
    if parent: o.parent = parent
    return o

def cyl(name, r, h, loc, mat, verts=32, rot=(0, 0, 0), r2=None, parent=None):
    me = bpy.data.meshes.new(name)
    import bmesh
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=verts, radius1=r, radius2=r if r2 is None else r2, depth=h)
    bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); o.location = loc; o.rotation_euler = rot; COL.objects.link(o)
    me.materials.append(mat)
    for p in me.polygons: p.use_smooth = True
    md = o.modifiers.new("ws", "WEIGHTED_NORMAL") if False else None
    if parent: o.parent = parent
    return o

def lathe(name, prof, loc, mat, segs=48, parent=None):
    """Objet de révolution autour de Z à partir d'un profil [(r, z), …]."""
    import bmesh
    bm = bmesh.new(); rings = []
    for i in range(segs):
        a = 2 * math.pi * i / segs
        rings.append([bm.verts.new((r * math.cos(a), r * math.sin(a), z)) for r, z in prof])
    for i in range(segs):
        r0, r1 = rings[i], rings[(i + 1) % segs]
        for j in range(len(prof) - 1):
            bm.faces.new((r0[j], r1[j], r1[j + 1], r0[j + 1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    o = bpy.data.objects.new(name, me); o.location = loc; COL.objects.link(o); me.materials.append(mat)
    if parent: o.parent = parent
    return o

def plane(name, w, h, loc, mat, rot=(0, 0, 0), parent=None):
    import bmesh
    bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
    uv = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        for l in f.loops: l[uv].uv = (l.vert.co.x + 0.5, l.vert.co.y + 0.5)
    for v in bm.verts: v.co.x *= w; v.co.y *= h
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); o.location = loc; o.rotation_euler = rot; COL.objects.link(o); me.materials.append(mat)
    if parent: o.parent = parent
    return o

def hide_cam(o):
    o.visible_camera = False
    for c in o.children: hide_cam(c)

# ============================================================ la salle
FX0, FX1, FY0, FY1, HW = -6.6, 6.6, -4.6, 4.6, 3.2
box("floor", (FX1 - FX0 + 0.3, FY1 - FY0 + 0.3, 0.1), (0, 0, -0.05), M["parquet"])
WIN_X = [-2.6, 1.9]; WIN_W, WIN_Z0, WIN_Z1 = 1.5, 1.2, 2.85
back = box("wall_back", (FX1 - FX0 + 0.3, 0.15, HW), (0, FY1 + 0.075, HW / 2), M["plaster"])
for i, wx in enumerate(WIN_X):
    cut = box(f"cut{i}", (WIN_W, 0.6, WIN_Z1 - WIN_Z0), (wx, FY1 + 0.075, (WIN_Z0 + WIN_Z1) / 2), M["plaster"])
    md = back.modifiers.new(f"b{i}", "BOOLEAN"); md.object = cut; md.operation = "DIFFERENCE"; md.solver = "EXACT"
    cut.hide_render = True; cut.hide_viewport = True
box("wall_left", (0.15, FY1 - FY0 + 0.3, HW), (FX0 - 0.075, 0, HW / 2), M["plaster"])
hide_cam(box("wall_front", (FX1 - FX0 + 0.3, 0.15, HW), (0, FY0 - 0.075, HW / 2), M["plaster"]))
hide_cam(box("wall_right", (0.15, FY1 - FY0 + 0.3, HW), (FX1 + 0.075, 0, HW / 2), M["plaster"]))
hide_cam(box("ceiling", (FX1 - FX0 + 0.3, FY1 - FY0 + 0.3, 0.1), (0, 0, HW + 0.05), M["ceiling"]))
# corniche
box("cornice_b", (FX1 - FX0, 0.08, 0.1), (0, FY1 - 0.04, HW - 0.05), M["cream_trim"], bevel=0.01)
box("cornice_l", (0.08, FY1 - FY0, 0.1), (FX0 + 0.04, 0, HW - 0.05), M["cream_trim"], bevel=0.01)
# briques derrière le bar
box("brick_bar", (FX1 - 2.75, 0.02, HW), ((FX1 + 2.75) / 2, FY1 - 0.01, HW / 2), M["brick"])

def wainscot(x0, x1, along="x", fixed=FY1, inward=-1):
    """Soubassement vert à panneaux sur un pan de mur (along x : mur du fond, along y : mur de gauche)."""
    L = x1 - x0; H = 1.02
    def bx(name, a0, a1, z0, z1, depth, mat, bev=0.004):
        c = (a0 + a1) / 2; w = a1 - a0; off = fixed + inward * depth / 2
        if along == "x": return box(name, (w, depth, z1 - z0), (c, off, (z0 + z1) / 2), mat, bevel=bev)
        return box(name, (depth, w, z1 - z0), (off, c, (z0 + z1) / 2), mat, bevel=bev)
    bx("ws_back", x0, x1, 0, H, 0.02, M["paint_green"], 0)
    bx("ws_base", x0, x1, 0, 0.14, 0.035, M["paint_green_d"])
    bx("ws_rail", x0, x1, H - 0.07, H, 0.035, M["paint_green"])
    bx("ws_cap", x0, x1, H, H + 0.045, 0.055, M["cream_trim"], 0.008)
    n = max(1, round(L / 0.72)); w = L / n
    for i in range(n + 1):
        a = x0 + i * w
        bx("ws_stile", a - 0.035, a + 0.035, 0.14, H - 0.07, 0.035, M["paint_green"])
        if i < n:
            bx("ws_panel", a + 0.08, a + w - 0.08, 0.24, H - 0.17, 0.03, M["paint_green"], 0.012)
wainscot(FX0, 2.75, "x", FY1, -1)
wainscot(FY0, FY1, "y", FX0, +1)

# fenêtres (cadre vert, croisillons, vitrage, appui)
for i, wx in enumerate(WIN_X):
    x0, x1 = wx - WIN_W / 2, wx + WIN_W / 2; zc = (WIN_Z0 + WIN_Z1) / 2; t = 0.07
    for nm, sz, lc in (("l", (t, 0.16, WIN_Z1 - WIN_Z0), (x0 + t / 2, FY1 + 0.06, zc)),
                       ("r", (t, 0.16, WIN_Z1 - WIN_Z0), (x1 - t / 2, FY1 + 0.06, zc)),
                       ("t", (WIN_W, 0.16, t), (wx, FY1 + 0.06, WIN_Z1 - t / 2)),
                       ("b", (WIN_W, 0.16, t), (wx, FY1 + 0.06, WIN_Z0 + t / 2)),
                       ("m", (0.045, 0.06, WIN_Z1 - WIN_Z0), (wx, FY1 + 0.09, zc)),
                       ("h", (WIN_W, 0.06, 0.045), (wx, FY1 + 0.09, WIN_Z0 + (WIN_Z1 - WIN_Z0) * 0.68))):
        box(f"win{i}_{nm}", sz, lc, M["paint_green"], bevel=0.006)
    g = box(f"glass{i}", (WIN_W - 2 * t, 0.006, WIN_Z1 - WIN_Z0 - 2 * t), (wx, FY1 + 0.11, zc), M["glass"])
    box(f"sill{i}", (WIN_W + 0.16, 0.16, 0.04), (wx, FY1 - 0.06, WIN_Z0 - 0.02), M["cream_trim"], bevel=0.008)
# la rue la nuit derrière les vitres (panneau émissif = HDRI vu dans la direction du regard)
bd, nt, bb = new_mat("backdrop"); N = nt.nodes; Lk = nt.links
nt.nodes.remove(bb); out = N["Material Output"]
tc = N.new("ShaderNodeNewGeometry"); vm = N.new("ShaderNodeVectorMath"); vm.operation = "SCALE"; vm.inputs["Scale"].default_value = -1
mp = N.new("ShaderNodeMapping"); mp.inputs["Rotation"].default_value = (0, 0, math.radians(200))
env = N.new("ShaderNodeTexEnvironment"); env.image = img(S + "/tex/cobblestone_street_night_2k.hdr")
em = N.new("ShaderNodeEmission"); em.inputs["Strength"].default_value = 1.6
Lk.new(tc.outputs["Incoming"], vm.inputs[0]); Lk.new(vm.outputs[0], mp.inputs["Vector"]); Lk.new(mp.outputs["Vector"], env.inputs["Vector"])
Lk.new(env.outputs["Color"], em.inputs["Color"]); Lk.new(em.outputs[0], out.inputs["Surface"])
bdp = plane("backdrop", 9.0, 2.8, (0, FY1 + 0.9, 1.75), bd, rot=(math.pi / 2, 0, 0))
bdp.visible_shadow = False

# monde : la nuit (éclaire faiblement par les fenêtres) ; le film est transparent, fond vert ajouté au compositing
w = bpy.data.worlds.new("night"); scn.world = w; w.use_nodes = True
wn = w.node_tree.nodes; wl = w.node_tree.links
we = wn.new("ShaderNodeTexEnvironment"); we.image = img(S + "/tex/cobblestone_street_night_2k.hdr")
wl.new(we.outputs["Color"], wn["Background"].inputs["Color"]); wn["Background"].inputs["Strength"].default_value = 0.6

# ============================================================ enseigne « À vos tables »
m_logo, _ = mat_img("logo", B + "/tex/logo.png", rough=0.22, coat=0.6)
SIGN_X = -0.35
box("sign_frame", (0.86, 0.03, 0.86), (SIGN_X, FY1 - 0.015, 2.2), M["brass"], bevel=0.008)
plane("sign_logo", 0.8, 0.8, (SIGN_X, FY1 - 0.0305, 2.2), m_logo, rot=(math.pi / 2, 0, 0))
font = bpy.data.fonts.load(S + "/fonts/SourceSerif4-600.ttf")
cu = bpy.data.curves.new("wordmark", "FONT"); cu.body = "À vos tables"; cu.font = font; cu.size = 0.27
cu.align_x = "CENTER"; cu.align_y = "CENTER"; cu.extrude = 0.008; cu.bevel_depth = 0.0015
wm = bpy.data.objects.new("wordmark", cu); wm.location = (SIGN_X, FY1 - 0.012, 1.5); wm.rotation_euler = (math.pi / 2, 0, 0)
COL.objects.link(wm); cu.materials.append(M["brass"])
sp = bpy.data.lights.new("sign_spot", "SPOT"); sp.energy = 60; sp.color = WARM[:3]; sp.spot_size = math.radians(70); sp.spot_blend = 0.6; sp.shadow_soft_size = 0.05
spo = bpy.data.objects.new("sign_spot", sp); spo.location = (SIGN_X, FY1 - 0.55, 2.95); COL.objects.link(spo)
spo.rotation_euler = (math.radians(35), 0, 0)
box("sign_lamp", (0.5, 0.06, 0.05), (SIGN_X, FY1 - 0.12, 2.75), M["brass"], bevel=0.01)

# ============================================================ modèles importés
AS = {}
AS["chair"] = A.import_asset("chair", "chair", 1.0)
AS["pendant"] = A.import_asset("pendant", "pendant", 1.0, pivot="top")
AS["backbar"] = A.import_asset("backbar", "backbar", 0.62, pivot="back")
AS["walllamp"] = A.import_asset("walllamp", "walllamp", 1.0, pivot="back")
AS["monstera"] = A.import_asset("monstera", "monstera", 1.0)
AS["palm"] = A.import_asset("palm", "palm", 1.0)
AS["wineglass"] = A.import_asset("wineglass", "glasses", 1.0, keep=["red_wine"])
AS["whiteglass"] = A.import_asset("whiteglass", "glasses", 1.0, keep=["white_wine"])
AS["pint"] = A.import_asset("pint", "glasses", 1.0, keep=["pint_low"])
AS["highball"] = A.import_asset("highball", "glasses", 1.0, keep=["Highball"])
AS["bottle"] = A.import_asset("bottle", "wine", 1.9, keep=["pasted__"])
AS["pizza"] = A.import_asset("pizza", "pizza", 0.5)
AS["pasta"] = A.import_asset("pasta", "pasta", 0.85)
AS["fork"] = A.import_asset("fork", "silverware", 0.044, keep=["Object_6"])
AS["knife"] = A.import_asset("knife", "silverware", 0.044, keep=["Object_8"])
AS["beertap"] = A.import_asset("beertap", "beertap", 1.0)
# verres : vrai verre transparent
for k in ("wineglass", "whiteglass", "pint", "highball"):
    for o in AS[k].objects:
        o.data.materials.clear(); o.data.materials.append(M["glass"])

# orientation de la chaise : dossier vers +Y (la chaise « regarde » −Y, comme les personnages)
vs = [v.co for o in AS["chair"].objects for v in o.data.vertices]
top = [v for v in vs if v.z > 0.62]
bx = sum(v.x for v in top) / max(1, len(top)); by = sum(v.y for v in top) / max(1, len(top))
turn = math.pi / 2 - math.atan2(by, bx)   # le dossier du modèle Sketchfab est sur le côté (+X) : quart de tour
for o in AS["chair"].objects: o.data.transform(Matrix.Rotation(turn, 4, "Z"))
vs = [v.co for o in AS["chair"].objects for v in o.data.vertices]
zs = sorted(v.z for v in vs if 0.3 < v.z < 0.6 and abs(v.y) < 0.12 and abs(v.x) < 0.12)
SEAT_H = zs[-1] if zs else 0.46
print("seat height", round(SEAT_H, 3))

# lampe : ampoule émissive
for o in AS["pendant"].objects:
    if "Bulb" in o.name: o.data.materials.clear(); o.data.materials.append(M["bulb"])
for o in AS["walllamp"].objects:
    if "Bulb" in o.name: o.data.materials.clear(); o.data.materials.append(M["bulb"])

def point_light(name, loc, power, radius=0.04, color=WARM):
    l = bpy.data.lights.new(name, "POINT"); l.energy = power; l.shadow_soft_size = radius; l.color = color[:3]
    o = bpy.data.objects.new(name, l); o.location = loc; COL.objects.link(o); return o

# ============================================================ tables, plaques, couverts, suspensions
TABLES = [(-3.4, 1.6, -1), (0.0, 1.6, 1), (3.4, 1.6, -1), (-3.4, -1.6, 1), (0.0, -1.6, -1), (3.4, -1.6, 1)]
TOP_Z = 0.75
m_eng, _ = mat_img("engrave", B + "/tex/engraving.png", rough=0.5, alpha=True, metal=0.6)
m_eng.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.30, 0.20, 0.07, 1)
for lk in list(m_eng.node_tree.links):
    if lk.to_socket.name == "Base Color": m_eng.node_tree.links.remove(lk)
eng_t = [n for n in m_eng.node_tree.nodes if n.type == "TEX_IMAGE"][0]
m_eng.node_tree.links.new(eng_t.outputs["Color"], m_eng.node_tree.nodes["Principled BSDF"].inputs["Alpha"])
PLATE_W, PLATE_D, PLATE_T = 0.24, 0.155, 0.008
plate_pos = []
for i, (tx, ty, side) in enumerate(TABLES):
    box(f"table{i+1}_top", (1.3, 0.8, 0.04), (tx, ty, TOP_Z - 0.02), M["wood_top"], bevel=0.008)
    box(f"table{i+1}_apron", (1.16, 0.66, 0.07), (tx, ty, TOP_Z - 0.075), M["black_metal"], bevel=0.004)
    for lx, ly in ((-0.56, -0.31), (0.56, -0.31), (-0.56, 0.31), (0.56, 0.31)):
        cyl(f"table{i+1}_leg", 0.02, TOP_Z - 0.04, (tx + lx, ty + ly, (TOP_Z - 0.04) / 2), M["black_metal"], 16)
    # plaque dorée au bout indiqué (même convention que 02c : texte lisible vers +Y, retournée côté −1)
    px = tx + side * 0.49
    root = bpy.data.objects.new(f"plate{i+1}", None); root.location = (px, ty, TOP_Z); root.rotation_euler = (0, 0, 0 if side > 0 else math.pi)
    COL.objects.link(root)
    pb = box(f"plate{i+1}_body", (PLATE_W, PLATE_D, PLATE_T), (0, 0, PLATE_T / 2), M["gold_plate"], bevel=0.0025, parent=root)
    m_st, _ = mat_img(f"sticker{i+1}", B + f"/tex/sticker_{i+1}.png", rough=0.45, alpha=True, coat=0.4)
    k = PLATE_W / 560
    plane(f"plate{i+1}_sticker", 220 * k, 250 * k, (0, (180 - 159) * k, PLATE_T + 0.0004), m_st, parent=root)
    plane(f"plate{i+1}_engrave", PLATE_W, PLATE_D, (0, 0, PLATE_T + 0.0002), m_eng, parent=root)
    plate_pos.append(Vector((px, ty, TOP_Z + PLATE_T)))
    # suspension au-dessus de la table
    A.place(AS["pendant"], (tx, ty, HW), name=f"pendant{i+1}")
    point_light(f"pendant{i+1}_L", (tx, ty, HW - 1.02), 75, 0.035)

# ============================================================ comptoir et bar
CX, CY = 4.9, 3.35
box("counter_body", (2.4, 0.6, 1.02), (CX, CY, 0.51), M["paint_green"], bevel=0.01)
for k2 in range(4):
    box("counter_panel", (0.48, 0.02, 0.62), (CX - 0.9 + k2 * 0.6, CY - 0.305, 0.55), M["paint_green"], bevel=0.012)
box("counter_kick", (2.42, 0.62, 0.1), (CX, CY + 0.01, 0.05), M["paint_green_d"])
box("counter_top", (2.6, 0.74, 0.045), (CX, CY, 1.045), M["marble"], bevel=0.01)
rail = cyl("counter_rail", 0.022, 2.3, (CX, CY - 0.45, 0.2), M["brass"], 16, rot=(0, math.pi / 2, 0))
for k2 in range(3):
    A.place(AS["beertap"], (CX - 0.55 + k2 * 0.22, CY + 0.12, 1.068), name="tap")
for k2 in range(5):
    A.place(AS["pint"] if k2 % 2 else AS["wineglass"], (CX + 0.25 + k2 * 0.12, CY + 0.18, 1.068), name="bar_glass")
A.place(AS["backbar"], (4.75, FY1, 0), name="backbar")
box("bottle_shelf", (3.2, 0.24, 0.04), (4.75, FY1 - 0.12, 2.3), M["wood_top"], bevel=0.005)
box("bottle_shelf_led", (3.1, 0.02, 0.012), (4.75, FY1 - 0.2, 2.275), M["led"])
for k2 in range(16):
    A.place(AS["bottle"], (3.3 + k2 * 0.19, FY1 - 0.11, 2.32), rot_z=k2 * 0.7, name="shelf_bottle")
al = bpy.data.lights.new("shelf_light", "AREA"); al.shape = "RECTANGLE"; al.size = 3.0; al.size_y = 0.05; al.energy = 50; al.color = WARM[:3]
alo = bpy.data.objects.new("shelf_light", al); alo.location = (4.75, FY1 - 0.2, 2.26); COL.objects.link(alo)
for k2, x in enumerate((4.3, 5.5)):
    A.place(AS["pendant"], (x, CY, HW), name="bar_pendant")
    point_light("bar_pendant_L", (x, CY, HW - 1.02), 35, 0.035)
# la tablette fournie, sur pied, côté personnel
tab = bpy.data.objects.new("staff_tablet_stand", None); tab.location = (4.15, CY + 0.08, 1.07); COL.objects.link(tab)
box("tablet_foot", (0.12, 0.1, 0.012), (0, 0, 0.006), M["black_metal"], parent=tab)
box("tablet_arm", (0.02, 0.02, 0.14), (0, 0, 0.075), M["black_metal"], parent=tab)
tb = box("tablet_body", (0.26, 0.012, 0.18), (0, 0.01, 0.2), M["phone_body"], bevel=0.006, rot=(math.radians(-25), 0, math.pi), parent=tab)
m_ts, _ = mat_img("tablet_screen", os.environ.get("ATABLE_PROJECT", S + "/proj/atable-promo") + "/assets/pro-salle.png", rough=0.15, emission=1.2)
plane("tablet_screen", 0.245, 0.16, (0, 0, 0), m_ts, rot=(math.radians(90 - 25), 0, math.pi), parent=tab).location = (0, 0.0035, 0.2)

# ============================================================ appliques, plantes, plafonnier diffus
for x in (-1.35, 0.65, -3.85, 4.0):
    if x == 4.0: continue
    A.place(AS["walllamp"], (x, FY1 - 0.02, 1.95), name="sconce")
    point_light("sconce_L", (x, FY1 - 0.17, 1.85), 14, 0.03)
for y in (2.4, -1.2, -3.6):
    A.place(AS["walllamp"], (FX0 + 0.02, y, 1.95), rot_z=math.pi / 2, name="sconce")
    point_light("sconce_L", (FX0 + 0.17, y, 1.85), 14, 0.03)
A.place(AS["monstera"], (-5.95, 3.95, 0), scale=1.35, name="plant")
A.place(AS["palm"], (-6.0, -2.4, 0), scale=1.0, rot_z=0.6, name="plant")
A.place(AS["monstera"], (6.0, -0.4, 0), scale=1.2, rot_z=2.0, name="plant")
A.place(AS["palm"], (6.0, -3.9, 0), scale=1.1, rot_z=1.3, name="plant")
A.place(AS["monstera"], (-5.95, -3.95, 0), scale=1.1, rot_z=4.0, name="plant")
fill = bpy.data.lights.new("fill", "AREA"); fill.shape = "RECTANGLE"; fill.size = 11; fill.size_y = 7.5; fill.energy = 140; fill.color = (1.0, 0.86, 0.7)
fo = bpy.data.objects.new("fill", fill); fo.location = (0, 0, HW - 0.05); COL.objects.link(fo)
fo.visible_camera = False

# ============================================================ décor : miroir doré, ardoise, bougies
mirror = mat_flat("mirror", (0.92, 0.88, 0.8, 1), rough=0.03, metal=1.0)
box("mirror_frame", (0.05, 1.62, 1.52), (FX0 + 0.025, 0.6, 1.95), M["brass"], bevel=0.02)
box("mirror_glass", (0.01, 1.46, 1.36), (FX0 + 0.052, 0.6, 1.95), mirror)
m_ch, _ = mat_img("chalk", B + "/tex/chalkboard.png", rough=0.85)
box("chalk_frame", (0.94, 0.04, 1.2), (-4.75, FY1 - 0.02, 1.88), M["wood_top"], bevel=0.01)
plane("chalk_board", 0.86, 1.075, (-4.75, FY1 - 0.041, 1.88), m_ch, rot=(math.pi / 2, 0, 0))
M["wax"] = mat_flat("wax", "#F1E6CF", rough=0.6, **{"Subsurface Weight": 0.6})
M["flame"] = emit_mat("flame", (1.0, 0.55, 0.18, 1), 40.0)
CANDLES = []
def candle(x, y, k):
    lathe("votive", [(0.0, 0.0), (0.032, 0.0), (0.034, 0.004), (0.034, 0.075), (0.031, 0.075), (0.031, 0.006), (0.0, 0.006)], (x, y, TOP_Z), M["glass"])
    cyl("wax", 0.026, 0.03, (x, y, TOP_Z + 0.021), M["wax"], 20)
    fl = bpy.data.objects.new("flame", bpy.data.meshes.new("flame")); COL.objects.link(fl)
    import bmesh
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=0.005); bm.to_mesh(fl.data); bm.free()
    fl.data.materials.append(M["flame"]); fl.location = (x, y, TOP_Z + 0.046); fl.scale = (1, 1, 2.2)
    fl.visible_shadow = False
    L = point_light("candle_L", (x, y, TOP_Z + 0.05), 2.5, 0.01, (1.0, 0.6, 0.3, 1))
    for f in range(0, NF, 3):
        L.data.energy = 2.5 * (1 + 0.18 * math.sin(f * 1.7 + k * 2.1) + 0.1 * math.sin(f * 0.53 + k))
        L.data.keyframe_insert("energy", frame=f)
for i, (tx, ty, side) in enumerate(TABLES):
    candle(tx - 0.2 * side, ty - 0.03, i)

# ============================================================ personnages
def assign(obj, act):
    """Blender 4.4+ : une action a des « slots » ; il faut en choisir un pour un autre objet que celui du bake."""
    obj.animation_data_create(); obj.animation_data.action = act
    if getattr(obj.animation_data, "action_slot", None) is None and len(getattr(act, "slots", [])):
        obj.animation_data.action_slot = act.slots[0]
with bpy.data.libraries.load(B + "/actions.blend") as (src, dst):
    dst.actions = list(src.actions)
ACT = {a.name: a for a in bpy.data.actions}

def seat_xy(t, side, slot):
    tx, ty, _ = TABLES[t]
    return Vector((tx + slot * 0.35, ty - side * 0.57, 0)), (math.pi if side > 0 else 0.0)

def chair_at(pos, rz):
    A.place(AS["chair"], (pos.x, pos.y, 0), rot_z=rz, name="chair")

def sit(char, action, pos, rz):
    arm, body = R.load_char(char)
    arm.name = f"{action}_rig"
    assign(arm, ACT[action])
    hip = STATS[action][0]
    fv = STATS[action][2] if len(STATS[action]) > 2 else None
    if fv and math.hypot(*fv) > 0.08:   # cap réel de l'animation (genoux) ; attendu : −Y
        d = (-math.pi / 2 - math.atan2(fv[1], fv[0]) + math.pi) % (2 * math.pi) - math.pi
        if abs(d) > math.radians(60): rz += d   # seulement les animations vraiment retournées
    rot = Matrix.Rotation(rz, 3, "Z")
    back = rot @ Vector((0, 0.05, 0))
    target = Vector((pos.x, pos.y, SEAT_H + 0.07)) + back
    loc = target - rot @ Vector((hip[0], hip[1], 0)); loc.z = target.z - hip[2]
    arm.rotation_mode = "XYZ"; arm.location = loc; arm.rotation_euler = (0, 0, rz)
    return arm

# convives : [table, côté (+1 devant / −1 derrière), place (−1 gauche / +1 droite), action, personnage]
SEATS = [(0, -1, -1, "t1_bl", "carla"), (0, -1, 1, "t1_br", "manuel"),
         (1, -1, -1, "t2_bl", "sophia"), (1, 1, 1, "t2_fr", "nathan"),
         (2, -1, 1, "t3_br", "claudia"), (2, 1, -1, "t3_fl", "manuel"),
         (4, -1, -1, "t5_bl", "sophia"), (4, -1, 1, "t5_br", "manuel"), (4, 1, -1, "t5_fl", "carla"),
         (5, -1, -1, "t6_bl", "carla"), (5, 1, 1, "t6_fr", "nathan"),
         # salle comble : toutes les autres chaises (la table 4 reste à deux pour le gros plan)
         (0, 1, -1, "t1_fl", "nathan"), (0, 1, 1, "t1_fr", "claudia"),
         (1, -1, 1, "t2_br", "manuel"), (1, 1, -1, "t2_fl", "carla"),
         (2, -1, -1, "t3_bl", "sophia"), (2, 1, 1, "t3_fr", "nathan"),
         (4, 1, 1, "t5_fr", "claudia"),
         (5, -1, 1, "t6_br", "manuel"), (5, 1, -1, "t6_fl", "sophia")]
OCC = {(s[0], s[1], s[2]) for s in SEATS} | {(3, 1, 1), (3, -1, -1)}
RIGS = {}
for t, side, slot, act, ch in SEATS:
    pos, rz = seat_xy(t, side, slot)
    RIGS[act] = sit(ch, act, pos, rz)
for t in range(6):
    for side in (-1, 1):
        for slot in (-1, 1):
            if t == 3 and side > 0 and slot < 0: continue  # table 4 : pas de chaise vide entre la caméra et le client
            pos, rz = seat_xy(t, side, slot); chair_at(pos, rz)
hero_pos, hero_rz = seat_xy(3, 1, 1)
hero = RIGS["hero"] = sit("nathan", "hero", hero_pos, hero_rz)
friend_pos, friend_rz = seat_xy(3, -1, -1)
friend = RIGS["friend"] = sit("claudia", "friend", friend_pos, friend_rz)
staff = RIGS["staff"] = R.load_char("carla")[0]
staff.name = "staff_rig"; assign(staff, ACT["staff"]); staff.rotation_mode = "XYZ"
sh = STATS["staff"][0]; staff.location = (4.25 - sh[0], 3.98 - sh[1], 0.02); staff.rotation_euler = (0, 0, 0)
# deux clients debout au comptoir (de dos pour la salle)
for ch, act, x in (("sophia", "bar_idle", 4.15), ("manuel", "bar_text", 5.6)):
    r = R.load_char(ch)[0]; r.name = act + "_rig"; assign(r, ACT[act]); r.rotation_mode = "XYZ"
    hs = STATS[act][0]; rz = math.pi
    r.rotation_euler = (0, 0, rz); r.location = Vector((x, 2.72, 0.0)) - Matrix.Rotation(rz, 3, "Z") @ Vector((hs[0], hs[1], 0))
    RIGS[act] = r
# salle comble : des clients attendent une table, debout près de l'entrée et au bout du bar ; un de plus au comptoir
def deg(a): return math.radians(a)
STANDING = [("nathan", "st_idle_nathan", (4.70, -3.25), deg(90)), ("carla", "st_idle_carla", (5.375, -2.86), deg(-30)),
            ("sophia", "st_text_sophia", (5.375, -3.64), deg(-150)),
            ("manuel", "st_idle_manuel", (5.55, 1.2), deg(121)), ("claudia", "st_idle_claudia", (6.05, 1.5), deg(-59)),
            ("claudia", "st_text_claudia", (4.85, 2.72), math.pi)]
for ch, act, (x, y), rz in STANDING:
    r = R.load_char(ch)[0]; r.name = act + "_rig"; assign(r, ACT[act]); r.rotation_mode = "XYZ"
    hs = STATS[act][0]
    r.rotation_euler = (0, 0, rz); r.location = Vector((x, y, 0.0)) - Matrix.Rotation(rz, 3, "Z") @ Vector((hs[0], hs[1], 0))
    RIGS[act] = r

# couverts / plats devant chaque convive
DRINKERS = {"t1_br", "t5_fl", "t6_fr", "t3_bl"}
for t, side, slot, act, ch in SEATS:
    tx, ty, _ = TABLES[t]
    d = Vector((tx + slot * 0.3, ty - side * 0.2, TOP_Z))
    if act not in ("t1_br", "t1_fr"):   # ces deux-là sont servis pendant le plan par le second serveur
        A.place(AS["pizza"] if (t + slot) % 2 else AS["pasta"], d, rot_z=t * 1.3 + slot, name="dish")
    A.place(AS["fork"], d + Vector((-0.17, 0, 0.002)), rot_z=math.pi / 2, name="fork")
    A.place(AS["knife"], d + Vector((0.17, 0, 0.002)), rot_z=math.pi / 2, name="knife")
    if act not in DRINKERS:
        A.place(AS["wineglass"], d + Vector((0.16 * slot, -0.17 * side, 0)), name="glass")
for t in (0, 1, 2, 4, 5):
    tx, ty, side = TABLES[t]
    A.place(AS["bottle"], (tx - side * 0.15, ty + 0.05, TOP_Z), rot_z=t, name="bottle")
# table 4 : deux verres d'eau, une carafe
tx4, ty4, _ = TABLES[3]
A.place(AS["highball"], (tx4 + 0.05, ty4 - 0.12, TOP_Z), name="t4_glass")
A.place(AS["highball"], (tx4 - 0.3, ty4 + 0.2, TOP_Z), name="t4_glass")
A.place(AS["whiteglass"], (tx4 - 0.12, ty4 + 0.05, TOP_Z), name="t4_glass")

# verres tenus à la main (« Sitting Drinking ») : enfants de la main droite, posés à une image de référence
def hand_prop(arm, coll, frame, offset=(0, 0, 0), bone="hand_r_051"):
    scn.frame_set(frame); bpy.context.view_layer.update()
    pbn = arm.pose.bones[bone]
    hw = arm.matrix_world @ pbn.matrix
    kn = arm.matrix_world @ [p for p in arm.pose.bones if p.name.startswith("middle_01_r_")][0].head
    o = A.place(coll, (0, 0, 0), name="held_" + coll.name)
    o.matrix_world = Matrix.Translation((hw.translation + kn) / 2 + Vector(offset))
    c = o.constraints.new("CHILD_OF"); c.target = arm; c.subtarget = bone
    c.inverse_matrix = hw.inverted()
    return o
for act in sorted(DRINKERS):
    hand_prop(RIGS[act], AS["wineglass"], 20, (0, 0, -0.07))

def apron(arm, body):
    """Tablier de garçon de café : feuille pondérée hanche / cuisses (pose de repos, repère de l'armature)."""
    import bmesh
    vs = [body.matrix_world @ v.co for v in body.data.vertices]
    def front(z):
        c = [v.y for v in vs if abs(v.z - z) < 0.025 and abs(v.x) < 0.2]
        return min(c) if c else -0.12
    ZT, ZB, NX, NZ = 0.99, 0.5, 20, 14
    bm = bmesh.new(); grid = []
    yb = min(front(z) for z in (0.55, 0.65, 0.75, 0.85, 0.95))
    def width(z):
        c = [abs(v.x) for v in vs if abs(v.z - z) < 0.025 and abs(v.y) < 0.2]
        return max(c) if c else 0.18
    for j in range(NZ + 1):
        z = ZT - (ZT - ZB) * j / NZ; t = j / NZ
        ry = -(min(front(z), yb + 0.03)) + 0.02 + 0.035 * t   # profondeur devant le centre du corps
        rx = min(width(z), 0.2) + 0.025 + 0.03 * t
        row = []
        for i in range(NX + 1):
            th = math.radians(-105 + 210 * i / NX)
            row.append(bm.verts.new((rx * math.sin(th), -ry * math.cos(th), z)))
        grid.append(row)
    for j in range(NZ):
        for i in range(NX):
            bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
    me = bpy.data.meshes.new("apron"); bm.to_mesh(me); bm.free()
    for p_ in me.polygons: p_.use_smooth = True
    o = bpy.data.objects.new("apron", me); COL.objects.link(o)
    names = {"hip": "hip_02", "l": [b.name for b in arm.data.bones if b.name.startswith("upperleg_l_")][0], "r": [b.name for b in arm.data.bones if b.name.startswith("upperleg_r_")][0]}
    vg = {k: o.vertex_groups.new(name=n) for k, n in names.items()}
    for v in me.vertices:
        t = (ZT - v.co.z) / (ZT - ZB); sl = 0.5 + 0.5 * max(-1, min(1, v.co.x / 0.12))
        wh = 1 - 0.55 * t; wl = (1 - wh) * sl; wr = (1 - wh) * (1 - sl)
        vg["hip"].add([v.index], wh, "REPLACE"); vg["l"].add([v.index], wl, "REPLACE"); vg["r"].add([v.index], wr, "REPLACE")
    sol = o.modifiers.new("solid", "SOLIDIFY"); sol.thickness = 0.004
    md = o.modifiers.new("arm", "ARMATURE"); md.object = arm
    o.parent = arm
    m = mat_flat("apron_cotton", "#ECE8DE", rough=0.85, **{"Sheen Weight": 0.3})
    me.materials.append(m)
    return o

def hand_rest_frame(arm):
    """Repère de repos de la main droite (espace armature) : colonnes doigts F0, paume N0 (côté paume), pouce T0.
    Le squelette Renderpeople est en pose T : paume vers le bas, pouce vers l'avant."""
    bones = arm.data.bones
    h = bones["hand_r_051"].head_local
    mid = [b for b in bones if b.name.startswith("middle_01_r_")][0].head_local
    idx = [b for b in bones if b.name.startswith("index_01_r_")][0].head_local
    pin = [b for b in bones if b.name.startswith("pinky_01_r_")][0].head_local
    F = (mid - h).normalized(); Aa = (idx - pin).normalized()
    N = Aa.cross(F).normalized()          # main droite : (index − auriculaire) × doigts = côté paume
    T = F.cross(N).normalized()
    return Matrix((F, N, T)).transposed()

def hand_rot(arm, F, P):
    """Rotation monde à donner à l'os de la main droite (Copy Rotation) pour avoir les doigts selon F et la paume vers P."""
    B0 = hand_rest_frame(arm)
    F = F.normalized(); P = (P - F * P.dot(F)).normalized()
    armrot = arm.matrix_world.to_3x3().normalized()
    Fa = armrot.inverted() @ F; Pa = armrot.inverted() @ P
    Bt = Matrix((Fa, Pa, Fa.cross(Pa))).transposed()
    rest = arm.data.bones["hand_r_051"].matrix_local.to_3x3()
    return armrot @ (Bt @ B0.transposed()) @ rest

def hand_target(arm, name, wrist, F, P):
    return Matrix.Translation(wrist) @ hand_rot(arm, F, P).to_4x4()

FINGERS = ("thumb", "index", "middle", "ring", "pinky")
def finger_pose(arm, curls, thumb):
    """Quaternions de base (repère local de chaque os) pour une main droite fléchie.
    curls[f] = (MCP, PIP, DIP) en degrés ; thumb = (opposition, flexion 2, flexion 3)."""
    b = arm.data.bones
    B0 = hand_rest_frame(arm); F0, N0 = B0.col[0], B0.col[1]
    out = {}
    for f in FINGERS:
        segs = [[x for x in b if x.name.startswith(f"{f}_0{i}_r_")][0] for i in (1, 2, 3)]
        d = (segs[1].head_local - segs[0].head_local).normalized()
        A = d.cross(N0).normalized()
        for k, sg in enumerate(segs):
            M = sg.matrix_local.to_3x3().normalized()
            if f == "thumb":  # thumb = (écart vers le côté pouce, opposition vers la paume, flexion 2, flexion 3)
                if k == 0:
                    qa = Quaternion(N0, math.radians(-thumb[0])) @ Quaternion(F0, math.radians(-thumb[1]))  # espace armature
                    q = (M.inverted() @ qa.to_matrix() @ M).to_quaternion()
                else:
                    q = Quaternion(M.inverted() @ A, math.radians(thumb[k + 1]))
            else:
                q = Quaternion(M.inverted() @ A, math.radians(curls[f][k]))
            out[sg.name] = q
    return out

def add_ik(arm, target, influence_keys=None, pole=None):
    pb = arm.pose.bones["lowerarm_r_050"]
    ik = pb.constraints.new("IK"); ik.target = target; ik.chain_count = 2; ik.use_stretch = False
    if pole: ik.pole_target = pole; ik.pole_angle = math.radians(-90)
    cr = arm.pose.bones["hand_r_051"].constraints.new("COPY_ROTATION"); cr.target = target
    cr.mix_mode = "REPLACE"; cr.target_space = "WORLD"; cr.owner_space = "WORLD"
    if influence_keys:
        for f, v in influence_keys:
            ik.influence = v; ik.keyframe_insert("influence", frame=f)
            cr.influence = v; cr.keyframe_insert("influence", frame=f)
    return ik, cr

# ============================================================ les serveurs (Eric + marche Renderpeople, tablier, plateau à l'épaule)
V_WALK = 1.16 * 1.3   # serveur pressé : marche accélérée de 30 % (pied d'appui sans glissement)
def bone_world(arm, b): return arm.matrix_world @ arm.pose.bones[b].matrix
def make_waiter(name, act, x0, y):
    w, wb = R.load_char("eric"); w.name = name + "_rig"; w.rotation_mode = "XYZ"
    apron(w, wb); assign(w, ACT[act])
    w.location = (0, 0, 0); w.rotation_euler = (0, 0, 0)
    scn.frame_set(0); bpy.context.view_layer.update()
    h0 = w.matrix_world @ w.pose.bones["hip_02"].head
    for f in range(NF):
        t = f / FPS
        w.location = (x0 - V_WALK * t - h0.y, y + h0.x, 0)  # tourné de −90° : il marche vers −X
        w.rotation_euler = (0, 0, -math.pi / 2)
        w.keyframe_insert("location", frame=f)
    w.keyframe_insert("rotation_euler", frame=0)
    for fc in w.animation_data.action.fcurves:
        if fc.data_path in ("location", "rotation_euler"):
            for k in fc.keyframe_points: k.interpolation = "LINEAR"
    scn.frame_set(0); bpy.context.view_layer.update()
    chest = bone_world(w, "spine_03_05")
    fwd = (w.matrix_world.to_3x3() @ Vector((0, -1, 0))).normalized()
    right = (w.matrix_world.to_3x3() @ Vector((-1, 0, 0))).normalized()
    tray_c = chest.translation + right * 0.27 + fwd * 0.18 + Vector((0, 0, 0.02)); tray_c.z = 1.36
    tray = bpy.data.objects.new(name + "_tray", None); COL.objects.link(tray)
    tray.location = tray_c - chest.translation  # décalage monde (le serveur garde le même cap)
    c = tray.constraints.new("COPY_LOCATION"); c.target = w; c.subtarget = "spine_03_05"; c.use_offset = True
    lathe("tray_disc", [(0.0, 0.0), (0.2, 0.0), (0.205, 0.012), (0.2, 0.016), (0.19, 0.006), (0.0, 0.006)], (0, 0, 0), M["brass"], parent=tray)
    A.place(AS["pasta"], (0.06, -0.04, 0.006), scale=0.8, name="tray_dish").parent = tray
    A.place(AS["wineglass"], (-0.1, 0.09, 0.006), name="tray_glass").parent = tray
    A.place(AS["wineglass"], (-0.13, -0.08, 0.006), name="tray_glass").parent = tray
    # main droite : paume vers le haut sous le plateau, doigts vers l'avant
    wt = bpy.data.objects.new(name + "_hand_tgt", None); COL.objects.link(wt)
    wt.matrix_world = hand_target(w, "w", tray_c - fwd * 0.05 - Vector((0, 0, 0.035)), fwd + right * 0.25, Vector((0, 0, 1)))
    wt.parent = tray; wt.matrix_parent_inverse = Matrix.Translation(tray_c).inverted()
    add_ik(w, wt)
    return w
waiter = make_waiter("waiter", "waiter_walk", 6.2, 0.05)

def face_axis(arm, bone):
    """Axe local de l'os le plus proche de la direction du regard au repos (−Y armature)."""
    m = arm.data.bones[bone].matrix_local.to_3x3()
    best = max(((abs(m.col[i].dot(Vector((0, -1, 0)))), i, m.col[i].dot(Vector((0, -1, 0))) > 0) for i in range(3)))
    return ("TRACK_" if best[2] else "TRACK_NEGATIVE_") + "XYZ"[best[1]]

# ---------- mains gauche / droite (généralisation des fonctions de la main droite)
def hand_bones(side):
    return ("hand_r_051", "lowerarm_r_050") if side == "r" else ("hand_l_026", "lowerarm_l_025")
def hand_rot_s(arm, F, P, side):
    bones = arm.data.bones; hb = hand_bones(side)[0]
    h = bones[hb].head_local
    mid = [b for b in bones if b.name.startswith(f"middle_01_{side}_")][0].head_local
    idx = [b for b in bones if b.name.startswith(f"index_01_{side}_")][0].head_local
    pin = [b for b in bones if b.name.startswith(f"pinky_01_{side}_")][0].head_local
    F0 = (mid - h).normalized(); Aa = (idx - pin).normalized()
    N0 = Aa.cross(F0).normalized() if side == "r" else F0.cross(Aa).normalized()   # côté paume
    B0 = Matrix((F0, N0, F0.cross(N0))).transposed()
    F = F.normalized(); P = (P - F * P.dot(F)).normalized()
    armrot = arm.matrix_world.to_3x3().normalized()
    Fa = armrot.inverted() @ F; Pa = armrot.inverted() @ P
    Bt = Matrix((Fa, Pa, Fa.cross(Pa))).transposed()
    return armrot @ (Bt @ B0.transposed()) @ bones[hb].matrix_local.to_3x3()
def add_ik_s(arm, target, side, chain=2, keys=None):
    hb, lb = hand_bones(side)
    ik = arm.pose.bones[lb].constraints.new("IK"); ik.target = target; ik.chain_count = chain; ik.use_stretch = False
    cr = arm.pose.bones[hb].constraints.new("COPY_ROTATION"); cr.target = target
    cr.mix_mode = "REPLACE"; cr.target_space = "WORLD"; cr.owner_space = "WORLD"
    for f, v in (keys or []):
        ik.influence = v; ik.keyframe_insert("influence", frame=f); cr.influence = v; cr.keyframe_insert("influence", frame=f)
    return ik, cr
def keyed_target(name, fn):
    """Empty animé image par image : fn(t) -> (position, F, P, arm, side) ; orientation de main calculée."""
    e = bpy.data.objects.new(name, None); COL.objects.link(e); e.rotation_mode = "QUATERNION"
    for f in range(NF):
        pos, F, P, arm, side = fn(f / FPS)
        e.location = pos; e.rotation_quaternion = hand_rot_s(arm, F, P, side).to_quaternion()
        e.keyframe_insert("location", frame=f); e.keyframe_insert("rotation_quaternion", frame=f)
    return e
def infl(spans, ramp=0.3):
    """Clés d'influence 0 -> 1 -> 0 pour une liste de (début, fin) en secondes."""
    ks = [(0, 0.0)]
    for a, b in spans:
        ks += [(int(a * FPS), 0.0), (int((a + ramp) * FPS), 1.0), (int((b - ramp) * FPS), 1.0), (int(b * FPS), 0.0)]
    return ks

# ---------- second serveur : il sert la table 1 (deux assiettes posées depuis le plateau)
sv, svb = R.load_char("eric"); sv.name = "server_rig"; sv.rotation_mode = "XYZ"
apron(sv, svb)
# posture debout neutre et immobile : une image de l'attente Renderpeople (hanches centrées), tenue tout le plan ;
# les bras (IK), la flexion des hanches et le regard sont animés par-dessus
spose = ACT["st_idle_eric"].copy(); spose.name = "server_pose"
for fc in spose.fcurves:
    v = fc.evaluate(125.0)
    for k in fc.keyframe_points: k.co[1] = v; k.handle_left[1] = v; k.handle_right[1] = v
    fc.update()
assign(sv, spose)
SV_RZ = -math.pi / 2                         # tourné vers −X : face au bout droit de la table 1
hs = STATS["st_idle_eric"][0]
sv.rotation_euler = (0, 0, SV_RZ); sv.location = Vector((-2.58, 1.62, 0.0)) - Matrix.Rotation(SV_RZ, 3, "Z") @ Vector((hs[0], hs[1], 0))
scn.frame_set(0); bpy.context.view_layer.update()
SV_F = Vector((-1, 0, 0)); SV_L = Vector((0, -1, 0))   # avant, gauche du serveur
ch0 = bone_world(sv, "spine_03_05").translation
tray_c2 = Vector((ch0.x, ch0.y, 1.19)) + SV_L * 0.21 + SV_F * 0.30   # plateau à hauteur de poitrine, avant-bras horizontal
tray2 = bpy.data.objects.new("server_tray", None); COL.objects.link(tray2); tray2.location = tray_c2
lathe("tray_disc", [(0.0, 0.0), (0.2, 0.0), (0.205, 0.012), (0.2, 0.016), (0.19, 0.006), (0.0, 0.006)], (0, 0, 0), M["brass"], parent=tray2)
lt = bpy.data.objects.new("server_lhand_tgt", None); COL.objects.link(lt)
lt.matrix_world = Matrix.Translation(tray_c2 + SV_F * 0.03 - Vector((0, 0, 0.035))) @ hand_rot_s(sv, SV_F - SV_L * 0.25, Vector((0, 0, 1)), "l").to_4x4()
add_ik_s(sv, lt, "l", chain=3)
# deux assiettes : sur le plateau, puis posées devant les clients de droite de la table 1
T1x, T1y, _ = TABLES[0]
SERVE = [  # (asset, position sur le plateau, place sur la table, prise, transport, lâcher)
    ("pasta", tray_c2 + Vector((0.07, 0.05, 0.006)), Vector((T1x + 0.43, T1y + 0.2, TOP_Z)), 0.9, 1.35, 2.25, 2.6),
    ("pizza", tray_c2 + Vector((-0.05, -0.06, 0.006)), Vector((T1x + 0.46, T1y - 0.09, TOP_Z)), 2.8, 3.25, 4.15, 4.5),
]
plates = []
for k, (asset, p0, p1, t0, t1, t2, t3) in enumerate(SERVE):
    o = A.place(AS[asset], p0, scale=0.75, name=f"served_{k}")
    for f in range(NF):
        t = f / FPS; u = ease(seg(t, t1, t2))
        pos = p0.lerp(p1, u) + Vector((0, 0, 0.12 * math.sin(math.pi * u)))
        o.location = pos; o.keyframe_insert("location", frame=f)
    plates.append(o)
SV_R = -SV_L
scn.frame_set(0); bpy.context.view_layer.update()
sv_hip = (sv.matrix_world @ sv.pose.bones["hip_02"].head).copy()
REST = (Vector((sv_hip.x, sv_hip.y, 0.0)) + SV_R * 0.2 + SV_F * 0.05 + Vector((0, 0, 0.87)), Vector((0, 0, -1)), -SV_R)
def serve_w(t):
    return max(ease(seg(t, t0, t0 + 0.4)) * (1 - ease(seg(t, t3 - 0.4, t3))) for (_, _, _, t0, _, _, t3) in SERVE)
def server_hand(t):
    # main droite : au repos le long du corps ; pendant un service, elle suit l'assiette (prise par le bord, paume dessous)
    k = 0 if t < 2.7 else 1
    asset, p0, p1, t0, t1, t2, t3 = SERVE[k]
    u = ease(seg(t, t1, t2)); pos = p0.lerp(p1, u) + Vector((0, 0, 0.12 * math.sin(math.pi * u)))
    grip = (pos + Vector((0.11, 0.0, 0.005)), SV_F.copy(), Vector((0, 0.15, 1.0)).normalized())
    w = serve_w(t)
    P = (REST[0].lerp(grip[0], w), REST[1].lerp(grip[1], w).normalized(), REST[2].lerp(grip[2], w).normalized())
    return P[0], P[1], P[2], sv, "r"
rt = keyed_target("server_rhand_tgt", server_hand)
# il se penche par les hanches pour poser l'assiette (dos droit, comme un serveur), puis se redresse
LEAN = {"spine_01_03": 28, "spine_02_04": 14, "spine_03_05": 8}
def lean_amt(t):
    a = 0.0
    for (t0, t1, t2, t3) in ((1.0, 1.6, 2.25, 2.75), (2.9, 3.5, 4.15, 4.65)):
        a = max(a, ease(seg(t, t0, t1)) * (1 - ease(seg(t, t2, t3))))
    return a
sact = sv.animation_data.action
for bn, deg_ in LEAN.items():
    M3 = sv.data.bones[bn].matrix_local.to_3x3().normalized()
    fcs = [sact.fcurves.find(f'pose.bones["{bn}"].rotation_quaternion', index=i) for i in range(4)]
    for kp in range(len(fcs[0].keyframe_points)):
        t = fcs[0].keyframe_points[kp].co[0] / FPS
        R3 = Matrix.Rotation(math.radians(deg_) * lean_amt(t), 3, "X")   # vers l'avant (−Y armature)
        qa = Quaternion([fcs[i].keyframe_points[kp].co[1] for i in range(4)])
        q = (M3.inverted() @ R3 @ M3).to_quaternion() @ qa
        for i in range(4): fcs[i].keyframe_points[kp].co[1] = q[i]
    for fc in fcs: fc.update()
add_ik_s(sv, rt, "r", chain=3)
# le serveur regarde ce qu'il pose ; les deux clients servis se tournent vers lui
def look_at(arm, bone, target, keys):
    c = arm.pose.bones[bone].constraints.new("DAMPED_TRACK"); c.target = target; c.track_axis = face_axis(arm, bone)
    for f, v in keys: c.influence = v; c.keyframe_insert("influence", frame=f)
look_at(sv, "head_07", rt, [(f, v * 0.7) for f, v in infl([(0.9, 2.6), (2.8, 4.5)], 0.35)])
svh = bpy.data.objects.new("server_head", None); COL.objects.link(svh)
svh.location = bone_world(sv, "head_07").translation
for act_, span in (("t1_br", (1.0, 3.0)), ("t1_fr", (2.9, 4.8))):
    look_at(RIGS[act_], "head_07", svh, [(f, v * 0.7) for f, v in infl([span], 0.4)])

# ---------- la salle déborde : trois clients lèvent la main pour appeler, le serveur pressé jette des coups d'œil
CALLERS = [("t6_bl", (0.4, 2.1)), ("t3_fl", (1.0, 2.7)), ("t2_fr", (2.1, 3.8))]
for act_, (a, b) in CALLERS:
    r = RIGS[act_]
    scn.frame_set(int(a * FPS)); bpy.context.view_layer.update()
    shp = bone_world(r, "upperarm_r_049").translation
    facing = (r.matrix_world.to_3x3() @ Vector((0, -1, 0))).normalized(); facing.z = 0; facing.normalize()
    rightv = facing.cross(Vector((0, 0, 1))).normalized()
    def caller(t, shp=shp, facing=facing, rightv=rightv, r=r):
        wave = 0.055 * math.sin(2 * math.pi * 2.2 * t)
        pos = shp + Vector((0, 0, 0.40)) + facing * 0.10 + rightv * (0.06 + wave)
        return pos, Vector((0, 0, 1)) + rightv * wave * 2, facing, r, "r"
    tg = keyed_target(f"{act_}_call_tgt", caller)
    add_ik_s(r, tg, "r", 2, infl([(a, b)], 0.35))
wh = bpy.data.objects.new("waiter_glance", None); COL.objects.link(wh)
# coups d'œil : le regard du serveur passe d'un client qui appelle à l'autre (cible animée sur leurs têtes)
GL = [("t6_bl", 0.9, 1.6), ("t3_fl", 1.75, 2.45), ("t2_fr", 2.65, 3.4)]
heads = {}
for act_, a, b in GL:
    scn.frame_set(int((a + b) / 2 * FPS)); bpy.context.view_layer.update()
    heads[act_] = bone_world(RIGS[act_], "head_07").translation.copy()
for f in range(NF):
    t = f / FPS; pos = None
    for i, (act_, a, b) in enumerate(GL):
        if t < b or i == len(GL) - 1:
            prev = heads[GL[i - 1][0]] if i > 0 else heads[act_]
            pos = prev.lerp(heads[act_], ease(seg(t, a - 0.15, a + 0.1))); break
    wh.location = pos; wh.keyframe_insert("location", frame=f)
look_at(waiter, "head_07", wh, [(0, 0.0), (int(0.8 * FPS), 0.0), (int(1.0 * FPS), 0.85), (int(3.4 * FPS), 0.85), (int(3.7 * FPS), 0.0)])

# ============================================================ le téléphone du client
ph = bpy.data.objects.new("phone", None); COL.objects.link(ph)
PW, PH_, PT = 0.072, 0.152, 0.0082
box("phone_body", (PW, PH_, PT), (0, 0, 0), M["phone_body"], bevel=0.0035, parent=ph)
m_scr, scr_node = mat_img("phone_screen", B + "/screen/scr_0000.png", rough=0.08, emission=2.2, seq=NF)
scr_node.image.colorspace_settings.name = "sRGB"
plane("phone_screen", PW - 0.004, PH_ - 0.005, (0, 0, PT / 2 + 0.0002), m_scr, parent=ph)
cyl("phone_lens", 0.0065, 0.002, (0.018, 0.05, -PT / 2 - 0.001), M["black_metal"], 20, parent=ph)
cyl("phone_lens2", 0.0065, 0.002, (0.018, 0.032, -PT / 2 - 0.001), M["black_metal"], 20, parent=ph)

# poses (monde) : posé -> levé face à lui -> au-dessus de la plaque, l'écran légèrement incliné vers lui
P4 = plate_pos[3]
def phone_mat(pos, normal, up):
    n = Vector(normal).normalized(); u = Vector(up); u = (u - n * u.dot(n)).normalized(); x = u.cross(n)
    return Matrix.Translation(Vector(pos)) @ Matrix((x, u, n)).transposed().to_4x4()
eye = hero.matrix_world @ hero.pose.bones["head_07"].head if False else None
PH_KEYS = [
    (3.85, phone_mat((hero_pos.x - 0.06, hero_pos.y + 0.33, TOP_Z + PT / 2), (0, 0, 1), (0.25, 1, 0))),
    (4.55, phone_mat((hero_pos.x - 0.03, hero_pos.y + 0.24, 1.0), (0, -0.75, 0.66), (0.05, 0.66, 0.75))),
    (4.85, phone_mat((hero_pos.x - 0.035, hero_pos.y + 0.25, 1.005), (0, -0.73, 0.68), (0.05, 0.68, 0.73))),
    (5.45, phone_mat((P4.x + 0.015, P4.y - 0.105, TOP_Z + 0.235), (0, -0.34, 0.94), (0, 0.94, 0.34))),
]
def phone_pose(t):
    if t <= PH_KEYS[0][0]: return PH_KEYS[0][1].copy()
    for (ta, ma), (tb, mb) in zip(PH_KEYS, PH_KEYS[1:]):
        if t <= tb:
            k = ease(seg(t, ta, tb))
            p = ma.translation.lerp(mb.translation, k)
            q = ma.to_quaternion().slerp(mb.to_quaternion(), k)
            return Matrix.Translation(p) @ q.to_matrix().to_4x4()
    m = PH_KEYS[-1][1].copy()
    m.translation += Vector((0.0012 * math.sin(t * 7.1), 0.0006 * math.sin(t * 4.3), 0.0009 * math.sin(t * 5.3 + 1)))
    return m
for f in range(NF):
    ph.matrix_world = phone_pose(f / FPS)
    ph.keyframe_insert("location", frame=f); ph.rotation_mode = "QUATERNION"; ph.keyframe_insert("rotation_quaternion", frame=f)

# main droite du client : prise réelle du téléphone, calculée image par image dans le repère du téléphone
#  - « prise » (posé sur la table) : paume au-dessus de l'écran, doigts vers le bord gauche, pouce vers le bas du téléphone
#  - « tenue » (en main) : paume contre le dos, doigts qui enroulent le bord gauche, pouce sur le bord droit
bh = hero.data.bones
PALM = (bh[[x.name for x in bh if x.name.startswith("middle_01_r_")][0]].head_local - bh["hand_r_051"].head_local).length
def grip(F, P, mcp):
    F = Vector(F).normalized(); P = Vector(P).normalized(); mcp = Vector(mcp)
    return F, P, mcp - F * PALM
# paramètres de prise optimisés par tools/optimize_grip.py sur le maillage déformé réel :
# aucun sommet de la main dans le téléphone (ni sous la table), écran dégagé, doigts au contact des bords
GP = json.load(open(B + "/grip_pick.json")); GH = json.load(open(B + "/grip_hold.json"))
def fdir(a): return (-math.cos(math.radians(a)), math.sin(math.radians(a)), 0.0)
G_PICK = grip(fdir(GP["ang"]), (0, 0, -1), (GP["mx"], GP["my"], GP["dz"]))
G_HOLD = grip(fdir(GH["ang"]), (0, 0, 1), (GH["mx"], GH["my"], GH["dz"]))
def _frame(F, P):
    F = Vector(F).normalized(); P = Vector(P); P = (P - F * P.dot(F)).normalized()
    return Matrix((F, P, F.cross(P))).transposed().to_quaternion()
# changement de prise : la main « roule » autour du bord droit du téléphone, doigts parallèles au bord,
# passe derrière l'appareil, puis pivote jusqu'à la tenue (aucun doigt ne traverse le téléphone)
GRIP_KEYS = [
    (0.00, G_PICK[2], _frame(G_PICK[0], G_PICK[1])),
    (0.30, Vector((0.075, -0.01, 0.035)), _frame((0, -1, 0), (-0.7, 0, -0.7))),
    (0.50, Vector((0.095, -0.01, 0.0)), _frame((0, -1, 0), (-1, 0, 0))),
    (0.72, Vector((0.07, -0.01, -0.035)), _frame((-0.2, -1, 0), (-0.7, 0, 0.7))),
    (1.00, G_HOLD[2], _frame(G_HOLD[0], G_HOLD[1])),
]
def grip_at(t):
    k = ease(seg(t, 3.85, 4.3))
    for (ka, ma, qa), (kb, mb, qb) in zip(GRIP_KEYS, GRIP_KEYS[1:]):
        if k <= kb:
            u = (k - ka) / (kb - ka)
            q = qa.slerp(qb, u); M3 = q.to_matrix()
            return M3.col[0], M3.col[1], ma.lerp(mb, u)
    M3 = GRIP_KEYS[-1][2].to_matrix(); return M3.col[0], M3.col[1], GRIP_KEYS[-1][1]
ht = bpy.data.objects.new("hero_hand_tgt", None); COL.objects.link(ht); ht.rotation_mode = "QUATERNION"
scn.frame_set(0); bpy.context.view_layer.update()
for f in range(NF):
    t = f / FPS; pm = phone_pose(t); R3 = pm.to_3x3()
    F, P, w = grip_at(t)
    m = hand_target(hero, "h", pm @ w, R3 @ F, R3 @ P)
    ht.location = m.translation; ht.rotation_quaternion = m.to_quaternion()
    ht.keyframe_insert("location", frame=f); ht.keyframe_insert("rotation_quaternion", frame=f)
# doigts : animation jusqu'à 3,4 s, puis prise (pincée sur la table), puis enroulement du bord du téléphone
def curls_of(G): return {f: (G[f + "1"], G[f + "2"], G[f + "3"]) for f in ("index", "middle", "ring", "pinky")}
QP = finger_pose(hero, curls_of(GP), (GP["t0"], GP["t1"], GP["t2"], GP["t3"]))
QH = finger_pose(hero, curls_of(GH), (GH["t0"], GH["t1"], GH["t2"], GH["t3"]))
QO = finger_pose(hero, {f: (2, 8, 4) for f in ("index", "middle", "ring", "pinky")}, (GH["t0"], 4, 0, 4))
ha = ACT["hero"]
for bn in QP:
    fcs = [ha.fcurves.find(f'pose.bones["{bn}"].rotation_quaternion', index=i) for i in range(4)]
    if any(fc is None for fc in fcs): continue
    for kp in range(len(fcs[0].keyframe_points)):
        fr = fcs[0].keyframe_points[kp].co[0]; t = fr / FPS
        if t < 3.4: continue
        qa = Quaternion([fcs[i].keyframe_points[kp].co[1] for i in range(4)])
        # la main s'ouvre pendant qu'elle change de prise, puis les doigts se referment autour du bord
        if t < 4.1: qg = QP[bn].slerp(QO[bn], ease(seg(t, 3.85, 3.98)))
        else: qg = QO[bn].slerp(QH[bn], ease(seg(t, 4.25, 4.45)))
        q = qa.slerp(qg, ease(seg(t, 3.4, 3.85)))
        for i in range(4): fcs[i].keyframe_points[kp].co[1] = q[i]
    for fc in fcs: fc.update()
add_ik(hero, ht, [(int(3.3 * FPS), 0.0), (int(3.85 * FPS), 1.0)])
# tête : regarde le téléphone ; l'amie se tourne vers l'écran
def face_axis(arm, bone):
    """Axe local de l'os le plus proche de la direction du regard au repos (−Y armature)."""
    m = arm.data.bones[bone].matrix_local.to_3x3()
    best = max(((abs(m.col[i].dot(Vector((0, -1, 0)))), i, m.col[i].dot(Vector((0, -1, 0))) > 0) for i in range(3)))
    return ("TRACK_" if best[2] else "TRACK_NEGATIVE_") + "XYZ"[best[1]]
def look(arm, bone, target, keys):
    c = arm.pose.bones[bone].constraints.new("DAMPED_TRACK"); c.target = target; c.track_axis = face_axis(arm, bone)
    for f, v in keys: c.influence = v; c.keyframe_insert("influence", frame=f)
look(hero, "head_07", ph, [(int(3.25 * FPS), 0.0), (int(3.75 * FPS), 0.75)])
look(hero, "neck_06", ph, [(int(3.25 * FPS), 0.0), (int(3.75 * FPS), 0.35)])
look(friend, "head_07", ph, [(int(4.0 * FPS), 0.0), (int(4.6 * FPS), 0.6)])

# ============================================================ caméra (même trajectoire et même minutage que 03a three.js)
def monotone(xs, ys):
    n = len(xs); d = [(ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]) for i in range(n - 1)]
    m = [0.0] + [0.0 if d[i - 1] * d[i] <= 0 else (d[i - 1] + d[i]) / 2 for i in range(1, n - 1)] + [0.0]
    for i in range(n - 1):
        if d[i] == 0: m[i] = m[i + 1] = 0; continue
        a, b = m[i] / d[i], m[i + 1] / d[i]; s = a * a + b * b
        if s > 9: q = 3 / math.sqrt(s); m[i] = q * a * d[i]; m[i + 1] = q * b * d[i]
    def f(x):
        if x <= xs[0]: return ys[0]
        if x >= xs[-1]: return ys[-1]
        j = 0
        while x > xs[j + 1]: j += 1
        h = xs[j + 1] - xs[j]; u = (x - xs[j]) / h; u2, u3 = u * u, u * u * u
        return (2 * u3 - 3 * u2 + 1) * ys[j] + (u3 - 2 * u2 + u) * h * m[j] + (-2 * u3 + 3 * u2) * ys[j + 1] + (u3 - u2) * h * m[j + 1]
    return f

def catmull(points, ctype="centripetal"):
    pts = [Vector(p) for p in points]; l = len(pts)
    def get(t):
        p = (l - 1) * t; ip = int(math.floor(p)); w = p - ip
        if w == 0 and ip == l - 1: ip = l - 2; w = 1
        p0 = pts[ip - 1] if ip > 0 else 2 * pts[0] - pts[1]
        p1, p2 = pts[ip], pts[ip + 1]
        p3 = pts[ip + 2] if ip + 2 < l else 2 * pts[l - 1] - pts[l - 2]
        out = Vector()
        for k in range(3):
            x0, x1, x2, x3 = p0[k], p1[k], p2[k], p3[k]
            if ctype == "centripetal":
                dt0 = ((p1 - p0).length_squared) ** 0.25; dt1 = ((p2 - p1).length_squared) ** 0.25; dt2 = ((p3 - p2).length_squared) ** 0.25
                if dt1 < 1e-4: dt1 = 1.0
                if dt0 < 1e-4: dt0 = dt1
                if dt2 < 1e-4: dt2 = dt1
                t1 = ((x1 - x0) / dt0 - (x2 - x0) / (dt0 + dt1) + (x2 - x1) / dt1) * dt1
                t2 = ((x2 - x1) / dt1 - (x3 - x1) / (dt1 + dt2) + (x3 - x2) / dt2) * dt1
            else:
                t1 = 0.5 * (x2 - x0); t2 = 0.5 * (x3 - x1)
            c0, c1, c2, c3 = x1, t1, -3 * x1 + 3 * x2 - 2 * t1 - t2, 2 * x1 - 2 * x2 + t1 + t2
            out[k] = c0 + c1 * w + c2 * w * w + c3 * w * w * w
        return out
    return get

aim_m = phone_pose(5.6); AIM = aim_m.translation + aim_m.to_3x3().col[2].normalized() * (PT / 2)
N_AIM = aim_m.to_3x3().col[2].normalized(); TOP_AIM = aim_m.to_3x3().col[1].normalized()
def V3(x, y, z): return Vector((x, -z, y))  # three.js -> Blender
CK = [
    (0.0, V3(0.0, 19.5, 0.35), V3(0, 0, 0.3), Vector((0, 1, 0)), 34),
    (0.9, V3(0.4, 18.0, 1.9), V3(0, 0, 0.25), Vector((0, 1, 0.2)), 34),
    (2.4, V3(6.8, 6.6, 9.8), V3(-0.8, 0.5, 0.2), Vector((0, 0, 1)), 30),
    (3.7, V3(-0.5, 2.35, 5.0), V3(-3.15, 0.92, 1.85), Vector((0, 0, 1)), 30),
    (5.0, V3(-2.15, 1.75, 2.95), V3(-2.98, 0.88, 1.7), Vector((0, 0, 1)), 32),
    (6.2, AIM + N_AIM * 0.36 + Vector((0.3, -0.04, 0.12)), AIM.copy(), Vector((0, 0.66, 0.75)), 32),
    (7.9, AIM + N_AIM * 0.072, AIM.copy(), TOP_AIM.copy(), 32),
]
camU = monotone([k[0] for k in CK], [i / (len(CK) - 1) for i in range(len(CK))])
cPos, cLook = catmull([k[1] for k in CK]), catmull([k[2] for k in CK])
cUp = catmull([k[3].normalized() for k in CK], "catmullrom")
camd = bpy.data.cameras.new("cam"); cam = bpy.data.objects.new("cam", camd); COL.objects.link(cam); scn.camera = cam
camd.sensor_fit = "VERTICAL"; camd.sensor_height = 24.0; camd.sensor_width = 36.0 * 1.0; camd.clip_start = 0.005; camd.clip_end = 200
camd.dof.use_dof = True
cam.rotation_mode = "QUATERNION"
TAG = []
from bpy_extras.object_utils import world_to_camera_view
T4_TAG = Vector((TABLES[3][0], TABLES[3][1], 1.5))
for f in range(NF):
    t = f / FPS; u = camU(t)
    p, lk, up = cPos(u), cLook(u), cUp(u).normalized()
    j = 0
    while j < len(CK) - 2 and t > CK[j + 1][0]: j += 1
    fov = lerp(CK[j][4], CK[j + 1][4], ease(seg(t, CK[j][0], CK[j + 1][0])))
    fwd_ = (lk - p).normalized(); rgt = fwd_.cross(up).normalized(); up2 = rgt.cross(fwd_)
    rotm = Matrix((rgt, up2, -fwd_)).transposed()
    cam.location = p; cam.rotation_quaternion = rotm.to_quaternion()
    camd.lens = 12.0 / math.tan(math.radians(fov) / 2)
    dist = (lk - p).length
    camd.dof.focus_distance = dist
    camd.dof.aperture_fstop = lerp(11.0, 2.8, ease(seg(t, 2.6, 4.6))) if t < 6.0 else lerp(2.8, 4.0, ease(seg(t, 6.0, 7.5)))
    cam.keyframe_insert("location", frame=f); cam.keyframe_insert("rotation_quaternion", frame=f)
    camd.keyframe_insert("lens", frame=f); camd.dof.keyframe_insert("focus_distance", frame=f); camd.dof.keyframe_insert("aperture_fstop", frame=f)
    scn.frame_set(f) if False else None
    TAG.append((p, rotm, fov))
# étiquette « TABLE 4 » projetée (coordonnées écran 1920×1080, calculées avec la même caméra)
tags = []
for f, (p, rotm, fov) in enumerate(TAG):
    v = rotm.transposed() @ (T4_TAG - p)
    if v.z >= -1e-3: tags.append(None); continue
    th = math.tan(math.radians(fov) / 2)
    x = (v.x / -v.z) / (th * 16 / 9); y = (v.y / -v.z) / th
    tags.append([round((x * 0.5 + 0.5) * 1920, 1), round((-y * 0.5 + 0.5) * 1080, 1)])
json.dump(tags, open(B + "/tag_t4.json", "w"))

# ============================================================ rendu
scn.render.engine = "CYCLES"
cy = scn.cycles
cy.device = "CPU"; cy.samples = 96; cy.use_adaptive_sampling = True; cy.adaptive_threshold = 0.03
cy.use_denoising = True; cy.denoiser = "OPENIMAGEDENOISE"
cy.max_bounces = 8; cy.diffuse_bounces = 3; cy.glossy_bounces = 3; cy.transmission_bounces = 8; cy.transparent_max_bounces = 8
cy.sample_clamp_indirect = 4.0; cy.blur_glossy = 1.0; cy.caustics_reflective = False; cy.caustics_refractive = False
cy.use_light_tree = True
scn.render.film_transparent = True
scn.render.resolution_x = 1920; scn.render.resolution_y = 1080; scn.render.resolution_percentage = 100
scn.render.use_motion_blur = True; scn.render.motion_blur_shutter = 0.4
scn.render.use_persistent_data = True
scn.view_settings.view_transform = "AgX"
try: scn.view_settings.look = "AgX - Medium High Contrast"
except Exception: pass
scn.view_settings.exposure = 0.4
scn.render.image_settings.file_format = "PNG"; scn.render.image_settings.color_mode = "RGB"; scn.render.image_settings.compression = 15
scn.render.filepath = B + "/frames/f_"
# compositing : fond vert de la marque derrière la découpe (comme le fond #1F4D3A de 02c)
scn.use_nodes = True
tree = scn.node_tree
for n in list(tree.nodes): tree.nodes.remove(n)
rl = tree.nodes.new("CompositorNodeRLayers"); ao = tree.nodes.new("CompositorNodeAlphaOver"); cp = tree.nodes.new("CompositorNodeComposite")
rgb = tree.nodes.new("CompositorNodeRGB"); rgb.outputs[0].default_value = srgb(GREEN)
tree.links.new(rgb.outputs[0], ao.inputs[1]); tree.links.new(rl.outputs["Image"], ao.inputs[2]); tree.links.new(ao.outputs[0], cp.inputs["Image"])
ao.use_premultiply = False

bpy.ops.file.make_paths_relative() if False else None
bpy.ops.wm.save_as_mainfile(filepath=os.environ.get("OUT_BLEND", B + "/salle.blend"))
print("BUILD OK")
