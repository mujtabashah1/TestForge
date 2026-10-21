import { BaseClient } from './base.client';
export class ProductsClient extends BaseClient {
  list(query = '') {
    return this.call(`/products${query}`);
  }
  get(id: string) {
    return this.call(`/products/${id}`);
  }
  create(data: unknown) {
    return this.call('/products', { method: 'POST', data });
  }
  update(id: string, data: unknown) {
    return this.call(`/products/${id}`, { method: 'PATCH', data });
  }
  archive(id: string) {
    return this.call(`/products/${id}`, { method: 'DELETE' });
  }
}
