import { test, expect } from '../../fixtures/test.fixture';
import { customerFactory } from '../../factories/data.factory';
import { userSchema } from '../../schemas/api.schemas';

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
});
