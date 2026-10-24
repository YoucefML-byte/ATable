# Wrapper edge-tts : utilise le certificat du proxy et passe par HTTPS_PROXY.
# usage: tts_edge.py <voix> <rate ex. +0%> <texte> <sortie.mp3>
import asyncio, os, ssl, sys

import edge_tts
import edge_tts.communicate as comm

comm._SSL_CTX = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")


async def main(voice, rate, text, out):
    c = edge_tts.Communicate(text, voice, rate=rate, proxy=os.environ.get("HTTPS_PROXY"))
    await c.save(out)


asyncio.run(main(*sys.argv[1:5]))
