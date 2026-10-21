import { test, expect } from '../../fixtures/test.fixture';
import { LoginPage } from '../../pages/login.page';
test('valid customer login opens the catalog', async ({ page }) => {
  const login = new LoginPage(page);
  await login.open();
  await login.login('customer@testforge.local', 'TestForge123!');
  await expect(page).toHaveURL(/\/products$/);
});
test('invalid password displays an accessible error', async ({ page }) => {
  const login = new LoginPage(page);
  await login.open();
  await login.login('customer@testforge.local', 'WrongPassword!');
  await login.expectError('Invalid email or password');
});
test('protected cart reports missing authentication', async ({ page }) => {
  await page.goto('/cart');
  await expect(page.locator('p[role="alert"]')).toContainText('Authentication required');
});
