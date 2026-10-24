import json, os, sys, urllib.request, urllib.parse
q = sys.argv[1]; extra = sys.argv[2:] 
params = {"type": "models", "q": q, "downloadable": "true", "count": "24", "sort_by": "-likeCount"}
for e in extra:
    k, v = e.split("=", 1); params[k] = v
url = "https://api.sketchfab.com/v3/search?" + urllib.parse.urlencode(params)
req = urllib.request.Request(url, headers={"Authorization": "Token " + os.environ["SKETCHFAB_API_TOKEN"]})
d = json.load(urllib.request.urlopen(req))
for m in d["results"]:
    lic = (m.get("license") or {}).get("label", "?")
    if not any(s in lic for s in ("CC0", "Attribution")) or "NonCommercial" in lic or "NoDerivs" in lic: continue
    print(f'{m["uid"]}  faces={m.get("faceCount")}  anim={m.get("animationCount")}  {lic[:28]:28}  {m["name"][:60]}  by {m["user"]["username"]}')
