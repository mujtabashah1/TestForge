import { expect, type Page } from '@playwright/test';
export class OrdersPage {
  constructor(private readonly page: Page) {}
  async expectConfirmation() {
    await expect(this.page.getByRole('status')).toContainText('Order confirmed:');
  }
  async confirmedOrderId() {
    const text = await this.page.getByRole('status').textContent();
    return text!.replace('Order confirmed: ', '').trim();
  }
}
