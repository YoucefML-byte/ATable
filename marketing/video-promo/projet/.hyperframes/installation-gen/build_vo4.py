# Voix off v4 (96 s : installation + plan 3D ; français imposé dans le SSML) : une phrase continue par plan, sans accélération,
# et minutage mot à mot en temps film (tts3/words.json) pour caler les animations.
# usage: build_vo3.py <voix> <dossier_sortie>
import json, os, subprocess, sys

S = os.path.dirname(os.path.abspath(__file__))
PY = os.path.join(S, "venv/bin/python")
VOICE, OUT = sys.argv[1], sys.argv[2]
SR, TOTAL, GAP = 48000, 96.0, 0.15

# (repère à l'écran, limite de fin, texte) — un bloc par plan ; +20 s après 12 s (installation 12–32)
SEGMENTS = [
    (0.15, 5.95, "Vendredi, vingt heures trente. Salle pleine. Tout le monde vous fait signe."),
    (6.35, 11.8, "Et si chaque table pouvait commander toute seule ? Voici À table."),
    (12.15, 17.9, "L'installation ? On s'en charge. Chaque table reçoit sa plaque en métal, et son QR code."),
    (18.15, 25.9, "Elle se place au bord de la table, à gauche ou à droite. Trois finitions au choix : rose, argenté ou doré."),
    (26.15, 31.9, "Et on vous fournit la tablette, reliée à tous vos QR codes. Les commandes y arrivent en direct."),
    (32.45, 39.6, "Retour au vendredi soir. À la table quatre, un client sort son téléphone, et vise la plaque."),
    (40.35, 45.8, "Un scan, et la carte s'ouvre. Pas d'appli, pas de compte."),
    (46.4, 53.9, "Votre client choisit ses options, ajoute une précision pour la cuisine, et envoie. Le paiement, lui, se fait au comptoir."),
    (54.7, 59.9, "En moins de trois secondes, la commande arrive en salle. Validée d'un geste."),
    (60.4, 65.9, "En cuisine, chaque commande a son minuteur. Elle est prête ? La salle est prévenue."),
    (66.35, 69.9, "Chacun a son code, et chaque table son état."),
    (70.4, 77.8, "Et vous, vous pilotez tout : la carte, les horaires, les QR codes, et les couleurs de votre établissement."),
    (78.4, 83.8, "Le tableau de bord vous montre l'essentiel : montant commandé, panier moyen, heures de rush."),
    (84.35, 89.8, "Plusieurs commerces ? Un seul outil, et des données protégées."),
    (90.85, 95.55, "À table ! Vos clients commandent, votre équipe sert. Demandez une démo."),
]


def run(*a):
    subprocess.run(a, check=True, capture_output=True)


def dur(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", path], capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def synth(i, text):
    mp3, js = f"{OUT}/seg{i:02d}.mp3", f"{OUT}/seg{i:02d}.json"
    for _ in range(4):  # le flux edge-tts est parfois coupé : on régénère si l'audio est trop court
        run(PY, "-I", os.path.join(S, "tts_words.py"), VOICE, "+0%", text, mp3, js)
        if dur(mp3) >= 0.045 * len(text):
            break
    else:
        sys.exit(f"segment {i} tronqué")
    head = f"{OUT}/seg{i:02d}_h.wav"
    wav = f"{OUT}/seg{i:02d}.wav"
    run("ffmpeg", "-y", "-i", mp3, "-af", "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.02",
        "-ar", str(SR), "-ac", "2", head)
    lead = dur(mp3) - dur(head)  # silence retiré au début (les offsets des mots partent du mp3 brut)
    run("ffmpeg", "-y", "-i", head, "-af",
        "areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.08,areverse", wav)
    return wav, dur(wav), lead, json.load(open(js))


os.makedirs(OUT, exist_ok=True)
placed, words, prev_end = [], [], 0.0
for i, (cue, limit, text) in enumerate(SEGMENTS):
    wav, d, lead, wj = synth(i, text)
    start = max(prev_end + GAP, min(cue, limit - d), cue - 0.4)
    placed.append({"text": text, "start": round(start, 3), "end": round(start + d, 3)})
    words += [{"seg": i, "word": w["word"], "t": round(start - lead + w["start"], 3)} for w in wj]
    prev_end = start + d
    flag = "" if start + d <= limit else "  !! DÉBORDE"
    print(f"{i:02d} {start:6.2f}-{start + d:6.2f} (repère {cue:5.2f}, limite {limit:5.2f}) lead {lead:.3f}{flag}")

inputs, filt = [], []
for k, p in enumerate(placed):
    inputs += ["-i", f"{OUT}/seg{k:02d}.wav"]
    ms = int(round(p["start"] * 1000))
    filt.append(f"[{k}:a]adelay={ms}|{ms}[d{k}]")
mix = "".join(f"[d{k}]" for k in range(len(placed)))
filt.append(f"{mix}amix=inputs={len(placed)}:normalize=0,apad,atrim=0:{TOTAL},"
            f"loudnorm=I=-16:TP=-1.5:LRA=11[vo]")
run("ffmpeg", "-y", *inputs, "-filter_complex", ";".join(filt), "-map", "[vo]",
    "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le", f"{OUT}/voiceover.wav")
json.dump({"voice": VOICE, "segments": placed}, open(f"{OUT}/voiceover.json", "w"),
          ensure_ascii=False, indent=2)
json.dump(words, open(f"{OUT}/words.json", "w"), ensure_ascii=False, indent=0)
