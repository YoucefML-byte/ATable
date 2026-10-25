# Changement de marque de la vidéo : « Atable » devient « À vos tables » (logo « À. » fourni par le porteur).
# Agit sur le projet HyperFrames (compositions/frames/*.html, assets/). Idempotent.
import os, re, sys, shutil, glob
sys.path.insert(0, os.environ["SCRATCH"] + "/logo")
import logo512 as L
P = os.environ["SCRATCH"] + "/proj/atable-promo"
F = P + "/compositions/frames"

# 1) logo en fichier : nouvelle tuile ; l'ancien fichier disparaît
shutil.copy(os.environ["SCRATCH"] + "/logo/avostables-logo.svg", P + "/assets/avostables-logo.svg")
if os.path.exists(P + "/assets/atable-logo.svg"): os.remove(P + "/assets/atable-logo.svg")

def sub(path, old, new, count=None, regex=False):
    s = open(path).read()
    n = len(re.findall(old, s)) if regex else s.count(old)
    if count is not None and n != count and new not in s:
        raise SystemExit(f"{os.path.basename(path)}: {n} × {old!r} (attendu {count})")
    s = re.sub(old, new, s) if regex else s.replace(old, new)
    open(path, "w").write(s)

for f in glob.glob(F + "/*.html"):
    sub(f, 'src="assets/atable-logo.svg"', 'src="assets/avostables-logo.svg"')
    sub(f, ">ATABLE<", ">À VOS TABLES<")
    sub(f, "ATABLE · QR · TABLE 4", "À VOS TABLES · QR · TABLE 4")
sub(F + "/05-en-salle.html", r"(\n\s*)ATABLE(\n)", r"\1À VOS TABLES\2", regex=True)
sub(F + "/09-les-chiffres.html", "pro.atable.fr/bistrot/tableau-de-bord", "pro.avostables.fr/bistrot/tableau-de-bord", 1)
sub(F + "/10-en-confiance.html", "console.atable.fr", "console.avostables.fr", 1)

# 2) 02 — la promesse : logo imprimé sur le ticket + nom
p = F + "/02-la-promesse.html"; s = open(p).read()
a = s.index('<div id="02-la-promesse-logo">'); b = s.index("</svg>", a) + len("</svg>")
cx, cy, r = L.DOT
NEW = f'''<div id="02-la-promesse-logo">
            <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect id="02-la-promesse-logo-fill" width="512" height="512" rx="112" fill="{L.GREEN}" fill-opacity="0" />
              <rect id="02-la-promesse-logo-outline" x="6" y="6" width="500" height="500" rx="106" fill="none" stroke="{L.GREEN}" stroke-width="12" />
              <path id="02-la-promesse-logo-letter" d="{L.LETTER}" fill="{L.CREAM}" fill-opacity="0" fill-rule="evenodd" stroke="{L.CREAM}" stroke-width="7" stroke-linejoin="round" />
              <path id="02-la-promesse-logo-accent" d="{L.ACCENT}" fill="{L.CREAM}" fill-opacity="0" stroke="{L.CREAM}" stroke-width="7" stroke-linejoin="round" />
              <circle id="02-la-promesse-logo-centre" cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="{L.GOLD}" fill-opacity="0" />
              <circle id="02-la-promesse-logo-centre-outline" cx="{cx:.1f}" cy="{cy:.1f}" r="{r - 4:.1f}" fill="none" stroke="{L.GOLD}" stroke-width="8" />
            </svg>'''
if "logo-letter" not in s:
    s = s[:a] + NEW + s[b:]
OLD_ANIM = s[s.index('      draw("logo-outline"'):s.index('      // the mark grows into place')]
NEW_ANIM = '''      // le contour d'un tracé s'efface quand son aplat arrive (la lettre garde sa graisse)
      function settle(name, start, dur) {
        fill(name, start, dur);
        tl.fromTo(el(name), { strokeOpacity: 1 }, { strokeOpacity: 0, duration: dur, ease: "power1.out" }, start);
      }
      draw("logo-outline", 1818, 3.0, 0.4); // green tile outline
      fill("logo-fill", 3.28, 0.24); // tile fills in
      draw("logo-letter", 1700, 3.3, 0.44); // the À, outline first
      settle("logo-letter", 3.66, 0.22);
      draw("logo-accent", 260, 3.72, 0.22); // grave accent
      settle("logo-accent", 3.9, 0.16);
      draw("logo-centre-outline", 150, 3.8, 0.24); // gold full stop
      settle("logo-centre-outline", 3.98, 0.12);
      fill("logo-centre", 3.98, 0.2);
'''
s = s.replace(OLD_ANIM, NEW_ANIM)
s = s.replace('<div id="02-la-promesse-wordmark">Atable</div>', '<div id="02-la-promesse-wordmark">À vos tables</div>')
s = s.replace('''      left: 120px;
      top: 268px;
      font-family: "Source Serif 4", serif;
      font-weight: 500;
      font-size: 11.5cqw;''', '''      left: 120px;
      top: 340px;
      font-family: "Source Serif 4", serif;
      font-weight: 500;
      font-size: 7.5cqw;''')
open(p, "w").write(s)

# 3) 11 — carte de fin : logo dessiné puis posé, nom
p = F + "/11-atable.html"; s = open(p).read()
a = s.index('<svg viewBox="0 0 512 512"', s.index('<div id="11-atable-mark">')); b = s.index("</svg>", a) + len("</svg>")
s = s[:a] + f'''<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-label="À vos tables">
          <rect id="11-atable-tile" width="512" height="512" rx="112" fill="{L.GREEN}" />
          <path id="11-atable-letter" d="{L.LETTER}" fill="{L.CREAM}" fill-rule="evenodd" stroke="{L.CREAM}" stroke-width="7" stroke-linejoin="round" />
          <path id="11-atable-accent" d="{L.ACCENT}" fill="{L.CREAM}" />
          <circle id="11-atable-dot" cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="{L.GOLD}" />
        </svg>''' + s[b:]
s = s.replace('<div id="11-atable-wordmark">Atable</div>', '<div id="11-atable-wordmark">À vos tables</div>')
s = s.replace('''      top: 222px;
      text-align: center;
      font-size: 11.5cqw;''', '''      top: 262px;
      text-align: center;
      font-size: 8.4cqw;''')
s = s.replace('''      var ring = byId("ring");
      var fork = byId("fork");
      var handle = byId("handle");
      var knife = byId("knife");
      var centre = byId("centre");''', '''      var tile = byId("tile");
      var letter = byId("letter");
      var accent = byId("accent");
      var dot = byId("dot");''')
s = s.replace('''      var ringLen = dashLength(ring);
      var forkLen = dashLength(fork);
      var handleLen = dashLength(handle);
      var knifeLen = dashLength(knife);''', '''      var letterLen = dashLength(letter);''')
A0 = s.index("      // plate ring from 12 o'clock"); A1 = s.index("      // the wordmark lands below")
s = s[:A0] + f'''      // la tuile apparaît, le « À » se trace puis se remplit, l'accent tombe, le point doré éclot
      tl.fromTo(tile, {{ scale: 0.86, opacity: 0, svgOrigin: "256 256" }}, {{ scale: 1, opacity: 1, svgOrigin: "256 256", duration: 0.3, ease: "power3.out" }}, 0.02);
      tl.fromTo(letter, {{ strokeDashoffset: letterLen + 40 }}, {{ strokeDashoffset: 0, duration: 0.34, ease: "power2.out" }}, 0.08);
      tl.fromTo(letter, {{ fillOpacity: 0, strokeOpacity: 1 }}, {{ fillOpacity: 1, strokeOpacity: 0, duration: 0.18, ease: "power1.out" }}, 0.3);
      tl.fromTo(accent, {{ y: -70, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.28, ease: "power3.out" }}, 0.36);
      tl.fromTo(
        dot,
        {{ scale: 0, svgOrigin: "{cx:.1f} {cy:.1f}" }},
        {{ scale: 1, svgOrigin: "{cx:.1f} {cy:.1f}", duration: 0.32, ease: "back.out(2)" }},
        0.46
      );

''' + s[A1:]
open(p, "w").write(s)
print("ok")
