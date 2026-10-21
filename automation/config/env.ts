import 'dotenv/config';
import { z } from 'zod';
export const env = z
  .object({
    BASE_URL: z.string().url().default('http://localhost:3000'),
    API_URL: z.string().url().default('http://localhost:4000/api'),
    TEST_DATABASE_URL: z
      .string()
      .url()
      .default('postgresql://testforge:testforge@localhost:5432/testforge_test?schema=public'),
    ADMIN_EMAIL: z.string().email().default('admin@testforge.local'),
    ADMIN_PASSWORD: z.string().default('TestForge123!'),
    CI: z.string().optional(),
  })
  .parse(process.env);
