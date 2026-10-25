# Applique la nouvelle marque « À vos tables » à la scène déjà construite (sans tout reconstruire) :
# textures rechargées (logo, gravure, écran du téléphone) et mot de l'enseigne en Source Serif.
import bpy, os
S = os.environ["SCRATCH"]
for im in bpy.data.images:
    if im.filepath and any(k in im.filepath for k in ("logo.png", "engraving.png", "scr_0000.png")):
        im.reload(); print("reload", im.name, im.filepath)
cu = bpy.data.curves["wordmark"]
cu.body = "À vos tables"; cu.font = bpy.data.fonts.load(S + "/fonts/SourceSerif4-600.ttf"); cu.size = 0.27
bpy.context.view_layer.update()
wm = bpy.data.objects["wordmark"]; wm.location.z = 1.5
print("wordmark dims", tuple(round(v, 3) for v in wm.dimensions))
bpy.ops.wm.save_mainfile()
