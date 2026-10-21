import { test, expect } from '../../fixtures/test.fixture';
import { customerFactory, unique } from '../../factories/data.factory';
import { orderSchema } from '../../schemas/api.schemas';

test('checkout is idempotent and payment state matches order state', async ({
  auth,
  products,
  cart,
  orders,
}) => {
  const customer = customerFactory();
  const registered = await auth.register(customer);
  const session = await registered.json();
  const adminLogin = await auth.login('admin@testforge.local', 'TestForge123!');
  products.setToken((await adminLogin.json()).token);
  const product = (
    await (
      await products.create({
        sku: `IDEM-${unique()}`,
        name: 'Idempotent Item',
        description: 'Created for idempotency validation',
        priceCents: 2500,
        inventory: 3,
        category: 'Tests',
      })
    ).json()
  ).product;
  cart.setToken(session.token);
  orders.setToken(session.token);
  await cart.set(product.id, 1);
  const key = `checkout-${unique()}`;
  const first = await orders.checkout(key);
  expect(first.status()).toBe(201);
  const firstOrder = (await first.json()).order;
  expect(() => orderSchema.parse(firstOrder)).not.toThrow();
  const second = await orders.checkout(key);
  expect(second.status()).toBe(200);
  const body = await second.json();
  expect(body.duplicate).toBe(true);
  expect(body.order.id).toBe(firstOrder.id);
  expect(firstOrder.payment.status).toBe('SUCCEEDED');
  expect(firstOrder.status).toBe('PAID');
});
