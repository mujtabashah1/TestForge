import { test, expect } from '../../fixtures/test.fixture';
import { env } from '../../config/env';
import { customerFactory, productFactory } from '../../factories/data.factory';
import { orderSchema } from '../../schemas/api.schemas';
import { query, cleanup } from '../../db/database';
import { LoginPage } from '../../pages/login.page';
import { ProductsPage } from '../../pages/products.page';
import { CartPage } from '../../pages/cart.page';
import { OrdersPage } from '../../pages/orders.page';

test('Complete Order Lifecycle — UI, API, and Database Validation', async ({
  page,
  auth,
  products,
  orders,
}, testInfo) => {
  const customer = customerFactory();
  const model = productFactory({ inventory: 4, priceCents: 4321 });
  const users: string[] = [];
  const productIds: string[] = [];
  try {
    const registration = await auth.register(customer);
    expect(registration.status()).toBe(201);
    const session = await registration.json();
    users.push(session.user.id);
    const admin = await auth.login(env.ADMIN_EMAIL, env.ADMIN_PASSWORD);
    products.setToken((await admin.json()).token);
    const created = await products.create(model);
    expect(created.status()).toBe(201);
    const product = (await created.json()).product;
    productIds.push(product.id);
    const initial = await query<{ inventory: number }>(
      'SELECT inventory FROM "Product" WHERE id=$1',
      [product.id],
    );
    expect(initial.rows[0]?.inventory).toBe(4);
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login(customer.email, customer.password);
    const productsPage = new ProductsPage(page);
    await productsPage.search(model.sku);
    await productsPage.expectProduct(model.name);
    await productsPage.card(model.name).addToCart();
    const cartPage = new CartPage(page);
    await cartPage.open();
    await cartPage.checkout();
    const ordersPage = new OrdersPage(page);
    await ordersPage.expectConfirmation();
    const orderId = await ordersPage.confirmedOrderId();
    await page.screenshot({ path: testInfo.outputPath('order-confirmation.png'), fullPage: true });
    orders.setToken(session.token);
    const apiResponse = await orders.get(orderId);
    expect(apiResponse.ok()).toBeTruthy();
    const payload = await apiResponse.json();
    await testInfo.attach('order-api-response', {
      body: JSON.stringify(payload, null, 2),
      contentType: 'application/json',
    });
    expect(() => orderSchema.parse(payload.order)).not.toThrow();
    expect(payload.order.totalCents).toBe(model.priceCents);
    expect(payload.order.status).toBe('PAID');
    const persisted = await query<{
      status: string;
      totalCents: number;
      paymentStatus: string;
      inventory: number;
    }>(
      'SELECT o.status,o."totalCents",p.status AS "paymentStatus",pr.inventory FROM "Order" o JOIN "Payment" p ON p."orderId"=o.id JOIN "OrderItem" oi ON oi."orderId"=o.id JOIN "Product" pr ON pr.id=oi."productId" WHERE o.id=$1',
      [orderId],
    );
    expect(persisted.rows[0]).toMatchObject({
      status: 'PAID',
      totalCents: model.priceCents,
      paymentStatus: 'SUCCEEDED',
      inventory: 3,
    });
  } finally {
    await cleanup(users, productIds);
  }
});
