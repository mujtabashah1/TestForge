import { BaseClient } from './base.client';
export class PaymentsClient extends BaseClient {
  retry(orderId: string, idempotencyKey: string, paymentToken: 'tok_success' | 'tok_fail') {
    return this.call(`/payments/${orderId}/retry`, {
      method: 'POST',
      data: { idempotencyKey, paymentToken },
    });
  }
}
