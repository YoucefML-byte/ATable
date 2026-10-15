import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { BISTROT, scanTable } from './helpers';

// Customer journey on a phone (CLI-01 to CLI-08). Only always-available products (drinks and
// desserts menu) are used, so the test does not depend on the time of day.

async function expectNoSeriousA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(
    serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}

test('CLI-01 to CLI-07 — scan, allergens, cart, order, my orders @mobile', async ({ page }) => {
  await scanTable(page, 'demoBistrotTable000002');
  await expect(page.getByText('Vous êtes à : Table 2').first()).toBeAttached();
  await expectNoSeriousA11yViolations(page);

  // CLI-02 — allergen information of a product.
  await page.getByRole('button', { name: /^Tiramisu/ }).click();
  await expect(page.getByText(/Contient : .*œufs.*lait/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Fermer la fiche' }).click();

  // CLI-04 — cart: two coffees, total computed and shown with the counter notice.
  await page.getByRole('button', { name: 'Ajouter Café', exact: true }).click();
  await page.getByRole('button', { name: 'Ajouter un Café' }).click();
  await page.getByRole('button', { name: /Voir mon panier · 2/ }).click();
  await expect(page.getByText('3,60 €').first()).toBeVisible();
  await expect(page.getByText('Le paiement se fait au comptoir.')).toBeVisible();

  // CLI-05 — sending with confirmation.
  await page.getByRole('button', { name: 'Envoyer ma commande' }).click();
  await page.getByRole('button', { name: 'Oui, envoyer' }).click();
  await expect(page.getByText('Commande envoyée ✓')).toBeVisible();

  // CLI-07 — my orders at this table, with an indicative total.
  await page.getByRole('link', { name: 'Voir mes commandes' }).click();
  await expect(page).toHaveURL(`${BISTROT}/commandes`);
  await expect(page.getByText('Envoyée').first()).toBeVisible();
  await expect(page.getByText(/Montant indicatif/)).toBeVisible();
  await expectNoSeriousA11yViolations(page);
});

test('CLI-01 CA3 — an unknown or regenerated QR code shows a clear page @mobile', async ({
  page,
}) => {
  await page.goto(`${BISTROT}/t/thisTokenDoesNotExist000`);
  await expect(page).toHaveURL(`${BISTROT}/qr-invalide`);
  await expect(page.getByRole('heading', { name: "Ce QR code n'est plus valide" })).toBeVisible();
});

test('CLI-05 — a body carrying a price is refused (M2) @mobile', async ({ page }) => {
  await scanTable(page, 'demoBistrotTable000003');
  const result = await page.evaluate(async () => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idempotencyKey: crypto.randomUUID(),
        note: null,
        items: [
          {
            product_id: 'f1000000-0000-4000-8000-000000000021',
            quantity: 1,
            options: [],
            unit_price_cents: 1,
          },
        ],
      }),
    });
    return { status: res.status, body: await res.json() };
  });
  // Unknown fields are refused by the strict schema: the browser cannot even send a price.
  expect(result.status).toBe(400);
});
