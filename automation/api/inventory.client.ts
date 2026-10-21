import { BaseClient } from './base.client';
export class InventoryClient extends BaseClient {
  set(productId: string, inventory: number) {
    return this.call(`/products/${productId}`, { method: 'PATCH', data: { inventory } });
  }
}
