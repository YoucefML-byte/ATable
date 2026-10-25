# Découpe la vidéo 96 s en stories verticales 1080×1920 : fond de marque, vidéo 16:9 au centre,
# sous-titres de la voix off dessous. Une story qui commence sur une transition démarre sur la
# première image nette de sa scène (tenue « freeze » s), le son, lui, part au bon moment.
# Le Reel (« reel » dans la liste) reprend la vidéo entière, sans coupure, avec le titre de chaque partie.
#   python3 build_stories.py stories.json video_96s.mp4 dossier_assets dossier_sortie [id... | reel]
import json, subprocess, sys, os
spec, SRC, A, OUT = sys.argv[1:5]
only = set(sys.argv[5:])
os.makedirs(OUT, exist_ok=True)
VIDEO_TOP, SUB_TOP = 660, 1300
R_VIDEO_TOP, R_SUB_TOP = 590, 1222
ENC = ["-r", "30", "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-maxrate", "8M", "-bufsize", "12M",
       "-profile:v", "high", "-level", "4.1", "-pix_fmt", "yuv420p",
       "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart"]
SPEC = json.load(open(spec))

def sub_window(subs, k, t0, t1, D):
    a, b, _ = subs[k]
    nxt = subs[k + 1][0] if k + 1 < len(subs) else t1 + 9
    return max(0.0, a - t0 - 0.08), min(D, b - t0 + 0.6, nxt - t0 - 0.06)

def build_reel():
    st = SPEC["stories"]; D = st[-1]["end"] - st[0]["start"]
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", SRC]
    f = ["[0:v]scale=1080:608:flags=lanczos,setsar=1,fps=30[v]"]
    n = 1; prev = None
    for i, s in enumerate(st):                    # fond (titre) de chaque partie
        cmd += ["-loop", "1", "-framerate", "30", "-t", f"{D}", "-i", f"{A}/reel-{s['id']}-bg.png"]
        if prev is None: f.append(f"[{n}:v]null[g{i}]")
        else: f.append(f"[{prev}][{n}:v]overlay=0:0:enable='gte(t,{s['start']})'[g{i}]")
        prev = f"g{i}"; n += 1
    f.append(f"[{prev}][v]overlay=0:{R_VIDEO_TOP}:eof_action=repeat[c0]")
    cur, k = "c0", 0
    for s in st:
        for j in range(len(s["subs"])):
            sa, sb = sub_window(s["subs"], j, 0, s["end"], D)
            cmd += ["-loop", "1", "-framerate", "30", "-t", f"{D}", "-i", f"{A}/reel-{s['id']}-sub{j}.png"]
            f.append(f"[{n}:v]format=rgba,fade=t=in:st={sa:.2f}:d=0.14:alpha=1,fade=t=out:st={sb - 0.14:.2f}:d=0.14:alpha=1[r{k}]")
            f.append(f"[{cur}][r{k}]overlay=0:{R_SUB_TOP}:enable='between(t,{sa:.2f},{sb:.2f})'[c{k + 1}]")
            cur = f"c{k + 1}"; n += 1; k += 1
    f.append(f"[{cur}]format=yuv420p[vo]")
    f.append(f"[0:a]afade=t=out:st={D - 0.4:.2f}:d=0.4[ao]")
    out = f"{OUT}/reel-avostables-96s.mp4"
    subprocess.run(cmd + ["-filter_complex", ";".join(f), "-map", "[vo]", "-map", "[ao]", "-t", f"{D}"] + ENC + [out], check=True)
    print("ok", out, flush=True)

if "reel" in only or not only:
    build_reel()
for s in SPEC["stories"]:
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
    for k in range(len(subs)):
        sa, sb = sub_window(subs, k, t0, t1, D)
        f.append(f"[{k + 3}:v]format=rgba,fade=t=in:st={sa:.2f}:d=0.14:alpha=1,fade=t=out:st={sb - 0.14:.2f}:d=0.14:alpha=1[s{k}]")
        f.append(f"[b{k}][s{k}]overlay=0:{SUB_TOP}:enable='between(t,{sa:.2f},{sb:.2f})'[b{k + 1}]")
    f.append(f"[b{len(subs)}]format=yuv420p[vo]")
    f.append(f"[2:a]afade=t=in:st=0:d=0.06,afade=t=out:st={D - 0.35:.2f}:d=0.35[ao]")
    out = f"{OUT}/story-{s['id']}.mp4"
    cmd += ["-filter_complex", ";".join(f), "-map", "[vo]", "-map", "[ao]", "-t", f"{D}"] + ENC + [out]
    subprocess.run(cmd, check=True)
    print("ok", out, flush=True)
