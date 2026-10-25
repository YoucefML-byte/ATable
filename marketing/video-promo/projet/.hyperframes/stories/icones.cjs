// Icônes des « À la une » Instagram (une par story) : pictogramme crème + touche dorée sur fond vert,
// image 1080×1920 (format attendu par Instagram), pictogramme centré pour le recadrage en cercle.
//   node icones.cjs projet_hyperframes dossier_sortie   (le logo est lu dans ../logo à côté du projet)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [proj, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const BG = '#1F4D3A', C = '#F4EFE6', G = '#E0A33A';
const st = `fill="none" stroke="${C}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"`;
const sg = `fill="none" stroke="${G}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"`;
const marque = fs.readFileSync(path.join(proj, '..', 'logo', 'avostables-marque-creme.svg'), 'utf8');
const ICONS = [
  { id: '0-a-vos-tables', nom: 'À vos tables', svg: null },
  { id: '1-le-rush', nom: 'Le rush', svg: `<g transform="translate(16 0)">
    <circle cx="300" cy="256" r="150" ${st}/>
    <line x1="300" y1="256" x2="223" y2="277" ${sg}/><line x1="300" y1="256" x2="300" y2="366" ${sg}/>
    <circle cx="300" cy="256" r="16" fill="${G}"/>
    <line x1="56" y1="196" x2="112" y2="196" ${st}/><line x1="30" y1="256" x2="104" y2="256" ${st}/><line x1="56" y1="316" x2="112" y2="316" ${st}/></g>` },
  { id: '2-installation', nom: 'Installation', svg: `
    <rect x="46" y="126" width="420" height="260" rx="40" ${sg}/>
    <circle cx="96" cy="256" r="12" fill="${G}"/><circle cx="416" cy="256" r="12" fill="${G}"/>
    <rect x="166" y="160" width="180" height="192" rx="18" ${st}/>
    <rect x="196" y="190" width="44" height="44" rx="8" fill="${C}"/><rect x="272" y="190" width="44" height="44" rx="8" fill="${C}"/>
    <rect x="196" y="270" width="44" height="44" rx="8" fill="${C}"/><rect x="282" y="280" width="24" height="24" rx="5" fill="${C}"/>` },
  { id: '3-la-tablette', nom: 'La tablette', svg: `
    <rect x="46" y="116" width="400" height="280" rx="36" ${st}/>
    <rect x="96" y="166" width="84" height="180" rx="12" fill="${C}" opacity=".9"/>
    <rect x="204" y="166" width="84" height="120" rx="12" fill="${C}" opacity=".9"/>
    <rect x="312" y="166" width="84" height="150" rx="12" fill="${C}" opacity=".9"/>
    <circle cx="446" cy="116" r="46" fill="${G}" stroke="${BG}" stroke-width="18"/>` },
  { id: '4-cote-client', nom: 'Côté client', svg: `
    <rect x="156" y="46" width="200" height="420" rx="40" ${st}/>
    <line x1="226" y1="92" x2="286" y2="92" ${st}/>
    <path d="M196 206v-34h34M316 206v-34h-34M196 316v34h34M316 316v34h-34" ${sg}/>
    <rect x="218" y="194" width="30" height="30" rx="5" fill="${C}"/><rect x="264" y="194" width="30" height="30" rx="5" fill="${C}"/>
    <rect x="218" y="240" width="30" height="30" rx="5" fill="${C}"/><rect x="268" y="290" width="22" height="22" rx="4" fill="${C}"/>` },
  { id: '5-cuisine', nom: 'Cuisine', svg: `
    <path d="M86 340a170 170 0 0 1 340 0" ${st}/>
    <line x1="56" y1="360" x2="456" y2="360" ${st}/>
    <circle cx="256" cy="150" r="20" ${st}/>
    <circle cx="390" cy="176" r="62" fill="${G}" stroke="${BG}" stroke-width="18"/>
    <path d="M360 178l22 22 38-42" fill="none" stroke="${BG}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>` },
  { id: '6-l-equipe', nom: "L'équipe", svg: `
    <line x1="76" y1="150" x2="436" y2="150" ${st}/><line x1="76" y1="256" x2="436" y2="256" ${st}/><line x1="76" y1="362" x2="436" y2="362" ${st}/>
    <circle cx="176" cy="150" r="40" fill="${G}" stroke="${BG}" stroke-width="16"/>
    <circle cx="346" cy="256" r="40" fill="${G}" stroke="${BG}" stroke-width="16"/>
    <circle cx="236" cy="362" r="40" fill="${G}" stroke="${BG}" stroke-width="16"/>` },
  { id: '7-chiffres', nom: 'Chiffres', svg: `
    <line x1="66" y1="426" x2="446" y2="426" ${st}/>
    <rect x="96" y="336" width="70" height="90" rx="12" fill="${C}"/><rect x="206" y="286" width="70" height="140" rx="12" fill="${C}"/>
    <rect x="316" y="226" width="70" height="200" rx="12" fill="${C}"/>
    <path d="M86 256l110-64 80 26 150-120M426 98l-58 4M426 98l-6 58" ${sg}/>` },
  { id: '8-demo', nom: 'Démo', svg: `
    <rect x="76" y="106" width="360" height="340" rx="40" ${st}/>
    <line x1="76" y1="196" x2="436" y2="196" ${st}/>
    <line x1="176" y1="66" x2="176" y2="136" ${st}/><line x1="336" y1="66" x2="336" y2="136" ${st}/>
    <path d="M186 316l50 50 100-110" fill="none" stroke="${G}" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"/>` },
];
function page(ic) {
  const inner = ic.svg
    ? `<svg viewBox="0 0 512 512" width="560" height="560" xmlns="http://www.w3.org/2000/svg">${ic.svg}</svg>`
    : `<div style="width:470px">${marque.replace('<svg ', '<svg width="470" ')}</div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0}
body{width:1080px;height:1920px;background:${BG};display:flex;align-items:center;justify-content:center}</style></head>
<body>${inner}</body></html>`;
}
function preview(files) {
  const items = ICONS.map((ic, i) => `<figure><div class="c"><img src="data:image/png;base64,${fs.readFileSync(files[i]).toString('base64')}"></div>
    <figcaption>${ic.nom}</figcaption></figure>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0}
body{width:1640px;background:#fff;font:500 22px/1.2 -apple-system,Inter,Arial,sans-serif;color:#111;padding:40px 30px;box-sizing:border-box}
.row{display:flex;flex-wrap:wrap;gap:22px 30px}figure{margin:0;width:140px;text-align:center}
.c{width:132px;height:132px;border-radius:50%;padding:4px;border:2px solid #d6d6d6;overflow:hidden;margin:0 auto}
.c img{width:132px;height:132px;border-radius:50%;object-fit:cover;object-position:50% 50%;display:block}
figcaption{margin-top:10px;font-size:20px}</style></head><body><div class="row">${items}</div></body></html>`;
}
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const files = [];
  for (const ic of ICONS) {
    const f = path.join(out, `icone-${ic.id}.png`);
    await p.setContent(page(ic)); await p.screenshot({ path: f }); files.push(f);
  }
  await p.setViewportSize({ width: 1640, height: 300 });
  await p.setContent(preview(files)); await p.screenshot({ path: path.join(out, 'apercu-icones.png'), fullPage: true });
  await b.close(); console.log('ok', files.length);
})();
