import type { Locator } from '@playwright/test';
export class ProductCard {
  constructor(private readonly root: Locator) {}
  async addToCart() {
    await this.root.getByRole('button', { name: 'Add to cart' }).click();
  }
}
