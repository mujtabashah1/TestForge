import { test as base } from '@playwright/test';
import { AuthClient } from '../api/auth.client';
import { ProductsClient } from '../api/products.client';
import { CartClient } from '../api/cart.client';
import { OrdersClient } from '../api/orders.client';
import { UsersClient } from '../api/users.client';
import { InventoryClient } from '../api/inventory.client';
import { PaymentsClient } from '../api/payments.client';
type Fixtures = {
  auth: AuthClient;
  products: ProductsClient;
  cart: CartClient;
  orders: OrdersClient;
  users: UsersClient;
  inventory: InventoryClient;
  payments: PaymentsClient;
};
export const test = base.extend<Fixtures>({
  auth: async ({ request }, use) => use(new AuthClient(request)),
  products: async ({ request }, use) => use(new ProductsClient(request)),
  cart: async ({ request }, use) => use(new CartClient(request)),
  orders: async ({ request }, use) => use(new OrdersClient(request)),
  users: async ({ request }, use) => use(new UsersClient(request)),
  inventory: async ({ request }, use) => use(new InventoryClient(request)),
  payments: async ({ request }, use) => use(new PaymentsClient(request)),
});
export { expect } from '@playwright/test';
