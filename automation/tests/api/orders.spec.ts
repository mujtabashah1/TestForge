import { test, expect } from '../../fixtures/test.fixture';
import { customerFactory, unique } from '../../factories/data.factory';
import { orderSchema } from '../../schemas/api.schemas';
import { env } from '../../config/env';

test('checkout is idempotent and payment state matches order state', async ({
  auth,
  products,
  cart,
  orders,
}) => {
  const customer = customerFactory();
  const registered = await auth.register(customer);
  const session = await registered.json();
  const adminLogin = await auth.login(env.ADMIN_EMAIL, env.ADMIN_PASSWORD);
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

test('checkout idempotency keys cannot expose another customer order', async ({
  auth,
  products,
  cart,
  orders,
}) => {
  const firstCustomer = await (await auth.register(customerFactory())).json();
  const secondCustomer = await (await auth.register(customerFactory())).json();
  const admin = await (await auth.login(env.ADMIN_EMAIL, env.ADMIN_PASSWORD)).json();
  products.setToken(admin.token);
  const product = (
    await (
      await products.create({
        sku: `IDEM-${unique()}`,
        name: 'Ownership Boundary Item',
        description: 'Validates customer-scoped idempotency behavior',
        priceCents: 1800,
        inventory: 2,
        category: 'Tests',
      })
    ).json()
  ).product;

  cart.setToken(firstCustomer.token);
  orders.setToken(firstCustomer.token);
  await cart.set(product.id, 1);
  const key = `checkout-${unique()}`;
  expect((await orders.checkout(key)).status()).toBe(201);

  orders.setToken(secondCustomer.token);
  const collision = await orders.checkout(key);
  expect(collision.status()).toBe(409);
  expect(await collision.json()).toEqual({ error: 'Idempotency key is already in use' });
});
