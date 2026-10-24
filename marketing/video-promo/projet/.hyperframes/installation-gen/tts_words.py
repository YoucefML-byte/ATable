# edge-tts avec minutage mot à mot : écrit le mp3 et un JSON [{word, start, end}] (secondes).
# usage: tts_words.py <voix> <rate> <texte> <sortie.mp3> <sortie.json>
import asyncio, json, os, ssl, sys

import edge_tts
import edge_tts.communicate as comm

comm._SSL_CTX = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")

# edge-tts déclare toujours xml:lang='en-US' : une voix multilingue (Vivienne) prononce alors à l'anglaise
# les mots courts ou ambigus (« Prête ? », « Atable »). On impose le français.
_mkssml = comm.mkssml


def mkssml_fr(tc, escaped_text):
    if isinstance(escaped_text, bytes):
        escaped_text = escaped_text.decode("utf-8")
    ssml = _mkssml(tc, escaped_text)
    return ssml.replace("xml:lang='en-US'", "xml:lang='fr-FR'")


comm.mkssml = mkssml_fr


async def main(voice, rate, text, out, out_json):
    c = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary",
                             proxy=os.environ.get("HTTPS_PROXY"))
    words = []
    with open(out, "wb") as f:
        async for chunk in c.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                s = chunk["offset"] / 1e7
                words.append({"word": chunk["text"], "start": round(s, 3),
                              "end": round(s + chunk["duration"] / 1e7, 3)})
    json.dump(words, open(out_json, "w"), ensure_ascii=False, indent=1)


asyncio.run(main(*sys.argv[1:6]))
