# Trois stories motion design « À vos tables » (1080 × 1920), trois styles : néon, éditorial, pop.
# Écrit <style>/index.html pour chacun. Bande-son : musique + voix off (assets/audio/music.wav, voir mix_voix.py et voix.json).
# Zones sûres Instagram : rien d'important au-dessus de 250 px ni sous 1560 px.
#   python3 gen_styles.py chemin/vers/logo512.py
import importlib.util, os, re, sys

spec = importlib.util.spec_from_file_location("logo512", sys.argv[1])
L = importlib.util.module_from_spec(spec); spec.loader.exec_module(L)
DX, DY, DR = L.DOT
_n = [float(v) for v in re.findall(r"-?\d+\.?\d*", L.LETTER)]
LCX, LCY = (min(_n[0::2]) + max(_n[0::2])) / 2, (min(_n[1::2]) + max(_n[1::2])) / 2
HERE = os.path.dirname(os.path.abspath(__file__))

FONTS = "".join(
    f'@font-face {{ font-family: "{fam}"; src: url("assets/fonts/{f}.woff2") format("woff2"); font-weight: {w}; font-display: block; }}\n'
    for fam, f, w in [("Source Serif 4", "SourceSerif4-400", 400), ("Source Serif 4", "SourceSerif4-500", 500),
                      ("Source Serif 4", "SourceSerif4-600", 600), ("JetBrains Mono", "JetBrainsMono-500", 500),
                      ("JetBrains Mono", "JetBrainsMono-700", 700)])

def page(dur, css, body, js):
    return f"""<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js" integrity="sha384-sG0Hv1tP1lZCk9KQmrIbY/XNwi+OY84GQqhMscbnsoBFqAz8KNCil1kvfL3Hbbk2" crossorigin="anonymous"></script>
    <style>
      {FONTS}
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: 1080px; height: 1920px; overflow: hidden; background: #000; }}
      #root {{ position: relative; width: 1080px; height: 1920px; overflow: hidden; }}
      .scene {{ position: absolute; inset: 0; overflow: hidden; }}
      .serif {{ font-family: "Source Serif 4"; font-weight: 500; letter-spacing: -0.02em; line-height: 1.04; }}
      .mono {{ font-family: "JetBrains Mono"; font-weight: 700; }}
      .center {{ position: absolute; left: 60px; right: 60px; text-align: center; }}
      .w {{ display: inline-block; }}
      {css}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{dur}" data-width="1080" data-height="1920">
      {body}
      <audio id="el-audio" src="assets/audio/music.wav" data-start="0" data-duration="{dur}" data-track-index="10" data-volume="1"></audio>
    </div>
    <script>
      (function () {{
        var tl = gsap.timeline({{ paused: true }});
        var $ = function (s) {{ return document.querySelector(s); }};
        var $$ = function (s) {{ return Array.prototype.slice.call(document.querySelectorAll(s)); }};
        // trait dessiné : le motif commence dans le vide (aucun bout arrondi avant le tracé)
        function dash(el) {{ var n = el.getTotalLength(); el.style.strokeDasharray = n + " " + (n + 120); el.style.strokeDashoffset = n + 60; return n; }}
        function draw(el, t, d, ease) {{ var n = dash(el); tl.fromTo(el, {{ strokeDashoffset: n + 60 }}, {{ strokeDashoffset: 0, duration: d, ease: ease || "power2.out" }}, t); }}
        // grésillement d'enseigne : une suite fixe d'allumages et d'extinctions
        function flicker(el, t, seq) {{
          var on = 0; tl.set(el, {{ opacity: 0 }}, 0);
          seq = seq || [0, 0.05, 0.09, 0.16, 0.2, 0.32];
          seq.forEach(function (dt, k) {{ tl.set(el, {{ opacity: k % 2 ? 0.15 : 1 }}, t + dt); }});
          tl.set(el, {{ opacity: 1 }}, t + seq[seq.length - 1] + 0.05);   // l'enseigne finit toujours allumée
        }}
        {js}
        tl.to({{}}, {{ duration: {dur} }}, 0);
        window.__timelines = window.__timelines || {{}};
        window.__timelines["main"] = tl;
      }})();
    </script>
  </body>
</html>
"""

def logo_svg(idp, fill_a, fill_d, tile=None, stroke=None):
    t = f'<rect id="{idp}Tile" width="512" height="512" rx="112" fill="{tile}" />' if tile else ""
    st = f' stroke="{stroke}" stroke-width="6" stroke-linejoin="round"' if stroke else ""
    return (f'<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-label="À vos tables" style="overflow:visible">{t}'
            f'<path id="{idp}Letter" d="{L.LETTER}" fill="{fill_a}" fill-rule="evenodd"{st}/>'
            f'<path id="{idp}Accent" d="{L.ACCENT}" fill="{fill_a}"{st}/>'
            f'<circle id="{idp}Dot" cx="{DX:.1f}" cy="{DY:.1f}" r="{DR:.1f}" fill="{fill_d}"/></svg>')

def words(text):
    return " ".join(f'<span class="w">{w}</span>' for w in text.split(" "))

QR = open(os.path.join(HERE, "qr_rows.txt")).read().strip().split(",")
def qr_svg(size, color, idp):
    c = size / len(QR)
    rects = "".join(f'<rect x="{x * c:.2f}" y="{y * c:.2f}" width="{c + 0.5:.2f}" height="{c + 0.5:.2f}"/>'
                    for y in range(len(QR)) for x in range(len(QR)) if QR[y][x] == "1")
    return f'<svg id="{idp}" viewBox="0 0 {size} {size}" width="{size}" height="{size}" fill="{color}" xmlns="http://www.w3.org/2000/svg">{rects}</svg>'

# ============================================================ 1 · NÉON (15 s) — la nuit des bars et des chichas
G = "#F2C46B"; CR = "#F4EFE6"
glowG = "drop-shadow(0 0 6px rgba(242,196,107,.9)) drop-shadow(0 0 22px rgba(242,196,107,.55))"
glowC = "drop-shadow(0 0 5px rgba(244,239,230,.85)) drop-shadow(0 0 18px rgba(244,239,230,.4))"
neon_css = f"""
#root {{ background: radial-gradient(90% 60% at 50% 45%, #10241B 0%, #08140F 60%, #050C09 100%); }}
.ng {{ color: {G}; text-shadow: 0 0 6px rgba(242,196,107,.9), 0 0 24px rgba(242,196,107,.55), 0 0 60px rgba(242,196,107,.3); }}
.nc {{ color: {CR}; text-shadow: 0 0 5px rgba(244,239,230,.8), 0 0 20px rgba(244,239,230,.35); }}
.tube {{ position: absolute; height: 4px; border-radius: 2px; background: {G}; box-shadow: 0 0 10px 2px rgba(242,196,107,.7); transform-origin: 0 50%; }}
#nLabel {{ top: 330px; font-size: 30px; letter-spacing: .5em; padding-left: .5em; }}
#nT1 {{ top: 420px; font-size: 128px; }}
#glass, #phone {{ position: absolute; overflow: visible; }}
#glass {{ left: 290px; top: 700px; width: 500px; height: 560px; filter: {glowC}; }}
#glass path, #phone rect, #phone path {{ fill: none; stroke-linecap: round; stroke-linejoin: round; }}
#nQ {{ top: 1300px; font-size: 54px; line-height: 1.15; }}
#phone {{ left: 340px; top: 640px; width: 400px; height: 720px; filter: {glowG}; }}
#nQr {{ position: absolute; left: 420px; top: 810px; width: 240px; height: 240px; filter: {glowC}; opacity: .95; }}
#nScan {{ position: absolute; left: 400px; top: 800px; width: 280px; height: 6px; border-radius: 3px; background: {CR};
  box-shadow: 0 0 14px 4px rgba(244,239,230,.8); opacity: 0; }}
#nT2 {{ top: 1410px; font-size: 64px; }}
#sign {{ top: 760px; font-size: 92px; letter-spacing: .06em; line-height: 1.1; }}
#signBox {{ position: absolute; left: 110px; right: 110px; top: 700px; height: 300px; border: 5px solid {G}; border-radius: 40px;
  box-shadow: 0 0 14px rgba(242,196,107,.8), inset 0 0 14px rgba(242,196,107,.5); }}
#nT3 {{ top: 1080px; font-size: 56px; }}
#nMark {{ position: absolute; left: 390px; top: 520px; width: 300px; height: 300px; filter: {glowC}; }}
#nWord {{ top: 860px; font-size: 128px; }}
#nTag {{ top: 1030px; font-size: 30px; letter-spacing: .32em; padding-left: .32em; }}
#nCta {{ top: 1470px; font-size: 28px; letter-spacing: .18em; }}
"""
neon_body = f"""
<div id="nTubes"><div class="tube" id="tb1" style="left:80px;top:300px;width:920px"></div><div class="tube" id="tb2" style="left:80px;top:1620px;width:920px"></div></div>
<div id="n1" class="scene clip" data-start="0" data-duration="3.4" data-track-index="0">
  <div id="nLabel" class="center mono ng">MINUIT</div>
  <div id="nT1" class="center serif nc"><span id="nw0" class="w">Le</span> <span id="nw1" class="w">bar</span> <span id="nw2" class="w">est</span><br><span id="nw3" class="w ng">plein.</span></div>
</div>
<div id="n2" class="scene clip" data-start="3.2" data-duration="3.5" data-track-index="1">
  <svg id="glass" viewBox="0 0 500 560" xmlns="http://www.w3.org/2000/svg">
    <path id="g1" d="M60 60H440L250 300Z" stroke="{CR}" stroke-width="12"/>
    <path id="g2" d="M250 300V500" stroke="{CR}" stroke-width="12"/>
    <path id="g3" d="M150 510H350" stroke="{CR}" stroke-width="12"/>
    <path id="g4" d="M380 30L300 160" stroke="{G}" stroke-width="10"/>
    <path id="g5" d="M120 120H380" stroke="{G}" stroke-width="8"/>
  </svg>
  <div id="nQ" class="center serif nc">Et personne pour<br>prendre la commande ?</div>
</div>
<div id="n3" class="scene clip" data-start="6.5" data-duration="3.7" data-track-index="2">
  <svg id="phone" viewBox="0 0 400 720" xmlns="http://www.w3.org/2000/svg">
    <rect id="ph1" x="10" y="10" width="380" height="700" rx="56" stroke="{G}" stroke-width="10"/>
    <path id="ph2" d="M160 52H240" stroke="{G}" stroke-width="10"/>
  </svg>
  <div id="nQr">{qr_svg(240, CR, "nQrSvg")}</div>
  <div id="nScan"></div>
  <div id="nT2" class="center serif nc">Un scan. <span class="ng">La carte s'allume.</span></div>
</div>
<div id="n4" class="scene clip" data-start="10" data-duration="2.75" data-track-index="3">
  <div id="signBox"></div>
  <div id="sign" class="center mono ng">COMMANDE<br>ENVOYÉE ✓</div>
  <div id="nT3" class="center serif nc">Le comptoir la reçoit en direct.</div>
</div>
<div id="n5" class="scene clip" data-start="12.55" data-duration="3.45" data-track-index="4">
  <div id="nMark">{logo_svg("nm", "transparent", G, stroke=CR)}</div>
  <div id="nWord" class="center serif nc">À vos tables</div>
  <div id="nTag" class="center mono ng">BARS · CHICHAS · CAFÉS</div>
  <div id="nCta" class="center mono ng">↓ DEMANDEZ VOTRE DÉMO ↓</div>
</div>
"""
neon_js = """
tl.fromTo("#tb1", { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power2.out" }, 0.1);
tl.fromTo("#tb2", { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power2.out" }, 0.2);
flicker("#nLabel", 0.25);
flicker("#nw0", 0.7, [0, 0.04, 0.08]); flicker("#nw1", 0.95, [0, 0.04, 0.08]); flicker("#nw2", 1.2, [0, 0.04, 0.08]);
flicker("#nw3", 1.6, [0, 0.06, 0.12, 0.22, 0.27, 0.42, 0.48]);
tl.to("#n1", { opacity: 0, duration: 0.2 }, 3.2);
// le verre se dessine, le liquide (trait doré) arrive, la question grésille
draw($("#g1"), 3.3, 0.55); draw($("#g2"), 3.7, 0.3); draw($("#g3"), 3.9, 0.3);
draw($("#g5"), 4.2, 0.3); draw($("#g4"), 4.35, 0.25);
tl.fromTo("#glass", { rotation: 0, transformOrigin: "50% 90%" }, { rotation: -6, duration: 0.5, yoyo: true, repeat: 2, ease: "sine.inOut" }, 4.6);
flicker("#nQ", 4.75, [0, 0.05, 0.1, 0.18, 0.22]);
tl.to("#n2", { opacity: 0, duration: 0.25 }, 6.45);
// le téléphone s'allume, le QR code s'éclaire, balayage
draw($("#ph1"), 6.55, 0.6); draw($("#ph2"), 6.95, 0.2);
tl.fromTo("#nQr", { opacity: 0, scale: 0.8 }, { opacity: 0.95, scale: 1, duration: 0.35, ease: "power3.out" }, 7.15);
tl.fromTo("#nScan", { opacity: 0, y: 0 }, { opacity: 1, duration: 0.05 }, 7.6);
tl.fromTo("#nScan", { y: 0 }, { y: 250, duration: 0.6, ease: "power1.inOut", immediateRender: false }, 7.62);
tl.to("#nScan", { opacity: 0, duration: 0.1 }, 8.22);
tl.fromTo("#nQr", { scale: 1 }, { scale: 1.08, duration: 0.15, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, 8.25);
flicker("#nT2", 8.4, [0, 0.05, 0.1, 0.16, 0.2]);
tl.to("#n3", { opacity: 0, duration: 0.2 }, 10.0);
// l'enseigne « COMMANDE ENVOYÉE » s'allume en grésillant, clignote deux fois
flicker("#signBox", 10.1, [0, 0.05, 0.1, 0.2, 0.25]);
flicker("#sign", 10.25, [0, 0.06, 0.12, 0.2, 0.26, 0.4, 0.46]);
tl.to(["#sign", "#signBox"], { opacity: 0.2, duration: 0.08, yoyo: true, repeat: 3 }, 11.1);
tl.fromTo("#nT3", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, 11.2);
tl.to("#n4", { opacity: 0, duration: 0.2 }, 12.55);
// le logo s'allume trait par trait, puis le point doré
draw($("#nmLetter"), 12.65, 0.55); draw($("#nmAccent"), 12.95, 0.25);
tl.fromTo("#nmDot", { scale: 0, svgOrigin: "%DOT%" }, { scale: 1, svgOrigin: "%DOT%", duration: 0.3, ease: "back.out(2.5)" }, 13.15);
flicker("#nWord", 13.25, [0, 0.05, 0.1, 0.17]);
flicker("#nTag", 13.6, [0, 0.04, 0.08]);
flicker("#nCta", 13.9, [0, 0.05, 0.1, 0.2, 0.25]);
tl.to("#nCta", { opacity: 0.35, duration: 0.12, yoyo: true, repeat: 3 }, 14.3);
"""

# ============================================================ 2 · ÉDITORIAL (15 s) — page de magazine, grands chiffres
INK = "#0C1613"; GR = "#1F4D3A"; GD = "#B9822A"
ed_css = f"""
#root {{ background: #EDE6D8; }}
.pg {{ background: #F4EFE6; box-shadow: -30px 0 60px rgba(12,22,19,.18); }}
.rule {{ position: absolute; left: 80px; right: 80px; height: 3px; background: {INK}; transform-origin: 0 50%; }}
.rule.thin {{ height: 1px; }}
.kick {{ position: absolute; left: 80px; font: 700 22px/1 "JetBrains Mono"; letter-spacing: .22em; color: {INK}; }}
.big {{ position: absolute; left: 60px; right: 60px; text-align: left; font: 600 560px/1 "Source Serif 4"; letter-spacing: -0.05em; color: {GR}; }}
.cap {{ position: absolute; left: 80px; right: 80px; font: 500 70px/1.1 "Source Serif 4"; letter-spacing: -0.015em; color: {INK}; }}
.cap em {{ font-style: italic; color: {GD}; }}
.folio {{ position: absolute; right: 80px; top: 1500px; font: 500 22px/1 "JetBrains Mono"; letter-spacing: .2em; color: {INK}; opacity: .6; }}
#eMast {{ position: absolute; left: 0; right: 0; top: 330px; text-align: center; font: 600 112px/1 "Source Serif 4"; letter-spacing: -0.02em; color: {GR}; }}
#eIssue {{ position: absolute; left: 0; right: 0; top: 470px; text-align: center; font: 700 22px/1 "JetBrains Mono"; letter-spacing: .3em; color: {INK}; }}
#eCover {{ position: absolute; left: 80px; right: 80px; top: 640px; font: 500 150px/1 "Source Serif 4"; letter-spacing: -0.03em; color: {INK}; }}
#eCover em {{ font-style: italic; color: {GD}; }}
.sw {{ position: absolute; top: 1290px; width: 150px; height: 150px; border-radius: 50%; border: 3px solid {INK}; }}
#eMark {{ position: absolute; left: 80px; top: 470px; width: 240px; height: 240px; }}
#eEnd {{ position: absolute; left: 80px; right: 80px; top: 780px; font: 500 120px/1.02 "Source Serif 4"; letter-spacing: -0.03em; color: {INK}; }}
#eEnd em {{ font-style: italic; color: {GD}; }}
#eCta {{ position: absolute; left: 80px; top: 1470px; font: 700 28px/1 "JetBrains Mono"; letter-spacing: .16em; color: {GR}; }}
"""
PAGES = [  # (id, début, chiffre, légende, rubrique)
    ("p1", 2.6, "0", "appli à télécharger<br>pour vos <em>clients.</em>", "SANS APPLI"),
    ("p2", 5.0, "1", "scan suffit pour<br>ouvrir la <em>carte.</em>", "LE QR CODE"),
    ("p3", 7.4, "3", "finitions pour<br>vos <em>plaques.</em>", "ROSE · ARGENTÉ · DORÉ"),
    ("p4", 9.8, "3 s", "et la commande<br>arrive <em>en salle.</em>", "EN MOINS DE"),
]
def ed_page(pid, t0, num, cap, kick, k):
    extra = ""
    if pid == "p3":
        extra = ("".join(f'<div class="sw" id="sw{i}" style="left:{80 + i * 190}px;background:{c}"></div>'
                         for i, c in enumerate(["#D9A79A", "#C9CDD2", "#D6AE57"])))
    small = "font-size:440px;" if len(num) > 1 else ""
    return f"""<div id="{pid}" class="scene pg clip" data-start="{t0}" data-duration="{(PAGES[k + 1][1] if k + 1 < len(PAGES) else 12.2) - t0 + 0.6:.2f}" data-track-index="{k + 1}">
  <div class="kick" style="top:300px">{kick}</div><div class="rule" style="top:340px"></div>
  <div class="big" id="{pid}n" style="{small}top:420px">{num}</div>
  <div class="rule thin" style="top:1010px"></div>
  <div class="cap" id="{pid}c" style="top:1050px">{cap}</div>
  {extra}
  <div class="folio">N° 01 · P. {k + 2}</div>
</div>"""
ed_body = f"""
<div id="p0" class="scene pg clip" data-start="0" data-duration="3.2" data-track-index="0">
  <div class="rule" style="top:300px"></div>
  <div id="eMast">À vos tables</div>
  <div id="eIssue">LE GUIDE DU SERVICE · N° 01</div>
  <div class="rule thin" style="top:530px"></div>
  <div id="eCover"><span class="w">Le</span> <span class="w">service,</span><br><span class="w"><em>en</em></span> <span class="w"><em>chiffres.</em></span></div>
  <div class="folio">N° 01 · P. 1</div>
</div>
{"".join(ed_page(*p, k) for k, p in enumerate(PAGES))}
<div id="p5" class="scene pg clip" data-start="12.2" data-duration="3.8" data-track-index="6">
  <div class="kick" style="top:300px">LE MOT DE LA FIN</div><div class="rule" style="top:340px"></div>
  <div id="eMark">{logo_svg("em", "#EFEBE4", "#D5B162", tile="#3D5742")}</div>
  <div id="eEnd"><span class="w">Moins</span> <span class="w">de</span> <span class="w">courses,</span><br><span class="w"><em>plus</em></span> <span class="w"><em>de</em></span> <span class="w"><em>service.</em></span></div>
  <div class="rule thin" style="top:1430px"></div>
  <div id="eCta">↓ DEMANDEZ VOTRE DÉMO</div>
</div>
"""
ed_js = """
$$(".rule").forEach(function (r) { tl.set(r, { scaleX: 0 }, 0); });
function rules(scope, t) { $$(scope + " .rule").forEach(function (r, k) { tl.to(r, { scaleX: 1, duration: 0.45, ease: "power3.inOut" }, t + k * 0.08); }); }
// couverture
rules("#p0", 0.1);
tl.fromTo("#eMast", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 0.25);
tl.fromTo("#eIssue", { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.55);
$$("#eCover .w").forEach(function (w, k) { tl.fromTo(w, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 0.8 + k * 0.12); });
// chaque page se tourne : elle arrive de la droite avec son ombre, le grand chiffre monte, la légende suit
[["#p1", 2.6], ["#p2", 5.0], ["#p3", 7.4], ["#p4", 9.8], ["#p5", 12.2]].forEach(function (p) {
  tl.fromTo(p[0], { x: 1080 }, { x: 0, duration: 0.55, ease: "power3.inOut" }, p[1]);
  rules(p[0], p[1] + 0.35);
});
[["#p1", 2.6], ["#p2", 5.0], ["#p3", 7.4], ["#p4", 9.8]].forEach(function (p) {
  tl.fromTo(p[0] + "n", { y: 120, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power4.out" }, p[1] + 0.45);
  tl.fromTo(p[0] + "c", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.45, ease: "power3.out" }, p[1] + 0.8);
});
$$(".sw").forEach(function (s, k) { tl.fromTo(s, { scale: 0 }, { scale: 1, duration: 0.4, ease: "back.out(2)" }, 8.5 + k * 0.15); });
// fin : logo, phrase, appel
tl.fromTo("#emTile", { scale: 0.8, opacity: 0, svgOrigin: "256 256" }, { scale: 1, opacity: 1, svgOrigin: "256 256", duration: 0.4, ease: "power3.out" }, 12.6);
tl.fromTo("#emAccent", { y: -80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, 12.85);
tl.fromTo("#emDot", { scale: 0, svgOrigin: "%DOT%" }, { scale: 1, svgOrigin: "%DOT%", duration: 0.3, ease: "back.out(2.5)" }, 12.95);
$$("#eEnd .w").forEach(function (w, k) { tl.fromTo(w, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, 12.8 + k * 0.1); });
tl.fromTo("#eCta", { opacity: 0 }, { opacity: 1, duration: 0.4 }, 13.7);
"""

# ============================================================ 3 · POP (13 s) — aplats francs, formes qui rebondissent
pop_css = f"""
#root {{ background: #F4EFE6; }}
.beat {{ position: absolute; inset: 0; }}
.word {{ position: absolute; left: 0; right: 0; top: 1240px; text-align: center; font: 600 190px/1 "Source Serif 4"; letter-spacing: -0.03em; }}
.shape {{ position: absolute; }}
#b1 {{ background: #E0A33A; }} #b2 {{ background: #1F4D3A; }} #b3 {{ background: #D9A79A; }} #b4 {{ background: #F4EFE6; }}
#c1 {{ left: 240px; top: 470px; width: 600px; height: 600px; border-radius: 50%; background: #F4EFE6; }}
#qr1 {{ position: absolute; left: 390px; top: 620px; }}
.pill {{ position: absolute; left: 160px; height: 120px; border-radius: 60px; background: #F4EFE6; display: flex; align-items: center;
  padding: 0 46px; font: 700 40px/1 "JetBrains Mono"; letter-spacing: .04em; color: #0C1613; }}
.pill b {{ margin-left: auto; color: #B9822A; }}
#arrow {{ position: absolute; left: 0; top: 640px; width: 1080px; height: 400px; overflow: visible; }}
#plate {{ left: 290px; top: 520px; width: 500px; height: 500px; border-radius: 50%; background: #FFFFFF; border: 24px solid #E7DCC6; }}
#check {{ position: absolute; left: 290px; top: 520px; width: 500px; height: 500px; overflow: visible; }}
#pT {{ position: absolute; left: 70px; right: 70px; top: 400px; text-align: center; font: 600 112px/1.04 "Source Serif 4"; letter-spacing: -0.025em; color: #1F4D3A; }}
#pT .g {{ color: #B9822A; }}
.dotS {{ position: absolute; border-radius: 50%; }}
#pMark {{ position: absolute; left: 340px; top: 470px; width: 400px; height: 400px; }}
#pWord {{ position: absolute; left: 0; right: 0; top: 930px; text-align: center; font: 600 132px/1 "Source Serif 4"; letter-spacing: -0.02em; color: #1F4D3A; }}
#pCta {{ position: absolute; left: 0; right: 0; top: 1470px; text-align: center; }}
#pCta span {{ display: inline-block; padding: 26px 46px; border-radius: 60px; background: #1F4D3A; color: #F4EFE6;
  font: 700 30px/1 "JetBrains Mono"; letter-spacing: .14em; }}
"""
BEATS = [("b1", 0.0, "Scan.", "#1F4D3A"), ("b2", 1.6, "Choix.", "#F4EFE6"), ("b3", 3.2, "Envoi.", "#0C1613"), ("b4", 4.8, "Servi !", "#1F4D3A")]
pop_body = f"""
<div id="pBeats" class="scene clip" data-start="0" data-duration="6.7" data-track-index="0">
  <div id="b1" class="beat"><div id="c1" class="shape"></div><div id="qr1">{qr_svg(300, "#0C1613", "qrP")}</div><div class="word" style="color:#1F4D3A">Scan.</div></div>
  <div id="b2" class="beat">
    <div class="pill" id="pl0" style="top:520px;width:760px">TACOS 2 VIANDES<b>9,50 €</b></div>
    <div class="pill" id="pl1" style="top:680px;width:760px">LIMONADE<b>5,00 €</b></div>
    <div class="pill" id="pl2" style="top:840px;width:760px">TARTE TATIN<b>8,00 €</b></div>
    <div class="word" style="color:#F4EFE6">Choix.</div></div>
  <div id="b3" class="beat">
    <svg id="arrow" viewBox="0 0 1080 400" xmlns="http://www.w3.org/2000/svg"><g id="arrowG">
      <path d="M160 260L760 140" stroke="#0C1613" stroke-width="34" stroke-linecap="round" fill="none"/>
      <path d="M640 80L800 132L690 250" stroke="#0C1613" stroke-width="34" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g></svg>
    <div class="word" style="color:#0C1613">Envoi.</div></div>
  <div id="b4" class="beat"><div id="plate" class="shape"></div>
    <svg id="check" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg"><path id="ck" d="M150 260L225 335L360 185" stroke="#E0A33A" stroke-width="44" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
    <div class="word" style="color:#1F4D3A">Servi !</div></div>
</div>
<div id="pMid" class="scene clip" data-start="6.4" data-duration="3.6" data-track-index="1" style="background:#F4EFE6">
  <div id="pT"><span class="w">Vos</span> <span class="w">clients</span><br><span class="w">commandent</span><br><span class="w g">tout</span> <span class="w g">seuls.</span></div>
  <div class="dotS" id="d0" style="left:120px;top:1000px;width:220px;height:220px;background:#E0A33A"></div>
  <div class="dotS" id="d1" style="left:420px;top:1080px;width:240px;height:240px;background:#1F4D3A;border-radius:44px"></div>
  <div class="dotS" id="d2" style="left:740px;top:990px;width:220px;height:220px;background:#D9A79A"></div>
  <div class="dotS" id="d3" style="left:300px;top:1330px;width:180px;height:100px;background:#C9CDD2;border-radius:50px"></div>
  <div class="dotS" id="d4" style="left:600px;top:1340px;width:120px;height:120px;background:#E0A33A"></div>
</div>
<div id="pEnd" class="scene clip" data-start="9.7" data-duration="3.3" data-track-index="2" style="background:#E0A33A">
  <div id="pMark">{logo_svg("pm", "#EFEBE4", "#D5B162", tile="#3D5742")}</div>
  <div id="pWord">À vos tables</div>
  <div id="pCta"><span>DEMANDEZ VOTRE DÉMO ↓</span></div>
</div>
"""
pop_js = """
// quatre temps : chaque aplat arrive en balayage vertical, la forme rebondit, le mot claque
[["#b1", 0.0], ["#b2", 1.6], ["#b3", 3.2], ["#b4", 4.8]].forEach(function (b, k) {
  if (k) tl.fromTo(b[0], { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.32, ease: "power4.inOut" }, b[1] - 0.1);
  tl.fromTo(b[0] + " .word", { scale: 0.4, opacity: 0, rotation: -6 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.45, ease: "back.out(2.2)" }, b[1] + 0.25);
});
tl.fromTo("#c1", { scale: 0 }, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.55)" }, 0.05);
tl.fromTo("#qr1", { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.5, ease: "back.out(1.8)" }, 0.2);
tl.fromTo("#qr1", { scale: 1 }, { scale: 1.08, duration: 0.12, yoyo: true, repeat: 3, immediateRender: false }, 0.9);
$$(".pill").forEach(function (p, k) { tl.fromTo(p, { x: -1100 }, { x: 0, duration: 0.4, ease: "back.out(1.4)" }, 1.65 + k * 0.12); });
tl.to("#pl0", { backgroundColor: "#E0A33A", scale: 1.05, duration: 0.15 }, 2.5);
tl.to("#pl0 b", { color: "#0C1613", duration: 0.15 }, 2.5);
tl.fromTo("#arrowG", { x: -700, y: 120, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, 3.3);
tl.to("#arrowG", { x: 900, y: -200, duration: 0.4, ease: "power3.in" }, 4.3);
tl.fromTo("#plate", { scale: 0, rotation: -180 }, { scale: 1, rotation: 0, duration: 0.55, ease: "back.out(1.6)" }, 4.85);
draw($("#ck"), 5.25, 0.3);
tl.fromTo("#pMid", { clipPath: "circle(0% at 540px 960px)" }, { clipPath: "circle(120% at 540px 960px)", duration: 0.45, ease: "power3.inOut" }, 6.35);
$$("#pT .w").forEach(function (w, k) { tl.fromTo(w, { y: -120, opacity: 0 }, { y: 0, opacity: 1, duration: 0.42, ease: "bounce.out" }, 6.7 + k * 0.12); });
$$(".dotS").forEach(function (d, k) {
  tl.fromTo(d, { y: 700 }, { y: 0, duration: 0.6, ease: "bounce.out" }, 7.0 + k * 0.1);
  tl.to(d, { y: -26, duration: 0.25, yoyo: true, repeat: 3, ease: "sine.inOut" }, 7.9 + k * 0.06);
});
tl.to(".dotS", { scale: 0, duration: 0.3, ease: "power3.in", stagger: 0.04 }, 9.35);
tl.fromTo("#pEnd", { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.4, ease: "power4.inOut" }, 9.6);
tl.fromTo("#pmTile", { scale: 0, rotation: -25, svgOrigin: "256 256" }, { scale: 1, rotation: 0, svgOrigin: "256 256", duration: 0.6, ease: "elastic.out(1, 0.6)" }, 9.9);
tl.fromTo("#pmLetter", { scale: 0, svgOrigin: "%LC%" }, { scale: 1, svgOrigin: "%LC%", duration: 0.5, ease: "back.out(2)" }, 10.15);
tl.fromTo("#pmAccent", { y: -200, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "bounce.out" }, 10.35);
tl.fromTo("#pmDot", { x: 500, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "back.out(1.5)" }, 10.5);
tl.fromTo("#pWord", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "back.out(2)" }, 10.55);
tl.fromTo("#pCta span", { scale: 0 }, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.6)" }, 11.1);
tl.to("#pCta span", { scale: 1.06, duration: 0.25, yoyo: true, repeat: 3, ease: "sine.inOut" }, 11.8);
"""

for name, dur, css, body, js in [("neon", 16, neon_css, neon_body, neon_js), ("editorial", 16, ed_css, ed_body, ed_js),
                                 ("pop", 13, pop_css, pop_body, pop_js)]:
    js = js.replace("%DOT%", f"{DX:.1f} {DY:.1f}").replace("%LC%", f"{LCX:.0f} {LCY:.0f}")
    open(os.path.join(HERE, name, "index.html"), "w").write(page(dur, css, body, js))
    print("ok", name)
