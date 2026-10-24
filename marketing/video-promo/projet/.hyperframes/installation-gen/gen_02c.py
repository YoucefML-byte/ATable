# Plan 02c « La tablette » (6 s, fond vert) — la caméra recule de la table jusqu'au plan de salle,
# la tablette fournie entre par la droite ; chaque plaque est reliée à la tablette par une piste
# lumineuse qui suit l'allée, et les commandes y arrivent en impulsions.
# Voix (temps plan) : « Et on vous fournit la tablette » 0.08–1.2 · « reliée » 1.45 · « à tous vos QR
# codes » 1.79–2.9 · « Les commandes » 3.25 · « y arrivent en direct » 3.81–4.9
import math, sys
from common import *

P = "02c-la-tablette"
D = 6.5
OUT = sys.argv[1]

CAM_E = dict(ax=1250, ay=560, tx=0, ty=0, s=0.62, rx=0, rz=0)          # = fin de 02b
CAM_F = dict(ax=440, ay=640, tx=1150, ty=-480, s=0.19, rx=0, rz=0)     # plan de salle dans la colonne gauche

# tables (centre monde, côté de la plaque, numéro) — la 4 est la table du film (autocollant TABLE 4)
TABLES = [("t4", 0, 0, 1, 4), ("t5", 1150, 0, -1, 5), ("t6", 2300, 0, 1, 6),
          ("t1", 0, -960, -1, 1), ("t2", 1150, -960, 1, 2), ("t3", 2300, -960, -1, 3)]
AISLE, PORT, BUS_X, R = 640.0, (968.0, 560.0), 760.0, 12.0


def scr(x, y):
    return project((x, y, 0.0), CAM_F)


def bez(p0, p1, p2, p3, n=60):
    pts = []
    for i in range(n + 1):
        t = i / n
        a, b, c, d = (1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t * t, t ** 3
        pts.append((a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]))
    return sum(math.dist(pts[i], pts[i + 1]) for i in range(n))


traces = {}
for tid, x, y, side, num in TABLES:
    px, py = scr(x + side * PLATE_X, y)
    sgn = 1 if py < AISLE else -1  # rangée du haut : on descend vers l'allée ; du bas : on remonte
    v_end = AISLE - sgn * R
    d = (f"M {px:.1f} {py:.1f} V {v_end:.1f} Q {px:.1f} {AISLE:.1f} {px + R:.1f} {AISLE:.1f} "
         f"H {BUS_X:.1f} C {BUS_X + 100:.1f} {AISLE:.1f} {PORT[0] - 90:.1f} {PORT[1]:.1f} {PORT[0]:.1f} {PORT[1]:.1f}")
    L = abs(v_end - py) + math.pi * R / 2 + (BUS_X - px - R) + bez((BUS_X, AISLE), (BUS_X + 100, AISLE), (PORT[0] - 90, PORT[1]), PORT)
    traces[tid] = (d, L, (px, py), scr(x, y), num)

TAB = dict(left=820, top=215, s=0.72)  # tablette du film (1060×690) réduite, centre (1350, 560)

css = f"""
{FONTS}
    #root {{ position: relative; width: 1920px; height: 1080px; overflow: hidden; font-family: "Source Serif 4"; color: {CREAM}; }}
    {I(P, "bg")} {{ position: absolute; inset: 0; background: {GREEN}; }}
    {I(P, "stage")} {{ position: absolute; inset: 0; perspective: {PERSP}px; perspective-origin: {PO[0]}px {PO[1]}px; }}
{rail_css(P, CREAM)}
{world_css(P, on_green=True)}
{plate_css(P)}
{sticker_css(P)}
    {I(P, "cam")} {{ z-index: 2; }}
    {C(P, "num")} {{
      position: absolute; width: 40px; height: 20px; line-height: 20px; text-align: center; z-index: 3;
      font-family: "JetBrains Mono"; font-weight: 700; font-size: 16px; color: {INK}; opacity: 0;
    }}

    /* ---------- pistes plaque -> tablette ---------- */
    {I(P, "net")} {{ position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; z-index: 3; overflow: visible; }}
    {C(P, "trace")} {{ fill: none; stroke: {GOLD}; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }}
    {C(P, "pulse")} {{ fill: none; stroke: #FFF6DF; stroke-width: 10; stroke-linecap: round; opacity: 0; }}
    {I(P, "port")} {{
      position: absolute; left: {PORT[0] - 9}px; top: {PORT[1] - 9}px; width: 18px; height: 18px; box-sizing: border-box;
      border: 3px solid {GOLD}; border-radius: 50%; background: {GREEN}; z-index: 6; transform-origin: 50% 50%;
    }}
    {I(P, "portring")} {{
      position: absolute; left: {PORT[0] - 9}px; top: {PORT[1] - 9}px; width: 18px; height: 18px; box-sizing: border-box;
      border: 2px solid #FFF6DF; border-radius: 50%; z-index: 6; transform-origin: 50% 50%; opacity: 0;
    }}

    /* ---------- tablette (gabarit du film : 1060×690, écran 1024×640) ---------- */
    {I(P, "tablet")} {{
      position: absolute; left: {TAB['left']}px; top: {TAB['top']}px; width: 1060px; height: 690px; box-sizing: border-box;
      border: 2px solid {INK}; border-radius: 34px; background: {CREAM2}; z-index: 5; transform-origin: 50% 50%;
    }}
    {I(P, "screen")} {{ position: absolute; left: 16px; top: 23px; width: 1024px; height: 640px; overflow: hidden; border-radius: 16px; background: #F6F7F9; }}
    {I(P, "shot")} {{ position: absolute; left: 0; top: 0; width: 1024px; height: 640px; display: block; }}
    {I(P, "ring")} {{
      position: absolute; left: 198.8px; top: 141.7px; width: 273.9px; height: 280.8px; box-sizing: border-box;
      border: 4px solid {ORANGE}; border-radius: 10px; opacity: 0; transform-origin: 50% 50%;
    }}

    /* ---------- notifications au-dessus de la tablette ---------- */
    {C(P, "notif")} {{
      position: absolute; left: 968px; height: 30px; display: flex; align-items: center; gap: 12px; white-space: nowrap; z-index: 6;
      font-family: "JetBrains Mono"; font-weight: 500; font-size: 22px; line-height: 30px; letter-spacing: 0.14em; color: {CREAM};
    }}
    {C(P, "ndot")} {{ display: block; width: 14px; height: 14px; border-radius: 50%; background: {ORANGE}; box-shadow: none; }}
    {I(P, "notif1")} {{ top: 222px; }}
    {I(P, "notif2")} {{ top: 262px; }}

    /* ---------- copie à gauche ---------- */
    {I(P, "copy")} {{ position: absolute; left: 120px; top: 0; width: 640px; height: 1080px; z-index: 4; }}
    {I(P, "head")} {{
      position: absolute; left: 0; top: 150px; width: 640px; margin: 0;
      font-family: "Source Serif 4"; font-weight: 500; font-size: 88px; line-height: 1.02; letter-spacing: -0.02em;
      color: {CREAM}; white-space: nowrap;
    }}
    {C(P, "row")} {{ display: block; }}
    {C(P, "gold")} {{ color: {GOLD}; }}
    {C(P, "mask")} {{ display: inline-block; overflow: hidden; vertical-align: top; }}
    {C(P, "hw")}, {C(P, "hw2")} {{ display: inline-block; }}
    {C(P, "lab")} {{
      position: absolute; left: 0; height: 28px; line-height: 28px; margin: 0;
      font-family: "JetBrains Mono"; font-weight: 500; font-size: 22px; letter-spacing: 0.14em; color: {CREAM}; white-space: nowrap;
    }}
    {I(P, "lab1")} {{ top: 366px; }}
    {I(P, "lab2")} {{ top: 842px; }}
    {C(P, "ch")} {{ display: inline-block; }}"""

tables = []
for tid, x, y, side, num in TABLES:
    hero = tid == "t4"
    tables.append(table_html(P, tid, x, y, plate_side=side, full=hero, hidden_leaves=not hero,
                             plate_id="qp" + tid[1:], plate_layers=[("g" + tid[1:], "gold", False)]))

paths = "\n".join(f'        <path id="{P}-tr-{tid}" class="{P}-trace" d="{d}" style="stroke-dasharray: {L:.1f} {L:.1f}; stroke-dashoffset: {L:.1f}" />'
                  for tid, (d, L, *_r) in traces.items())
pulses = "\n".join(f'        <path id="{P}-pu-{tid}" class="{P}-pulse" d="{d}" style="stroke-dasharray: 0.1 {L + 40:.1f}; stroke-dashoffset: 0" />'
                   for tid, (d, L, *_r) in traces.items())
nums = "\n".join(f'      <div id="{P}-num{num}" class="{P}-num" style="left: {c[0] - 20:.1f}px; top: {c[1] - 10:.1f}px">{num}</div>'
                 for tid, (d, L, p, c, num) in traces.items())


def chars(text):
    return "".join(f'<span class="{P}-ch">{"&nbsp;" if ch == " " else ch}</span>' for ch in text)


html = f"""<template>
  <style>{css}
  </style>

  <div id="root" data-composition-id="{P}" data-width="1920" data-height="1080" data-duration="{D}">
    <div id="{P}-bg" class="clip" data-start="0" data-duration="{D}" data-track-index="0"></div>

    <div id="{P}-stage" class="clip" data-start="0" data-duration="{D}" data-track-index="1">
{rail_html(P, 2, GREEN, CREAM)}

      <!-- monde 3D : la table 4 (raccord 02b) puis toute la salle -->
      <div id="{P}-cam" data-layout-allow-overflow>
        <div id="{P}-spin" data-layout-allow-overflow>
          <div id="{P}-off" data-layout-allow-overflow>
        {chr(10).join('        ' + t for t in tables).strip()}
          </div>
        </div>
      </div>
{nums}

      <!-- pistes : chaque plaque rejoint l'allée puis la tablette -->
      <svg id="{P}-net" viewBox="0 0 1920 1080" data-layout-allow-overflow>
{paths}
{pulses}
      </svg>

      <!-- tablette fournie -->
      <div id="{P}-tablet" data-layout-allow-overflow>
        <div id="{P}-screen">
          <img id="{P}-shot" src="assets/pro-salle.png" alt="" />
          <div id="{P}-ring"></div>
        </div>
      </div>
      <div id="{P}-port"></div>
      <div id="{P}-portring"></div>
      <div id="{P}-notif1" class="{P}-notif"><span class="{P}-ndot"></span><span>NOUVELLE COMMANDE · TABLE&nbsp;2</span></div>
      <div id="{P}-notif2" class="{P}-notif"><span class="{P}-ndot"></span><span>NOUVELLE COMMANDE · TABLE&nbsp;6</span></div>

      <!-- copie -->
      <div id="{P}-copy">
        <h1 id="{P}-head" data-layout-allow-overflow><span class="{P}-row"><span class="{P}-mask"><span class="{P}-hw">La</span></span> <span class="{P}-mask"><span class="{P}-hw">tablette,</span></span></span><span class="{P}-row {P}-gold"><span class="{P}-mask"><span class="{P}-hw2">fournie.</span></span></span></h1>
        <p id="{P}-lab1" class="{P}-lab">{chars("RELIÉE À TOUS VOS QR CODES")}</p>
        <p id="{P}-lab2" class="{P}-lab">{chars("LES COMMANDES ARRIVENT EN DIRECT")}</p>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
  <script>
    (function () {{
      var ID = "{P}";
      function $(s) {{ return document.getElementById(ID + "-" + s); }}
      function $$(root, c) {{ return Array.prototype.slice.call(root.querySelectorAll('[class~="' + ID + "-" + c + '"]')); }}

      var GOLD = "{GOLD}", GREEN = "{GREEN}";
      var cam = $("cam"), spin = $("spin"), off = $("off");
      var tl = gsap.timeline({{ paused: true }});

      // caméra E (= dernière image de 02b) et états de départ
      gsap.set(cam, {{ x: {CAM_E["ax"]}, y: {CAM_E["ay"]}, rotationX: 0 }});
      gsap.set(spin, {{ rotation: 0, scale: {CAM_E["s"]}, scaleZ: {CAM_E["s"]} }});
      gsap.set(off, {{ x: 0, y: 0 }});
      ["4", "5", "6", "1", "2", "3"].forEach(function (n) {{
        gsap.set($("qp" + n), {{ z: 0.6, scale: {PLATE_S} }});
        gsap.set($("qp" + n + "-sheen"), {{ x: -260, skewX: -22 }});
      }});
      gsap.set($("tablet"), {{ scale: {TAB["s"]} }});
      gsap.set([$("qp5"), $("qp6"), $("qp1"), $("qp2"), $("qp3")], {{ opacity: 0 }});

      /* ---- rail : étiquette sur 03 TABLETTE ---- */
      tl.fromTo($("tag"), {{ x: -480 }}, {{ x: 0, duration: 0.6, ease: "power3.out", force3D: false }}, 0);
      tl.fromTo($("dot3"), {{ backgroundColor: GREEN }}, {{ backgroundColor: GOLD, duration: 0.15, ease: "power1.out" }}, 0.45);

      /* ---- E -> F (0–1.3) : la caméra recule jusqu'au plan de salle ---- */
      tl.to(cam, {{ x: {CAM_F["ax"]}, y: {CAM_F["ay"]}, duration: 1.3, ease: "power3.inOut" }}, 0);
      tl.to(spin, {{ scale: {CAM_F["s"]}, scaleZ: {CAM_F["s"]}, duration: 1.3, ease: "power3.inOut" }}, 0);
      tl.to(off, {{ x: {-CAM_F["tx"]}, y: {-CAM_F["ty"]}, duration: 1.3, ease: "power3.inOut" }}, 0);

      // les autres tables apparaissent autour de la table 4 (groupes : échelle ; feuilles : opacité)
      ["t5", "t1", "t2", "t6", "t3"].forEach(function (t, i) {{
        var g = $(t), t0 = 0.85 + i * 0.08;
        tl.fromTo(g, {{ scale: 0.7 }}, {{ scale: 1, duration: 0.45, ease: "power3.out" }}, t0);
        tl.to($$(g, t + "-leaf").concat([$("qp" + t.slice(1))]), {{ opacity: 1, duration: 0.2, ease: "power1.out" }}, t0);
      }});
      // la vue devient un plan : les faces verticales de la table 4 (pieds, côtés, dossiers) s'effacent
      tl.to($$($("t4"), "tside").concat($$($("t4"), "leg"), $$($("t4"), "back")), {{ opacity: 0, duration: 0.5, ease: "power1.inOut" }}, 0.25);
      tl.to($$($("stage"), "num"), {{ opacity: 1, duration: 0.3, ease: "power1.out", stagger: 0.04 }}, 1.3);

      /* ---- « La tablette, fournie. » ---- */
      tl.fromTo($$($("head"), "hw"), {{ yPercent: 110 }}, {{ yPercent: 0, duration: 0.75, ease: "power3.out", stagger: 0.1, force3D: false }}, 0.1);
      tl.fromTo($$($("head"), "hw2"), {{ yPercent: 110 }}, {{ yPercent: 0, duration: 0.7, ease: "power3.out", force3D: false }}, 0.55);

      /* ---- la tablette entre par la droite (0.35–1.15) ---- */
      tl.fromTo($("tablet"), {{ x: 1250 }}, {{ x: 0, duration: 0.85, ease: "power3.out" }}, 0.3);

      /* ---- « reliée à tous vos QR codes » : port, puis les pistes se tracent (1.5–2.75) ---- */
      tl.fromTo($$($("lab1"), "ch"), {{ opacity: 0 }}, {{ opacity: 1, duration: 0.01, ease: "none", stagger: 0.03 }}, 1.45);
      tl.fromTo($("port"), {{ scale: 0 }}, {{ scale: 1, duration: 0.3, ease: "power3.out" }}, 1.5);
      var order = {{ t4: 0, t5: 1, t1: 2, t6: 3, t2: 4, t3: 5 }};
      var lens = {{ {", ".join(f"{tid}: {L:.1f}" for tid, (d, L, *_r) in traces.items())} }};
      Object.keys(order).forEach(function (t) {{
        tl.to($("tr-" + t), {{ strokeDashoffset: 0, duration: 0.75, ease: "power2.inOut" }}, 1.6 + order[t] * 0.13);
      }});

      /* ---- « Les commandes y arrivent en direct » : impulsions vers la tablette (3.2–4.6) ---- */
      tl.fromTo($$($("lab2"), "ch"), {{ opacity: 0 }}, {{ opacity: 1, duration: 0.01, ease: "none", stagger: 0.025 }}, 3.25);
      var wave = [["t2", 3.2], ["t4", 3.36], ["t1", 3.52], ["t6", 3.9], ["t5", 4.0], ["t3", 4.12]];
      wave.forEach(function (w) {{
        var t = w[0], t0 = w[1], L = lens[t], d = 0.3 + L / 1500;
        tl.set($("pu-" + t), {{ opacity: 1 }}, t0);
        tl.fromTo($("pu-" + t), {{ strokeDashoffset: 0 }}, {{ strokeDashoffset: -L, duration: d, ease: "power1.in", immediateRender: false }}, t0);
        tl.set($("pu-" + t), {{ opacity: 0 }}, t0 + d);
        tl.fromTo($("portring"), {{ scale: 1, opacity: 0.9 }}, {{ scale: 2.6, opacity: 0, duration: 0.4, ease: "power2.out", immediateRender: false }}, t0 + d);
        if (t === "t2") {{
          tl.fromTo($("notif1"), {{ x: -14, opacity: 0 }}, {{ x: 0, opacity: 1, duration: 0.33, ease: "power3.out", force3D: false }}, t0 + d);
          tl.fromTo($("ring"), {{ scale: 1.08, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.35, ease: "power3.out", immediateRender: false }}, t0 + d + 0.05);
        }}
        if (t === "t6") {{
          tl.fromTo($("notif2"), {{ x: -14, opacity: 0 }}, {{ x: 0, opacity: 1, duration: 0.33, ease: "power3.out", force3D: false }}, t0 + d);
        }}
      }});

      window.__timelines = window.__timelines || {{}};
      window.__timelines[ID] = tl;
    }})();
  </script>
</template>
"""
open(OUT, "w").write(html)
for tid, (d, L, p, c, num) in traces.items():
    print(tid, "plaque", [round(v, 1) for v in p], "L", round(L), "arrivée", round(0.3 + L / 1500, 2))
