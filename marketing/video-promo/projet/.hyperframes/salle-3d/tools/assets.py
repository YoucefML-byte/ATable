# Import des modèles Sketchfab (glTF) en collections normalisées + instanciation
import bpy, os, math
from mathutils import Vector, Matrix
S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = None

def lib():
    global LIB
    if LIB is None:
        LIB = bpy.data.collections.new("ASSETS"); bpy.context.scene.collection.children.link(LIB)
        LIB.hide_render = True; LIB.hide_viewport = True
    return LIB

def import_asset(name, folder, scale=1.0, rot_z=0.0, pivot="bottom", keep=None, drop=()):
    """Importe dl/<folder>/scene.gltf, cuit les transformations, garde les maillages filtrés, centre le pivot."""
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=f"{S}/dl/{folder}/scene.gltf")
    new = [o for o in bpy.data.objects if o not in before]
    meshes = [o for o in new if o.type == "MESH" and o.name != "Icosphere"
              and (keep is None or any(k in o.name for k in keep)) and not any(d in o.name for d in drop)]
    coll = bpy.data.collections.new("A_" + name); lib().children.link(coll)
    for o in meshes:
        mw = o.matrix_world.copy()
        o.parent = None
        o.data = o.data.copy()
        o.data.transform(Matrix.Rotation(rot_z, 4, "Z") @ Matrix.Scale(scale, 4) @ mw)
        o.matrix_world = Matrix.Identity(4)
        for c in o.users_collection: c.objects.unlink(o)
        coll.objects.link(o)
    for o in new:
        if o not in meshes: bpy.data.objects.remove(o)
    lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
    for o in meshes:
        for v in o.data.vertices:
            lo = Vector(map(min, lo, v.co)); hi = Vector(map(max, hi, v.co))
    if pivot == "bottom": off = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
    elif pivot == "top": off = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, hi.z))
    elif pivot == "back": off = Vector(((lo.x + hi.x) / 2, hi.y, lo.z))  # dos contre un mur en +Y
    else: off = Vector((0, 0, 0))
    for o in meshes:
        o.data.transform(Matrix.Translation(-off))
    coll["size"] = list(hi - lo)
    return coll

def place(coll, loc, rot_z=0.0, scale=1.0, name=None, parent=None):
    e = bpy.data.objects.new(name or ("I_" + coll.name), None)
    e.instance_type = "COLLECTION"; e.instance_collection = coll
    e.location = loc; e.rotation_euler = (0, 0, rot_z); e.scale = (scale,) * 3
    (parent or bpy.context.scene.collection).objects.link(e) if not isinstance(parent, bpy.types.Collection) else parent.objects.link(e)
    return e

def mesh_stats(coll):
    vs = [v.co for o in coll.objects for v in o.data.vertices]
    return vs
