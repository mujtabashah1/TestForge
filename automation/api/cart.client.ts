import { BaseClient } from './base.client';
export class CartClient extends BaseClient {
  get() {
    return this.call('/cart');
  }
  set(productId: string, quantity: number) {
    return this.call('/cart/items', { method: 'PUT', data: { productId, quantity } });
  }
  remove(productId: string) {
    return this.call(`/cart/items/${productId}`, { method: 'DELETE' });
  }
}
