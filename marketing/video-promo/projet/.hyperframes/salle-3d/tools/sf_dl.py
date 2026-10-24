import json, os, sys, urllib.request, zipfile
H={"Authorization": "Token " + os.environ["SKETCHFAB_API_TOKEN"]}
out=sys.argv[1]
for arg in sys.argv[2:]:
    name, uid = arg.split("=")
    d=json.load(urllib.request.urlopen(urllib.request.Request(f"https://api.sketchfab.com/v3/models/{uid}/download",headers=H)))
    g=d.get("gltf") or {}
    dest=f"{out}/{name}"; os.makedirs(dest, exist_ok=True)
    urllib.request.urlretrieve(g["url"], dest+"/m.zip")
    zipfile.ZipFile(dest+"/m.zip").extractall(dest); os.remove(dest+"/m.zip")
    m=json.load(urllib.request.urlopen(urllib.request.Request(f"https://api.sketchfab.com/v3/models/{uid}",headers=H)))
    json.dump({"uid":uid,"name":m["name"],"author":m["user"]["displayName"],"username":m["user"]["username"],"license":m["license"]["label"],"url":m["viewerUrl"]}, open(dest+"/credit.json","w"), ensure_ascii=False)
    print(name, g.get("size"), "ok")
