# Plan 02b « La table » (8 s, fond crème) — la caméra recule et orbite pendant que la table 3D se
# construit autour de la plaque, montre les deux emplacements (bord gauche / bord droit), puis plonge
# sur la plaque qui change de finition sur les mots « rose », « argenté », « doré ».
# Voix (temps plan) : « Elle se place au bord de la table » 0.04–1.4 · « à gauche » 1.61 · « ou à droite »
# 1.98–2.5 · « Trois finitions au choix » 3.01–4.1 · rose 4.49 · argenté 5.14 · doré 5.66
import sys
from common import *

P = "02b-la-table"
D = 8
OUT = sys.argv[1]

CAM_A = dict(ax=1250, ay=540, tx=-PLATE_X, ty=0, s=4.0, rx=0, rz=0)      # raccord 02a (plaque plein cadre)
CAM_C = dict(ax=1250, ay=575, tx=0, ty=0, s=0.86, rx=30, rz=0)           # vue d'ensemble, en hauteur
CAM_C2 = dict(ax=1250, ay=610, tx=0, ty=0, s=0.78, rx=36, rz=0)          # la table recule pendant que la plaque lévite
CAM_E = dict(ax=1250, ay=560, tx=0, ty=0, s=0.62, rx=0, rz=0)            # vue de dessus : raccord 02c


def cam_js(c):
    return (f'{{ x: {c["ax"]}, y: {c["ay"]}, rotationX: {c["rx"]} }}',
            f'{{ rotation: {c["rz"]}, scale: {c["s"]}, scaleZ: {c["s"]} }}',
            f'{{ x: {-c["tx"]}, y: {-c["ty"]} }}')


# légendes écran au-dessus des emplacements (calculées pour la caméra C, immobile de 1.6 à 2.9)
lx, ly = project((-PLATE_X, -60, 0.4), CAM_C)
rx_, ry = project((PLATE_X, -60, 0.4), CAM_C)
# plaque « héros » (2D, hors monde) : départ = plaque du monde vue par la caméra C, lévitation au centre,
# retour = emplacement de la plaque vue par la caméra E (vue de dessus)
H0 = project((PLATE_X, 0, 0.6), CAM_C)
H_S0 = CAM_C["s"] * PLATE_S
HERO = (1250, 520, 0.8)
H1 = project((PLATE_X, 0, 0.6), CAM_E)
H_S1 = CAM_E["s"] * PLATE_S
gx, gy = HERO[0] - 280 * HERO[2] + 34, HERO[1] - 180 * HERO[2] + 30  # éclat : coin haut-gauche du héros

A, C_, C2, E = cam_js(CAM_A), cam_js(CAM_C), cam_js(CAM_C2), cam_js(CAM_E)

SW = [("rose", "ROSE", 0), ("silver", "ARGENTÉ", 210), ("gold", "DORÉ", 420)]

css = f"""
{FONTS}
    #root {{ position: relative; width: 1920px; height: 1080px; overflow: hidden; font-family: "Source Serif 4"; color: {INK}; }}
    {I(P, "bg")} {{ position: absolute; inset: 0; background: {CREAM}; }}
    {I(P, "stage")} {{ position: absolute; inset: 0; perspective: {PERSP}px; perspective-origin: {PO[0]}px {PO[1]}px; }}
{rail_css(P, INK)}
{world_css(P)}
{plate_css(P)}
{sticker_css(P)}
    {I(P, "cam")} {{ z-index: 2; }}
    {C(P, "ol")} {{
      position: absolute; width: 170px; height: 120px; box-sizing: border-box;
      border: 3px dashed {GOLD_DEEP}; border-radius: 16px; opacity: 0;
    }}

    /* ---------- légendes écran des emplacements ---------- */
    {C(P, "place")} {{
      position: absolute; width: 260px; height: 24px; line-height: 24px; text-align: center; z-index: 6;
      font-family: "JetBrains Mono"; font-weight: 700; font-size: 20px; letter-spacing: 0.14em; padding-left: 0.14em;
      box-sizing: border-box; color: {INK}; white-space: nowrap; opacity: 0;
    }}
    {C(P, "pstem")} {{ position: absolute; width: 2px; height: 26px; background: {INK}; transform-origin: 50% 100%; z-index: 6; }}
    {I(P, "hero")} {{ left: 970px; top: 360px; z-index: 5; visibility: hidden; }}
    {I(P, "glint")} {{ left: {gx - 23:.1f}px; top: {gy - 23:.1f}px; z-index: 6; transform-origin: 50% 50%; opacity: 0; }}

    /* ---------- copie à gauche ---------- */
    {I(P, "copy")} {{ position: absolute; left: 120px; top: 0; width: 640px; height: 1080px; z-index: 4; }}
    {C(P, "head")} {{
      position: absolute; left: 0; top: 250px; width: 640px; margin: 0;
      font-family: "Source Serif 4"; font-weight: 500; font-size: 88px; line-height: 1.02; letter-spacing: -0.02em;
      color: {GREEN}; white-space: nowrap;
    }}
    {C(P, "row")} {{ display: block; }}
    {C(P, "mask")} {{ display: inline-block; overflow: hidden; vertical-align: top; }}
    {C(P, "hw")}, {C(P, "hw2")} {{ display: inline-block; }}
    {I(P, "rule")} {{ position: absolute; left: 0; top: 462px; width: 96px; height: 2px; background: {GREEN}; transform-origin: 0% 50%; }}
    {I(P, "line1")} {{
      position: absolute; left: 0; top: 492px; width: 640px; margin: 0;
      font-family: "Source Serif 4"; font-weight: 400; font-size: 40px; line-height: 1.3; color: {INK}; white-space: nowrap;
    }}
    {C(P, "w")} {{ display: inline-block; }}
    {C(P, "acc")} {{ color: {GOLD_DEEP}; }}

    /* ---------- nuancier : trois finitions ---------- */
    {C(P, "sw")} {{ position: absolute; top: 500px; width: 180px; height: 124px; transform-origin: 50% 50%; }}
    {C(P, "swclip")} {{ position: absolute; inset: 0; box-sizing: border-box; border: 2px solid {INK}; border-radius: 8px; overflow: hidden; }}
    {C(P, "swb")} {{ position: absolute; inset: 0; }}
    {C(P, "swb1")} {{ clip-path: polygon(12% 0, 34% 0, 18% 100%, -4% 100%); }}
    {C(P, "swb2")} {{ clip-path: polygon(40% 0, 44% 0, 28% 100%, 24% 100%); }}
    {C(P, "swb3")} {{ clip-path: polygon(78% 0, 100% 0, 100% 100%, 62% 100%); }}
    {C(P, "swring")} {{ position: absolute; left: -10px; top: -10px; width: 200px; height: 144px; box-sizing: border-box; border: 4px solid {GREEN}; border-radius: 14px; opacity: 0; transform-origin: 50% 50%; }}
    {C(P, "swl")} {{
      position: absolute; top: 644px; width: 180px; height: 24px; line-height: 24px; text-align: center;
      font-family: "JetBrains Mono"; font-weight: 500; font-size: 20px; letter-spacing: 0.14em; padding-left: 0.14em;
      box-sizing: border-box; color: {INK}; white-space: nowrap;
    }}"""

swatches = []
for fk, label, x in SW:
    f = FIN[fk]
    swatches.append(f"""<div id="{P}-sw-{fk}" class="{P}-sw" style="left: {x}px">
          <div class="{P}-swclip">
            <div class="{P}-swb" style="background: {f['base']}"></div>
            <div class="{P}-swb {P}-swb1" style="background: {f['mid']}"></div>
            <div class="{P}-swb {P}-swb2" style="background: {f['light']}"></div>
            <div class="{P}-swb {P}-swb3" style="background: {f['shade']}"></div>
          </div>
          <div id="{P}-ring-{fk}" class="{P}-swring"></div>
        </div>
        <div id="{P}-swl-{fk}" class="{P}-swl" style="left: {x}px">{label}</div>""")

table = table_html(P, "t", 0, 0, plate_side=-1, full=True, hidden_leaves=True, plate_id="qp",
                   plate_layers=[("pg", "gold", False)])
hero = plate_html(P, "hero", [("hg", "gold", False), ("pr", "rose", True), ("ps", "silver", True), ("pg2", "gold", True)])

html = f"""<template>
  <style>{css}
  </style>

  <div id="root" data-composition-id="{P}" data-width="1920" data-height="1080" data-duration="{D}">
    <div id="{P}-bg" class="clip" data-start="0" data-duration="{D}" data-track-index="0"></div>

    <div id="{P}-stage" class="clip" data-start="0" data-duration="{D}" data-track-index="1">
{rail_html(P, 1, CREAM, INK)}

      <!-- monde 3D : la table, ses chaises, ses couverts et la plaque QR -->
      <div id="{P}-cam" data-layout-allow-overflow>
        <div id="{P}-spin" data-layout-allow-overflow>
          <div id="{P}-off" data-layout-allow-overflow>
        {table}
            <div id="{P}-olL" class="{P}-ol" style="left: {-PLATE_X - 85}px; top: -60px; transform: translateZ(0.4px)"></div>
            <div id="{P}-olR" class="{P}-ol" style="left: {PLATE_X - 85}px; top: -60px; transform: translateZ(0.4px)"></div>
          </div>
        </div>
      </div>

      <!-- légendes des deux emplacements (caméra C) -->
      <div id="{P}-stemL" class="{P}-pstem" style="left: {lx - 1:.1f}px; top: {ly - 32:.1f}px"></div>
      <div id="{P}-lblL" class="{P}-place" style="left: {lx - 130:.1f}px; top: {ly - 62:.1f}px">À GAUCHE</div>
      <div id="{P}-stemR" class="{P}-pstem" style="left: {rx_ - 1:.1f}px; top: {ry - 32:.1f}px"></div>
      <div id="{P}-lblR" class="{P}-place" style="left: {rx_ - 130:.1f}px; top: {ry - 62:.1f}px">OU À DROITE</div>
      <!-- plaque héros : se soulève de la table pour présenter les finitions -->
      {hero}
      <div id="{P}-glint" class="{P}-glint"></div>

      <!-- copie -->
      <div id="{P}-copy">
        <h1 id="{P}-head1" class="{P}-head" data-layout-allow-overflow data-layout-allow-overlap><span class="{P}-row"><span class="{P}-mask"><span class="{P}-hw">Au</span></span> <span class="{P}-mask"><span class="{P}-hw">bord</span></span></span><span class="{P}-row"><span class="{P}-mask"><span class="{P}-hw">de</span></span> <span class="{P}-mask"><span class="{P}-hw">la</span></span> <span class="{P}-mask"><span class="{P}-hw">table.</span></span></span></h1>
        <h1 id="{P}-head2" class="{P}-head" data-layout-allow-overflow data-layout-allow-overlap><span class="{P}-row"><span class="{P}-mask"><span class="{P}-hw2">Trois</span></span></span><span class="{P}-row"><span class="{P}-mask"><span class="{P}-hw2">finitions.</span></span></span></h1>
        <div id="{P}-rule"></div>
        <p id="{P}-line1"><span class="{P}-w">À</span> <span class="{P}-w {P}-acc">gauche</span> <span class="{P}-w">ou</span> <span class="{P}-w">à</span> <span class="{P}-w {P}-acc">droite.</span></p>
        {chr(10).join('        ' + s for s in swatches).strip()}
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
  <script>
    (function () {{
      var ID = "{P}";
      function $(s) {{ return document.getElementById(ID + "-" + s); }}
      function $$(root, c) {{ return Array.prototype.slice.call(root.querySelectorAll('[class~="' + ID + "-" + c + '"]')); }}

      var GOLD = "{GOLD}", INK = "{INK}", CREAM = "{CREAM}";
      var cam = $("cam"), spin = $("spin"), off = $("off"), table = $("t"), plate = $("qp");
      var tl = gsap.timeline({{ paused: true }});

      // caméra A (= dernière image de 02a) et états de départ
      gsap.set(cam, {A[0]});
      gsap.set(spin, {A[1]});
      gsap.set(off, {A[2]});
      gsap.set(plate, {{ z: 0.6, scale: {PLATE_S} }});
      gsap.set([$("qp-sheen"), $("hero-sheen")], {{ x: -260, skewX: -22 }});
      gsap.set($("hero"), {{ x: {H0[0] - 1250:.2f}, y: {H0[1] - 540:.2f}, scale: {H_S0:.4f}, rotationX: {CAM_C["rx"]} }});
      ["ch0", "ch1", "ch2", "ch3"].forEach(function (c) {{ gsap.set($("t-" + c), {{ z: 170, scale: 0.6 }}); }});

      /* ---- rail : 01 PLAQUE passée, l'étiquette glisse sur 02 TABLE ---- */
      tl.fromTo($("tag"), {{ x: -480 }}, {{ x: 0, duration: 0.6, ease: "power3.out", force3D: false }}, 0);
      tl.fromTo($("dot2"), {{ backgroundColor: CREAM }}, {{ backgroundColor: GOLD, duration: 0.15, ease: "power1.out" }}, 0.45);

      /* ---- A -> C (0–1.6) : recul, orbite en passant par une plongée 3D marquée ---- */
      tl.to(cam, {{ x: {CAM_C["ax"]}, y: {CAM_C["ay"]}, duration: 1.6, ease: "power3.inOut" }}, 0);
      tl.fromTo(cam, {{ rotationX: 0 }}, {{ rotationX: 56, duration: 0.85, ease: "power2.out", immediateRender: false }}, 0);
      tl.to(cam, {{ rotationX: 30, duration: 0.75, ease: "power2.inOut" }}, 0.85);
      tl.to(spin, {{ scale: {CAM_C["s"]}, scaleZ: {CAM_C["s"]}, duration: 1.6, ease: "power3.inOut" }}, 0);
      tl.fromTo(spin, {{ rotation: 0 }}, {{ rotation: -24, duration: 0.85, ease: "power2.out", immediateRender: false }}, 0);
      tl.to(spin, {{ rotation: 0, duration: 0.75, ease: "power2.inOut" }}, 0.85);
      tl.to(off, {C_[2].replace("}", ", duration: 1.6, ease: \"power3.inOut\" }")}, 0);

      // la table apparaît sous la plaque (feuilles uniquement : jamais d'opacité sur un groupe 3D)
      tl.to($$(table, "ttop").concat($$(table, "tside"), $$(table, "leg")), {{ opacity: 1, duration: 0.4, ease: "power1.out" }}, 0.12);
      // les chaises tombent à leur place, une par temps
      ["ch0", "ch3", "ch1", "ch2"].forEach(function (c, i) {{
        var g = $("t-" + c), t0 = 0.5 + i * 0.12;
        tl.to(g, {{ z: 0, scale: 1, duration: 0.45, ease: "power3.out" }}, t0);
        tl.to($$(g, "seat").concat($$(g, "back")), {{ opacity: 1, duration: 0.15, ease: "power1.out" }}, t0);
      }});
      // couverts
      tl.to($$(table, "dish"), {{ opacity: 1, duration: 0.25, ease: "power1.out", stagger: 0.06 }}, 0.95);
      tl.to($$(table, "cutl").concat($$(table, "glass")), {{ opacity: 1, duration: 0.25, ease: "power1.out", stagger: 0.025 }}, 1.1);

      /* ---- copie 1 : « Au bord de la table. » puis « À gauche ou à droite. » ---- */
      tl.fromTo($$($("head1"), "hw"), {{ yPercent: 110 }}, {{ yPercent: 0, duration: 0.75, ease: "power3.out", stagger: 0.08, force3D: false }}, 0.15);
      tl.fromTo($("rule"), {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.5, ease: "power3.out", force3D: false }}, 1.0);
      tl.fromTo($$($("line1"), "w"), {{ y: 28, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.09, force3D: false }}, 1.55);

      /* ---- emplacements : gauche (1.62), la plaque glisse à droite (2.0–2.5) ---- */
      tl.fromTo($("olL"), {{ opacity: 0, scale: 1.18 }}, {{ opacity: 1, scale: 1, duration: 0.35, ease: "power3.out" }}, 1.62);
      tl.fromTo($("stemL"), {{ scaleY: 0 }}, {{ scaleY: 1, duration: 0.25, ease: "power3.out", force3D: false }}, 1.65);
      tl.fromTo($("lblL"), {{ y: 10, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.3, ease: "power3.out", force3D: false }}, 1.7);
      tl.to(plate, {{ x: {2 * PLATE_X}, duration: 0.5, ease: "power3.inOut" }}, 2.0);
      tl.to(plate, {{ z: 36, duration: 0.25, ease: "power2.out" }}, 2.0);
      tl.to(plate, {{ z: 0.6, duration: 0.25, ease: "power2.in" }}, 2.25);
      tl.fromTo($("olR"), {{ opacity: 0, scale: 1.18 }}, {{ opacity: 1, scale: 1, duration: 0.35, ease: "power3.out" }}, 2.05);
      tl.fromTo($("stemR"), {{ scaleY: 0 }}, {{ scaleY: 1, duration: 0.25, ease: "power3.out", force3D: false }}, 2.08);
      tl.fromTo($("lblR"), {{ y: 10, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.3, ease: "power3.out", force3D: false }}, 2.12);
      tl.to([$("olL"), $("olR"), $("stemL"), $("stemR"), $("lblL"), $("lblR")], {{ opacity: 0, duration: 0.25, ease: "power1.in" }}, 2.8);

      /* ---- 2.85 : la plaque se soulève de la table (relais monde -> plaque héros), la table recule ---- */
      tl.set($("hero"), {{ visibility: "visible" }}, 2.85);
      tl.set(plate, {{ opacity: 0 }}, 2.85);
      tl.to($("hero"), {{ x: {HERO[0] - 1250}, y: {HERO[1] - 540}, scale: {HERO[2]}, rotationX: 0, duration: 0.85, ease: "power3.inOut" }}, 2.85);
      tl.to(cam, {C2[0].replace("}", ", duration: 1.0, ease: \"power2.inOut\" }")}, 2.85);
      tl.to(spin, {C2[1].replace("}", ", duration: 1.0, ease: \"power2.inOut\" }")}, 2.85);

      /* ---- copie 2 : « Trois finitions. » + nuancier ---- */
      tl.to([$("head1"), $("line1")], {{ y: -24, opacity: 0, duration: 0.25, ease: "power2.in", force3D: false }}, 2.82);
      tl.fromTo($$($("head2"), "hw2"), {{ yPercent: 110 }}, {{ yPercent: 0, duration: 0.7, ease: "power3.out", stagger: 0.1, force3D: false }}, 3.05);
      tl.fromTo([$("sw-rose"), $("sw-silver"), $("sw-gold")], {{ y: 30, scale: 0.92, opacity: 0 }},
        {{ y: 0, scale: 1, opacity: 1, duration: 0.45, ease: "power3.out", stagger: 0.1, force3D: false }}, 3.45);
      tl.fromTo([$("swl-rose"), $("swl-silver"), $("swl-gold")], {{ opacity: 0 }}, {{ opacity: 0.45, duration: 0.3, ease: "power1.out", stagger: 0.1 }}, 3.6);

      /* ---- changements de finition, chacun sur son mot (balayage + reflet au front) ---- */
      function finish(layer, sw, t, prev) {{
        tl.fromTo($(layer), {{ clipPath: "inset(0% 100% 0% 0%)" }}, {{ clipPath: "inset(0% 0% 0% 0%)", duration: 0.38, ease: "power2.inOut", immediateRender: false }}, t);
        tl.fromTo($("hero-sheen"), {{ x: -150 }}, {{ x: 600, duration: 0.38, ease: "power2.inOut", immediateRender: false }}, t);
        tl.fromTo($("ring-" + sw), {{ opacity: 0, scale: 1.08 }}, {{ opacity: 1, scale: 1, duration: 0.3, ease: "power3.out", immediateRender: false }}, t + 0.04);
        tl.to($("sw-" + sw), {{ y: -12, duration: 0.3, ease: "power3.out", force3D: false }}, t + 0.04);
        tl.to($("swl-" + sw), {{ opacity: 1, duration: 0.2, ease: "power1.out" }}, t + 0.04);
        if (prev) {{
          tl.to($("ring-" + prev), {{ opacity: 0, duration: 0.18, ease: "power1.in" }}, t);
          tl.to($("sw-" + prev), {{ y: 0, duration: 0.3, ease: "power2.out", force3D: false }}, t);
          tl.to($("swl-" + prev), {{ opacity: 0.45, duration: 0.2, ease: "power1.out" }}, t);
        }}
      }}
      finish("pr", "rose", 4.45, null);
      finish("ps", "silver", 5.1, "rose");
      finish("pg2", "gold", 5.62, "silver");

      // éclat sur la plaque dorée
      tl.fromTo($("glint"), {{ scale: 0, rotation: -12, opacity: 1 }}, {{ scale: 1, rotation: 6, duration: 0.22, ease: "power2.out", immediateRender: false }}, 6.05);
      tl.to($("glint"), {{ scale: 0, rotation: 22, duration: 0.25, ease: "power2.in" }}, 6.27);

      /* ---- sortie de la copie, D -> E (6.55–7.4) : vue de dessus pour le raccord avec 02c ---- */
      tl.to([$("head2"), $("rule"), $("sw-rose"), $("sw-silver"), $("sw-gold"), $("swl-rose"), $("swl-silver"), $("swl-gold")],
        {{ y: -18, opacity: 0, duration: 0.35, ease: "power2.in", force3D: false }}, 6.55);
      tl.to(cam, {E[0].replace("}", ", duration: 0.85, ease: \"power3.inOut\" }")}, 6.5);
      tl.to(spin, {E[1].replace("}", ", duration: 0.85, ease: \"power3.inOut\" }")}, 6.5);
      tl.to($("hero"), {{ x: {H1[0] - 1250:.2f}, y: {H1[1] - 540:.2f}, scale: {H_S1:.4f}, duration: 0.75, ease: "power3.inOut" }}, 6.7);
      tl.set(plate, {{ opacity: 1 }}, 7.45);
      tl.set($("hero"), {{ visibility: "hidden" }}, 7.45);

      window.__timelines = window.__timelines || {{}};
      window.__timelines[ID] = tl;
    }})();
  </script>
</template>
"""
open(OUT, "w").write(html)
print("ok", OUT, "labels", round(lx), round(ly), round(rx_), round(ry), "hero0", [round(v) for v in H0], round(H_S0, 3), "hero1", [round(v) for v in H1], round(H_S1, 3))
