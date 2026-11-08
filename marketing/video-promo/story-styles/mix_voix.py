# Bande-son d'une story « style » : extrait de la musique de la publicité, voix off posée aux repères,
# musique baissée sous la voix, normalisation -16 LUFS.
#   python3 mix_voix.py soundtrack.wav dossier_style
import json, os, subprocess, sys
SRC, D = sys.argv[1], sys.argv[2]
cfg = json.load(open(os.path.join(D, "voix.json")))
V = os.path.join(D, "assets/audio/voix")
cmd = ["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", str(cfg["music_from"]), "-t", str(cfg["duration"]), "-i", SRC]
f = []
for k, (wav, t) in enumerate(cfg["voix"]):
    cmd += ["-i", os.path.join(V, wav)]; ms = int(round(t * 1000))
    f.append(f"[{k + 1}:a]adelay={ms}|{ms}[v{k}]")
n = len(cfg["voix"]); dur = cfg["duration"]
f.append("".join(f"[v{k}]" for k in range(n)) + f"amix=inputs={n}:normalize=0,apad,atrim=0:{dur},asplit=2[vo][key]")
f.append(f"[0:a]afade=t=in:st=0:d=0.3,afade=t=out:st={dur - 1.2}:d=1.2,volume=0.36[mu]")
f.append("[mu][key]sidechaincompress=threshold=0.02:ratio=4:attack=15:release=350:makeup=1[duck]")
f.append(f"[duck][vo]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,atrim=0:{dur}[out]")
subprocess.run(cmd + ["-filter_complex", ";".join(f), "-map", "[out]", "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le",
                      os.path.join(D, "assets/audio/music.wav")], check=True)
print("ok", D)
