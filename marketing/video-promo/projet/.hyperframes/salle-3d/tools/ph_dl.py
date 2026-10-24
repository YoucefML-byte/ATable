import json, sys, urllib.request
o=urllib.request.build_opener(); o.addheaders=[('User-Agent','atable-promo/1.0')]; urllib.request.install_opener(o)
out = sys.argv[1]
for t in sys.argv[2:]:
    d = json.load(urllib.request.urlopen(f"https://api.polyhaven.com/files/{t}"))
    if "hdri" in d:
        urllib.request.urlretrieve(d["hdri"]["2k"]["hdr"]["url"], f"{out}/{t}_2k.hdr"); print("ok", t); continue
    for k, dst in (("Diffuse", "diff"), ("Rough", "rough"), ("nor_gl", "nor")):
        if k in d and "2k" in d[k]:
            urllib.request.urlretrieve(d[k]["2k"]["jpg"]["url"], f"{out}/{t}_{dst}.jpg")
    print("ok", t)
