import { test, expect } from '../../fixtures/test.fixture';
import { ProductsPage } from '../../pages/products.page';
test('customer can search the catalog', async ({ page }) => {
  const products = new ProductsPage(page);
  await products.open();
  await products.search('ForgeBook');
  await products.expectProduct('ForgeBook Pro');
});
test('empty search result is explicit', async ({ page }) => {
  const products = new ProductsPage(page);
  await products.open();
  await products.search('definitely-not-a-product');
  await expect(page.getByText('No products match your search.')).toBeVisible();
});
