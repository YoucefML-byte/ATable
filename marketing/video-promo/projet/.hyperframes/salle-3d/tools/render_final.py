# Rendu final, reprenable : saute les images déjà présentes.  -- largeur hauteur spp seuil premier dernier
import bpy, sys, os, time
a = sys.argv[sys.argv.index("--") + 1:]
W, H, spp, thr, f0, f1 = int(a[0]), int(a[1]), int(a[2]), float(a[3]), int(a[4]), int(a[5])
scn = bpy.context.scene; cy = scn.cycles
scn.render.resolution_x, scn.render.resolution_y, scn.render.resolution_percentage = W, H, 100
cy.samples = spp; cy.adaptive_threshold = thr
cy.diffuse_bounces = 2; cy.glossy_bounces = 2; cy.max_bounces = 6; cy.transmission_bounces = 6
out = os.path.dirname(bpy.data.filepath) + "/frames"
os.makedirs(out, exist_ok=True)
for f in range(f0, f1 + 1):
    p = f"{out}/f_{f:04d}.png"
    if os.path.exists(p) and os.path.getsize(p) > 0: continue
    t0 = time.time(); scn.frame_set(f); scn.render.filepath = p + ".tmp.png"
    bpy.ops.render.render(write_still=True)
    os.replace(p + ".tmp.png", p)
    print(f"done {f} {time.time() - t0:.1f}s", flush=True)
print("ALL DONE", f0, f1, flush=True)
