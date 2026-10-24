# Génère compositions/frames/03a-la-salle.html : le plan 3D rendu dans Blender (Cycles) joué en vidéo,
# avec le repère « VENDREDI · 20:34 » et l'étiquette « TABLE 4 » épinglée au-dessus de la table
# (positions écran exportées image par image depuis la caméra Blender : build/tag_t4.json).
import json, sys, os

tags_path, out_path = sys.argv[1], sys.argv[2]
tags = json.load(open(tags_path))
xs = ",".join("null" if t is None else f"{t[0]:.1f}" for t in tags)
ys = ",".join("null" if t is None else f"{t[1]:.1f}" for t in tags)

HTML = """<template>
  <style>
    @font-face { font-family: "JetBrains Mono"; src: url("assets/fonts/JetBrainsMono-700.woff2") format("woff2"); font-weight: 700; font-style: normal; font-display: block; }

    #root { position: relative; width: 1920px; height: 1080px; overflow: hidden; }
    [id="03a-la-salle-bg"] { position: absolute; inset: 0; background: #1F4D3A; }
    [id="03a-la-salle-vid"] { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; object-fit: cover; display: block; }
    [id="03a-la-salle-ovl"] { position: absolute; inset: 0; }
    [id="03a-la-salle-label"] {
      position: absolute; left: 96px; top: 64px; height: 44px; display: flex; gap: 14px; align-items: center;
      padding: 0 16px; box-sizing: border-box; background: #E7DCC6; border: 2px solid #0C1613; border-radius: 6px;
      font-family: "JetBrains Mono"; font-weight: 700; font-size: 22px; letter-spacing: 0.16em; color: #0C1613; white-space: nowrap;
    }
    [id="03a-la-salle-label"] span { display: inline-block; }
    [id="03a-la-salle-tag"] {
      position: absolute; left: 0; top: 0; width: 140px; height: 40px; box-sizing: border-box; transform-origin: 50% 100%;
      background: #E7DCC6; border: 2px solid #0C1613; border-radius: 6px; opacity: 0;
      font-family: "JetBrains Mono"; font-weight: 700; font-size: 18px; line-height: 36px; text-align: center; color: #0C1613; white-space: nowrap;
    }
  </style>

  <div id="root" data-composition-id="03a-la-salle" data-width="1920" data-height="1080" data-duration="8.5">
    <div id="03a-la-salle-bg" class="clip" data-start="0" data-duration="8.5" data-track-index="0"></div>
    <!-- Rendu Blender 4.5 / Cycles (scène et pipeline : .hyperframes/salle-3d/) -->
    <video id="03a-la-salle-vid" class="clip" data-start="0" data-duration="8.5" data-track-index="1"
      src="assets/video/03a-la-salle.mp4" muted playsinline preload="auto"></video>
    <div id="03a-la-salle-ovl" class="clip" data-start="0" data-duration="8.5" data-track-index="2">
      <div id="03a-la-salle-label"><span id="03a-la-salle-lbl-a">VENDREDI</span><span id="03a-la-salle-lbl-b">·</span><span id="03a-la-salle-lbl-c">20:34</span></div>
      <div id="03a-la-salle-tag" data-layout-allow-overflow>TABLE 4</div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
  <script>
(function () {
  var ID = "03a-la-salle", D = 8.5, FPS = 30;
  function $(s) { return document.getElementById(ID + "-" + s); }
  // position écran (px, 1920×1080) du point situé 1,5 m au-dessus de la table 4, image par image (caméra Blender)
  var TX = [__XS__];
  var TY = [__YS__];
  var tag = $("tag");
  function pin(t) {
    var f = t * FPS, i = Math.max(0, Math.min(TX.length - 1, Math.floor(f))), j = Math.min(TX.length - 1, i + 1), k = f - i;
    if (TX[i] === null || TX[j] === null) return;
    var x = TX[i] + (TX[j] - TX[i]) * k, y = TY[i] + (TY[j] - TY[i]) * k;
    tag.style.left = (x - 70).toFixed(1) + "px";
    tag.style.top = (y - 46).toFixed(1) + "px";
  }
  var state = { t: 0 };
  var tl = gsap.timeline({ paused: true });
  tl.fromTo(state, { t: 0 }, { t: D, duration: D, ease: "none", onUpdate: function () { pin(state.t); } }, 0);
  // repère « VENDREDI · 20:34 », puis l'étiquette de la table 4
  tl.fromTo([$("lbl-a"), $("lbl-b"), $("lbl-c")], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out", stagger: 0.12 }, 0.25);
  tl.to($("label"), { opacity: 0, duration: 0.4, ease: "power1.in" }, 4.4);
  tl.fromTo(tag, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power3.out" }, 2.2);
  tl.to(tag, { opacity: 0, duration: 0.25, ease: "power1.in" }, 4.55);
  pin(0);
  window.__timelines = window.__timelines || {};
  window.__timelines[ID] = tl;
})();
  </script>
</template>
"""
open(out_path, "w").write(HTML.replace("__XS__", xs).replace("__YS__", ys))
print("ok", out_path, len(tags))
