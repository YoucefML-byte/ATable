// Fonds 1080×1920 des stories, sous-titres (PNG transparents) et couverture « À la une ».
//   node make_assets.js stories.json projet_hyperframes dossier_sortie
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [specPath, proj, out] = process.argv.slice(2);
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
fs.mkdirSync(out, { recursive: true });
const font = (f) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(proj, 'assets/fonts', f)).toString('base64');
const logo = 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(proj, 'assets/avostables-logo.svg')).toString('base64');
const CSS = `
@font-face{font-family:S;font-weight:400;src:url(${font('SourceSerif4-400.woff2')})}
@font-face{font-family:S;font-weight:500;src:url(${font('SourceSerif4-500.woff2')})}
@font-face{font-family:S;font-weight:600;src:url(${font('SourceSerif4-600.woff2')})}
@font-face{font-family:M;font-weight:700;src:url(${font('JetBrainsMono-700.woff2')})}
@font-face{font-family:M;font-weight:500;src:url(${font('JetBrainsMono-500.woff2')})}
html,body{margin:0;padding:0}
body{width:1080px;overflow:hidden;color:#F4EFE6;font-family:S}
em{font-style:normal;color:#E0A33A}`;
// Zones sûres Instagram/Facebook : rien d'important au-dessus de 250 px ni sous 1560 px.
const VIDEO_TOP = 660, VIDEO_H = 608;
function bgHtml(s) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}
body{height:1920px;background:radial-gradient(120% 70% at 50% 38%,#24573F 0%,#1F4D3A 55%,#173B2D 100%)}
.brand{position:absolute;top:262px;left:80px;display:flex;align-items:center;gap:18px}
.brand img{width:66px;height:66px;display:block}
.brand span{font:500 42px/1 S;letter-spacing:-.01em}
.head{position:absolute;left:80px;right:80px;top:370px;height:262px;display:flex;flex-direction:column;justify-content:flex-end}
.k{font:700 24px/1 M;letter-spacing:.16em;color:#E0A33A;margin-bottom:22px}
.t{font:600 68px/1.08 S;letter-spacing:-.015em}
.frame{position:absolute;left:0;top:${VIDEO_TOP}px;width:1080px;height:${VIDEO_H}px;background:#0C1613}
.m{position:absolute;left:0;right:0;top:1520px;text-align:center;font:700 22px/1 M;letter-spacing:.18em;opacity:.72}
.cta{color:#E0A33A;opacity:1}
</style></head><body>
<div class="brand"><img src="${logo}"><span>À vos tables</span></div>
<div class="head"><div class="k">${s.kicker}</div><div class="t">${s.title}</div></div>
<div class="frame"></div>
${s.cta ? '<div class="m cta">↓ DEMANDEZ VOTRE DÉMO ↓</div>' : '<div class="m">QR CODE · NFC · PAIEMENT AU COMPTOIR</div>'}
</body></html>`;
}
function subHtml(text) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}
body{height:220px;background:transparent;display:flex;align-items:flex-start;justify-content:center}
p{margin:0;width:920px;text-align:center;font:500 50px/1.22 S;letter-spacing:-.005em;text-wrap:balance;
  text-shadow:0 2px 10px rgba(12,22,19,.35)}
</style></head><body><p>${text}</p></body></html>`;
}
function coverHtml() {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}
body{height:1920px;background:#1F4D3A;display:flex;align-items:center;justify-content:center}
img{width:620px;height:620px}</style></head><body><img src="${logo}"></body></html>`;
}
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const shot = async (html, file, h, transparent) => {
    await p.setViewportSize({ width: 1080, height: h });
    await p.setContent(html, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: file, omitBackground: !!transparent });
  };
  for (const s of spec.stories) {
    await shot(bgHtml(s), path.join(out, `${s.id}-bg.png`), 1920);
    for (let i = 0; i < s.subs.length; i++) await shot(subHtml(s.subs[i][2]), path.join(out, `${s.id}-sub${i}.png`), 220, true);
  }
  await shot(coverHtml(), path.join(out, 'couverture-a-la-une.png'), 1920);
  await b.close(); console.log('ok');
})();
