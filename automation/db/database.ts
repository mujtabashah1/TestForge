import { Pool } from 'pg';
import { env } from '../config/env';
const databaseName = new URL(env.TEST_DATABASE_URL).pathname.replace('/', '');
if (!databaseName.endsWith('_test'))
  throw new Error(`Refusing database helpers against non-test database: ${databaseName}`);
export const pool = new Pool({ connectionString: env.TEST_DATABASE_URL });
export const query = <T extends Record<string, unknown>>(text: string, values: unknown[] = []) =>
  pool.query<T>(text, values);
export async function cleanup(userIds: string[], productIds: string[]) {
  if (userIds.length) {
    await query(
      'DELETE FROM "Payment" WHERE "orderId" IN (SELECT id FROM "Order" WHERE "userId" = ANY($1))',
      [userIds],
    );
    await query(
      'DELETE FROM "OrderItem" WHERE "orderId" IN (SELECT id FROM "Order" WHERE "userId" = ANY($1))',
      [userIds],
    );
    await query('DELETE FROM "Order" WHERE "userId" = ANY($1)', [userIds]);
    await query('DELETE FROM "User" WHERE id = ANY($1)', [userIds]);
  }
  if (productIds.length) await query('DELETE FROM "Product" WHERE id = ANY($1)', [productIds]);
}

export async function cleanupGeneratedData() {
  await query(
    'DELETE FROM "Payment" WHERE "orderId" IN (SELECT id FROM "Order" WHERE "userId" IN (SELECT id FROM "User" WHERE email LIKE $1))',
    ['qa+%@testforge.local'],
  );
  await query(
    'DELETE FROM "OrderItem" WHERE "orderId" IN (SELECT id FROM "Order" WHERE "userId" IN (SELECT id FROM "User" WHERE email LIKE $1))',
    ['qa+%@testforge.local'],
  );
  await query('DELETE FROM "Order" WHERE "userId" IN (SELECT id FROM "User" WHERE email LIKE $1)', [
    'qa+%@testforge.local',
  ]);
  await query(
    'DELETE FROM "CartItem" WHERE "userId" IN (SELECT id FROM "User" WHERE email LIKE $1)',
    ['qa+%@testforge.local'],
  );
  await query('DELETE FROM "User" WHERE email LIKE $1', ['qa+%@testforge.local']);
  await query('DELETE FROM "Product" WHERE sku LIKE $1 OR sku LIKE $2', ['QA-%', 'IDEM-%']);
}
