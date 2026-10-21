import { test, expect } from '../../fixtures/test.fixture';
import { customerFactory, productFactory, unique } from '../../factories/data.factory';
import { env } from '../../config/env';
import { query } from '../../db/database';

test('cancelling a paid order restores inventory and refunds payment', async ({
  auth,
  products,
  cart,
  orders,
}) => {
  const session = await (await auth.register(customerFactory())).json();
  const admin = await (await auth.login(env.ADMIN_EMAIL, env.ADMIN_PASSWORD)).json();
  products.setToken(admin.token);
  const product = (await (await products.create(productFactory({ inventory: 2 }))).json()).product;
  cart.setToken(session.token);
  orders.setToken(session.token);
  await cart.set(product.id, 1);
  const order = (await (await orders.checkout(`cancel-${unique()}`)).json()).order;
  orders.setToken(admin.token);
  const cancelled = await orders.status(order.id, 'CANCELLED');
  expect((await cancelled.json()).order).toMatchObject({
    status: 'CANCELLED',
    payment: { status: 'REFUNDED' },
  });
  expect((await orders.status(order.id, 'SHIPPED')).status()).toBe(409);
  const row = await query<{ inventory: number }>('SELECT inventory FROM "Product" WHERE id=$1', [
    product.id,
  ]);
  expect(row.rows[0]?.inventory).toBe(2);
});
