# Story motion design n° 2 « Lever la main, c'est fini » (1080 × 1920, 21,5 s) : écrit index.html.
# Six scènes calées sur la voix off (assets/audio/voix/textes.txt) :
#   1 0–3,6 « Lever la main. Attendre. Recommencer. » (crème : main qui s'agite, mots tamponnés, attente qui défile)
#   2 3,6–7,4 « Ça, c'est fini. » (vert : révélation par barre, liste barrée)
#   3 7,4–10,6 « Vos clients scannent… et commandent. » (or : le QR code se construit case par case)
#   4 10,6–13,9 « 3, 2, 1… déjà en salle. » (encre : compte à rebours, coche)
#   5 13,9–17,4 « Sans appli, sans compte. » (crème : pastilles)
#   6 17,4–21,5 fin : le logo s'assemble, « Le service, sans courir. », appel à la démo.
# Zones sûres Instagram : rien d'important au-dessus de 250 px ni sous 1560 px.
#   python3 gen_index.py chemin/vers/logo512.py
import importlib.util, os, sys

spec = importlib.util.spec_from_file_location("logo512", sys.argv[1])
L = importlib.util.module_from_spec(spec); spec.loader.exec_module(L)
DX, DY, DR = L.DOT
import re as _re
_n = [float(v) for v in _re.findall(r"-?\d+\.?\d*", L.LETTER)]
LCX, LCY = (min(_n[0::2]) + max(_n[0::2])) / 2, (min(_n[1::2]) + max(_n[1::2])) / 2
HERE = os.path.dirname(os.path.abspath(__file__))
QR = open(os.path.join(HERE, "qr_rows.txt")).read().strip().split(",")
N = len(QR); CELL = 600 / N

qr_rects = "".join(
    f'<rect class="m" data-d="{r + c}" x="{c * CELL:.2f}" y="{r * CELL:.2f}" width="{CELL + 0.6:.2f}" height="{CELL + 0.6:.2f}"/>'
    for r in range(N) for c in range(N) if QR[r][c] == "1")

LIST = ["Attendre la carte", "Chercher un serveur", "Répéter sa commande"]
list_html = "\n".join(
    f'<div class="item" id="it{i}"><span class="idx">0{i + 1}</span><span class="itx">{t}<i class="strike"></i></span></div>'
    for i, t in enumerate(LIST))

CHIPS = [("SANS APPLI", 0, 0, -3), ("SANS COMPTE", 1, 0, 2), ("QR CODE & NFC", 0, 1, 2),
         ("PAIEMENT AU COMPTOIR", 1, 1, -2), ("INSTALLATION INCLUSE", 0, 2, -2), ("TABLETTE FOURNIE", 1, 2, 3)]
chips_html = "\n".join(
    f'<div class="chip" id="ch{i}" data-r="{r}" style="left:{80 + col * 470}px;top:{800 + row * 150}px"><i></i>{t}</div>'
    for i, (t, col, row, r) in enumerate(CHIPS))

def reveal(text, cls=""):
    return f'<span class="rv {cls}"><span class="rt">{text}</span><i class="rb"></i></span>'

def chars(text):
    return "".join(f'<span class="c">{"&nbsp;" if ch == " " else ch}</span>' for ch in text)

HEAD = '<img class="mini" src="assets/avostables-logo.svg" alt="">'

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
      .gold {{ background: radial-gradient(120% 75% at 50% 38%, #EAB255 0%, #E0A33A 55%, #CF9230 100%); color: #0C1613; }}
      .ink {{ background: radial-gradient(110% 70% at 50% 45%, #183A2C 0%, #0F241B 55%, #0C1613 100%); color: #F4EFE6; }}
      .mini {{ position: absolute; left: 516px; top: 262px; width: 48px; height: 48px; display: block; }}
      .serif {{ font-family: "Source Serif 4"; font-weight: 500; letter-spacing: -0.02em; line-height: 1.04; }}
      .center {{ position: absolute; left: 60px; right: 60px; text-align: center; }}
      .rv {{ position: relative; display: inline-block; overflow: hidden; vertical-align: top; }}
      .rt {{ display: inline-block; opacity: 0; }}
      .rb {{ position: absolute; inset: 6% -2%; background: #E0A33A; transform: scaleX(0); transform-origin: 0 50%; }}
      .rv.cr .rb {{ background: #F4EFE6; }}

      /* ---------- 1 · lever la main ---------- */
      #hand {{ position: absolute; left: 330px; top: 380px; width: 420px; height: 420px; overflow: visible; }}
      #hand path {{ fill: none; stroke-linecap: round; stroke-linejoin: round; }}
      .stamp {{ position: absolute; left: 0; right: 0; text-align: center; font-size: 112px; color: #1F4D3A; }}
      #st0 {{ top: 850px; }} #st1 {{ top: 990px; }} #st2 {{ top: 1130px; color: #B9822A; }}
      #wait {{ position: absolute; left: 0; right: 0; top: 1360px; text-align: center; font: 700 30px/1 "JetBrains Mono";
        letter-spacing: 0.2em; color: #1F4D3A; }}
      #wait b {{ display: inline-block; min-width: 4.6em; text-align: left; color: #B9822A; }}
      .door {{ position: absolute; top: 0; width: 541px; height: 1920px;
        background: radial-gradient(120% 75% at 50% 40%, #24573F 0%, #1F4D3A 55%, #173B2D 100%); }}
      #doorL {{ left: 0; }} #doorR {{ right: 0; }}

      /* ---------- 2 · c'est fini ---------- */
      #t2 {{ top: 420px; font-size: 124px; }}
      .item {{ position: absolute; left: 120px; right: 120px; height: 100px; display: flex; align-items: center; gap: 30px;
        font-family: "Source Serif 4"; font-weight: 400; font-size: 66px; letter-spacing: -0.01em; color: #F4EFE6; }}
      #it0 {{ top: 780px; }} #it1 {{ top: 930px; }} #it2 {{ top: 1080px; }}
      .idx {{ font: 700 26px/1 "JetBrains Mono"; letter-spacing: 0.1em; color: #E0A33A; }}
      .itx {{ position: relative; white-space: nowrap; }}
      .strike {{ position: absolute; left: -8px; right: -8px; top: 54%; height: 8px; border-radius: 4px; background: #E0A33A;
        transform: scaleX(0); transform-origin: 0 50%; }}
      #t2b {{ top: 1290px; font: 700 26px/1 "JetBrains Mono"; letter-spacing: 0.2em; color: #E0A33A; }}

      /* ---------- 3 · le QR se construit ---------- */
      #t3a {{ top: 400px; font: 700 30px/1 "JetBrains Mono"; letter-spacing: 0.3em; color: #173B2D; }}
      #qrBox {{ position: absolute; left: 240px; top: 520px; width: 600px; height: 600px; transform-origin: 72px 72px; }}
      #qrBox svg {{ position: relative; display: block; width: 600px; height: 600px; overflow: visible; }}
      #qrBox .m {{ fill: #0C1613; }}
      #qrPad {{ position: absolute; left: -36px; top: -36px; width: 672px; height: 672px; border-radius: 34px; background: #F4EFE6;
        box-shadow: 0 24px 50px rgba(12, 22, 19, 0.22); }}
      .bk {{ position: absolute; width: 90px; height: 90px; border: 0 solid #0C1613; }}
      #k1 {{ left: -70px; top: -70px; border-width: 12px 0 0 12px; border-top-left-radius: 18px; }}
      #k2 {{ right: -70px; top: -70px; border-width: 12px 12px 0 0; border-top-right-radius: 18px; }}
      #k3 {{ left: -70px; bottom: -70px; border-width: 0 0 12px 12px; border-bottom-left-radius: 18px; }}
      #k4 {{ right: -70px; bottom: -70px; border-width: 0 12px 12px 0; border-bottom-right-radius: 18px; }}
      #beam {{ position: absolute; left: -20px; right: -20px; top: 0; height: 10px; border-radius: 5px; background: #F4EFE6;
        box-shadow: 0 0 26px 8px rgba(255, 253, 246, 0.7); opacity: 0; }}
      #t3b {{ top: 1262px; font-size: 88px; color: #0C1613; white-space: nowrap; }}
      #t3c {{ top: 1364px; font-size: 88px; color: #173B2D; white-space: nowrap; }}
      #fill3 {{ position: absolute; inset: 0; background: #0C1613; opacity: 0; }}

      /* ---------- 4 · compte à rebours ---------- */
      #ring {{ position: absolute; left: 240px; top: 560px; width: 600px; height: 600px; overflow: visible; }}
      .digit {{ position: absolute; left: 0; right: 0; top: 590px; height: 540px; text-align: center;
        font: 600 500px/540px "Source Serif 4"; color: #F4EFE6; opacity: 0; }}
      #t4 {{ top: 1250px; font-size: 104px; }}
      #t4b {{ top: 1388px; font: 700 26px/1 "JetBrains Mono"; letter-spacing: 0.18em; color: #E0A33A; }}

      /* ---------- 5 · pastilles ---------- */
      #t5 {{ top: 420px; font-size: 112px; color: #1F4D3A; }}
      #t5 .w {{ display: inline-block; }}
      .chip {{ position: absolute; width: 450px; height: 110px; border: 4px solid #0C1613; border-radius: 55px; background: #E7DCC6;
        display: flex; align-items: center; justify-content: center; gap: 16px; font: 700 27px/1 "JetBrains Mono";
        letter-spacing: 0.06em; color: #0C1613; white-space: nowrap; }}
      .chip i {{ width: 18px; height: 18px; border-radius: 50%; background: #1F4D3A; display: block; flex: none; }}
      #t5b {{ top: 1290px; font-size: 76px; color: #B9822A; }}

      /* ---------- 6 · fin ---------- */
      #eMark {{ position: absolute; left: 390px; top: 450px; width: 300px; height: 300px; }}
      #eMark svg {{ display: block; width: 100%; height: 100%; overflow: visible; }}
      #eWord {{ top: 810px; font-size: 132px; color: #F4EFE6; white-space: nowrap; }}
      #eWord .c {{ display: inline-block; }}
      #eTag {{ top: 990px; font-size: 86px; color: #E0A33A; white-space: nowrap; }}
      #eMono {{ top: 1150px; font: 500 24px/1 "JetBrains Mono"; letter-spacing: 0.16em; color: #F4EFE6; opacity: 0.85; }}
      #eCta {{ top: 1470px; font: 700 28px/1 "JetBrains Mono"; letter-spacing: 0.18em; color: #E0A33A; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="21.5" data-width="1080" data-height="1920">

      <!-- 1 · lever la main -->
      <div id="s1" class="scene cream clip" data-start="0" data-duration="3.85" data-track-index="0">
        {HEAD}
        <svg id="hand" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <g id="handG">
            <path class="hs" d="M168 300V372C168 432 214 474 274 474H296C356 474 402 432 402 372V292" stroke="#1F4D3A" stroke-width="30"/>
            <path class="hs" d="M196 300V150" stroke="#1F4D3A" stroke-width="30"/>
            <path class="hs" d="M252 292V118" stroke="#1F4D3A" stroke-width="30"/>
            <path class="hs" d="M308 292V134" stroke="#1F4D3A" stroke-width="30"/>
            <path class="hs" d="M364 300V178" stroke="#1F4D3A" stroke-width="30"/>
            <path class="hs" d="M168 352C150 322 122 300 98 310C84 330 110 372 150 420" stroke="#1F4D3A" stroke-width="30"/>
          </g>
          <path id="arc1" d="M444 156C470 186 470 236 444 266" stroke="#E0A33A" stroke-width="22"/>
          <path id="arc2" d="M482 122C524 174 524 248 482 300" stroke="#E0A33A" stroke-width="22"/>
        </svg>
        <div id="st0" class="stamp serif">Lever la main.</div>
        <div id="st1" class="stamp serif">Attendre.</div>
        <div id="st2" class="stamp serif">Recommencer.</div>
        <div id="wait">ATTENTE · <b id="waitT">00:00</b></div>
        <div id="doorL" class="door"></div><div id="doorR" class="door"></div>
      </div>

      <!-- 2 · c'est fini -->
      <div id="s2" class="scene green clip" data-start="3.55" data-duration="4.3" data-track-index="1">
        {HEAD}
        <div id="t2" class="center serif">{reveal("Ça,")} {reveal("c'est fini.")}</div>
        {list_html}
        <div id="t2b" class="center">PLUS D'ATTENTE · PLUS D'ALLERS-RETOURS</div>
      </div>

      <!-- 3 · le QR se construit -->
      <div id="s3" class="scene gold clip" data-start="6.95" data-duration="3.95" data-track-index="2">
        {HEAD}
        <div id="t3a" class="center">MAINTENANT</div>
        <div id="qrBox"><div id="qrPad"></div>
          <svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">{qr_rects}</svg>
          <div class="bk" id="k1"></div><div class="bk" id="k2"></div><div class="bk" id="k3"></div><div class="bk" id="k4"></div>
          <div id="beam"></div>
        </div>
        <div id="t3b" class="center serif">Vos clients scannent…</div>
        <div id="t3c" class="center serif">…et commandent.</div>
        <div id="fill3"></div>
      </div>

      <!-- 4 · compte à rebours -->
      <div id="s4" class="scene ink clip" data-start="10.6" data-duration="3.7" data-track-index="3">
        {HEAD}
        <svg id="ring" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="300" cy="300" r="280" fill="none" stroke="#24573F" stroke-width="16"/>
          <circle id="ringFg" cx="300" cy="300" r="280" fill="none" stroke="#E0A33A" stroke-width="16" stroke-linecap="round" transform="rotate(-90 300 300)"/>
          <path id="check" d="M190 310L265 385L420 220" fill="none" stroke="#E0A33A" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div id="d3" class="digit">3</div><div id="d2" class="digit">2</div><div id="d1" class="digit">1</div>
        <div id="t4" class="center serif">{reveal("Déjà en salle.", "cr")}</div>
        <div id="t4b" class="center">COMMANDE N° 001 · TABLE 4 · REÇUE</div>
      </div>

      <!-- 5 · pastilles -->
      <div id="s5" class="scene cream clip" data-start="13.75" data-duration="3.95" data-track-index="4">
        {HEAD}
        <div id="t5" class="center serif"><span class="w">Sans</span> <span class="w">appli,</span><br><span class="w">sans</span> <span class="w">compte.</span></div>
        {chips_html}
        <div id="t5b" class="center serif">Et on installe tout.</div>
      </div>

      <!-- 6 · fin -->
      <div id="s6" class="scene green clip" data-start="17.25" data-duration="4.25" data-track-index="5">
        <div id="eMark"><svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-label="À vos tables">
          <rect id="eTile" width="512" height="512" rx="112" fill="{L.GREEN}" />
          <path id="eLetter" d="{L.LETTER}" fill="{L.CREAM}" fill-rule="evenodd" />
          <path id="eAccent" d="{L.ACCENT}" fill="{L.CREAM}" />
          <circle id="eDot" cx="{DX:.1f}" cy="{DY:.1f}" r="{DR:.1f}" fill="{L.GOLD}" />
        </svg></div>
        <div id="eWord" class="center serif">{chars("À vos tables")}</div>
        <div id="eTag" class="center serif">{reveal("Le service,", "cr")} {reveal("sans courir.", "cr")}</div>
        <div id="eMono" class="center">QR CODE · NFC · PAIEMENT AU COMPTOIR</div>
        <div id="eCta" class="center">↓ DEMANDEZ VOTRE DÉMO ↓</div>
      </div>

      <audio id="el-audio" src="assets/audio/story-mix.wav" data-start="0" data-duration="21.5" data-track-index="10" data-volume="1"></audio>
    </div>

    <script>
      (function () {{
        var tl = gsap.timeline({{ paused: true }});
        var $ = function (s) {{ return document.querySelector(s); }};
        var $$ = function (s) {{ return Array.prototype.slice.call(document.querySelectorAll(s)); }};
        // trait dessiné : le motif commence dans le vide, pour qu'aucun bout arrondi ne s'affiche avant le tracé
        function dash(el) {{ var n = el.getTotalLength(); el.style.strokeDasharray = n + " " + (n + 120); return n; }}
        // révélation par barre : la barre passe, le texte apparaît derrière elle
        function bar(rv, t) {{
          var b = rv.querySelector(".rb"), tx = rv.querySelector(".rt");
          tl.fromTo(b, {{ scaleX: 0, transformOrigin: "0% 50%" }}, {{ scaleX: 1, duration: 0.2, ease: "power2.in" }}, t);
          tl.set(tx, {{ opacity: 1 }}, t + 0.2);
          tl.set(b, {{ transformOrigin: "100% 50%" }}, t + 0.2);
          tl.to(b, {{ scaleX: 0, duration: 0.24, ease: "power2.out" }}, t + 0.2);
        }}

        // ---------- 1 · lever la main (voix : 0,40 · 1,48 · 2,51)
        $$("#hand .hs").forEach(function (p, k) {{
          var n = dash(p);
          tl.fromTo(p, {{ strokeDashoffset: n + 60 }}, {{ strokeDashoffset: 0, duration: 0.42, ease: "power2.out" }}, 0.1 + k * 0.05);
        }});
        tl.fromTo("#handG", {{ rotation: 0, svgOrigin: "285 474" }}, {{ rotation: -14, svgOrigin: "285 474", duration: 0.25, ease: "sine.inOut", yoyo: true, repeat: 9 }}, 0.55);
        ["#arc1", "#arc2"].forEach(function (a, k) {{
          var n = dash($(a));
          tl.fromTo(a, {{ strokeDashoffset: n + 60, opacity: 1 }}, {{ strokeDashoffset: 0, duration: 0.25, ease: "power2.out" }}, 0.7 + k * 0.08);
        }});
        tl.to(["#arc1", "#arc2"], {{ opacity: 0.25, duration: 0.25, yoyo: true, repeat: 7, ease: "none" }}, 1.0);
        [["#st0", 0.36, -3], ["#st1", 1.44, 2], ["#st2", 2.47, -2]].forEach(function (s, k, all) {{
          tl.fromTo(s[0], {{ scale: 1.7, opacity: 0, rotation: s[2] * 2 }}, {{ scale: 1, opacity: 1, rotation: s[2], duration: 0.22, ease: "power4.in" }}, s[1]);
          tl.fromTo("#hand", {{ y: 0 }}, {{ y: 10, duration: 0.06, yoyo: true, repeat: 1, ease: "none", immediateRender: false }}, s[1] + 0.22);
          if (k > 0) tl.to(all[k - 1][0], {{ opacity: 0.32, duration: 0.25 }}, s[1] + 0.1);
        }});
        var wt = {{ v: 0 }}, wEl = $("#waitT");
        tl.fromTo(wt, {{ v: 0 }}, {{ v: 252, duration: 3.0, ease: "power1.in",
          onUpdate: function () {{ var s = Math.round(wt.v); wEl.textContent = ("0" + Math.floor(s / 60)).slice(-2) + ":" + ("0" + (s % 60)).slice(-2); }} }}, 0.3);
        tl.fromTo("#wait", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.3 }}, 0.3);
        // les portes vertes se referment sur la scène
        tl.fromTo("#doorL", {{ x: -541 }}, {{ x: 0, duration: 0.4, ease: "power3.inOut" }}, 3.2);
        tl.fromTo("#doorR", {{ x: 541 }}, {{ x: 0, duration: 0.4, ease: "power3.inOut" }}, 3.2);

        // ---------- 2 · c'est fini (voix : « Ça, » 3,90 · « c'est fini. » 4,54 · 5,56 · 6,55)
        var rv2 = $$("#t2 .rv"); bar(rv2[0], 3.8); bar(rv2[1], 4.46);
        [[0, 4.95, 5.55], [1, 5.45, 6.05], [2, 5.95, 6.62]].forEach(function (s) {{
          var it = "#it" + s[0];
          tl.fromTo(it, {{ x: -60, opacity: 0 }}, {{ x: 0, opacity: 1, duration: 0.35, ease: "power3.out" }}, s[1]);
          tl.fromTo(it + " .strike", {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.3, ease: "power2.inOut" }}, s[2]);
          tl.to(it + " .itx", {{ opacity: 0.45, duration: 0.3 }}, s[2] + 0.1);
        }});
        tl.fromTo("#t2b", {{ opacity: 0, y: 16 }}, {{ opacity: 1, y: 0, duration: 0.35 }}, 6.7);
        // la scène verte monte, la scène dorée arrive par en dessous
        tl.to("#s2", {{ y: -1920, duration: 0.45, ease: "power3.inOut" }}, 7.15);

        // ---------- 3 · le QR se construit (voix : « Maintenant, » 7,79 · « vos clients scannent, » 8,64 · « et commandent. » 9,77)
        tl.fromTo("#s3", {{ y: 1920 }}, {{ y: 0, duration: 0.45, ease: "power3.inOut" }}, 7.15);
        tl.fromTo("#t3a", {{ opacity: 0, scaleX: 1.35 }}, {{ opacity: 1, scaleX: 1, duration: 0.5, ease: "power3.out" }}, 7.72);
        tl.fromTo("#qrPad", {{ scale: 0.6, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.6)" }}, 7.6);
        tl.fromTo("#qrBox .m", {{ scale: 0, transformOrigin: "50% 50%" }}, {{ scale: 1, duration: 0.2, ease: "back.out(2)",
          stagger: function (i, el) {{ return +el.getAttribute("data-d") * 0.019; }} }}, 7.8);
        tl.fromTo("#qrBox .bk", {{ scale: 1.25, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.3, ease: "power3.out", stagger: 0.04 }}, 8.55);
        tl.fromTo("#beam", {{ opacity: 0, y: 0 }}, {{ opacity: 1, duration: 0.06 }}, 8.75);
        tl.fromTo("#beam", {{ y: 0 }}, {{ y: 590, duration: 0.55, ease: "power1.inOut", immediateRender: false }}, 8.78);
        tl.to("#beam", {{ opacity: 0, duration: 0.1 }}, 9.33);
        tl.fromTo("#t3b", {{ y: 50, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }}, 8.6);
        tl.fromTo("#t3c", {{ y: 50, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }}, 9.73);
        // on plonge dans le carré noir du QR code
        tl.to("#qrBox", {{ scale: 44, duration: 0.5, ease: "power4.in" }}, 10.2);
        tl.to(["#t3a", "#t3b", "#t3c"], {{ opacity: 0, duration: 0.2 }}, 10.2);
        tl.fromTo("#fill3", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.12 }}, 10.6);

        // ---------- 4 · compte à rebours (voix : 10,99 · 11,57 · 12,30 · « la commande… » 12,67)
        var C = 2 * Math.PI * 280, fg = $("#ringFg"); fg.style.strokeDasharray = C + " " + C;
        tl.fromTo(fg, {{ strokeDashoffset: 0 }}, {{ strokeDashoffset: C, duration: 1.75, ease: "none" }}, 10.85);
        [["#d3", 10.95], ["#d2", 11.53], ["#d1", 12.26]].forEach(function (d) {{
          tl.fromTo(d[0], {{ scale: 1.45, opacity: 0, filter: "blur(10px)" }}, {{ scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.16, ease: "power3.out" }}, d[1]);
          tl.to(d[0], {{ scale: 0.7, opacity: 0, duration: 0.14, ease: "power2.in" }}, d[1] + 0.42);
        }});
        // la commande est reçue : le cercle doré se referme autour de la coche
        tl.to(fg, {{ strokeDashoffset: 0, duration: 0.38, ease: "power2.out" }}, 12.66);
        var ck = $("#check"), ckn = dash(ck);
        tl.fromTo(ck, {{ strokeDashoffset: ckn + 60 }}, {{ strokeDashoffset: 0, duration: 0.32, ease: "power2.out" }}, 12.7);
        tl.fromTo("#ring", {{ scale: 1 }}, {{ scale: 1.06, duration: 0.14, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false, transformOrigin: "50% 50%" }}, 12.95);
        bar($("#t4 .rv"), 12.62);
        tl.fromTo("#t4b", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.3 }}, 13.15);

        // ---------- 5 · pastilles (voix : 14,26 · 15,17 · « Et on installe tout. » 16,29)
        tl.fromTo("#s5", {{ clipPath: "circle(0% at 540px 860px)" }}, {{ clipPath: "circle(130% at 540px 860px)", duration: 0.5, ease: "power3.inOut" }}, 13.72);
        $$("#t5 .w").forEach(function (w, k) {{
          tl.fromTo(w, {{ y: -90, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.38, ease: "back.out(2.2)" }}, (k < 2 ? 14.22 : 15.13) + (k % 2) * 0.12);
        }});
        $$(".chip").forEach(function (c, k) {{
          var r = +c.getAttribute("data-r");
          tl.fromTo(c, {{ scale: 0, rotation: r * 4 }}, {{ scale: 1, rotation: r, duration: 0.5, ease: "elastic.out(1, 0.6)" }}, 14.45 + k * 0.17);
        }});
        tl.to(".chip", {{ y: -8, duration: 0.5, yoyo: true, repeat: 3, ease: "sine.inOut", stagger: 0.1 }}, 15.5);
        tl.to(["#ch4", "#ch5"], {{ backgroundColor: "#E0A33A", duration: 0.2 }}, 16.3);
        tl.fromTo(["#ch4", "#ch5"], {{ scale: 1 }}, {{ scale: 1.08, duration: 0.15, yoyo: true, repeat: 1, immediateRender: false }}, 16.3);
        tl.fromTo("#t5b", {{ y: 40, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }}, 16.25);
        tl.to(".chip", {{ x: function (i) {{ return (i % 2 ? 1 : -1) * 700; }}, rotation: function (i) {{ return (i % 2 ? 20 : -20); }}, duration: 0.45, ease: "power3.in" }}, 17.15);

        // ---------- 6 · fin (voix : « À vos tables. » 17,72 · « Le service, » 18,86 · « sans courir. » 19,87)
        tl.fromTo("#s6", {{ y: 1920 }}, {{ y: 0, duration: 0.45, ease: "power3.inOut" }}, 17.25);
        tl.fromTo("#eTile", {{ y: -420, svgOrigin: "256 256" }}, {{ y: 0, duration: 0.7, ease: "bounce.out" }}, 17.55);
        tl.fromTo("#eLetter", {{ scale: 0.15, opacity: 0, svgOrigin: "{LCX:.0f} {LCY:.0f}" }}, {{ scale: 1, opacity: 1, svgOrigin: "{LCX:.0f} {LCY:.0f}", duration: 0.7, ease: "elastic.out(1, 0.55)" }}, 17.95);
        tl.fromTo("#eAccent", {{ y: -260, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.45, ease: "bounce.out" }}, 18.3);
        tl.fromTo("#eDot", {{ x: 520, opacity: 0 }}, {{ x: 0, opacity: 1, duration: 0.55, ease: "power2.out" }}, 18.45);
        tl.fromTo("#eDot", {{ y: -150 }}, {{ y: 0, duration: 0.55, ease: "bounce.out" }}, 18.45);
        tl.fromTo("#eWord .c", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.2, ease: "power2.out", stagger: 0.035 }}, 17.68);
        var rv6 = $$("#eTag .rv"); bar(rv6[0], 18.8); bar(rv6[1], 19.8);
        tl.fromTo("#eMono", {{ opacity: 0 }}, {{ opacity: 0.85, duration: 0.4 }}, 20.25);
        tl.fromTo("#eCta", {{ y: 20, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }}, 20.45);
        tl.fromTo("#eCta", {{ scale: 1 }}, {{ scale: 1.05, duration: 0.3, yoyo: true, repeat: 1, ease: "sine.inOut", immediateRender: false }}, 20.85);
        tl.to({{}}, {{ duration: 21.5 }}, 0);
        window.__timelines = window.__timelines || {{}};
        window.__timelines["main"] = tl;
      }})();
    </script>
  </body>
</html>
"""
open(os.path.join(HERE, "index.html"), "w").write(HTML)
print("ok", sum(row.count("1") for row in QR), "modules")
