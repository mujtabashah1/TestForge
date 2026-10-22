import { test, expect } from '../../fixtures/test.fixture';
import { customerFactory } from '../../factories/data.factory';
import { productFactory } from '../../factories/data.factory';
import { userSchema } from '../../schemas/api.schemas';
import jwt from 'jsonwebtoken';
import { cleanup, query } from '../../db/database';
import { env } from '../../config/env';

test.describe('Authentication API', () => {
  test('registers, authenticates, and rejects duplicate registration', async ({ auth }) => {
    const customer = customerFactory();
    const created = await auth.register(customer);
    expect(created.status()).toBe(201);
    const body = await created.json();
    expect(() => userSchema.parse(body.user)).not.toThrow();
    expect(body.token).toBeTruthy();
    const duplicate = await auth.register(customer);
    expect(duplicate.status()).toBe(409);
    expect(await duplicate.json()).toMatchObject({ error: 'Email already registered' });
    const login = await auth.login(customer.email, customer.password);
    expect(login.ok()).toBeTruthy();
  });
  test('rejects missing credentials and invalid password', async ({ auth }) => {
    const missing = await auth.login('', '');
    expect(missing.status()).toBe(400);
    const invalid = await auth.login('customer@testforge.local', 'WrongPassword!');
    expect(invalid.status()).toBe(401);
  });
  test('rejects absent and invalid bearer tokens', async ({ auth }) => {
    expect((await auth.me()).status()).toBe(401);
    auth.setToken('not-a-jwt');
    expect((await auth.me()).status()).toBe(401);
  });

  test('rejects an expired signed token', async ({ auth }) => {
    const customer = customerFactory();
    const session = await (await auth.register(customer)).json();
    try {
      auth.setToken(
        jwt.sign({ userId: session.user.id, tokenVersion: 0 }, env.JWT_SECRET, {
          algorithm: 'HS256',
          expiresIn: -1,
          issuer: env.JWT_ISSUER,
          audience: env.JWT_AUDIENCE,
          subject: session.user.id,
        }),
      );
      expect((await auth.me()).status()).toBe(401);
    } finally {
      await cleanup([session.user.id], []);
    }
  });

  test('logout revokes reuse of the authenticated token', async ({ auth }) => {
    const customer = customerFactory();
    const session = await (await auth.register(customer)).json();
    auth.setToken(session.token);
    try {
      expect((await auth.me()).status()).toBe(200);
      expect((await auth.logout()).status()).toBe(204);
      expect((await auth.me()).status()).toBe(401);
    } finally {
      await cleanup([session.user.id], []);
    }
  });

  test('uses the current database role instead of a stale token claim', async ({
    auth,
    products,
  }) => {
    const customer = customerFactory();
    const product = productFactory();
    const session = await (await auth.register(customer)).json();
    auth.setToken(session.token);
    products.setToken(session.token);
    const productIds: string[] = [];
    try {
      expect((await products.create(product)).status()).toBe(403);
      await query('UPDATE "User" SET role = $1 WHERE id = $2', ['ADMIN', session.user.id]);
      const created = await products.create(product);
      expect(created.status()).toBe(201);
      productIds.push((await created.json()).id);
      await query('UPDATE "User" SET role = $1 WHERE id = $2', ['CUSTOMER', session.user.id]);
      expect((await products.create(productFactory())).status()).toBe(403);
    } finally {
      await cleanup([session.user.id], productIds);
    }
  });

  test('rejects existing tokens after account deactivation', async ({ auth }) => {
    const customer = customerFactory();
    const session = await (await auth.register(customer)).json();
    auth.setToken(session.token);
    try {
      await query('UPDATE "User" SET active = false WHERE id = $1', [session.user.id]);
      expect((await auth.me()).status()).toBe(401);
      expect((await auth.login(customer.email, customer.password)).status()).toBe(401);
    } finally {
      await cleanup([session.user.id], []);
    }
  });
});
