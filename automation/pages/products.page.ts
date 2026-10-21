import { expect, type Page } from '@playwright/test';
import { ProductCard } from '../components/product-card.component';
export class ProductsPage {
  constructor(private readonly page: Page) {}
  async open() {
    await this.page.goto('/products');
    await expect(this.page.getByRole('heading', { name: 'Products' })).toBeVisible();
  }
  async search(value: string) {
    await this.page.getByLabel('Search catalog').fill(value);
    await this.page.getByLabel('Search catalog').press('Enter');
  }
  card(name: string) {
    return new ProductCard(this.page.getByRole('article').filter({ hasText: name }));
  }
  async expectProduct(name: string) {
    await expect(this.page.getByRole('heading', { name })).toBeVisible();
  }
}
