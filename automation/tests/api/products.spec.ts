import { test, expect } from '../../fixtures/test.fixture';
import { env } from '../../config/env';
import { productFactory } from '../../factories/data.factory';
import { productSchema } from '../../schemas/api.schemas';

test.describe('Products API', () => {
  test('admin creates and filters a product with schema-valid response', async ({
    auth,
    products,
  }) => {
    const login = await auth.login(env.ADMIN_EMAIL, env.ADMIN_PASSWORD);
    products.setToken((await login.json()).token);
    const model = productFactory();
    const response = await products.create(model);
    expect(response.status()).toBe(201);
    const product = (await response.json()).product;
    expect(() => productSchema.parse(product)).not.toThrow();
    const list = await products.list(`?search=${encodeURIComponent(model.sku)}&page=1&limit=5`);
    expect(list.status()).toBe(200);
    expect((await list.json()).items).toContainEqual(
      expect.objectContaining({ id: product.id, sku: model.sku }),
    );
  });
  test('customer cannot create and invalid price is rejected', async ({ auth, products }) => {
    const login = await auth.login('customer@testforge.local', 'TestForge123!');
    products.setToken((await login.json()).token);
    expect((await products.create(productFactory())).status()).toBe(403);
    const admin = await auth.login(env.ADMIN_EMAIL, env.ADMIN_PASSWORD);
    products.setToken((await admin.json()).token);
    expect((await products.create(productFactory({ priceCents: 0 }))).status()).toBe(400);
  });
  test('pagination and sort metadata are coherent', async ({ products }) => {
    const response = await products.list('?page=1&limit=2&sort=priceAsc');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.page).toBe(1);
    expect(body.limit).toBe(2);
    expect(body.items.length).toBeLessThanOrEqual(2);
    if (body.items.length === 2)
      expect(body.items[0].priceCents).toBeLessThanOrEqual(body.items[1].priceCents);
  });
  test('admin edits inventory and archives a product', async ({ auth, products, inventory }) => {
    const login = await auth.login(env.ADMIN_EMAIL, env.ADMIN_PASSWORD);
    const token = (await login.json()).token;
    products.setToken(token);
    inventory.setToken(token);
    const created = (await (await products.create(productFactory())).json()).product;
    const changed = await inventory.set(created.id, 11);
    expect((await changed.json()).product.inventory).toBe(11);
    expect((await products.archive(created.id)).status()).toBe(204);
    expect((await products.get(created.id)).status()).toBe(404);
  });
});
