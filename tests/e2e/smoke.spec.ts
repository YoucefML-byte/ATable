import { test, expect } from '@playwright/test';
import { KARIM, PRO, ownerLogin } from './helpers';

test('smoke — owner login with 2FA reaches the floor @desktop', async ({ page }) => {
  await ownerLogin(page, KARIM);
  await expect(page).toHaveURL(`${PRO}/bistrot/salle`);
  await expect(page.getByRole('heading', { name: 'Salle' })).toBeVisible();
});
