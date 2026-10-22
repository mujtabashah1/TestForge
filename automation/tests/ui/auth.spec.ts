import { test, expect } from '../../fixtures/test.fixture';
import { LoginPage } from '../../pages/login.page';
import { env } from '../../config/env';
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

test('UI logout revokes the token before clearing browser state', async ({ page, request }) => {
  const login = new LoginPage(page);
  await login.open();
  await login.login('customer@testforge.local', 'TestForge123!');
  await expect(page).toHaveURL(/\/products$/);
  const token = await page.evaluate(() => localStorage.getItem('testforge_token'));
  expect(token).toBeTruthy();

  const logoutResponse = page.waitForResponse(
    (response) => response.url().endsWith('/auth/logout') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: /Sign out/ }).click();
  expect((await logoutResponse).status()).toBe(204);
  await expect(page).toHaveURL('/');
  expect(await page.evaluate(() => localStorage.getItem('testforge_token'))).toBeNull();

  const replay = await request.get(`${env.API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(replay.status()).toBe(401);
});
