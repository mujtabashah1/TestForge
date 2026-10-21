import { test, expect } from '../../fixtures/test.fixture';
import { customerFactory, productFactory, unique } from '../../factories/data.factory';
import { env } from '../../config/env';

test('cart supports quantity boundaries and removal', async ({ auth, products, cart }) => {
  const session = await (await auth.register(customerFactory())).json();
  const admin = await (await auth.login(env.ADMIN_EMAIL, env.ADMIN_PASSWORD)).json();
  products.setToken(admin.token);
  const product = (await (await products.create(productFactory({ inventory: 2 }))).json()).product;
  cart.setToken(session.token);
  expect((await cart.set(product.id, 2)).ok()).toBeTruthy();
  expect((await cart.set(product.id, 3)).status()).toBe(409);
  const current = await (await cart.get()).json();
  expect(current.items[0]).toMatchObject({ productId: product.id, quantity: 2 });
  expect((await cart.remove(product.id)).status()).toBe(204);
  expect((await (await cart.get()).json()).items).toHaveLength(0);
});

test('failed payment can be retried once and reconciles order state', async ({
  auth,
  products,
  cart,
  orders,
  payments,
}) => {
  const session = await (await auth.register(customerFactory())).json();
  const admin = await (await auth.login(env.ADMIN_EMAIL, env.ADMIN_PASSWORD)).json();
  products.setToken(admin.token);
  const product = (await (await products.create(productFactory({ inventory: 2 }))).json()).product;
  cart.setToken(session.token);
  orders.setToken(session.token);
  payments.setToken(session.token);
  await cart.set(product.id, 1);
  const failed = await orders.checkout(`failed-${unique()}`, 'tok_fail');
  expect(failed.status()).toBe(201);
  const failedOrder = (await failed.json()).order;
  expect(failedOrder).toMatchObject({ status: 'PAYMENT_FAILED', payment: { status: 'FAILED' } });
  expect((await payments.retry(failedOrder.id, `retry-${unique()}`, 'tok_fail')).status()).toBe(
    402,
  );
  const succeeded = await payments.retry(failedOrder.id, `retry-${unique()}`, 'tok_success');
  expect((await succeeded.json()).order).toMatchObject({
    status: 'PAID',
    payment: { status: 'SUCCEEDED' },
  });
  expect((await payments.retry(failedOrder.id, `retry-${unique()}`, 'tok_success')).status()).toBe(
    409,
  );
});
