import { test, expect } from '@playwright/test';
import { ADMIN, CONSOLE, KARIM, MAILPIT, PRO, ownerLogin } from './helpers';

// Platform console (CON-01 to CON-06).

test('CON-01/02 — create a shop, invite its owner, add a domain, read the journal @desktop', async ({
  page,
  request,
}) => {
  const slug = `e2e-${Date.now() % 1_000_000}`;
  const email = `${slug}@patron.test`;
  await ownerLogin(page, ADMIN, CONSOLE);
  await expect(page).toHaveURL(`${CONSOLE}/`);
  await expect(page.getByRole('heading', { level: 1, name: 'Commerces' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Le Bistrot Démo' })).toBeVisible();

  await page.getByRole('link', { name: 'Nouveau commerce' }).click();
  await page.getByLabel('Nom du commerce').fill(`Brasserie ${slug}`);
  await expect(page.getByLabel('Identifiant (sous-domaine)')).toHaveValue(`brasserie-${slug}`);
  await page.getByLabel('E-mail du patron').fill(email);
  await page.getByLabel("Prénom du patron (affiché dans l'espace pro)").fill('Nadia');
  await page.getByRole('button', { name: 'Créer le commerce et inviter le patron' }).click();
  await expect(
    page.getByText('Commerce créé. Une invitation a été envoyée au patron.'),
  ).toBeVisible();
  await expect(page.getByText('Mise en place').first()).toBeVisible();
  await expect(page.getByText(`brasserie-${slug}.localhost`)).toBeVisible();

  // Custom domain without the Vercel API: recorded, then confirmed by hand.
  await page.getByLabel('Ajouter un domaine').fill(`www.${slug}.test`);
  await page.getByRole('button', { name: 'Ajouter un domaine' }).click();
  await expect(page.getByText(`www.${slug}.test`)).toBeVisible();
  await page.getByRole('button', { name: 'Marquer comme vérifié' }).click();
  await expect(page.getByRole('button', { name: 'Rendre principal' })).toBeVisible();

  // Activation.
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Passer en « Actif »' }).click();
  await expect(page.getByText('Actif', { exact: true }).first()).toBeVisible();

  // The invitation e-mail leads to the "choose a password" page of the pro space.
  const list = await (
    await request.get(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`)
  ).json();
  expect(list.messages.length).toBeGreaterThan(0);
  const message = await (
    await request.get(`${MAILPIT}/api/v1/message/${list.messages[0].ID}`)
  ).json();
  const link = /href="([^"]+auth\/confirm[^"]+)"/.exec(message.HTML)?.[1]?.replaceAll('&amp;', '&');
  expect(link).toBeTruthy();
  expect(link).toContain(PRO);

  // Journal filtered on the shop.
  await page.getByRole('link', { name: 'Voir tout le journal' }).click();
  await expect(page.getByText('shop.create')).toBeVisible();
  await expect(page.getByText('domain.add')).toBeVisible();

  // Exports.
  const shopUrl = page.url();
  const shopId = /shop=([0-9a-f-]{36})/.exec(shopUrl)?.[1];
  const exported = await page.evaluate(async (id) => {
    const res = await fetch(`/api/console/export/${id}`);
    const csv = await fetch(`/api/console/export/${id}?format=csv`);
    return { status: res.status, text: await res.text(), csvType: csv.headers.get('content-type') };
  }, shopId);
  expect(exported.status).toBe(200);
  expect(JSON.parse(exported.text).format).toBe('atable-export');
  expect(exported.text).not.toContain('token');
  expect(exported.csvType).toContain('text/csv');

  const invited = await page.context().newPage();
  await invited.goto(link!);
  await expect(invited).toHaveURL(`${PRO}/nouveau-mot-de-passe`);
});

test('CON — an owner cannot open the console @desktop', async ({ page }) => {
  await ownerLogin(page, KARIM, CONSOLE).catch(() => null);
  await page.goto(`${CONSOLE}/`);
  await expect(page.getByRole('heading', { level: 1, name: 'Commerces' })).toHaveCount(0);
  const status = await page.evaluate(
    async () => (await fetch('/api/console/export/c1000000-0000-4000-8000-000000000001')).status,
  );
  expect([401, 403]).toContain(status);
});
