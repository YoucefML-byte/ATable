# Rend une image complète (mêmes réglages que render_final.py) vers un fichier donné.  -- frame sortie
import bpy, sys, time
a = sys.argv[sys.argv.index("--") + 1:]
f, out = int(a[0]), a[1]
scn = bpy.context.scene; cy = scn.cycles
scn.render.resolution_x, scn.render.resolution_y, scn.render.resolution_percentage = 1600, 900, 100
cy.samples = 12; cy.adaptive_threshold = 0.05
cy.diffuse_bounces = 2; cy.glossy_bounces = 2; cy.max_bounces = 6; cy.transmission_bounces = 6
t0 = time.time(); scn.frame_set(f); scn.render.filepath = out
bpy.ops.render.render(write_still=True); print(f"done {f} {time.time() - t0:.1f}s", flush=True)
