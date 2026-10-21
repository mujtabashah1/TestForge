import { BaseClient } from './base.client';
export class OrdersClient extends BaseClient {
  checkout(idempotencyKey: string, paymentToken: 'tok_success' | 'tok_fail' = 'tok_success') {
    return this.call('/orders/checkout', {
      method: 'POST',
      data: { idempotencyKey, paymentToken },
    });
  }
  list() {
    return this.call('/orders');
  }
  get(id: string) {
    return this.call(`/orders/${id}`);
  }
  status(id: string, status: string) {
    return this.call(`/orders/${id}/status`, { method: 'PATCH', data: { status } });
  }
}
