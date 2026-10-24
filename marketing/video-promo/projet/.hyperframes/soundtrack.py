# Host-made soundtrack for the Atable promo: a 120 bpm warm house groove arranged on the
# storyboard's frames, plus the sound effects at the storyboard's Scene times. Deterministic
# (fixed seed). Writes a 48 kHz stereo WAV.
import sys, wave
import numpy as np

OUT = sys.argv[1]
SR = 48000
BPM = 120
BEAT = 60 / BPM
BAR = 4 * BEAT
TOTAL = 96.0
INS, INS_LEN = 12.0, 20.0  # séquence installation insérée
SALLE, SALLE_LEN = 32.0, 8.0  # plan 3D « La salle » inséré ensuite


def sh(t):  # repères de l'ancien montage (68 s)
    return t + INS_LEN + SALLE_LEN if t >= INS else t
N = int((TOTAL + 0.01) * SR)
rng = np.random.default_rng(42)
T = np.arange(N) / SR


def tt(d):
    return np.arange(int(d * SR)) / SR


def noise(d):
    return rng.standard_normal(int(d * SR))


def fft_filter(x, lo=None, hi=None, order=4):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    m = np.ones_like(f)
    if lo:
        m *= 1 / (1 + (lo / np.maximum(f, 1)) ** order)
    if hi:
        m *= 1 / (1 + (f / hi) ** order)
    return np.fft.irfft(X * m, len(x))


def norm(x, p=1.0):
    return x / (np.max(np.abs(x)) + 1e-9) * p


def midi(n):
    return 440 * 2 ** ((n - 69) / 12)


def add(buf, x, t, g=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= buf.shape[1] or i + len(x) <= 0:
        return
    if i < 0:
        x = x[-i:]
        i = 0
    x = x[: buf.shape[1] - i]
    buf[0, i : i + len(x)] += x * g * np.sqrt((1 - pan) / 2) * 1.414
    buf[1, i : i + len(x)] += x * g * np.sqrt((1 + pan) / 2) * 1.414


# ----------------------------------------------------------------- instruments
def kick():
    t = tt(0.42)
    f = 46 + 110 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.16)
    click = fft_filter(noise(0.42), 1500, 6000) * np.exp(-t / 0.003) * 0.25
    return norm(np.tanh(1.6 * (body + click)), 0.95)


def clap():
    d = 0.32
    t = tt(d)
    n = fft_filter(noise(d), 900, 4200)
    env = np.zeros_like(t)
    for k, off in enumerate((0, 0.009, 0.019)):
        env += np.where(t >= off, np.exp(-(t - off) / (0.012 if k < 2 else 0.11)), 0)
    return norm(n * env, 0.7)


def hat(open_=False):
    d = 0.25 if open_ else 0.06
    t = tt(d)
    n = fft_filter(noise(d), 7000, 15000)
    return norm(n * np.exp(-t / (0.09 if open_ else 0.014)), 0.45)


def shaker():
    d = 0.07
    t = tt(d)
    n = fft_filter(noise(d), 5000, 11000)
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    return norm(n * env, 0.3)


def bass_note(n, d):
    t = tt(d)
    f = midi(n)
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    env = (1 - np.exp(-t / 0.004)) * np.exp(-t / 0.28) * np.clip((d - t) / 0.02, 0, 1)
    return np.tanh(1.4 * x * env) * 0.8


def epiano(n, d, vel=1.0):
    t = tt(d)
    f = midi(n)
    idx = 1.6 * np.exp(-t / 0.35) + 0.25
    mod = np.sin(2 * np.pi * f * t)
    x = np.sin(2 * np.pi * f * t + idx * mod)
    x += 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.2)
    env = (1 - np.exp(-t / 0.003)) * np.exp(-t / 1.4) * np.clip((d - t) / 0.08, 0, 1)
    trem = 1 + 0.12 * np.sin(2 * np.pi * 4.5 * t)
    return x * env * trem * vel


def pluck(n, d=0.45, vel=1.0):
    t = tt(d)
    f = midi(n)
    x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t / 0.05)
    return x * (1 - np.exp(-t / 0.002)) * np.exp(-t / 0.13) * vel


def pad(notes, d):
    t = tt(d)
    x = np.zeros_like(t)
    for n in notes:
        f = midi(n)
        for det in (0.996, 1.0, 1.004):
            for h in range(1, 6):
                x += np.sin(2 * np.pi * f * det * h * t + h * det) / (h ** 1.7)
    env = np.clip(t / 0.9, 0, 1) * np.clip((d - t) / 0.9, 0, 1)
    return fft_filter(x * env, 80, 2400) / (len(notes) * 4)


def riser(d):
    t = tt(d)
    n = noise(d)
    out = np.zeros_like(t)
    seg = int(0.05 * SR)
    for i in range(0, len(t), seg):
        p = i / len(t)
        lo = 400 + 5000 * p ** 2
        chunk = n[i : i + seg]
        out[i : i + seg] = fft_filter(chunk, lo, lo * 2.5)
    sweep = np.sin(2 * np.pi * np.cumsum(np.geomspace(180, 1400, len(t))) / SR) * 0.25
    env = (t / d) ** 2
    return norm((out + sweep) * env, 0.5)


def boom():
    t = tt(1.4)
    f = 32 + 60 * np.exp(-t / 0.08)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.45)
    hit = fft_filter(noise(1.4), 60, 900) * np.exp(-t / 0.06) * 0.4
    return norm(np.tanh(1.3 * (x + hit)), 0.9)


# chords: one per bar, 4-bar loop  F maj9 · A m7 · D m9 · Bb maj9
CH = [
    {"root": 41, "notes": [53, 57, 60, 64, 67]},
    {"root": 45, "notes": [52, 57, 60, 64, 67]},
    {"root": 38, "notes": [53, 57, 60, 62, 64]},
    {"root": 46, "notes": [53, 57, 60, 62, 65]},
]
BASS_RHYTHM = [(0, 0.75), (1.5, 0.5), (2.5, 0.5), (3.0, 0.5), (3.5, 0.4)]  # beats, length (beats)
ARP = [2, 3, 4, 3, 2, 4, 3, 1]

drums = np.zeros((2, N))
bass = np.zeros((2, N))
keys = np.zeros((2, N))
pads = np.zeros((2, N))
fx = np.zeros((2, N))
sfx = np.zeros((2, N))

K, CL, HC, HO, SH = kick(), clap(), hat(), hat(True), shaker()


def bar_index(t):
    return int(round(t / BAR))


def section(bar):
    s = bar * BAR
    if s < 6:
        return "intro"
    if s < 12:
        return "promise"
    if s < 40:  # installation puis plan 3D : même montée (quatre temps légers à partir de 26 s)
        return "install"
    s -= INS_LEN + SALLE_LEN
    if s < 42:
        return "groove"
    if s < 56:
        return "lift"
    if s < 62:
        return "break"
    return "end"


nbars = int(np.ceil(TOTAL / BAR))
for b in range(nbars):
    s0 = b * BAR
    sec = section(b)
    ch = CH[b % 4]
    # drums
    for beat in range(4):
        t = s0 + beat * BEAT
        if sec in ("groove", "lift"):
            add(drums, K, t, 0.9)
            if beat in (1, 3):
                add(drums, CL, t, 0.55, 0.05)
            add(drums, HO if sec == "lift" else HC, t + BEAT / 2, 0.5 if sec == "lift" else 0.45, 0.25)
        elif sec == "promise":
            if beat in (0, 2):
                add(drums, K, t, 0.8)
            if beat == 3:
                add(drums, CL, t, 0.4)
            add(drums, HC, t + BEAT / 2, 0.35, 0.25)
        elif sec == "install":
            full = s0 >= 26
            if full or beat in (0, 2):
                add(drums, K, t, 0.8 if full else 0.7)
            if (full and beat in (1, 3)) or (not full and beat == 3):
                add(drums, CL, t, 0.45 if full else 0.3, 0.05)
            add(drums, HC, t + BEAT / 2, 0.4 if full else 0.33, 0.25)
        elif sec == "intro":
            # the clock: ticking hats on eighths, a heartbeat kick from the flip at 3.5 s
            add(drums, HC, t, 0.32, -0.3)
            add(drums, HC, t + BEAT / 2, 0.22, 0.3)
            if t >= 3.5:
                add(drums, K, t, 0.55)
        elif sec == "end" and b == bar_index(90):
            pass
    if sec in ("groove", "lift", "promise") or (sec == "install" and s0 >= 18):
        for i in range(16):
            t = s0 + i * BEAT / 4 + (0.012 if i % 2 else 0)
            v = (0.55, 0.25, 0.4, 0.25)[i % 4]
            add(drums, SH, t, v * (0.9 if sec != "promise" else 0.6), 0.35 * np.sin(i))
    # bass
    if sec in ("groove", "lift", "promise", "install") or (sec == "intro" and s0 >= 2):
        for (bt, ln) in BASS_RHYTHM:
            if sec == "intro" and s0 + bt * BEAT < 3.5:
                continue
            n = ch["root"] + (12 if bt == 3.0 else 0)
            add(bass, bass_note(n, ln * BEAT), s0 + bt * BEAT, 0.55 if sec not in ("intro", "install") else (0.4 if sec == "intro" else 0.48))
    # keys: chord on the "and" of 1 and on 3 (stab), plucked arpeggio from the groove on
    if sec in ("promise", "install", "groove", "lift", "break", "end"):
        if sec != "end" or b == bar_index(90):
            for off, vel in ((0.5, 0.8), (2.0, 0.6)):
                if sec == "break" and off == 0.5:
                    continue
                for j, n in enumerate(ch["notes"]):
                    add(keys, epiano(n, 1.6 if sec != "end" else 5.5, vel), s0 + off * BEAT + j * 0.006, 0.11, -0.4 + 0.2 * j)
        if sec in ("groove", "lift", "break") or (sec == "install" and s0 >= 18):
            for i in range(8):
                n = ch["notes"][ARP[i]] + 12
                vel = 0.6 if sec == "groove" else (0.5 if sec == "install" else 0.8)
                add(keys, pluck(n, 0.4, vel), s0 + i * BEAT / 2 + BEAT / 4, 0.09, 0.5 * np.sin(i * 0.9))
        if sec == "lift":
            mel = [ch["notes"][4] + 12, ch["notes"][3] + 12, ch["notes"][4] + 12, ch["notes"][2] + 24]
            for i, n in enumerate(mel):
                add(keys, pluck(n, 0.6, 0.9), s0 + i * BEAT, 0.07, -0.2)
    # pads
    if sec in ("intro", "break", "end", "promise", "install"):
        notes = [ch["root"] + 12] + ch["notes"][:3]
        add(pads, pad(notes, BAR + 1.0), s0 - 0.3, 0.55 if sec not in ("promise", "install") else (0.35 if sec == "promise" else 0.3))
    elif sec in ("groove", "lift"):
        add(pads, pad(ch["notes"][:4], BAR + 1.0), s0 - 0.3, 0.22)

# risers and hits
add(fx, riser(1.5), 4.5, 0.45)
add(fx, boom(), 3.5, 0.6)
add(fx, boom(), 6.0, 0.55)
add(fx, riser(1.0), 9.6, 0.35)
add(fx, riser(1.0), sh(41.0), 0.35)
add(fx, riser(1.4), 38.6, 0.3)  # montée vers « Un scan »
add(fx, riser(1.5), sh(60.5), 0.5)
add(fx, boom(), sh(62.0), 0.5)
add(fx, boom(), sh(63.0), 0.75)

# final chord ring-out (bar at 62 holds an F maj9 epiano + pad until the end)
for j, n in enumerate([41, 53, 57, 60, 64, 67]):
    add(keys, epiano(n, 5.0, 0.9), sh(63.0) + j * 0.01, 0.12, -0.3 + 0.12 * j)
add(pads, pad([53, 57, 60, 64], 5.2), sh(62.8), 0.5)

# sidechain pump on bass, keys and pads from the kick grid (groove / lift only)
pump = np.ones(N)
for b in range(nbars):
    if section(b) in ("groove", "lift"):
        for beat in range(4):
            i0 = int((b * BAR + beat * BEAT) * SR)
            d = int(0.32 * SR)
            seg = 1 - 0.38 * np.exp(-np.arange(d) / (0.09 * SR))
            j = min(N, i0 + d)
            pump[i0:j] = np.minimum(pump[i0:j], seg[: j - i0])
for buf in (bass, keys, pads):
    buf *= pump


# ----------------------------------------------------------------- sound effects
def sweep_sine(f0, f1, d, tau, att=0.002):
    t = tt(d)
    f = np.geomspace(f0, f1, len(t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / tau) * (1 - np.exp(-t / att))


def bell(f0, d, parts=((1, 1, 0.9), (2.76, 0.45, 0.35), (5.4, 0.25, 0.18), (8.9, 0.12, 0.1))):
    t = tt(d)
    x = sum(a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t / tau) for r, a, tau in parts)
    return x * (1 - np.exp(-t / 0.002))


def s_pop():
    return norm(sweep_sine(1100, 420, 0.11, 0.028), 0.7)


def s_tap():
    t = tt(0.05)
    c = fft_filter(noise(0.05), 1500, 7000) * np.exp(-t / 0.004)
    return norm(0.6 * c + 0.7 * sweep_sine(280, 120, 0.05, 0.016), 0.7)


def s_press():
    return norm(s_tap() + np.concatenate([np.zeros(int(0.04 * SR)), sweep_sine(220, 160, 0.06, 0.02)])[: len(s_tap())], 0.75)


def s_whoosh(d=0.55, lo=300, hi=3500):
    t = tt(d)
    a = fft_filter(noise(d), lo, hi * 0.5)
    b = fft_filter(noise(d), hi * 0.6, hi * 2.2)
    e1 = np.sin(np.pi * np.clip(t / (d * 0.85), 0, 1)) ** 2
    e2 = np.sin(np.pi * np.clip((t - d * 0.15) / (d * 0.85), 0, 1)) ** 2
    return norm(a * e1 + 0.6 * b * e2, 0.5)


def s_printer(d=1.6):
    t = tt(d)
    n = fft_filter(noise(d), 1200, 6500)
    steps = (np.sin(2 * np.pi * 11 * t) > -0.2).astype(float)  # line feeds
    buzz = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 95 * t))
    motor = np.sin(2 * np.pi * 190 * t) * 0.15
    env = np.clip(t / 0.03, 0, 1) * np.clip((d - t) / 0.05, 0, 1)
    return norm((n * (0.6 * steps + 0.4 * buzz) * 0.8 + motor) * env, 0.45)


def s_stamp():
    t = tt(0.4)
    thud = sweep_sine(140, 60, 0.4, 0.07)
    slap = fft_filter(noise(0.4), 500, 4000) * np.exp(-t / 0.018)
    return norm(np.tanh(1.5 * (thud + 0.6 * slap)), 0.85)


def s_bell():
    return norm(bell(2093, 2.2, ((1, 1, 1.2), (2.4, 0.4, 0.5), (4.1, 0.2, 0.25), (5.9, 0.08, 0.12))), 0.55)


def s_scan():
    x = np.zeros(int(0.25 * SR))
    for k in range(2):
        t = tt(0.07)
        b = np.sin(2 * np.pi * 1850 * t) * np.minimum(1, t / 0.003) * np.minimum(1, (0.07 - t) / 0.01)
        j = int(k * 0.11 * SR)
        x[j : j + len(b)] += b
    return norm(x, 0.32)


def s_key():
    t = tt(0.03)
    c = fft_filter(noise(0.03), 2500, 8000) * np.exp(-t / 0.003)
    return norm(c + 0.3 * sweep_sine(500, 300, 0.03, 0.006), 0.32)


def s_tick():
    t = tt(0.06)
    return norm(np.sin(2 * np.pi * 2300 * t) * np.exp(-t / 0.011) * (1 - np.exp(-t / 0.0008)), 0.28)


def s_notif():
    x = np.zeros(int(0.6 * SR))
    for k, f in enumerate((659.3, 987.8)):
        b = bell(f, 0.45, ((1, 1, 0.14), (3, 0.15, 0.05)))
        j = int(k * 0.09 * SR)
        x[j : j + len(b)] += b
    return norm(x, 0.5)


def s_chime():
    x = np.zeros(int(1.0 * SR))
    for k, f in enumerate((1568, 1976, 2349)):
        b = bell(f, 0.8, ((1, 1, 0.25), (2, 0.2, 0.1)))
        j = int(k * 0.06 * SR)
        x[j : j + len(b)] += b
    return norm(x, 0.35)


def s_swell():
    d = 1.0
    t = tt(d)
    e = (t / d) ** 2
    n = fft_filter(noise(d), 2000, 10000) * e
    return norm(n, 0.35)


def s_shimmer():
    x = np.zeros(int(0.9 * SR))
    for k, f in enumerate((2637, 3136, 3951, 4699)):
        b = bell(f, 0.6, ((1, 1, 0.18), (2.01, 0.25, 0.06)))
        j = int(k * 0.035 * SR)
        x[j : j + len(b)] += b * (0.9 - 0.15 * k)
    return norm(x, 0.3)


def s_peel():
    d = 0.34
    t = tt(d)
    n = fft_filter(noise(d), 1800, 7500)
    crackle = (np.sin(2 * np.pi * 70 * t) > 0.6).astype(float) * 0.6 + 0.4
    env = np.clip(t / 0.05, 0, 1) * np.clip((d - t) / 0.12, 0, 1) * (0.4 + 0.6 * t / d)
    return norm(n * crackle * env, 0.4)


SFXS = []
def cue(fn, t, g=1.0, pan=0.0):  # repères de l'ancien montage (68 s) : décalés après la séquence installation
    SFXS.append((fn, sh(t), g, pan))


def cue_abs(fn, t, g=1.0, pan=0.0):  # repères absolus (séquence installation)
    SFXS.append((fn, t, g, pan))

# frame starts (montage 68 s, décalés par cue()): 0 6 12 18 26 32 38 42 50 56 62
for i, t in enumerate((2.0, 2.5, 3.0, 3.5, 4.0)):
    cue(s_pop, t, 0.55, (-0.5, 0.5, -0.3, 0.4, 0.0)[i])
cue(lambda: s_whoosh(0.5), 5.7, 0.55)               # into the zoom-through
cue(s_printer, 6.05, 0.9, 0.2)
cue(s_stamp, 9.0, 0.45, 0.2)
cue(lambda: s_whoosh(0.45), 12.25, 0.45, 0.3)
cue(s_scan, 13.4, 0.9, 0.3)
cue(s_tick, 15.5, 0.8, -0.2); cue(s_tick, 16.5, 0.8, 0.2)
cue(s_tap, 18.9, 0.8, 0.3); cue(s_tap, 19.4, 0.8, 0.3)
for i in range(16):
    cue(s_key, 20.9 + i * 0.1, 0.7, 0.3)
cue(s_press, 23.0, 0.9, 0.3); cue(lambda: s_whoosh(0.35, 600, 5000), 23.3, 0.4, 0.3)
cue(s_stamp, 24.0, 0.85, 0.2)
cue(lambda: s_whoosh(0.8, 250, 3000), 26.15, 0.7, 0.0)
cue(s_notif, 27.0, 0.75, 0.3)
cue(s_press, 29.0, 0.9, -0.1); cue(s_stamp, 29.4, 0.8, -0.1)
cue(lambda: s_whoosh(0.45), 31.8, 0.4)
for i in range(7):
    cue(s_tick, 32.5 + i * 0.5, 0.45, 0.2)
cue(s_press, 35.5, 0.9, -0.2); cue(s_bell, 35.8, 0.9, 0.2); cue(s_stamp, 35.8, 0.6, -0.2)
cue(lambda: s_whoosh(0.5), 37.8, 0.5)
cue(s_pop, 39.6, 0.6, -0.4); cue(s_pop, 39.9, 0.6, 0.4)
cue(lambda: s_whoosh(0.5), 41.8, 0.5)
for i, t in enumerate((43.5, 44.7, 45.9, 47.1)):
    cue(s_pop, t, 0.6, (-0.2, 0.3, -0.3, 0.4)[i])
cue(lambda: s_whoosh(0.5), 50.15, 0.5)
for i in range(9):
    cue(s_tick, 51.0 + i * 0.09, 0.35, -0.2)
for i in range(8):
    cue(s_tick, 52.5 + i * 0.09, 0.35, 0.2)
cue(s_stamp, 54.0, 0.4)
cue(lambda: s_whoosh(0.6, 400, 6000), 56.95, 0.45, 0.2)
for t in (58.0, 59.0, 60.0, 61.0):
    cue(s_tick, t, 0.7, 0.1)
cue(s_chime, 61.5, 0.6)
cue(s_swell, 62.0, 0.6)
cue(s_pop, 64.5, 0.5)

# ---- séquence installation (12–32 s)
# 02a la plaque
cue_abs(lambda: s_whoosh(0.6), 12.2, 0.5, 0.2)
cue_abs(s_shimmer, 13.08, 0.7, 0.3)
cue_abs(lambda: s_whoosh(0.4, 600, 5000), 14.35, 0.4, 0.5)
cue_abs(s_peel, 15.0, 0.8, 0.45)
cue_abs(lambda: s_whoosh(0.45, 500, 4500), 15.55, 0.4, 0.2)
cue_abs(s_press, 16.6, 0.9, 0.2); cue_abs(s_stamp, 16.62, 0.45, 0.2)
cue_abs(s_shimmer, 17.12, 0.6, 0.3)
cue_abs(s_tick, 17.5, 0.5, -0.2)
# 02b la table
cue_abs(lambda: s_whoosh(0.9, 250, 3000), 18.0, 0.6)
for i, t in enumerate((18.5, 18.62, 18.74, 18.86)):
    cue_abs(s_pop, t, 0.45, (-0.4, 0.4, -0.2, 0.2)[i])
for i in range(4):
    cue_abs(s_tick, 18.95 + i * 0.08, 0.3, 0.3 * np.sin(i))
cue_abs(s_tick, 19.62, 0.6, -0.3)
cue_abs(lambda: s_whoosh(0.35, 600, 5000), 20.0, 0.4, 0.2); cue_abs(s_tick, 20.05, 0.6, 0.4)
cue_abs(s_tap, 20.5, 0.7, 0.4)
cue_abs(lambda: s_whoosh(0.6, 400, 6000), 20.85, 0.45, 0.2)
for i, t in enumerate((21.45, 21.55, 21.65)):
    cue_abs(s_pop, t, 0.4, -0.5 + 0.2 * i)
for t in (22.45, 23.1, 23.62):
    cue_abs(s_shimmer, t, 0.65, 0.25); cue_abs(s_pop, t + 0.04, 0.3, -0.4)
cue_abs(s_tick, 24.05, 0.5, 0.2)
cue_abs(lambda: s_whoosh(0.6), 24.7, 0.4, 0.2)
cue_abs(s_tap, 25.45, 0.6, 0.3)
# 02c la tablette
cue_abs(lambda: s_whoosh(0.9, 250, 3000), 26.0, 0.55)
cue_abs(lambda: s_whoosh(0.7), 26.3, 0.5, 0.5)
for i in range(5):
    cue_abs(s_pop, 26.85 + i * 0.08, 0.35, -0.5 + 0.2 * i)
cue_abs(s_pop, 27.5, 0.5, 0.0)
for i in range(6):
    cue_abs(s_tick, 27.6 + i * 0.13, 0.35, -0.3 + 0.1 * i)
for i, t in enumerate((29.2, 29.36, 29.52, 29.9, 30.0, 30.12)):
    cue_abs(s_key, t, 0.45, -0.4)
cue_abs(s_notif, 29.88, 0.7, 0.3)
cue_abs(s_notif, 30.43, 0.6, 0.35)

# ---- plan 3D « La salle » (32–40 s) : ambiance de restaurant + scan
def s_murmur(d, seed):  # brouhaha : plusieurs « voix » = bruit filtré modulé au rythme des syllabes
    r = np.random.default_rng(seed)
    t = tt(d)
    x = np.zeros(len(t))
    for k in range(10):
        f0 = r.uniform(260, 950)
        n = fft_filter(r.standard_normal(len(t)), f0 * 0.7, f0 * 1.35)
        rate = r.uniform(3.0, 5.5)
        am = np.clip(np.sin(2 * np.pi * rate * t + r.uniform(0, 6)) + 0.4 * np.sin(2 * np.pi * rate * 0.31 * t + r.uniform(0, 6)) - 0.1, 0, None)
        x += n * am * r.uniform(0.5, 1.0)
    env = np.clip(t / 0.7, 0, 1) * np.clip((d - t) / 1.6, 0, 1)
    return norm(fft_filter(x, 160, 3200) * env, 0.5)


def s_clink(f):
    return norm(bell(f, 0.5, ((1, 1, 0.12), (2.7, 0.35, 0.05), (5.1, 0.15, 0.03))), 0.35)


add(sfx, s_murmur(8.4, 7), 31.9, 0.55, 0.0)
cr = np.random.default_rng(11)
for k in range(9):
    add(sfx, s_clink(cr.uniform(2900, 5200)), 32.3 + k * 0.62 + cr.uniform(0, 0.3), 0.18 + 0.1 * cr.uniform(), cr.uniform(-0.7, 0.7))
cue_abs(lambda: s_whoosh(0.7, 250, 3000), 31.85, 0.45)            # fondu vers la salle 3D
cue_abs(lambda: s_whoosh(1.2, 200, 2500), 32.9, 0.35, 0.2)        # plongée de la caméra
cue_abs(s_tap, 35.85, 0.55, -0.2)                                  # il saisit son téléphone
cue_abs(lambda: s_whoosh(0.35, 700, 5000), 36.0, 0.25, -0.2)
cue_abs(s_scan, 37.05, 0.8, -0.1)                                  # le viseur cherche le QR
cue_abs(s_shimmer, 37.6, 0.65, -0.1); cue_abs(s_pop, 37.72, 0.4, -0.1)  # QR reconnu
cue_abs(lambda: s_whoosh(0.9, 400, 6000), 38.3, 0.4)              # on entre dans l'écran

for fn, t, g, pan in SFXS:
    add(sfx, fn(), t, g, pan)


# ----------------------------------------------------------------- reverb + mix
def reverb(x, d=1.4, mix=0.2):
    t = tt(d)
    ir = rng.standard_normal(len(t)) * np.exp(-t / (d / 5))
    ir = fft_filter(ir, 200, 6000)
    ir /= np.sqrt(np.sum(ir ** 2))
    L = len(x) + len(ir)
    nfft = 1 << (L - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]
    return x + mix * y


def verb(buf, d, m):
    return np.vstack([reverb(buf[0], d, m), reverb(buf[1], d * 1.07, m)])


keys = verb(keys, 1.6, 0.3)
pads = verb(pads, 2.4, 0.35)
sfx = verb(sfx, 0.9, 0.18)
fx = verb(fx, 1.8, 0.25)
drums = verb(drums, 0.6, 0.08)

music = drums * 0.8 + bass * 0.9 + keys * 1.0 + pads * 0.9 + fx * 0.8
music = np.vstack([fft_filter(music[0], 28, 16000), fft_filter(music[1], 28, 16000)])
# arrangement dynamics: quiet tension, a lift for the owner's section, a breakdown before the end card
pts = [(0, 0.5), (3.4, 0.5), (3.6, 0.72), (5.9, 0.8), (6.0, 0.85), (11.9, 0.85), (12.0, 0.82), (31.9, 0.88),
       (32.4, 0.74), (39.6, 0.8), (40.0, 0.9), (69.9, 0.9), (70.0, 1.0), (83.8, 1.0), (84.2, 0.62), (89.8, 0.7),
       (90.0, 0.95), (TOTAL, 0.95)]
dyn = np.interp(T, [a for a, _ in pts], [b for _, b in pts])
music *= dyn
mix = music * 0.85 + sfx * 0.75
fade = np.clip((TOTAL - T) / 1.2, 0, 1) * np.clip(T / 0.05, 0, 1)
mix *= fade
mix = np.tanh(mix / (np.max(np.abs(mix)) + 1e-9) * 1.05) * 0.92
out = (np.clip(mix.T, -1, 1) * 32767).astype(np.int16)
with wave.open(OUT, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(out.tobytes())
print("soundtrack", OUT, round(N / SR, 2), "s,", len(SFXS), "effects")
