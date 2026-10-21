import { cleanupGeneratedData, pool } from './db/database';

export default async function globalTeardown() {
  try {
    await cleanupGeneratedData();
  } finally {
    await pool.end();
  }
}
