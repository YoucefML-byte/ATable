import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { BISTROT, KARIM, PRO, ownerLogin, scanTable } from './helpers';

// E9 + E12 + E15 (vol. 08 §1.1): device enrolment, PIN login, order from a phone, appearance on
// the floor screen in less than 3 seconds, validation, kitchen, served, table closing.

async function enrolledTablet(browser: Browser): Promise<BrowserContext> {
  const tablet = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    hasTouch: true,
  });
  const page = await tablet.newPage();
  await ownerLogin(page, KARIM);
  await page.goto(`${PRO}/bistrot/appareils`);
  const enrolled = page.getByText(
    "Cet appareil est enrôlé : l'équipe peut s'y connecter par code PIN.",
  );
  if (!(await enrolled.isVisible())) {
    await page.getByLabel("Nom de l'appareil").fill('Tablette e2e');
    await page.getByRole('button', { name: 'Enrôler cet appareil' }).click();
    await expect(enrolled.first()).toBeVisible();
  }
  // The owner signs out: the device stays enrolled for the team.
  await page.getByRole('button', { name: 'Se déconnecter' }).first().click();
  await expect(page).toHaveURL(/\/connexion$/);
  await page.close();
  return tablet;
}

async function pinLogin(page: Page, name: string, pin: string) {
  await page.goto(`${PRO}/equipe`);
  await page.getByRole('button', { name }).click();
  for (const digit of pin) await page.getByRole('button', { name: digit, exact: true }).click();
}

test('E9 E12 E15 — PIN login, order in less than 3 s, kitchen, served, closing @tablet', async ({
  browser,
}) => {
  const tablet = await enrolledTablet(browser);
  const floor = await tablet.newPage();

  // E9 — PIN login on the enrolled tablet.
  await pinLogin(floor, 'Sofia', '518374');
  await expect(floor).toHaveURL(`${PRO}/bistrot/salle`);
  await floor.getByRole('button', { name: 'Démarrer le service' }).click();
  await expect(floor.getByText('Connecté', { exact: true })).toBeVisible();

  // Customer phone: scan, add a drink and a dessert, send.
  const phoneContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const phone = await phoneContext.newPage();
  await scanTable(phone, 'demoBistrotTable000009');
  await expect(phone.getByText('Vous êtes à : Terrasse 3').first()).toBeAttached();
  await phone.getByRole('button', { name: 'Ajouter Café', exact: true }).click();
  await phone.getByRole('button', { name: 'Ajouter Tiramisu', exact: true }).click();
  await phone.getByRole('button', { name: /Voir mon panier · 2/ }).click();
  await phone.getByLabel("Une précision pour l'équipe ?").fill('sans sucre');
  await phone.getByRole('button', { name: 'Envoyer ma commande' }).click();
  const sentAt = Date.now();
  await phone.getByRole('button', { name: 'Oui, envoyer' }).click();
  await expect(phone.getByText('Commande envoyée ✓')).toBeVisible();

  // E12 — appears on the floor in less than 3 seconds.
  const card = floor.getByRole('article', { name: /Terrasse 3/ });
  await expect(card).toBeVisible({ timeout: 3000 });
  const delay = Date.now() - sentAt;
  test.info().annotations.push({ type: 'delay-ms', description: String(delay) });
  expect(delay).toBeLessThan(3000);
  await expect(card.getByText('« sans sucre »')).toBeVisible();
  await card.getByRole('button', { name: 'Valider' }).click();

  // Kitchen on the same tablet (Sofia has every permission).
  const kitchen = await tablet.newPage();
  await kitchen.goto(`${PRO}/bistrot/cuisine`);
  const kitchenCard = kitchen.getByRole('article').filter({ hasText: 'Terrasse 3' });
  await expect(kitchenCard).toBeVisible();
  await kitchenCard.getByRole('button', { name: 'PRÊTE' }).click();
  await expect(kitchen.getByText(/Commande n° \d+ prête/)).toBeVisible();
  // After the 5-second undo window, the order is sent to "ready".
  await expect(
    floor.getByRole('article', { name: /Terrasse 3/ }).getByRole('button', { name: 'Servie' }),
  ).toBeVisible({ timeout: 12_000 });
  await floor
    .getByRole('article', { name: /Terrasse 3/ })
    .getByRole('button', { name: 'Servie' })
    .click();
  await expect(floor.getByRole('article', { name: /Terrasse 3/ })).toHaveCount(0);

  // E15 — close the table, then a new scan starts a new session.
  await floor.getByRole('link', { name: 'Vue tables' }).click();
  await floor.getByRole('button', { name: /Terrasse 3/ }).click();
  await expect(floor.getByText('Total validé')).toBeVisible();
  await floor.getByRole('button', { name: 'Clôturer la table' }).click();
  await floor.getByRole('button', { name: 'Confirmer' }).click();
  await expect(floor.getByText('Table libérée.')).toBeVisible();

  await phone.goto(`${BISTROT}/commandes`);
  await expect(
    phone.getByText("Vous n'avez pas encore passé de commande à cette table."),
  ).toBeVisible();

  await phoneContext.close();
  await tablet.close();
});
