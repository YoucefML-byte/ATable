# Vérifie à l'oreille « machine » l'accent d'un mot : on isole le mot (minutage edge-tts) et Whisper
# estime la langue parlée (probabilités fr / en).
import json, subprocess, sys

import numpy as np
from faster_whisper import WhisperModel

CASES = [
    ("Prête — avant (en-US)", "tts3/seg08.mp3", "tts3/seg08.json", ["Prête"]),
    ("Prête — après (fr-FR)", "tts4/test-prete.mp3", "tts4/test-prete.json", ["Prête"]),
    ("Atable — avant (en-US)", "tts3/seg01.mp3", "tts3/seg01.json", ["Atable"]),
    ("Atable — fr-FR, écrit « Atable »", "tts4/test-atable-orig.mp3", "tts4/test-atable-orig.json", ["Atable"]),
    ("À table — fr-FR, écrit « À table »", "tts4/test-atable.mp3", "tts4/test-atable.json", ["À", "table"]),
]
SR = 16000
model = WhisperModel(sys.argv[1] if len(sys.argv) > 1 else "small", device="cpu", compute_type="int8")


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768


for label, mp3, js, target in CASES:
    words = json.load(open(js))
    idx = [i for i, w in enumerate(words) if w["word"] == target[0]][-1]
    j = idx + len(target) - 1
    t0 = words[idx]["start"] - 0.05
    t1 = (words[j + 1]["start"] if j + 1 < len(words) else words[j]["end"] + 0.35) + 0.02
    a = load(mp3)[int(t0 * SR): int(t1 * SR)]
    a = np.concatenate([np.zeros(int(0.3 * SR), np.float32), a, np.zeros(int(0.3 * SR), np.float32)])
    lang, prob, allp = model.detect_language(a)
    p = dict(allp)
    segs, _ = model.transcribe(a, language="fr", beam_size=5)
    txt = " ".join(s.text.strip() for s in segs)
    print(f"{label:38s} fr={p.get('fr', 0):.2f} en={p.get('en', 0):.2f} (détectée: {lang})  transcription fr: «{txt}»")
