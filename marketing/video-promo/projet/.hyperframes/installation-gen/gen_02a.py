# Plan 02a « La plaque » (6 s, fond crème) — la plaque métal entre en 3D, l'autocollant QR se décolle
# de son support et se presse dessus. Voix : « L'installation ? On s'en charge. Chaque table reçoit
# sa plaque en métal, et son QR code. » (mots à 0.11 · 1.27 · 2.52 · plaque 3.57 · QR code 4.64–5.5)
import sys
from common import *

P = "02a-la-plaque"
D = 6
OUT = sys.argv[1]

STK_FINAL = (1140, 394)  # autocollant posé : plaque (970, 360) + (170, 34)
STK_OFF = (410.84, -226.96)  # centre de l'autocollant sur son support, tourné de 6°

css = f"""
{FONTS}
    #root {{ position: relative; width: 1920px; height: 1080px; overflow: hidden; font-family: "Source Serif 4"; color: {INK}; }}
    {I(P, "bg")} {{ position: absolute; inset: 0; background: {CREAM}; }}
    {I(P, "stage")} {{ position: absolute; inset: 0; perspective: {PERSP}px; perspective-origin: {PO[0]}px {PO[1]}px; }}
{rail_css(P, INK)}

    /* ---------- copie à gauche (x 120–760) ---------- */
    {I(P, "copy")} {{ position: absolute; left: 120px; top: 0; width: 640px; height: 1080px; z-index: 4; }}
    {I(P, "head")} {{
      position: absolute; left: 0; top: 250px; width: 640px; margin: 0;
      font-family: "Source Serif 4"; font-weight: 500; font-size: 88px; line-height: 1.02; letter-spacing: -0.02em;
      color: {GREEN}; white-space: nowrap;
    }}
    {C(P, "row")} {{ display: block; }}
    {C(P, "gold")} {{ color: {GOLD_DEEP}; }}
    {C(P, "mask")} {{ display: inline-block; overflow: hidden; vertical-align: top; }}
    {C(P, "hw")}, {C(P, "hw2")} {{ display: inline-block; }}
    {I(P, "rule")} {{ position: absolute; left: 0; top: 462px; width: 96px; height: 2px; background: {GREEN}; transform-origin: 0% 50%; }}
    {C(P, "line")} {{
      position: absolute; left: 0; width: 640px; margin: 0;
      font-family: "Source Serif 4"; font-weight: 400; font-size: 40px; line-height: 1.3; color: {INK}; white-space: nowrap;
    }}
    {I(P, "line1")} {{ top: 492px; }}
    {I(P, "line2")} {{ top: 544px; }}
    {C(P, "w")} {{ display: inline-block; }}
{plate_css(P)}
{sticker_css(P)}

    /* ---------- plaque en 3D (épaisseur = 3 couches derrière) ---------- */
    {I(P, "plate3d")} {{ position: absolute; left: 970px; top: 360px; width: 560px; height: 360px; transform-style: preserve-3d; transform-origin: 50% 50%; z-index: 2; }}

    /* ---------- support (planche d'autocollants) ---------- */
    {I(P, "liner")} {{
      position: absolute; left: 1525px; top: 142px; width: 270px; height: 316px; box-sizing: border-box;
      background: {CREAM2}; border: 2px solid {INK}; border-radius: 10px; transform-origin: 50% 50%; z-index: 3;
    }}
    {I(P, "cut")} {{ position: absolute; left: 21px; top: 21px; width: 224px; height: 254px; box-sizing: border-box; border: 2px dashed #B9A57E; border-radius: 16px; }}
    {I(P, "linertxt")} {{
      position: absolute; left: 0; right: 0; top: 282px; height: 18px; line-height: 18px; text-align: center;
      font-family: "JetBrains Mono"; font-weight: 500; font-size: 12px; letter-spacing: 0.16em; padding-left: 0.16em; color: #8C7A57; white-space: nowrap;
    }}
    {I(P, "stk")} {{ left: {STK_FINAL[0]}px; top: {STK_FINAL[1]}px; z-index: 5; }}
    {I(P, "ripple")} {{
      position: absolute; left: {STK_FINAL[0]}px; top: {STK_FINAL[1]}px; width: 220px; height: 250px; box-sizing: border-box;
      border: 3px solid #FFFDF6; border-radius: 18px; transform-origin: 50% 50%; z-index: 6; opacity: 0;
    }}
    {I(P, "glint")} {{ left: 981px; top: 371px; z-index: 6; transform-origin: 50% 50%; }}

    /* ---------- légendes à droite de la plaque ---------- */
    {C(P, "hair")} {{ position: absolute; height: 2px; background: {INK}; transform-origin: 0% 50%; z-index: 6; }}
    {I(P, "hair1")} {{ left: 1530px; top: 399px; width: 42px; }}
    {I(P, "hair2")} {{ left: 1362px; top: 605px; width: 210px; }}
    {C(P, "callout")} {{
      position: absolute; left: 1584px; height: 22px; line-height: 22px; z-index: 6;
      font-family: "JetBrains Mono"; font-weight: 500; font-size: 18px; letter-spacing: 0.12em;
      text-transform: uppercase; color: {INK}; white-space: nowrap;
    }}
    {I(P, "lbl1")} {{ top: 389px; }}
    {I(P, "lbl2")} {{ top: 595px; }}
    {I(P, "lbl2b")} {{ top: 623px; color: {GOLD_DEEP}; }}"""

g = FIN["gold"]
html = f"""<template>
  <style>{css}
  </style>

  <div id="root" data-composition-id="{P}" data-width="1920" data-height="1080" data-duration="{D}">
    <div id="{P}-bg" class="clip" data-start="0" data-duration="{D}" data-track-index="0"></div>

    <div id="{P}-stage" class="clip" data-start="0" data-duration="{D}" data-track-index="1">
{rail_html(P, 0, CREAM, INK)}

      <!-- copie -->
      <div id="{P}-copy">
        <h1 id="{P}-head" data-layout-allow-overflow><span class="{P}-row"><span class="{P}-mask"><span class="{P}-hw">L’installation&nbsp;?</span></span></span><span class="{P}-row {P}-gold"><span class="{P}-mask"><span class="{P}-hw2">On</span></span> <span class="{P}-mask"><span class="{P}-hw2">s’en</span></span> <span class="{P}-mask"><span class="{P}-hw2">charge.</span></span></span></h1>
        <div id="{P}-rule"></div>
        <p id="{P}-line1" class="{P}-line"><span class="{P}-w">Une</span> <span class="{P}-w">plaque</span> <span class="{P}-w">en</span> <span class="{P}-w">métal</span> <span class="{P}-w">par</span> <span class="{P}-w">table,</span></p>
        <p id="{P}-line2" class="{P}-line"><span class="{P}-w">avec</span> <span class="{P}-w">son</span> <span class="{P}-w">QR</span> <span class="{P}-w">code.</span></p>
      </div>

      <!-- plaque métal dorée, avec son épaisseur -->
      <div id="{P}-plate3d">
        <div class="{P}-edge" style="background: {g['eng']}; transform: translateZ(-12px)"></div>
        <div class="{P}-edge" style="background: {g['dark']}; transform: translateZ(-8px)"></div>
        <div class="{P}-edge" style="background: {g['dark']}; transform: translateZ(-4px)"></div>
        {plate_html(P, "plate", [("fgold", "gold", False)], sticker=False, extra_style="left: 0; top: 0")}
      </div>
      <div id="{P}-glint" class="{P}-glint" style="opacity: 0"></div>

      <!-- planche d'autocollants -->
      <div id="{P}-liner">
        <div id="{P}-cut"></div>
        <div id="{P}-linertxt">À VOS TABLES · QR · TABLE 4</div>
      </div>
      {sticker_html(P, "stk")}
      <div id="{P}-ripple"></div>

      <!-- légendes -->
      <div id="{P}-hair1" class="{P}-hair"></div>
      <div id="{P}-lbl1" class="{P}-callout">PLAQUE MÉTAL</div>
      <div id="{P}-hair2" class="{P}-hair"></div>
      <div id="{P}-lbl2" class="{P}-callout">AUTOCOLLANT QR</div>
      <div id="{P}-lbl2b" class="{P}-callout">UNIQUE PAR TABLE</div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
  <script>
    (function () {{
      var ID = "{P}";
      function $(s) {{ return document.getElementById(ID + "-" + s); }}
      function $$(root, c) {{ return Array.prototype.slice.call(root.querySelectorAll('[class~="' + ID + "-" + c + '"]')); }}

      var GOLD = "{GOLD}", CREAM = "{CREAM}";
      var SX = {STK_OFF[0]}, SY = {STK_OFF[1]};
      var tl = gsap.timeline({{ paused: true }});

      // états de départ (hors timeline : déterministes)
      gsap.set($("plate-sheen"), {{ x: -260, skewX: -22 }});
      gsap.set($("liner"), {{ rotation: 6 }});
      gsap.set($("stk"), {{ x: SX, y: SY, rotation: 6 }});

      /* ---- rail : l'étiquette arrive sur 01 PLAQUE ---- */
      tl.fromTo($("tag"), {{ x: -100 }}, {{ x: 0, duration: 0.6, ease: "power3.out", force3D: false }}, 0);
      tl.fromTo($("tag"), {{ opacity: 0 }}, {{ opacity: 1, duration: 0.3, ease: "power1.out" }}, 0);
      tl.fromTo($("dot1"), {{ backgroundColor: CREAM }}, {{ backgroundColor: GOLD, duration: 0.15, ease: "power1.out" }}, 0.45);

      /* ---- « L'installation ? » (0.12) puis « On s'en charge. » (1.25) ---- */
      tl.fromTo($$($("head"), "hw"), {{ yPercent: 110 }}, {{ yPercent: 0, duration: 0.8, ease: "power3.out", force3D: false }}, 0.12);
      tl.fromTo($$($("head"), "hw2"), {{ yPercent: 110 }}, {{ yPercent: 0, duration: 0.7, ease: "power3.out", stagger: 0.1, force3D: false }}, 1.25);

      /* ---- la plaque bascule de la perspective à plat (0.25–1.4), un reflet la balaie ---- */
      tl.fromTo($("plate3d"), {{ rotationX: 68, rotationZ: -16, y: 170, scale: 0.78 }},
        {{ rotationX: 0, rotationZ: 0, y: 0, scale: 1, duration: 1.15, ease: "power3.out" }}, 0.25);
      tl.fromTo($("plate3d"), {{ opacity: 0 }}, {{ opacity: 1, duration: 0.3, ease: "power1.out" }}, 0.25);
      tl.fromTo($("plate-sheen"), {{ x: -260 }}, {{ x: 820, duration: 0.75, ease: "power2.inOut" }}, 1.05);

      tl.fromTo($("rule"), {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.5, ease: "power3.out", force3D: false }}, 2.3);

      /* ---- la planche d'autocollants entre en haut à droite (2.35) ---- */
      tl.fromTo($("liner"), {{ x: 600, y: -380, rotation: 18 }}, {{ x: 0, y: 0, rotation: 6, duration: 0.6, ease: "power3.out", force3D: false }}, 2.35);
      tl.fromTo($("stk"), {{ x: SX + 600, y: SY - 380, rotation: 18 }}, {{ x: SX, y: SY, rotation: 6, duration: 0.6, ease: "power3.out", force3D: false }}, 2.35);

      /* ---- le coin se décolle (3.0), l'autocollant se soulève (3.25), la planche repart (3.45) ---- */
      tl.fromTo($("stk"), {{ "--f": "0px" }}, {{ "--f": "54px", duration: 0.3, ease: "power2.out" }}, 3.0);
      tl.to($("stk"), {{ scale: 1.06, rotationY: -12, duration: 0.3, ease: "power2.out" }}, 3.25);
      tl.to($("liner"), {{ x: 520, y: -480, rotation: 26, duration: 0.5, ease: "power2.in", force3D: false }}, 3.45);

      /* ---- « Une plaque en métal par table, » (3.5) ---- */
      tl.fromTo($$($("line1"), "w"), {{ y: 28, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.55, ease: "power3.out", stagger: 0.06, force3D: false }}, 3.5);

      /* ---- vol jusqu'au-dessus de la plaque (3.55–4.55), incliné, coin encore relevé ---- */
      tl.to($("stk"), {{ x: 0, y: 0, rotation: 3, rotationX: 22, rotationY: 0, scale: 1.12, "--f": "30px", duration: 1.0, ease: "power3.inOut" }}, 3.55);

      // légende PLAQUE MÉTAL
      tl.fromTo($("hair1"), {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.3, ease: "power3.out", force3D: false }}, 3.75);
      tl.fromTo($("lbl1"), {{ x: -12, opacity: 0 }}, {{ x: 0, opacity: 1, duration: 0.33, ease: "power3.out", force3D: false }}, 3.82);

      /* ---- pression (4.6) sur « et son QR code », écrasement et onde ---- */
      tl.to($("stk"), {{ rotation: 0, rotationX: 0, scale: 1, "--f": "0px", duration: 0.2, ease: "power3.out" }}, 4.6);
      tl.to($("stk"), {{ scaleX: 1.02, scaleY: 0.975, duration: 0.08, ease: "power2.out" }}, 4.8);
      tl.to($("stk"), {{ scaleX: 1, scaleY: 1, duration: 0.14, ease: "power2.out" }}, 4.88);
      tl.fromTo($("ripple"), {{ scale: 1, opacity: 0.9 }}, {{ scale: 1.28, opacity: 0, duration: 0.55, ease: "power2.out", immediateRender: false }}, 4.8);
      tl.fromTo($$($("line2"), "w"), {{ y: 28, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.55, ease: "power3.out", stagger: 0.06, force3D: false }}, 4.62);

      // légende AUTOCOLLANT QR · UNIQUE PAR TABLE
      tl.fromTo($("hair2"), {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.35, ease: "power3.out", force3D: false }}, 4.95);
      tl.fromTo([$("lbl2"), $("lbl2b")], {{ x: -12, opacity: 0 }}, {{ x: 0, opacity: 1, duration: 0.33, ease: "power3.out", stagger: 0.08, force3D: false }}, 5.02);

      /* ---- second reflet + éclat (5.1–5.95) ---- */
      tl.fromTo($("plate-sheen"), {{ x: -260 }}, {{ x: 820, duration: 0.7, ease: "power2.inOut", immediateRender: false }}, 5.1);
      tl.fromTo($("glint"), {{ scale: 0, rotation: -12, opacity: 1 }}, {{ scale: 1, rotation: 6, duration: 0.22, ease: "power2.out" }}, 5.5);
      tl.to($("glint"), {{ scale: 0, rotation: 22, duration: 0.25, ease: "power2.in" }}, 5.72);

      /* ---- sortie de la copie et des légendes : seule la plaque reste pour le raccord avec 02b ---- */
      tl.to([$("head"), $("rule"), $("line1"), $("line2"), $("hair1"), $("lbl1"), $("hair2"), $("lbl2"), $("lbl2b")],
        {{ y: -18, opacity: 0, duration: 0.35, ease: "power2.in", force3D: false }}, 5.5);

      window.__timelines = window.__timelines || {{}};
      window.__timelines[ID] = tl;
    }})();
  </script>
</template>
"""
open(OUT, "w").write(html)
print("ok", OUT)
