import { expect, type Page } from '@playwright/test';
export class CartPage {
  constructor(private readonly page: Page) {}
  async open() {
    await this.page.goto('/cart', { waitUntil: 'commit' });
    await expect(this.page.getByRole('heading', { name: 'Your cart' })).toBeVisible();
  }
  async checkout() {
    await this.page.getByRole('button', { name: 'Pay and place order' }).click();
  }
}
