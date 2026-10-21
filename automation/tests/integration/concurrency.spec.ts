import { test, expect } from '../../fixtures/test.fixture';
import { CartClient } from '../../api/cart.client';
import { OrdersClient } from '../../api/orders.client';
import { env } from '../../config/env';
import { customerFactory, productFactory, unique } from '../../factories/data.factory';
import { query } from '../../db/database';

test('simultaneous purchases cannot oversell inventory', async ({
  request,
  auth,
  products,
}, testInfo) => {
  const admin = await auth.login(env.ADMIN_EMAIL, env.ADMIN_PASSWORD);
  products.setToken((await admin.json()).token);
  const product = (await (await products.create(productFactory({ inventory: 1 }))).json()).product;
  const sessions = [] as Array<{ token: string; user: { id: string } }>;
  for (let i = 0; i < 2; i++) {
    const response = await auth.register(customerFactory());
    sessions.push(await response.json());
  }
  for (const session of sessions) {
    const cart = new CartClient(request, session.token);
    expect((await cart.set(product.id, 1)).ok()).toBeTruthy();
  }
  const results = await Promise.all(
    sessions.map((session, index) =>
      new OrdersClient(request, session.token).checkout(`race-${index}-${unique()}`),
    ),
  );
  const statuses = results.map((r) => r.status()).sort();
  await testInfo.attach('checkout-statuses', {
    body: JSON.stringify(statuses),
    contentType: 'application/json',
  });
  expect(statuses).toEqual([201, 409]);
  const stock = await query<{ inventory: number }>('SELECT inventory FROM "Product" WHERE id=$1', [
    product.id,
  ]);
  expect(stock.rows[0]?.inventory).toBe(0);
  const count = await query<{ count: string }>(
    'SELECT count(*) FROM "OrderItem" WHERE "productId"=$1',
    [product.id],
  );
  expect(Number(count.rows[0]?.count)).toBe(1);
});
