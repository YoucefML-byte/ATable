# Story motion design « À vos tables » (1080 × 1920, 17 s) : écrit index.html.
# Cinq scènes calées sur la voix off (assets/audio/voix/textes.txt) :
#   A 0–3,45 le rush (crème) · B 3,45–6,55 le scan de la plaque (vert) · C 6,55–9,55 la commande sur le
#   téléphone (crème) · D 9,55–13,0 le ticket validé (vert) · E 13,0–17 la carte de fin et l'appel à la démo.
# Zones sûres Instagram : rien d'important au-dessus de 250 px ni sous 1560 px.
#   python3 gen_index.py chemin/vers/logo512.py
import importlib.util, os, sys

spec = importlib.util.spec_from_file_location("logo512", sys.argv[1])
L = importlib.util.module_from_spec(spec); spec.loader.exec_module(L)
DX, DY, DR = L.DOT
HERE = os.path.dirname(os.path.abspath(__file__))

TAGS = [  # (texte, x, y, rotation, doré)
    ("TABLE 7 — ATTEND 12 MIN", 90, 930, -6, False),
    ("TERRASSE 2 — ATTEND 9 MIN", 430, 1040, 4, False),
    ("BAR — ATTEND 6 MIN", 120, 1150, 3, False),
    ("TABLE 3 — « ON PEUT COMMANDER ? »", 160, 1270, -3, True),
    ("TABLE 12 — ATTEND 15 MIN", 470, 1390, -5, False),
    ("TABLE 5 — « L'ADDITION ? »", 100, 1480, 5, False),
]
tags_html = "\n".join(
    f'<div class="tag{" gold" if g else ""}" id="tag{i}" data-r="{r}" style="left:{x}px;top:{y}px">{t}</div>'
    for i, (t, x, y, r, g) in enumerate(TAGS))

def words(text, cls="w"):
    return " ".join(f'<span class="{cls}">{w}</span>' for w in text.split(" "))

def brand(dark):
    return (f'<div class="brand{" on-dark" if dark else ""}"><img src="assets/avostables-logo.svg" alt="">'
            f'<span>À VOS TABLES</span></div>')

HTML = f"""<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js" integrity="sha384-sG0Hv1tP1lZCk9KQmrIbY/XNwi+OY84GQqhMscbnsoBFqAz8KNCil1kvfL3Hbbk2" crossorigin="anonymous"></script>
    <style>
      @font-face {{ font-family: "Source Serif 4"; src: url("assets/fonts/SourceSerif4-400.woff2") format("woff2"); font-weight: 400; font-display: block; }}
      @font-face {{ font-family: "Source Serif 4"; src: url("assets/fonts/SourceSerif4-500.woff2") format("woff2"); font-weight: 500; font-display: block; }}
      @font-face {{ font-family: "Source Serif 4"; src: url("assets/fonts/SourceSerif4-600.woff2") format("woff2"); font-weight: 600; font-display: block; }}
      @font-face {{ font-family: "JetBrains Mono"; src: url("assets/fonts/JetBrainsMono-500.woff2") format("woff2"); font-weight: 500; font-display: block; }}
      @font-face {{ font-family: "JetBrains Mono"; src: url("assets/fonts/JetBrainsMono-700.woff2") format("woff2"); font-weight: 700; font-display: block; }}
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: 1080px; height: 1920px; overflow: hidden; background: #000; }}
      #root {{ position: relative; width: 1080px; height: 1920px; overflow: hidden; background: #F4EFE6; }}
      .scene {{ position: absolute; inset: 0; overflow: hidden; }}
      .cream {{ background: #F4EFE6; color: #1F4D3A; }}
      .green {{ background: radial-gradient(120% 75% at 50% 40%, #24573F 0%, #1F4D3A 55%, #173B2D 100%); color: #F4EFE6; }}
      .w {{ display: inline-block; }}
      .g {{ color: #E0A33A; }}
      .gd {{ color: #B9822A; }}
      .brand {{ position: absolute; left: 80px; top: 258px; display: flex; align-items: center; gap: 16px;
        font: 700 22px/1 "JetBrains Mono"; letter-spacing: 0.18em; color: #0C1613; }}
      .brand img {{ width: 52px; height: 52px; display: block; }}
      .brand.on-dark {{ color: #F4EFE6; }}
      .title {{ position: absolute; left: 80px; right: 80px; font-family: "Source Serif 4"; font-weight: 500;
        letter-spacing: -0.02em; line-height: 1.04; }}
      .line {{ display: block; white-space: nowrap; }}

      /* ---------- A : le rush ---------- */
      #aLabel {{ position: absolute; left: 0; right: 0; top: 410px; text-align: center;
        font: 700 26px/1 "JetBrains Mono"; letter-spacing: 0.22em; color: #1F4D3A; }}
      #aTitle {{ top: 462px; text-align: center; font-size: 128px; color: #1F4D3A; }}
      #aSub {{ top: 630px; text-align: center; font-weight: 400; font-size: 74px; line-height: 1.12; color: #0C1613; }}
      .tag {{ position: absolute; height: 64px; padding: 0 22px; display: flex; align-items: center; white-space: nowrap;
        background: #E7DCC6; border: 3px solid #0C1613; border-radius: 10px;
        font: 700 27px/1 "JetBrains Mono"; letter-spacing: 0.06em; color: #0C1613; }}
      .tag.gold {{ background: #E0A33A; }}
      #aWipe {{ position: absolute; inset: 0; background: radial-gradient(120% 75% at 50% 40%, #24573F 0%, #1F4D3A 55%, #173B2D 100%); clip-path: inset(100% 0 0 0); }}

      /* ---------- B : le scan ---------- */
      #bTitle {{ top: 400px; font-size: 124px; }}
      #bPlateWrap {{ position: absolute; left: 106px; top: 770px; width: 868px; height: 558px; }}
      #bStage {{ position: absolute; inset: 0; transform-origin: 540px 1016px; }}
      .plate {{ position: absolute; left: 0; top: 0; width: 560px; height: 360px; transform-origin: 0 0; }}
      .pclip {{ position: absolute; inset: 0; border-radius: 26px; overflow: hidden; }}
      .fbase {{ position: absolute; inset: 0; border: 10px solid; border-color: #F2D893 #A9832F #A9832F #F2D893;
        border-radius: 26px; background: #D6AE57; }}
      .facet {{ position: absolute; left: 10px; top: 10px; width: 540px; height: 340px; }}
      .f1 {{ clip-path: polygon(9% 0, 27% 0, 12% 100%, -6% 100%); background: #E4C373; }}
      .f2 {{ clip-path: polygon(31% 0, 34% 0, 19% 100%, 16% 100%); background: #F2D893; }}
      .f3 {{ clip-path: polygon(80% 0, 100% 0, 100% 100%, 66% 100%); background: #C79E48; }}
      .screw {{ position: absolute; top: 171px; width: 18px; height: 18px; border: 2px solid #584313; border-radius: 50%; background: #E4C373; }}
      .eng {{ position: absolute; left: 0; right: 0; top: 302px; height: 20px; line-height: 20px; text-align: center;
        font: 700 14px/20px "JetBrains Mono"; letter-spacing: 0.42em; padding-left: 0.42em; color: #584313; }}
      .pol {{ position: absolute; inset: 0; border: 2px solid #0C1613; border-radius: 26px; }}
      .stk {{ position: absolute; left: 170px; top: 34px; width: 220px; height: 250px; background: #F4EFE6;
        border: 2px solid #0C1613; border-radius: 14px; }}
      .stk img {{ position: absolute; left: 21px; top: 16px; width: 174px; height: 174px; display: block; }}
      .stk div {{ position: absolute; left: 0; right: 0; top: 200px; height: 30px; display: flex; align-items: center;
        justify-content: center; font: 700 18px/1 "JetBrains Mono"; letter-spacing: 0.12em; color: #0C1613; }}
      #bSheen {{ position: absolute; left: -160px; top: -60px; width: 110px; height: 480px; background: #FFFDF6; opacity: 0.5; transform: rotate(18deg); }}
      .corner {{ position: absolute; width: 74px; height: 74px; border: 0 solid #F4EFE6; }}
      #c1 {{ left: -26px; top: -26px; border-width: 10px 0 0 10px; border-top-left-radius: 14px; }}
      #c2 {{ right: -26px; top: -26px; border-width: 10px 10px 0 0; border-top-right-radius: 14px; }}
      #c3 {{ left: -26px; bottom: -26px; border-width: 0 0 10px 10px; border-bottom-left-radius: 14px; }}
      #c4 {{ right: -26px; bottom: -26px; border-width: 0 10px 10px 0; border-bottom-right-radius: 14px; }}
      #bBrackets {{ position: absolute; left: 263px; top: 52px; width: 342px; height: 388px; }}
      #bScan {{ position: absolute; left: 18px; right: 18px; top: 0; height: 8px; border-radius: 4px; background: #E0A33A;
        box-shadow: 0 0 24px 6px rgba(224, 163, 58, 0.55); opacity: 0; }}
      #bPill {{ position: absolute; left: 0; right: 0; top: 1392px; display: flex; justify-content: center; }}
      #bPill div {{ height: 76px; padding: 0 34px 0 28px; display: flex; align-items: center; gap: 16px; background: #F4EFE6;
        border: 3px solid #0C1613; border-radius: 38px; font: 700 28px/1 "JetBrains Mono"; color: #0C1613; }}
      #bPill i {{ width: 22px; height: 22px; border-radius: 50%; background: #2E9E6A; display: block; }}

      /* ---------- C : le téléphone ---------- */
      #cTitle {{ top: 384px; font-size: 84px; color: #1F4D3A; }}
      #cPhone {{ position: absolute; left: 256px; top: 604px; width: 568px; height: 950px; background: #0C1613;
        border-radius: 70px; padding: 22px 20px; box-shadow: 0 30px 60px rgba(12, 22, 19, 0.25); }}
      #cScreen {{ position: relative; width: 528px; height: 906px; border-radius: 50px; overflow: hidden; background: #fff; }}
      #cScreen img {{ position: absolute; left: 0; top: 0; width: 528px; height: 899px; display: block; }}
      #cNotch {{ position: absolute; left: 50%; top: 34px; width: 150px; height: 34px; margin-left: -75px; border-radius: 17px; background: #0C1613; }}
      .tap {{ position: absolute; width: 90px; height: 90px; margin: -45px 0 0 -45px; border-radius: 50%;
        border: 6px solid #E0A33A; background: rgba(224, 163, 58, 0.25); opacity: 0; }}

      /* ---------- D : le ticket ---------- */
      #dTitle {{ top: 384px; font-size: 92px; }}
      #dSlot {{ position: absolute; left: 230px; top: 742px; width: 620px; height: 30px; border-radius: 15px; background: #0C1613; z-index: 3; }}
      #dMask {{ position: absolute; left: 270px; top: 756px; width: 540px; height: 680px; overflow: hidden; }}
      #dTicket {{ position: absolute; left: 10px; top: 0; width: 520px; height: 640px; }}
      #dPaper {{ position: absolute; inset: 0 0 14px 0; background: #E7DCC6; padding: 52px 44px 0; color: #0C1613;
        font-family: "JetBrains Mono"; }}
      #dEdge {{ position: absolute; left: 0; bottom: 0; width: 520px; height: 14px; }}
      .tk1 {{ font: 700 30px/1 "JetBrains Mono"; letter-spacing: 0.2em; text-align: center; }}
      .tkr {{ border-top: 3px dashed #8C7A57; margin: 26px 0; }}
      .tk2 {{ font: 700 58px/1 "JetBrains Mono"; letter-spacing: 0.06em; text-align: center; }}
      .tk3 {{ font: 500 24px/1 "JetBrains Mono"; letter-spacing: 0.12em; text-align: center; margin-top: 14px; }}
      .tk4 {{ font: 500 27px/1.55 "JetBrains Mono"; letter-spacing: 0.04em; }}
      #dStamp {{ position: absolute; left: 330px; top: 1200px; width: 420px; height: 116px; border: 8px solid #E0A33A;
        border-radius: 18px; display: flex; align-items: center; justify-content: center; gap: 14px;
        font: 700 52px/1 "JetBrains Mono"; letter-spacing: 0.12em; color: #E0A33A; background: rgba(23, 59, 45, 0.92);
        transform: rotate(-9deg); opacity: 0; z-index: 4; }}
      #dRing {{ position: absolute; left: 540px; top: 1258px; width: 40px; height: 40px; margin: -20px 0 0 -20px;
        border: 6px solid #F4EFE6; border-radius: 50%; opacity: 0; z-index: 4; }}

      /* ---------- E : fin ---------- */
      #eMark {{ position: absolute; left: 390px; top: 470px; width: 300px; height: 300px; }}
      #eMark svg {{ display: block; width: 100%; height: 100%; overflow: visible; }}
      #eWord {{ position: absolute; left: 0; right: 0; top: 820px; text-align: center; font: 500 132px/1 "Source Serif 4";
        letter-spacing: -0.02em; color: #F4EFE6; }}
      .eLine {{ position: absolute; left: 0; right: 0; text-align: center; font: 500 72px/1.1 "Source Serif 4"; letter-spacing: -0.015em; }}
      #eL1 {{ top: 1030px; color: #F4EFE6; }}
      #eL2 {{ top: 1114px; color: #E0A33A; }}
      #eMono {{ position: absolute; left: 0; right: 0; top: 1262px; text-align: center; font: 500 24px/1 "JetBrains Mono";
        letter-spacing: 0.16em; color: #F4EFE6; opacity: 0.85; }}
      #eCta {{ position: absolute; left: 0; right: 0; top: 1470px; text-align: center; font: 700 28px/1 "JetBrains Mono";
        letter-spacing: 0.18em; color: #E0A33A; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="17" data-width="1080" data-height="1920">

      <!-- A · le rush -->
      <div id="sA" class="scene cream clip" data-start="0" data-duration="3.9" data-track-index="0">
        {brand(False)}
        <div id="aLabel">VENDREDI · 20:30</div>
        <div id="aTitle" class="title"><span class="line">{words("Vendredi soir.")}</span></div>
        <div id="aSub" class="title"><span class="line">{words("Tout le monde")}</span><span class="line">{words("vous fait signe.")}</span></div>
        <div id="aTags">{tags_html}</div>
        <div id="aWipe"></div>
      </div>

      <!-- B · un scan -->
      <div id="sB" class="scene green clip" data-start="3.45" data-duration="3.5" data-track-index="1">
        <div id="bStage">
          {brand(True)}
          <div id="bTitle" class="title"><span class="line">{words("Et si")} <span class="w g">un</span> <span class="w g">scan</span></span><span class="line">{words("suffisait ?")}</span></div>
          <div id="bPlateWrap">
            <div class="plate" style="transform: scale(1.55)">
              <div class="pclip"><div class="fbase"></div><div class="facet f1"></div><div class="facet f2"></div><div class="facet f3"></div>
                <div class="screw" style="left: 26px"></div><div class="screw" style="left: 516px"></div>
                <div class="eng">À VOS TABLES</div><div id="bSheen"></div></div>
              <div class="pol"></div>
              <div class="stk"><img src="assets/table-qr.svg" alt=""><div>TABLE 4</div></div>
            </div>
            <div id="bBrackets"><div class="corner" id="c1"></div><div class="corner" id="c2"></div><div class="corner" id="c3"></div><div class="corner" id="c4"></div><div id="bScan"></div></div>
          </div>
          <div id="bPill"><div><i></i>À vos tables · Table 4</div></div>
        </div>
      </div>

      <!-- C · la commande -->
      <div id="sC" class="scene cream clip" data-start="6.45" data-duration="3.6" data-track-index="2">
        {brand(False)}
        <div id="cTitle" class="title"><span class="line">{words("La carte s'ouvre,")}</span><span class="line">{words("votre client")} <span class="w gd">commande.</span></span></div>
        <div id="cPhone"><div id="cScreen">
          <img id="cImg0" src="assets/client-carte.png" alt="">
          <img id="cImg1" src="assets/client-produit.png" alt="">
          <img id="cImg2" src="assets/client-panier.png" alt="">
          <img id="cImg3" src="assets/client-confirmation.png" alt="">
          <div class="tap" id="tap0" style="left: 475px; top: 470px"></div>
          <div class="tap" id="tap1" style="left: 352px; top: 844px"></div>
          <div class="tap" id="tap2" style="left: 264px; top: 844px"></div>
          <div id="cNotch"></div>
        </div></div>
      </div>

      <!-- D · le ticket -->
      <div id="sD" class="scene green clip" data-start="9.55" data-duration="3.75" data-track-index="3">
        <div id="dHead">{brand(True)}
          <div id="dTitle" class="title"><span class="line">{words("En salle,")}</span><span class="line">{words("la commande arrive.")}</span><span class="line g">{words("Validée d'un geste.")}</span></div></div>
        <div id="dSlot"></div>
        <div id="dMask"><div id="dTicket">
          <div id="dPaper">
            <div class="tk1">À VOS TABLES</div><div class="tkr"></div>
            <div class="tk2">TABLE 4</div><div class="tk3">COMMANDE N° 001</div><div class="tkr"></div>
            <div class="tk4">1 × TACOS 2 VIANDES<br>1 × LIMONADE<br>NOTE : SAUCE À PART SVP</div>
          </div>
          <svg id="dEdge" viewBox="0 0 520 14" preserveAspectRatio="none" aria-hidden="true"><path fill="#E7DCC6" d="M0 0H520V2{''.join(f'L{520 - 10 * (k + 1) + 5} 14L{520 - 10 * (k + 1)} 2' for k in range(52))}Z"/></svg>
        </div></div>
        <div id="dStamp">VALIDÉE ✓</div>
        <div id="dRing"></div>
      </div>

      <!-- E · fin -->
      <div id="sE" class="scene green clip" data-start="12.95" data-duration="4.05" data-track-index="4">
        <div id="eMark"><svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-label="À vos tables">
          <rect id="eTile" width="512" height="512" rx="112" fill="{L.GREEN}" />
          <path id="eLetter" d="{L.LETTER}" fill="{L.CREAM}" fill-rule="evenodd" stroke="{L.CREAM}" stroke-width="7" stroke-linejoin="round" />
          <path id="eAccent" d="{L.ACCENT}" fill="{L.CREAM}" />
          <circle id="eDot" cx="{DX:.1f}" cy="{DY:.1f}" r="{DR:.1f}" fill="{L.GOLD}" />
        </svg></div>
        <div id="eWord">À vos tables</div>
        <div id="eL1" class="eLine">{words("Vos clients commandent.")}</div>
        <div id="eL2" class="eLine">{words("Votre équipe sert.")}</div>
        <div id="eMono">QR CODE · NFC · PAIEMENT AU COMPTOIR</div>
        <div id="eCta">↓ DEMANDEZ VOTRE DÉMO ↓</div>
      </div>

      <audio id="el-audio" src="assets/audio/story-mix.wav" data-start="0" data-duration="17" data-track-index="10" data-volume="1"></audio>
    </div>

    <script>
      (function () {{
        var tl = gsap.timeline({{ paused: true }});
        var $ = function (s) {{ return document.querySelector(s); }};
        var $$ = function (s) {{ return Array.prototype.slice.call(document.querySelectorAll(s)); }};
        function rise(sel, t, step) {{
          $$(sel).forEach(function (el, k) {{
            tl.fromTo(el, {{ y: 44, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.42, ease: "power3.out" }}, t + k * (step || 0.07));
          }});
        }}

        // ---------- A · le rush (voix : « Vendredi soir. » 0,40 · « Tout le monde vous fait signe. » 1,76)
        tl.fromTo("#sA .brand", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.3 }}, 0.05);
        tl.fromTo("#aLabel", {{ opacity: 0, y: 16 }}, {{ opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }}, 0.12);
        rise("#aTitle .w", 0.36, 0.1);
        rise("#aSub .w", 1.72, 0.07);
        $$(".tag").forEach(function (el, k) {{
          var r = +el.dataset.r;
          tl.fromTo(el, {{ y: -260, opacity: 0, rotation: r - 12 }}, {{ y: 0, opacity: 1, rotation: r, duration: 0.5, ease: "back.out(1.7)" }}, 0.95 + k * 0.24);
        }});
        // l'équipe est débordée : les étiquettes s'agitent
        tl.to(".tag", {{ x: 7, duration: 0.05, yoyo: true, repeat: 9, ease: "none", stagger: 0.02 }}, 2.62);
        tl.fromTo("#aWipe", {{ clipPath: "inset(100% 0% 0% 0%)" }}, {{ clipPath: "inset(0% 0% 0% 0%)", duration: 0.42, ease: "power3.inOut" }}, 3.05);

        // ---------- B · le scan (voix : « Et si un scan suffisait ? » 3,70)
        tl.fromTo("#sB .brand", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.25 }}, 3.5);
        rise("#bTitle .w", 3.62, 0.09);
        tl.fromTo("#bPlateWrap", {{ y: 520, rotation: -9, scale: 0.84, opacity: 0 }}, {{ y: 0, rotation: 0, scale: 1, opacity: 1, duration: 0.7, ease: "back.out(1.25)" }}, 3.86);
        tl.fromTo("#bBrackets", {{ scale: 1.18, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.3, ease: "power3.out" }}, 4.6);
        tl.fromTo("#bScan", {{ opacity: 0, y: 6 }}, {{ opacity: 1, duration: 0.08 }}, 4.78);
        tl.fromTo("#bScan", {{ y: 6 }}, {{ y: 372, duration: 0.6, ease: "power1.inOut", immediateRender: false }}, 4.8);
        tl.to("#bScan", {{ opacity: 0, duration: 0.1 }}, 5.4);
        tl.to(".corner", {{ borderColor: "#E0A33A", duration: 0.12 }}, 5.42);
        tl.fromTo("#bBrackets", {{ scale: 1 }}, {{ scale: 0.94, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }}, 5.42);
        tl.fromTo("#bSheen", {{ x: 0 }}, {{ x: 1100, duration: 0.6, ease: "power2.inOut" }}, 5.45);
        tl.fromTo("#bPill div", {{ scale: 0, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.42, ease: "back.out(2)" }}, 5.55);
        // on « entre » dans le QR code : le décor s'agrandit vers l'autocollant, la scène suivante apparaît
        tl.to("#bStage", {{ scale: 3.4, opacity: 0, duration: 0.45, ease: "power3.in" }}, 6.42);

        // ---------- C · la commande (voix : « La carte s'ouvre, » 6,75 · « votre client commande. » 7,94)
        tl.fromTo("#sC", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.3, ease: "power1.out" }}, 6.5);
        tl.fromTo("#sC .brand", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.25 }}, 6.6);
        rise("#cTitle .line:nth-child(1) .w", 6.7, 0.08);
        rise("#cTitle .line:nth-child(2) .w", 7.9, 0.09);
        tl.fromTo("#cPhone", {{ y: 520, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }}, 6.62);
        tl.fromTo("#cImg0", {{ y: 40 }}, {{ y: 0, duration: 0.6, ease: "power2.out" }}, 6.7);
        function tap(sel, t) {{
          tl.fromTo(sel, {{ scale: 0.3, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.14, ease: "power2.out" }}, t);
          tl.to(sel, {{ scale: 1.5, opacity: 0, duration: 0.3, ease: "power1.out" }}, t + 0.16);
        }}
        function slideIn(sel, t) {{ tl.fromTo(sel, {{ x: 528 }}, {{ x: 0, duration: 0.32, ease: "power3.out" }}, t); }}
        tap("#tap0", 7.5); slideIn("#cImg1", 7.72);
        tap("#tap1", 8.22); slideIn("#cImg2", 8.42);
        tap("#tap2", 8.86); slideIn("#cImg3", 9.04);
        tl.to("#sC", {{ x: -1080, duration: 0.45, ease: "power3.inOut" }}, 9.55);

        // ---------- D · le ticket (voix : « En salle, » 9,75 · « la commande arrive. » 10,49 · « Validée d'un geste. » 11,82)
        tl.fromTo("#sD", {{ x: 1080 }}, {{ x: 0, duration: 0.45, ease: "power3.inOut" }}, 9.55);
        rise("#dTitle .line:nth-child(1) .w", 9.72, 0.08);
        rise("#dTitle .line:nth-child(2) .w", 10.45, 0.08);
        rise("#dTitle .line:nth-child(3) .w", 11.78, 0.08);
        // le ticket sort de l'imprimante par à-coups
        var FEED = [[10.05, 130], [10.3, 300], [10.55, 430], [10.8, 560], [11.0, 640]];
        var prev = 0;
        FEED.forEach(function (f, i) {{
          tl.fromTo("#dTicket", {{ y: prev - 640 }}, {{ y: f[1] - 640, duration: 0.16, ease: "power2.out", immediateRender: i === 0 }}, f[0]);
          prev = f[1];
        }});
        tl.fromTo("#dStamp", {{ scale: 2.3, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.2, ease: "power4.in" }}, 11.84);
        tl.fromTo("#dTicket", {{ x: 0 }}, {{ x: 8, duration: 0.05, yoyo: true, repeat: 3, ease: "none", immediateRender: false }}, 12.04);
        tl.fromTo("#dRing", {{ scale: 1, opacity: 0.9 }}, {{ scale: 9, opacity: 0, duration: 0.6, ease: "power2.out", immediateRender: false }}, 12.04);
        tl.to(["#dMask", "#dStamp", "#dSlot"], {{ y: "-=1300", rotation: 5, duration: 0.5, ease: "power3.in" }}, 12.62);
        tl.to("#dHead", {{ opacity: 0, y: -40, duration: 0.35, ease: "power2.in" }}, 12.7);

        // ---------- E · fin (voix : « À vos tables. » 13,25 · « Vos clients commandent, » 14,38 · « votre équipe sert. » 15,56)
        tl.fromTo("#sE", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.2 }}, 12.95);
        var letter = $("#eLetter"), len = letter.getTotalLength();
        letter.style.strokeDasharray = len + " " + (len + 80);
        tl.fromTo("#eTile", {{ scale: 0.84, opacity: 0, svgOrigin: "256 256" }}, {{ scale: 1, opacity: 1, svgOrigin: "256 256", duration: 0.32, ease: "power3.out" }}, 13.05);
        tl.fromTo(letter, {{ strokeDashoffset: len + 40, fillOpacity: 0 }}, {{ strokeDashoffset: 0, duration: 0.36, ease: "power2.out" }}, 13.1);
        tl.fromTo(letter, {{ fillOpacity: 0, strokeOpacity: 1 }}, {{ fillOpacity: 1, strokeOpacity: 0, duration: 0.2, ease: "power1.out", immediateRender: false }}, 13.34);
        tl.fromTo("#eAccent", {{ y: -70, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.3, ease: "power3.out" }}, 13.42);
        tl.fromTo("#eDot", {{ scale: 0, svgOrigin: "{DX:.1f} {DY:.1f}" }}, {{ scale: 1, svgOrigin: "{DX:.1f} {DY:.1f}", duration: 0.34, ease: "back.out(2)" }}, 13.5);
        tl.fromTo("#eWord", {{ y: 40, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }}, 13.3);
        rise("#eL1 .w", 14.34, 0.08);
        rise("#eL2 .w", 15.52, 0.08);
        tl.fromTo("#eMono", {{ opacity: 0 }}, {{ opacity: 0.85, duration: 0.4 }}, 15.95);
        tl.fromTo("#eCta", {{ y: 20, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }}, 16.2);
        tl.to({{}}, {{ duration: 17 }}, 0);
        window.__timelines = window.__timelines || {{}};
        window.__timelines["main"] = tl;
      }})();
    </script>
  </body>
</html>
"""
open(os.path.join(HERE, "index.html"), "w").write(HTML)
print("ok")
