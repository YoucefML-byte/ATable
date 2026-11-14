# Reel 1 « Une appli ? Non merci » (1080 × 1920, 28,5 s) : écrit index.html à partir du script plan par plan.
# Les repères suivent la voix off (timeline.json : début de chaque phrase).
# Zones sûres Reels : texte important entre 250 et 1450 px (la légende et les boutons couvrent le bas).
#   python3 gen_reel1.py chemin/vers/logo512.py
import importlib.util, json, os, re, sys

spec = importlib.util.spec_from_file_location("logo512", sys.argv[1])
L = importlib.util.module_from_spec(spec); spec.loader.exec_module(L)
DX, DY, DR = L.DOT
_n = [float(v) for v in re.findall(r"-?\d+\.?\d*", L.LETTER)]
LCX, LCY = (min(_n[0::2]) + max(_n[0::2])) / 2, (min(_n[1::2]) + max(_n[1::2])) / 2
HERE = os.path.dirname(os.path.abspath(__file__))
B = [o["on"] for o in json.load(open(os.path.join(HERE, "timeline.json")))]   # 11 repères
DUR = 28.5

LABELS = ["PAS D'APPLI, MERCI", "ILS ONT RAISON", "RIEN À TÉLÉCHARGER", "1 PLAQUE EN MÉTAL", "QR CODE", "IL SCANNE",
          "DANS LE NAVIGATEUR", "IL COMMANDE", "DIRECT EN CUISINE", "IL PAIE COMME D'HABITUDE", "COMMENTEZ DEMO"]

# plan de salle : 6 tables (2 colonnes × 3 rangées), la table 4 en bas à gauche
TABLES = [(1, 230, 640), (2, 610, 640), (3, 230, 900), (5, 610, 900), (4, 230, 1160), (6, 610, 1160)]
def table(num, x, y):
    ch = "".join(f'<div class="ch" style="left:{x + dx}px;top:{y + dy}px"></div>'
                 for dx, dy in [(40, -34), (150, -34), (40, 154), (150, 154)])
    return ch + f'<div class="tb" id="tb{num}" style="left:{x}px;top:{y}px"><span>{num}</span></div>'
plan_tables = "".join(table(*t) for t in TABLES)
GUESTS = [(250, 610, "#E0A33A"), (420, 612, "#D9A79A"), (640, 610, "#C9CDD2"), (790, 612, "#E0A33A"),
          (260, 1070, "#D9A79A"), (410, 1068, "#E0A33A"), (650, 1072, "#E0A33A"), (800, 1070, "#C9CDD2"),
          (250, 1330, "#C9CDD2"), (420, 1332, "#E0A33A"), (640, 1330, "#D9A79A")]
guests = "".join(f'<i class="gu" style="left:{x}px;top:{y}px;background:{c}"></i>' for x, y, c in GUESTS)
QMARKS = [(330, 545), (710, 545), (710, 805), (330, 805), (710, 1065)]
qmarks = "".join(f'<div class="qm" style="left:{x}px;top:{y}px">?</div>' for x, y in QMARKS)

FONTS = "".join(
    f'@font-face {{ font-family: "{fam}"; src: url("assets/fonts/{f}") format("{fmt}"); font-weight: {w}; font-display: block; }}\n'
    for fam, f, fmt, w in [("Source Serif 4", "SourceSerif4-500.woff2", "woff2", 500), ("Source Serif 4", "SourceSerif4-600.woff2", "woff2", 600),
                           ("JetBrains Mono", "JetBrainsMono-700.woff2", "woff2", 700), ("Inter", "Inter-ExtraBold.otf", "opentype", 800)])

pills = "".join(f'<div class="lab" id="lab{k}"><span>{t}</span></div>' for k, t in enumerate(LABELS))

HTML = f"""<!doctype html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js" integrity="sha384-sG0Hv1tP1lZCk9KQmrIbY/XNwi+OY84GQqhMscbnsoBFqAz8KNCil1kvfL3Hbbk2" crossorigin="anonymous"></script>
<style>
{FONTS}
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
html, body {{ width: 1080px; height: 1920px; overflow: hidden; background: #000; }}
#root {{ position: relative; width: 1080px; height: 1920px; overflow: hidden;
  background: radial-gradient(120% 75% at 50% 42%, #24573F 0%, #1F4D3A 55%, #173B2D 100%); }}
.layer {{ position: absolute; inset: 0; }}
/* étiquette « à l'écran » : pastille sombre, grandes capitales */
.lab {{ position: absolute; left: 0; right: 0; top: 300px; display: flex; justify-content: center; opacity: 0; z-index: 20; }}
.lab span {{ background: #0C1613; color: #F4EFE6; font: 800 54px/1 "Inter"; letter-spacing: -0.01em; padding: 26px 34px 24px;
  border-radius: 14px; white-space: nowrap; box-shadow: 0 10px 30px rgba(0,0,0,.25); }}
#hook {{ position: absolute; left: 0; right: 0; top: 300px; display: flex; justify-content: center; z-index: 21; }}
#hook span {{ background: #0C1613; color: #F4EFE6; font: 800 76px/1 "Inter"; padding: 34px 40px 30px; border-radius: 18px;
  box-shadow: 0 14px 40px rgba(0,0,0,.3); }}
/* plan de salle */
#plan {{ transform-origin: 350px 1235px; }}
.tb {{ position: absolute; width: 240px; height: 150px; background: #E7DCC6; border: 4px solid #0C1613; border-radius: 16px; }}
.tb span {{ position: absolute; left: 14px; top: 10px; font: 700 26px/1 "JetBrains Mono"; color: #1F4D3A; }}
#tb4 {{ background: #F4EFE6; }}
.ch {{ position: absolute; width: 52px; height: 30px; background: #0F2A20; border-radius: 8px; }}
.gu {{ position: absolute; width: 44px; height: 44px; border-radius: 50%; border: 4px solid #0C1613; }}
.qm {{ position: absolute; width: 74px; height: 74px; margin-left: -37px; border-radius: 50%; background: #F4EFE6; border: 4px solid #0C1613;
  font: 600 52px/66px "Source Serif 4"; text-align: center; color: #1F4D3A; }}
#bubble {{ position: absolute; left: 150px; top: 960px; width: 580px; height: 140px; z-index: 5; transform-origin: 100px 150px; }}
#bubble .bx {{ position: absolute; inset: 0 0 26px 0; background: #F4EFE6; border: 5px solid #0C1613; border-radius: 30px;
  display: flex; align-items: center; gap: 22px; padding: 0 30px; font: 600 46px/1 "Source Serif 4"; color: #0C1613; white-space: nowrap; }}
#bubble .tail {{ position: absolute; left: 70px; bottom: 0; width: 44px; height: 44px; background: #F4EFE6; border-right: 5px solid #0C1613;
  border-bottom: 5px solid #0C1613; transform: rotate(45deg); }}
#dl {{ width: 56px; height: 56px; flex: none; overflow: visible; }}
#dlx {{ position: absolute; left: 22px; top: 26px; width: 70px; height: 70px; overflow: visible; }}
#server {{ position: absolute; left: 930px; top: 1440px; width: 90px; height: 90px; z-index: 6; opacity: 0; }}
#server .bd {{ position: absolute; inset: 0; border-radius: 50%; background: #0C1613; border: 6px solid #F4EFE6; }}
#server .tray {{ position: absolute; left: 50px; top: -26px; width: 70px; height: 70px; border-radius: 50%; background: #E0A33A; border: 4px solid #0C1613; }}
.dish {{ position: absolute; width: 58px; height: 58px; border-radius: 50%; background: #FFFFFF; border: 6px solid #E0A33A; z-index: 4; }}
/* logo */
#logoL {{ display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(12,22,19,.55); }}
#lgMark {{ width: 320px; height: 320px; }}
#lgMark svg {{ display: block; width: 100%; height: 100%; overflow: visible; }}
#lgWord {{ margin-top: 30px; font: 600 120px/1 "Source Serif 4"; letter-spacing: -0.02em; color: #F4EFE6; }}
#lgTag {{ margin-top: 40px; background: #E0A33A; color: #0C1613; font: 800 46px/1 "Inter"; padding: 22px 34px; border-radius: 60px; }}
/* gros plan de la table et de la plaque */
#closeL {{ background: radial-gradient(90% 70% at 50% 45%, #5A3A22 0%, #3F2817 60%, #2C1C10 100%); }}
#wood {{ position: absolute; inset: 0; opacity: .18;
  background: repeating-linear-gradient(98deg, #000 0 3px, transparent 3px 46px), repeating-linear-gradient(97deg, #fff 0 1px, transparent 1px 23px); }}
#plate {{ position: absolute; left: 150px; top: 760px; width: 780px; height: 500px; }}
.pclip {{ position: absolute; inset: 0; border-radius: 34px; overflow: hidden; }}
.fbase {{ position: absolute; inset: 0; border: 14px solid; border-color: #F2D893 #A9832F #A9832F #F2D893; border-radius: 34px; background: #D6AE57; }}
.facet {{ position: absolute; left: 14px; top: 14px; right: 14px; bottom: 14px; }}
.f1 {{ clip-path: polygon(9% 0,27% 0,12% 100%,-6% 100%); background: #E4C373; }} .f2 {{ clip-path: polygon(31% 0,34% 0,19% 100%,16% 100%); background: #F2D893; }}
.f3 {{ clip-path: polygon(80% 0,100% 0,100% 100%,66% 100%); background: #C79E48; }}
.pol {{ position: absolute; inset: 0; border: 3px solid #0C1613; border-radius: 34px; }}
.screw {{ position: absolute; top: 238px; width: 25px; height: 25px; border: 3px solid #584313; border-radius: 50%; background: #E4C373; }}
.eng {{ position: absolute; left: 0; right: 0; top: 430px; text-align: center; font: 700 19px/1 "JetBrains Mono"; letter-spacing: .4em; color: #584313; }}
#stk {{ position: absolute; left: 238px; top: 44px; width: 304px; height: 346px; background: #F4EFE6; border: 3px solid #0C1613; border-radius: 18px; }}
#stk img {{ position: absolute; left: 30px; top: 22px; width: 240px; height: 240px; }}
#stk div {{ position: absolute; left: 0; right: 0; top: 278px; text-align: center; font: 700 26px/1 "JetBrains Mono"; letter-spacing: .12em; color: #0C1613; }}
#glow {{ position: absolute; left: 238px; top: 44px; width: 304px; height: 346px; border-radius: 22px; border: 8px solid #E0A33A;
  box-shadow: 0 0 40px 10px rgba(224,163,58,.7); opacity: 0; }}
/* téléphone */
#phone {{ position: absolute; left: 290px; top: 1960px; width: 500px; height: 960px; background: #0C1613; border-radius: 68px; padding: 20px;
  box-shadow: 0 30px 70px rgba(0,0,0,.45); z-index: 8; }}
#scr {{ position: relative; width: 460px; height: 920px; border-radius: 50px; overflow: hidden; background: #F4EFE6; }}
#cam {{ position: absolute; inset: 0; background: radial-gradient(80% 60% at 50% 45%, #6A4A2C, #2C1C10); }}
#camPlate {{ position: absolute; left: 50px; top: 260px; width: 360px; height: 231px; border-radius: 18px; background: #D6AE57; border: 3px solid #0C1613; }}
#camPlate i {{ position: absolute; left: 110px; top: 18px; width: 140px; height: 160px; background: #F4EFE6; border-radius: 10px; }}
#camPlate img {{ position: absolute; left: 124px; top: 28px; width: 112px; height: 112px; }}
.bk {{ position: absolute; width: 70px; height: 70px; border: 0 solid #F4EFE6; }}
#bk1 {{ left: 140px; top: 255px; border-width: 9px 0 0 9px; }} #bk2 {{ left: 250px; top: 255px; border-width: 9px 9px 0 0; }}
#bk3 {{ left: 140px; top: 395px; border-width: 0 0 9px 9px; }} #bk4 {{ left: 250px; top: 395px; border-width: 0 9px 9px 0; }}
#scanL {{ position: absolute; left: 150px; top: 270px; width: 160px; height: 6px; background: #E0A33A; box-shadow: 0 0 16px 4px rgba(224,163,58,.7); opacity: 0; }}
#web {{ position: absolute; inset: 0; background: #FFFFFF; opacity: 0; }}
#bar {{ position: absolute; left: 0; right: 0; top: 0; height: 104px; background: #F1F1F1; border-bottom: 2px solid #DDD; padding: 46px 18px 0; }}
#bar div {{ height: 44px; border-radius: 22px; background: #FFFFFF; border: 2px solid #D5D5D5; display: flex; align-items: center; gap: 10px;
  padding: 0 18px; font: 700 20px/1 "JetBrains Mono"; color: #333; }}
#bar svg {{ width: 18px; height: 18px; }}
#view {{ position: absolute; left: 0; right: 0; top: 104px; bottom: 0; overflow: hidden; }}
#view img {{ position: absolute; left: 0; top: 0; width: 460px; display: block; }}
#imgPanier {{ opacity: 0; }}
#tap {{ position: absolute; left: 230px; top: 742px; width: 96px; height: 96px; margin: -48px 0 0 -48px; border-radius: 50%;
  background: rgba(224,163,58,.35); border: 6px solid #E0A33A; opacity: 0; }}
#okb {{ position: absolute; left: 130px; top: 330px; width: 200px; height: 200px; border-radius: 50%; background: #1F4D3A; opacity: 0; }}
#okb svg {{ width: 200px; height: 200px; }}
/* cuisine */
#kitL {{ background: radial-gradient(120% 75% at 50% 42%, #24573F 0%, #1F4D3A 55%, #173B2D 100%); }}
#tab {{ position: absolute; left: 60px; top: 560px; width: 960px; height: 620px; background: #0C1613; border-radius: 40px; padding: 22px; }}
#tab img {{ width: 916px; height: 576px; border-radius: 20px; display: block; object-fit: cover; object-position: 30% 0; }}
#tick {{ position: absolute; left: 380px; top: 1560px; width: 320px; padding: 22px 24px; background: #F4EFE6; border: 4px solid #0C1613; border-radius: 16px;
  font: 700 24px/1.45 "JetBrains Mono"; color: #0C1613; z-index: 9; }}
#tick b {{ display: block; font-size: 32px; color: #1F4D3A; }}
#kitT {{ position: absolute; left: 0; right: 0; top: 1240px; text-align: center; font: 600 70px/1.1 "Source Serif 4"; color: #F4EFE6; }}
#kitT em {{ font-style: normal; color: #E0A33A; }}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="1080" data-height="1920">
  <div id="planL" class="layer clip" data-start="0" data-duration="{DUR}" data-track-index="0">
    <div id="plan" class="layer">{plan_tables}{guests}{qmarks}
      <i class="dish" id="dish1" style="left:270px;top:1210px"></i><i class="dish" id="dish2" style="left:370px;top:1215px"></i>
      <div id="bubble"><div class="bx">
        <svg id="dl" viewBox="0 0 56 56"><g fill="none" stroke="#1F4D3A" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M28 6V34M16 23L28 35L40 23M8 42V50H48V42"/></g></svg>Encore une appli ?
        <svg id="dlx" viewBox="0 0 84 84"><path id="dlxp" d="M6 78L78 6" stroke="#C0392B" stroke-width="10" stroke-linecap="round" fill="none"/></svg>
      </div><div class="tail"></div></div>
      <div id="server"><div class="tray"></div><div class="bd"></div></div>
    </div>
  </div>
  <div id="logoL" class="layer clip" data-start="5.4" data-duration="3.2" data-track-index="1">
    <div id="lgMark"><svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <rect id="lgTile" width="512" height="512" rx="112" fill="{L.GREEN}"/>
      <path id="lgLetter" d="{L.LETTER}" fill="{L.CREAM}" fill-rule="evenodd"/><path id="lgAccent" d="{L.ACCENT}" fill="{L.CREAM}"/>
      <circle id="lgDot" cx="{DX:.1f}" cy="{DY:.1f}" r="{DR:.1f}" fill="{L.GOLD}"/></svg></div>
    <div id="lgWord">À vos tables</div>
    <div id="lgTag">Rien à télécharger</div>
  </div>
  <div id="closeL" class="layer clip" data-start="7.9" data-duration="12.1" data-track-index="2">
    <div id="wood"></div>
    <div id="plate"><div class="pclip"><div class="fbase"></div><div class="facet f1"></div><div class="facet f2"></div><div class="facet f3"></div>
      <div class="screw" style="left:36px"></div><div class="screw" style="left:719px"></div><div class="eng">À VOS TABLES</div></div><div class="pol"></div>
      <div id="stk"><img src="assets/table-qr.svg" alt=""><div>TABLE 4</div></div><div id="glow"></div></div>
  </div>
  <div id="phoneL" class="layer clip" data-start="11.6" data-duration="8.4" data-track-index="3">
    <div id="phone"><div id="scr">
      <div id="cam"><div id="camPlate"><i></i><img src="assets/table-qr.svg" alt=""></div>
        <div class="bk" id="bk1"></div><div class="bk" id="bk2"></div><div class="bk" id="bk3"></div><div class="bk" id="bk4"></div><div id="scanL"></div></div>
      <div id="web"><div id="bar"><div><svg viewBox="0 0 18 18"><path d="M4 8V6a5 5 0 0 1 10 0v2M3 8h12v8H3z" fill="none" stroke="#2E7D32" stroke-width="2"/></svg>lebistrot.fr/table-4</div></div>
        <div id="view"><img id="imgCarte" src="assets/client-carte.png" alt=""><img id="imgPanier" src="assets/client-panier.png" alt=""></div>
        <div id="tap"></div><div id="okb"><svg viewBox="0 0 200 200"><path id="okp" d="M55 104L88 137L148 72" stroke="#F4EFE6" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg></div>
      </div></div></div>
  </div>
  <div id="kitL" class="layer clip" data-start="19.4" data-duration="2.75" data-track-index="4">
    <div id="tab"><img src="assets/pro-cuisine.png" alt=""></div>
    <div id="kitT">Table 4 · <em>en cuisine</em></div>
    <div id="tick"><b>TABLE 4</b>1 × TACOS 2 VIANDES<br>1 × LIMONADE</div>
  </div>
  <div id="hook"><span>UNE APPLI ? NON MERCI.</span></div>
  {pills}
  <audio id="el-audio" src="assets/audio/music.wav" data-start="0" data-duration="{DUR}" data-track-index="10" data-volume="1"></audio>
</div>
<script>
(function () {{
  var tl = gsap.timeline({{ paused: true }});
  var $ = function (s) {{ return document.querySelector(s); }};
  var $$ = function (s) {{ return Array.prototype.slice.call(document.querySelectorAll(s)); }};
  function dash(el) {{ var n = el.getTotalLength(); el.style.strokeDasharray = n + " " + (n + 120); el.style.strokeDashoffset = n + 60; return n; }}
  function draw(el, t, d) {{ var n = dash(el); tl.fromTo(el, {{ strokeDashoffset: n + 60 }}, {{ strokeDashoffset: 0, duration: d, ease: "power2.out" }}, t); }}
  var B = {json.dumps(B)};
  // ---- étiquettes « à l'écran » : la première remplace l'accroche, chacune chasse la précédente
  tl.fromTo("#hook span", {{ scale: 1 }}, {{ scale: 1.04, duration: 0.25, yoyo: true, repeat: 1, ease: "sine.inOut" }}, 0.3);
  tl.to("#hook", {{ opacity: 0, scale: 0.9, duration: 0.18 }}, B[1] - 0.15);
  for (var k = 1; k < 11; k++) {{
    tl.fromTo("#lab" + k, {{ opacity: 0, scale: 0.7, y: -20 }}, {{ opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "back.out(2.2)" }}, B[k] - 0.05);
    if (k < 10) tl.to("#lab" + k, {{ opacity: 0, scale: 0.92, duration: 0.15 }}, B[k + 1] - 0.15);
  }}
  // ---- 0:00 plan de salle, bulle « Encore une appli ? », l'icône de téléchargement se barre
  tl.fromTo(".tb", {{ scale: 0.6, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.35, ease: "back.out(1.8)", stagger: 0.04 }}, 0.0);
  tl.fromTo(".ch", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.3 }}, 0.15);
  tl.fromTo("#bubble", {{ scale: 0, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)" }}, 0.45);
  draw($("#dlxp"), 1.55, 0.3);
  // ---- 0:03 la salle se remplit, des « ? » au-dessus des tables
  tl.fromTo(".gu", {{ scale: 0 }}, {{ scale: 1, duration: 0.3, ease: "back.out(2.5)", stagger: 0.07 }}, B[1]);
  tl.fromTo(".qm", {{ scale: 0, y: 30 }}, {{ scale: 1, y: 0, duration: 0.35, ease: "back.out(2.5)", stagger: 0.15 }}, B[1] + 0.6);
  tl.to(".qm", {{ y: -12, duration: 0.3, yoyo: true, repeat: 3, ease: "sine.inOut", stagger: 0.08 }}, B[1] + 1.4);
  tl.to(["#bubble", ".qm"], {{ opacity: 0, duration: 0.25 }}, B[2] - 0.2);
  // ---- 0:06 logo, « Rien à télécharger » se pose dessous
  tl.fromTo("#logoL", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.25 }}, B[2] - 0.3);
  tl.fromTo("#lgTile", {{ scale: 0.4, opacity: 0, svgOrigin: "256 256" }}, {{ scale: 1, opacity: 1, svgOrigin: "256 256", duration: 0.5, ease: "back.out(1.8)" }}, B[2] - 0.2);
  tl.fromTo("#lgAccent", {{ y: -160, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.45, ease: "bounce.out" }}, B[2] + 0.1);
  tl.fromTo("#lgDot", {{ scale: 0, svgOrigin: "{DX:.1f} {DY:.1f}" }}, {{ scale: 1, svgOrigin: "{DX:.1f} {DY:.1f}", duration: 0.3, ease: "back.out(2.5)" }}, B[2] + 0.25);
  tl.fromTo("#lgWord", {{ y: 40, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }}, B[2] + 0.2);
  tl.fromTo("#lgTag", {{ y: -120, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.5, ease: "bounce.out" }}, B[2] + 1.0);
  tl.to("#logoL", {{ opacity: 0, duration: 0.3 }}, B[3] - 0.3);
  // ---- 0:08 zoom sur la table, la plaque se pose avec un petit rebond
  tl.to("#plan", {{ scale: 3.2, duration: 0.6, ease: "power3.in" }}, B[3] - 0.45);
  tl.fromTo("#closeL", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.3 }}, B[3] - 0.15);
  tl.fromTo("#plate", {{ y: -900, rotation: -8 }}, {{ y: 0, rotation: 0, duration: 0.7, ease: "bounce.out" }}, B[3] + 0.25);
  // ---- 0:11 le QR code s'illumine
  tl.fromTo("#glow", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.2 }}, B[4]);
  tl.fromTo("#glow", {{ scale: 1 }}, {{ scale: 1.06, duration: 0.3, yoyo: true, repeat: 3, ease: "sine.inOut", immediateRender: false }}, B[4] + 0.1);
  // ---- 0:12 un téléphone entre dans le champ, cadre de scan
  tl.fromTo("#phone", {{ y: 0 }}, {{ y: -1180, duration: 0.6, ease: "power3.out" }}, B[5] - 0.2);
  tl.fromTo(".bk", {{ scale: 1.3, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.3, ease: "power3.out" }}, B[5] + 0.45);
  tl.fromTo("#scanL", {{ opacity: 0, y: 0 }}, {{ opacity: 1, duration: 0.05 }}, B[5] + 0.8);
  tl.fromTo("#scanL", {{ y: 0 }}, {{ y: 190, duration: 0.6, ease: "power1.inOut", immediateRender: false }}, B[5] + 0.82);
  tl.to("#scanL", {{ opacity: 0, duration: 0.1 }}, B[5] + 1.42);
  tl.to(".bk", {{ borderColor: "#E0A33A", duration: 0.15 }}, B[5] + 1.45);
  // ---- 0:14 la carte s'ouvre dans le navigateur, les plats défilent
  tl.to("#phone", {{ y: -1360, scale: 1.12, duration: 0.5, ease: "power3.inOut" }}, B[6] - 0.3);
  tl.fromTo("#web", {{ opacity: 0, scaleY: 0.2, transformOrigin: "50% 0%" }}, {{ opacity: 1, scaleY: 1, duration: 0.45, ease: "power3.out" }}, B[6] - 0.1);
  tl.fromTo("#imgCarte", {{ y: 0 }}, {{ y: -260, duration: 2.0, ease: "sine.inOut" }}, B[6] + 0.6);
  // ---- 0:17 il commande : le panier, un doigt touche « Envoyer », coche
  tl.fromTo("#imgPanier", {{ opacity: 0, x: 460 }}, {{ opacity: 1, x: 0, duration: 0.35, ease: "power3.out" }}, B[7] - 0.1);
  tl.fromTo("#tap", {{ scale: 0.3, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.15 }}, B[7] + 0.9);
  tl.to("#tap", {{ scale: 1.6, opacity: 0, duration: 0.3 }}, B[7] + 1.08);
  tl.fromTo("#okb", {{ scale: 0, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" }}, B[7] + 1.2);
  draw($("#okp"), B[7] + 1.35, 0.3);
  // ---- 0:20 la commande file jusqu'à la cuisine et s'y affiche
  tl.fromTo("#kitL", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.3 }}, B[8] - 0.3);
  tl.fromTo("#tab", {{ y: -60, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }}, B[8] - 0.2);
  tl.fromTo("#tick", {{ y: 0, rotation: 8, scale: 1 }}, {{ y: -820, rotation: -3, scale: 0.85, duration: 0.65, ease: "power3.out" }}, B[8] + 0.2);
  tl.to("#tick", {{ boxShadow: "0 0 40px 12px rgba(224,163,58,.8)", duration: 0.2, yoyo: true, repeat: 1 }}, B[8] + 0.85);
  tl.fromTo("#kitT", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }}, B[8] + 0.5);
  // ---- 0:22 retour au plan de salle : le serveur arrive avec les assiettes
  tl.set("#plan", {{ scale: 1 }}, B[9] - 0.35);
  tl.to("#kitL", {{ opacity: 0, duration: 0.3 }}, B[9] - 0.35);
  tl.fromTo("#server", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.2 }}, B[9] - 0.15);
  tl.fromTo("#server", {{ x: 0, y: 0 }}, {{ x: -500, y: -240, duration: 0.9, ease: "power2.inOut" }}, B[9] - 0.1);
  tl.fromTo(".dish", {{ scale: 0 }}, {{ scale: 1, duration: 0.3, ease: "back.out(2.5)", stagger: 0.12 }}, B[9] + 0.85);
  tl.to("#server", {{ x: 0, y: 160, duration: 0.6, ease: "power2.in" }}, B[10] - 0.1);
  tl.to("#server", {{ opacity: 0, duration: 0.2 }}, B[10] + 0.4);
  // ---- 0:24 la bulle du début réapparaît et se barre : la vidéo boucle
  tl.set("#dlxp", {{ strokeDashoffset: 9999 }}, B[10] - 0.1);
  tl.fromTo("#bubble", {{ scale: 0, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)", immediateRender: false }}, B[10] + 0.1);
  tl.to("#dlxp", {{ strokeDashoffset: 0, duration: 0.3, ease: "power2.out" }}, B[10] + 0.9);
  tl.to("#bubble", {{ scale: 1.06, duration: 0.25, yoyo: true, repeat: 3, ease: "sine.inOut" }}, B[10] + 1.4);
  tl.to("#lab10 span", {{ backgroundColor: "#E0A33A", color: "#0C1613", duration: 0.25 }}, B[10] + 1.6);
  tl.to({{}}, {{ duration: {DUR} }}, 0);
  window.__timelines = window.__timelines || {{}};
  window.__timelines["main"] = tl;
}})();
</script>
</body>
</html>
"""
open(os.path.join(HERE, "index.html"), "w").write(HTML)
print("ok", [round(b, 2) for b in B])
