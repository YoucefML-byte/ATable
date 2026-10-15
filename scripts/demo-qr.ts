// Prints the QR links of the demo tables (local seed) and writes the PNG codes, to test the
// customer journey with a real phone on the same network:
//   pnpm demo:qr [output-folder]
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import QRCode from 'qrcode';

const out = process.argv[2] ?? join(process.cwd(), '.demo-qr');
const scheme = process.env.PUBLIC_SCHEME ?? 'http';
const port = (process.env.PLATFORM_PRO_HOST ?? '').split(':')[1];
const root = process.env.PLATFORM_ROOT_DOMAIN ?? 'localhost';
const suffix = port ? `:${port}` : '';

const tables = [
  ...Array.from({ length: 10 }, (_, i) => ({
    shop: `bistrot.${root}`,
    token: `demoBistrotTable${String(i + 1).padStart(6, '0')}`,
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    shop: `lounge.${root}`,
    token: `demoLoungeTable0${String(i + 1).padStart(6, '0')}`,
  })),
];

mkdirSync(out, { recursive: true });
for (const t of tables) {
  const url = `${scheme}://${t.shop}${suffix}/t/${t.token}`;
  await QRCode.toFile(join(out, `${t.token}.png`), url, { width: 600, margin: 2 });
  console.log(url);
}
console.log(`\n${tables.length} QR codes written to ${out}`);
