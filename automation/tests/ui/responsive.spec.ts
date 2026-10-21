import { test, expect } from '../../fixtures/test.fixture';
test('catalog remains usable at the configured viewport', async ({ page }) => {
  await page.goto('/products');
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
});
