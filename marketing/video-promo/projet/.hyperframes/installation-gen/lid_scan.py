# Passe au crible chaque mot (≥ 4 lettres) d'un dossier de segments edge-tts : Whisper estime la langue
# de chaque mot isolé ; on signale ceux qui sonnent anglais.
# usage: lid_scan.py <dossier> [segments séparés par des virgules]
import glob, json, os, subprocess, sys

import numpy as np
from faster_whisper import WhisperModel

SR = 16000
d = sys.argv[1]
only = set(sys.argv[2].split(",")) if len(sys.argv) > 2 else None
model = WhisperModel("small", device="cpu", compute_type="int8")


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768


for js in sorted(glob.glob(f"{d}/*.json")):
    name = os.path.basename(js)[:-5]
    if only and name not in only:
        continue
    mp3 = js[:-5] + ".mp3"
    if not os.path.exists(mp3):
        continue
    words = json.load(open(js))
    if not isinstance(words, list) or not words or "word" not in words[0]:
        continue
    a = load(mp3)
    flagged = []
    for i, w in enumerate(words):
        if len(w["word"]) < 4:
            continue
        t0 = w["start"] - 0.04
        t1 = (words[i + 1]["start"] if i + 1 < len(words) else w["end"] + 0.35) + 0.02
        seg = np.concatenate([np.zeros(int(0.3 * SR), np.float32), a[int(t0 * SR): int(t1 * SR)], np.zeros(int(0.3 * SR), np.float32)])
        lang, prob, allp = model.detect_language(seg)
        p = dict(allp)
        if p.get("en", 0) > p.get("fr", 0):
            flagged.append(f"{w['word']}(en {p.get('en', 0):.2f} / fr {p.get('fr', 0):.2f})")
    print(f"{name}: " + (", ".join(flagged) if flagged else "ok"))
