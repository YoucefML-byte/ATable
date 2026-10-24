import json, os, sys, urllib.request
H={"Authorization": "Token " + os.environ["SKETCHFAB_API_TOKEN"]}
out=sys.argv[1]
for uid in sys.argv[2:]:
    m=json.load(urllib.request.urlopen(urllib.request.Request(f"https://api.sketchfab.com/v3/models/{uid}",headers=H)))
    imgs=sorted(m["thumbnails"]["images"], key=lambda i:i["width"])
    img=[i for i in imgs if i["width"]>=400][0]
    urllib.request.urlretrieve(img["url"], f"{out}/{uid[:8]}.jpg")
    print(uid[:8], m["name"][:50], "|", m["license"]["label"], "|", m["user"]["displayName"], "|", m.get("viewerUrl"))
