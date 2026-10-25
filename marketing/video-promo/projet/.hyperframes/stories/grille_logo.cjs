// Grande image du logo « À. » pour la grille Instagram (3 × 3 vignettes 3:4) : 3240 × 4320 px.
//   node grille_logo.cjs dossier_logo sortie.png
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [logoDir, out] = process.argv.slice(2);
const W = 3240, H = 4320, MARK_W = 2700;               // la marque occupe 83 % de la largeur
const svg = fs.readFileSync(path.join(logoDir, 'avostables-marque-creme.svg'), 'utf8');
const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/); const markH = MARK_W * vb[2] / vb[1];
const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0}
body{width:${W}px;height:${H}px;overflow:hidden;
  background:radial-gradient(90% 70% at 30% 22%,#47684F 0%,#3D5742 55%,#344B39 100%)}
.m{position:absolute;left:${(W - MARK_W) / 2}px;top:${(H - markH) / 2}px;width:${MARK_W}px;height:${markH}px}
.m svg{width:100%;height:100%;display:block}</style></head>
<body><div class="m">${svg}</div></body></html>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.setContent(html); await p.screenshot({ path: out }); await b.close(); console.log('ok', out);
})();
