# Pièces partagées des plans « installation » (02a/02b/02c) et du plan 03 :
# polices, rail d'installation, plaque métal (3 finitions), autocollant QR, monde 3D de la table.
import math

INK, CREAM, CREAM2, GREEN, GOLD, GOLD_DEEP = "#0C1613", "#F4EFE6", "#E7DCC6", "#1F4D3A", "#E0A33A", "#B9822A"
ORANGE = "#B45309"

# finitions métal à plat : base, facettes claires, ombre, biseau, gravure
FIN = {
    "gold":   dict(base="#D6AE57", mid="#E4C373", light="#F2D893", shade="#C79E48", dark="#A9832F", eng="#584313"),
    "rose":   dict(base="#D9A193", mid="#E7B5A8", light="#F5D0C6", shade="#CB9081", dark="#AE7466", eng="#5E3328"),
    "silver": dict(base="#C3C8CD", mid="#D6DADE", light="#EDF0F2", shade="#B3B9BF", dark="#959CA3", eng="#3E454C"),
}

FONTS = """    @font-face { font-family: "Source Serif 4"; src: url("assets/fonts/SourceSerif4-400.woff2") format("woff2"); font-weight: 400; font-style: normal; font-display: block; }
    @font-face { font-family: "Source Serif 4"; src: url("assets/fonts/SourceSerif4-500.woff2") format("woff2"); font-weight: 500; font-style: normal; font-display: block; }
    @font-face { font-family: "JetBrains Mono"; src: url("assets/fonts/JetBrainsMono-500.woff2") format("woff2"); font-weight: 500; font-style: normal; font-display: block; }
    @font-face { font-family: "JetBrains Mono"; src: url("assets/fonts/JetBrainsMono-700.woff2") format("woff2"); font-weight: 700; font-style: normal; font-display: block; }
"""


def C(P, name):
    """sélecteur de classe préfixé (convention du film : [class~="<id>-x"])"""
    return f'[class~="{P}-{name}"]'


def I(P, name):
    return f'[id="{P}-{name}"]'


# ----------------------------------------------------------------------------- rail d'installation
STATIONS = [(660, "01 PLAQUE"), (1140, "02 TABLE"), (1620, "03 TABLETTE")]


def rail_css(P, line):
    return f"""
    /* ---------- rail d'installation (même grammaire que le rail ticket) ---------- */
    {I(P, "rail")} {{ position: absolute; inset: 0; z-index: 8; }}
    {I(P, "logo")} {{ position: absolute; left: 96px; top: 44px; width: 40px; height: 40px; display: block; }}
    {I(P, "wordmark")} {{
      position: absolute; left: 152px; top: 44px; height: 40px; line-height: 40px;
      font-family: "JetBrains Mono"; font-weight: 700; font-size: 18px; letter-spacing: 0.18em;
      text-transform: uppercase; color: {line}; white-space: nowrap;
    }}
    {I(P, "railline")} {{ position: absolute; left: 640px; top: 63px; width: 1000px; height: 2px; background: {line}; }}
    {C(P, "dot")} {{
      position: absolute; top: 57px; width: 14px; height: 14px; box-sizing: border-box;
      border: 2px solid {line}; border-radius: 50%;
    }}
    {C(P, "lbl")} {{
      position: absolute; top: 82px; width: 220px; height: 20px; line-height: 20px; text-align: center;
      font-family: "JetBrains Mono"; font-weight: 500; font-size: 15px; letter-spacing: 0.14em; padding-left: 0.14em;
      box-sizing: border-box; text-transform: uppercase; color: {line}; white-space: nowrap;
    }}
    {C(P, "future")} {{ opacity: 0.45; }}
    {I(P, "tag")} {{
      position: absolute; top: 16px; width: 136px; height: 30px; box-sizing: border-box;
      background: {CREAM2}; border: 2px solid {INK}; border-radius: 6px;
      font-family: "JetBrains Mono"; font-weight: 700; font-size: 13px; line-height: 26px; text-align: center;
      color: {INK}; white-space: nowrap;
    }}"""


def rail_html(P, cur, ground, line):
    """cur = index (0..2) de l'étape courante ; étapes passées pleines, futures creuses."""
    dots, lbls = [], []
    for k, (cx, label) in enumerate(STATIONS):
        fill = line if k < cur else ground
        dots.append(f'<div id="{P}-dot{k + 1}" class="{P}-dot" style="left: {cx - 7}px; background: {fill}"></div>')
        fut = f" {P}-future" if k > cur else ""
        lbls.append(f'<div class="{P}-lbl{fut}" style="left: {cx - 110}px">{label}</div>')
    tag_left = STATIONS[cur][0] - 68
    return f"""      <!-- rail d'installation : étape courante {STATIONS[cur][1]} -->
      <div id="{P}-rail">
        <img id="{P}-logo" src="assets/avostables-logo.svg" alt="" />
        <div id="{P}-wordmark">À VOS TABLES</div>
        <div id="{P}-railline"></div>
        {chr(10).join('        ' + d for d in dots).strip()}
        {chr(10).join('        ' + l for l in lbls).strip()}
        <div id="{P}-tag" style="left: {tag_left}px">INSTALLATION</div>
      </div>"""


# ----------------------------------------------------------------------------- plaque métal 560×360
def plate_css(P):
    return f"""
    /* ---------- plaque métal 560×360 : biseau plat, facettes, vis, gravure ---------- */
    {C(P, "plate")} {{ position: absolute; width: 560px; height: 360px; transform-origin: 50% 50%; }}
    {C(P, "pclip")} {{ position: absolute; inset: 0; border-radius: 26px; overflow: hidden; }}
    {C(P, "fin")} {{ position: absolute; inset: 0; }}
    {C(P, "fbase")} {{ position: absolute; inset: 0; box-sizing: border-box; border: 10px solid; border-radius: 26px; }}
    {C(P, "facet")} {{ position: absolute; left: 10px; top: 10px; width: 540px; height: 340px; }}
    {C(P, "facet1")} {{ clip-path: polygon(9% 0, 27% 0, 12% 100%, -6% 100%); }}
    {C(P, "facet2")} {{ clip-path: polygon(31% 0, 34% 0, 19% 100%, 16% 100%); }}
    {C(P, "facet3")} {{ clip-path: polygon(80% 0, 100% 0, 100% 100%, 66% 100%); }}
    {C(P, "screw")} {{ position: absolute; top: 171px; width: 18px; height: 18px; box-sizing: border-box; border: 2px solid; border-radius: 50%; }}
    {C(P, "slot")} {{ position: absolute; left: 2px; top: 6px; width: 10px; height: 2px; transform: rotate(-35deg); }}
    {C(P, "eng")} {{
      position: absolute; left: 0; right: 0; top: 302px; height: 20px; line-height: 20px; text-align: center;
      font-family: "JetBrains Mono"; font-weight: 700; font-size: 14px; letter-spacing: 0.42em; padding-left: 0.42em;
    }}
    {C(P, "sheen")} {{ position: absolute; left: 0; top: -60px; width: 120px; height: 480px; background: #FFFDF6; opacity: 0.55; }}
    {C(P, "pol")} {{ position: absolute; inset: 0; box-sizing: border-box; border: 2px solid {INK}; border-radius: 26px; }}
    {C(P, "edge")} {{ position: absolute; inset: 0; border-radius: 26px; }}
    {C(P, "glint")} {{
      position: absolute; width: 46px; height: 46px; background: #FFFFFF;
      clip-path: polygon(50% 0, 58% 42%, 100% 50%, 58% 58%, 50% 100%, 42% 58%, 0 50%, 42% 42%);
    }}"""


def finish_html(P, lid, fk, clipped=False):
    f = FIN[fk]
    st = ' style="clip-path: inset(0% 100% 0% 0%)"' if clipped else ""
    return f"""<div id="{P}-{lid}" class="{P}-fin"{st}>
            <div class="{P}-fbase" style="background: {f['base']}; border-color: {f['light']} {f['dark']} {f['dark']} {f['light']}"></div>
            <div class="{P}-facet {P}-facet1" style="background: {f['mid']}"></div>
            <div class="{P}-facet {P}-facet2" style="background: {f['light']}"></div>
            <div class="{P}-facet {P}-facet3" style="background: {f['shade']}"></div>
            <div class="{P}-screw" style="left: 26px; border-color: {f['eng']}; background: {f['mid']}"><div class="{P}-slot" style="background: {f['eng']}"></div></div>
            <div class="{P}-screw" style="left: 516px; border-color: {f['eng']}; background: {f['mid']}"><div class="{P}-slot" style="background: {f['eng']}"></div></div>
            <div class="{P}-eng" style="color: {f['eng']}">À VOS TABLES</div>
          </div>"""


def sticker_css(P):
    return f"""
    /* ---------- autocollant QR 220×250 (coin décollable via --f) ---------- */
    {C(P, "stk")} {{ position: absolute; width: 220px; height: 250px; transform-origin: 50% 50%; }}
    {C(P, "stkface")} {{
      position: absolute; inset: 0; box-sizing: border-box; background: {CREAM}; border: 2px solid {INK}; border-radius: 14px;
      clip-path: polygon(0 0, calc(100% - var(--f)) 0, 100% var(--f), 100% 100%, 0 100%);
    }}
    {C(P, "stkflap")} {{
      position: absolute; inset: 0; background: #D8CDB8;
      clip-path: polygon(calc(100% - var(--f)) 0, 100% var(--f), calc(100% - var(--f)) var(--f));
    }}
    {C(P, "stkqr")} {{ position: absolute; left: 21px; top: 16px; width: 174px; height: 174px; display: block; }}
    {C(P, "stklbl")} {{
      position: absolute; left: 0; right: 0; top: 200px; height: 30px; display: flex; align-items: center; justify-content: center; gap: 8px;
      font-family: "JetBrains Mono"; font-weight: 700; font-size: 18px; letter-spacing: 0.12em; color: {INK}; white-space: nowrap;
    }}
    {C(P, "stklogo")} {{ width: 22px; height: 22px; display: block; }}"""


def sticker_html(P, sid, style=""):
    return f"""<div id="{P}-{sid}" class="{P}-stk" style="--f: 0px;{style}">
            <div class="{P}-stkface">
              <img class="{P}-stkqr" src="assets/table-qr.svg" alt="" />
              <div class="{P}-stklbl"><img class="{P}-stklogo" src="assets/avostables-logo.svg" alt="" />TABLE 4</div>
            </div>
            <div class="{P}-stkflap"></div>
          </div>"""


def plate_html(P, pid, layers, sticker=True, extra_style="", sheen=True):
    """layers: liste (id, finition, masquée) de bas en haut ; l'autocollant est posé au centre (170, 34)."""
    fins = "\n          ".join(finish_html(P, lid, fk, cl) for lid, fk, cl in layers)
    stk = ("\n          " + sticker_html(P, pid + "-stk", " left: 170px; top: 34px;")) if sticker else ""
    sh = f'\n          <div id="{P}-{pid}-sheen" class="{P}-sheen" data-layout-allow-overflow></div>' if sheen else ""
    return f"""<div id="{P}-{pid}" class="{P}-plate"{(' style="' + extra_style + '"') if extra_style else ''}>
        <div class="{P}-pclip" data-layout-allow-occlusion>
          {fins}{sh}{stk}
        </div>
        <div class="{P}-pol"></div>
      </div>"""


# ----------------------------------------------------------------------------- monde 3D de la table
# Unités monde : origine = centre de la table, z = 0 sur le plateau (la plaque y est posée à z ≈ 0,
# ainsi le plan « vue de dessus » raccorde exactement avec la plaque plein cadre).
TABLE_W, TABLE_H, TABLE_T, LEG = 900, 520, 16, 75
SEAT_Z, BACK_H = -30, 72
CHAIRS = [(-210, -1), (210, -1), (-210, 1), (210, 1)]  # x, côté (−1 haut, +1 bas)
SETTINGS = [(-180, -150), (180, -150), (-180, 150), (180, 150)]
PLATE_X = 360  # centre de la plaque au bord gauche (−) ou droit (+)
PLATE_S = 0.25  # plaque 560×360 → 140×90 dans le monde


def world_css(P, on_green=False):
    chair = CREAM if on_green else GREEN
    chair_side = "#DCCFB4" if on_green else "#173B2D"
    return f"""
    /* ---------- monde 3D : caméra = cam (tilt X) > spin (rot Z, échelle) > off (cible) ---------- */
    {I(P, "cam")}, {I(P, "spin")}, {I(P, "off")} {{ position: absolute; left: 0; top: 0; width: 0; height: 0; transform-style: preserve-3d; }}
    {C(P, "g3")} {{ position: absolute; left: 0; top: 0; width: 0; height: 0; transform-style: preserve-3d; }}
    {C(P, "ttop")} {{
      position: absolute; left: {-TABLE_W // 2}px; top: {-TABLE_H // 2}px; width: {TABLE_W}px; height: {TABLE_H}px; box-sizing: border-box;
      background: {CREAM2}; border: 2px solid {INK}; border-radius: 14px;
    }}
    {C(P, "grain")} {{ position: absolute; height: 2px; background: #D9CBAE; border-radius: 1px; }}
    {C(P, "tside")} {{ position: absolute; box-sizing: border-box; background: #CDBE9C; border: 2px solid {INK}; }}
    {C(P, "leg")} {{ position: absolute; box-sizing: border-box; background: #B9A57E; border: 2px solid {INK}; }}
    {C(P, "seat")} {{ position: absolute; width: 180px; height: 128px; box-sizing: border-box; background: {chair}; border: 2px solid {INK}; border-radius: 22px; }}
    {C(P, "back")} {{ position: absolute; width: 180px; height: {BACK_H}px; box-sizing: border-box; background: {chair_side}; border: 2px solid {INK}; border-radius: 10px 10px 0 0; }}
    {C(P, "dish")} {{ position: absolute; width: 120px; height: 120px; box-sizing: border-box; background: {CREAM}; border: 2px solid {INK}; border-radius: 50%; }}
    {C(P, "dishin")} {{ position: absolute; left: 20px; top: 20px; width: 76px; height: 76px; box-sizing: border-box; border: 2px solid #D9CBAE; border-radius: 50%; }}
    {C(P, "cutl")} {{ position: absolute; width: 2px; height: 86px; background: {INK}; border-radius: 1px; }}
    {C(P, "glass")} {{ position: absolute; width: 36px; height: 36px; box-sizing: border-box; background: {CREAM}; border: 2px solid {INK}; border-radius: 50%; }}"""


def tz(z):
    return f"transform: translateZ({z}px)"


def table_html(P, tid, cx=0, cy=0, plate_side=1, full=True, plate_layers=None, plate_id=None, hidden_leaves=False):
    """Table en monde (cx, cy). full = faces latérales, pieds et dossiers (pour la 3D)."""
    vis = "opacity: 0; " if hidden_leaves else ""
    h, hw, hh = [], TABLE_W // 2, TABLE_H // 2
    leaf = f'class="{P}-{tid}-leaf'  # marqueur pour animer l'opacité des feuilles (jamais des groupes 3D)
    if full:
        # pieds (deux plans croisés) puis faces latérales du plateau
        for lx, ly in ((-hw + 40, -hh + 40), (hw - 40, -hh + 40), (-hw + 40, hh - 40), (hw - 40, hh - 40)):
            h.append(f'<div {leaf} {P}-leg" style="{vis}left: {lx - 9}px; top: {ly}px; width: 18px; height: {LEG}px; transform-origin: 50% 0; transform: translateZ(-{TABLE_T}px) rotateX(-90deg)"></div>')
            h.append(f'<div {leaf} {P}-leg" style="{vis}left: {lx}px; top: {ly - 9}px; width: {LEG}px; height: 18px; transform-origin: 0 50%; transform: translateZ(-{TABLE_T}px) rotateY(90deg)"></div>')
        h.append(f'<div {leaf} {P}-tside" style="{vis}left: {-hw}px; top: {hh}px; width: {TABLE_W}px; height: {TABLE_T}px; transform-origin: 50% 0; transform: rotateX(-90deg)"></div>')
        h.append(f'<div {leaf} {P}-tside" style="{vis}left: {-hw}px; top: {-hh}px; width: {TABLE_W}px; height: {TABLE_T}px; transform-origin: 50% 0; transform: rotateX(-90deg)"></div>')
        h.append(f'<div {leaf} {P}-tside" style="{vis}left: {hw}px; top: {-hh}px; width: {TABLE_T}px; height: {TABLE_H}px; transform-origin: 0 50%; transform: rotateY(90deg)"></div>')
        h.append(f'<div {leaf} {P}-tside" style="{vis}left: {-hw}px; top: {-hh}px; width: {TABLE_T}px; height: {TABLE_H}px; transform-origin: 0 50%; transform: rotateY(90deg)"></div>')
    grains = "".join(f'<div class="{P}-grain" style="left: {gx}px; top: {gy}px; width: {gw}px"></div>'
                     for gx, gy, gw in ((70, 128, 300), (430, 196, 380), (120, 318, 420), (560, 392, 250)))
    h.append(f'<div {leaf} {P}-ttop" style="{vis}{tz(0)}">{grains}</div>')
    for sx, sy in SETTINGS:
        h.append(f'<div {leaf} {P}-dish" style="{vis}left: {sx - 60}px; top: {sy - 60}px; {tz(0.3)}"><div class="{P}-dishin"></div></div>')
        h.append(f'<div {leaf} {P}-cutl" style="{vis}left: {sx - 80}px; top: {sy - 43}px; {tz(0.3)}"></div>')
        h.append(f'<div {leaf} {P}-cutl" style="{vis}left: {sx + 78}px; top: {sy - 43}px; {tz(0.3)}"></div>')
        gx = sx + 62 if sx < 0 else sx - 98  # le verre côté intérieur : les bouts de table restent libres pour la plaque
        h.append(f'<div {leaf} {P}-glass" style="{vis}left: {gx}px; top: {sy + (-88 if sy < 0 else 52)}px; {tz(0.3)}"></div>')
    chairs = []
    for k, (x, side) in enumerate(CHAIRS):
        sy = side * (hh + 22 + 64)  # centre du siège
        seat = f'<div {leaf} {P}-seat" style="{vis}left: {x - 90}px; top: {sy - 64}px; {tz(SEAT_Z)}"></div>'
        back = ""
        if full:
            by = sy + side * 64  # bord extérieur du siège
            back = (f'<div {leaf} {P}-back" style="{vis}left: {x - 90}px; top: {by - (BACK_H if side < 0 else 0)}px; '
                    f'transform-origin: 50% {"100%" if side < 0 else "0"}; transform: translateZ({SEAT_Z}px) rotateX({90 if side > 0 else -90}deg)"></div>')
        chairs.append(f'<div id="{P}-{tid}-ch{k}" class="{P}-g3">{seat}{back}</div>')
    plate = ""
    if plate_layers is not None:
        px = plate_side * PLATE_X
        plate = (plate_html(P, plate_id, plate_layers,
                            extra_style=f"left: {px - 280}px; top: -180px; transform: translateZ(0.6px) scale({PLATE_S})")
                 .replace("\n", "\n        "))
    return f"""<div id="{P}-{tid}" class="{P}-g3" style="transform: translate({cx}px, {cy}px)">
          {chr(10).join('          ' + x for x in chairs).strip()}
          {chr(10).join('          ' + x for x in h).strip()}
          {plate}
        </div>"""


# ----------------------------------------------------------------------------- projection caméra (pour les légendes écran)
PERSP, PO = 1700, (1250, 540)


def project(p, cam):
    """p = (x, y, z) monde ; cam = dict(ax, ay, tx, ty, s, rx, rz) -> (x, y) écran"""
    x, y, z = (p[0] - cam["tx"]) * cam["s"], (p[1] - cam["ty"]) * cam["s"], p[2] * cam["s"]
    rz = math.radians(cam["rz"])
    x, y = x * math.cos(rz) - y * math.sin(rz), x * math.sin(rz) + y * math.cos(rz)
    rx = math.radians(cam["rx"])
    y, z = y * math.cos(rx) - z * math.sin(rx), y * math.sin(rx) + z * math.cos(rx)
    X, Y = cam["ax"] + x, cam["ay"] + y
    k = PERSP / (PERSP - z)
    return PO[0] + (X - PO[0]) * k, PO[1] + (Y - PO[1]) * k
