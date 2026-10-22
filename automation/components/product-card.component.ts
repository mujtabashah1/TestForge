import { expect, type Locator } from '@playwright/test';
export class ProductCard {
  constructor(private readonly root: Locator) {}
  async addToCart() {
    const page = this.root.page();
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/cart/items') && response.request().method() === 'PUT',
    );
    const dialogPromise = page.waitForEvent('dialog').then(async (dialog) => {
      expect(dialog.message()).toBe('Added to cart');
      await dialog.accept();
    });
    await this.root.getByRole('button', { name: 'Add to cart' }).click();
    expect((await responsePromise).ok()).toBeTruthy();
    await dialogPromise;
  }
}
