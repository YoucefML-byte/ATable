import { test, expect } from '@playwright/test';
import { KARIM, PRO, ownerLogin } from './helpers';

// Every owner screen opens without a server or browser error (REG, CAT, TAB, DSH).
const PAGES: Array<[string, string]> = [
  ['tableau-de-bord', 'Tableau de bord'],
  ['carte', 'Carte'],
  ['cartes-horaires', 'Cartes et horaires'],
  ['tables', 'Tables et QR codes'],
  ['reglages', 'Réglages'],
  ['theme', 'Thème et identité visuelle'],
  ['historique', 'Historique des commandes'],
  ['equipe', 'Équipe'],
  ['appareils', 'Appareils'],
];

test('owner screens render @desktop', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await ownerLogin(page, KARIM);
  for (const [path, heading] of PAGES) {
    await page.goto(`${PRO}/bistrot/${path}`);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    if (process.env.PW_SCREENSHOTS)
      await page.screenshot({ path: `${process.env.PW_SCREENSHOTS}/${path}.png`, fullPage: true });
  }
  expect(errors).toEqual([]);
});

test('schedule simulator answers for a Tuesday lunch @desktop', async ({ page }) => {
  await ownerLogin(page, KARIM);
  await page.goto(`${PRO}/bistrot/cartes-horaires`);
  await page.getByLabel('Date').fill('2026-10-13');
  await page.getByLabel('Heure').fill('12:30');
  await page.getByRole('button', { name: 'Voir' }).click();
  await expect(page.getByText(/Cartes actives : .*Carte du midi/)).toBeVisible();
  await page.getByLabel('Heure').fill('16:30');
  await page.getByRole('button', { name: 'Voir' }).click();
  await expect(page.getByText(/Cartes actives : Boissons et desserts$/)).toBeVisible();
});

test('theme editor blocks a low-contrast main colour @desktop', async ({ page }) => {
  await ownerLogin(page, KARIM);
  await page.goto(`${PRO}/bistrot/theme`);
  await page.getByLabel('Couleur principale (hex)').fill('#FFFF66');
  await expect(page.getByText(/trop proche du fond/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
  await page.getByRole('button', { name: /^Utiliser #/ }).click();
  await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeEnabled();
});

test('CAT-01/03 — a new product with allergens shows on the customer menu @desktop', async ({
  page,
  browser,
}) => {
  const name = `Plat e2e ${Date.now() % 100000}`;
  await ownerLogin(page, KARIM);
  await page.goto(`${PRO}/bistrot/carte`);
  await page.getByRole('button', { name: /^Plats/ }).click();
  await page.getByRole('button', { name: 'Nouveau produit' }).click();
  await page.getByLabel('Nom', { exact: true }).fill(name);
  await page.getByLabel('Prix de base (€)').fill('12,5');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page.getByText('Enregistré').first()).toBeVisible();
  await page
    .getByRole('radiogroup', { name: 'Lait' })
    .getByRole('radio', { name: 'Contient' })
    .click();
  await page.getByRole('button', { name: 'Enregistrer les allergènes' }).click();
  await expect(page.getByText(/Déclarés le/)).toBeVisible();

  const phone = await browser.newPage();
  await phone.goto('http://bistrot.localhost:3000/t/demoBistrotTable000001');
  await expect(phone.getByText(name).first()).toBeVisible({ timeout: 10_000 });
  await expect(phone.getByText('12,50 €').first()).toBeVisible();
  await phone.close();
});

test('TAB-02 — QR code of a table and A4 print sheet @desktop', async ({ page }) => {
  await ownerLogin(page, KARIM);
  await page.goto(`${PRO}/bistrot/tables`);
  await page
    .getByRole('row', { name: /Table 1\b/ })
    .getByRole('button', { name: 'Modifier' })
    .click();
  await expect(page.getByRole('img', { name: 'QR code de Table 1' }).locator('svg')).toBeVisible();
  await page.getByLabel('Format').selectOption('labels6');
  const [sheet] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('button', { name: /Planche d'impression/ }).click(),
  ]);
  await expect(sheet.getByText(/\d+ QR codes/)).toBeVisible();
  await expect(sheet.locator('section svg').first()).toBeVisible();
});
