# Découpe la vidéo 96 s en stories verticales 1080×1920 : fond de marque, vidéo 16:9 au centre,
# sous-titres de la voix off dessous. Une story qui commence sur une transition démarre sur la
# première image nette de sa scène (tenue « freeze » s), le son, lui, part au bon moment.
#   python3 build_stories.py stories.json video_96s.mp4 dossier_assets dossier_sortie [id...]
import json, subprocess, sys, os
spec, SRC, A, OUT = sys.argv[1:5]
only = set(sys.argv[5:])
os.makedirs(OUT, exist_ok=True)
VIDEO_TOP, SUB_TOP = 660, 1300
for s in json.load(open(spec))["stories"]:
    if only and s["id"] not in only: continue
    t0, t1, fz = s["start"], s["end"], s["freeze"]; D = t1 - t0
    cmd = ["ffmpeg", "-v", "error", "-y",
           "-loop", "1", "-framerate", "30", "-t", f"{D}", "-i", f"{A}/{s['id']}-bg.png",
           "-ss", f"{t0 + fz}", "-t", f"{D - fz}", "-i", SRC,
           "-ss", f"{t0}", "-t", f"{D}", "-i", SRC]
    for k in range(len(s["subs"])):
        cmd += ["-loop", "1", "-framerate", "30", "-t", f"{D}", "-i", f"{A}/{s['id']}-sub{k}.png"]
    f = [f"[1:v]scale=1080:608:flags=lanczos,setsar=1,fps=30,tpad=start_duration={fz}:start_mode=clone[v]",
         f"[0:v][v]overlay=0:{VIDEO_TOP}:eof_action=repeat[b0]"]
    subs = s["subs"]
    for k, (a, b, _) in enumerate(subs):
        nxt = subs[k + 1][0] if k + 1 < len(subs) else t1 + 9
        sa = max(0.0, a - t0 - 0.08); sb = min(D, b - t0 + 0.6, nxt - t0 - 0.06)
        f.append(f"[{k + 3}:v]format=rgba,fade=t=in:st={sa:.2f}:d=0.14:alpha=1,fade=t=out:st={sb - 0.14:.2f}:d=0.14:alpha=1[s{k}]")
        f.append(f"[b{k}][s{k}]overlay=0:{SUB_TOP}:enable='between(t,{sa:.2f},{sb:.2f})'[b{k + 1}]")
    f.append(f"[b{len(subs)}]format=yuv420p[vo]")
    f.append(f"[2:a]afade=t=in:st=0:d=0.06,afade=t=out:st={D - 0.35:.2f}:d=0.35[ao]")
    out = f"{OUT}/story-{s['id']}.mp4"
    cmd += ["-filter_complex", ";".join(f), "-map", "[vo]", "-map", "[ao]", "-t", f"{D}", "-r", "30",
            "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-maxrate", "8M", "-bufsize", "12M",
            "-profile:v", "high", "-level", "4.1", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", out]
    subprocess.run(cmd, check=True)
    print("ok", out, flush=True)
