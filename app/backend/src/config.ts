import 'dotenv/config';
import { z } from 'zod';

const schema = z
  .object({
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(16).default('local-development-secret-change-me'),
    JWT_ISSUER: z.string().min(1).default('testforge-api'),
    JWT_AUDIENCE: z.string().min(1).default('testforge-web'),
    PORT: z.coerce.number().int().positive().default(4000),
    FRONTEND_URL: z.string().url().default('http://localhost:3000'),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  })
  .superRefine((value, context) => {
    if (
      value.NODE_ENV === 'production' &&
      value.JWT_SECRET === 'local-development-secret-change-me'
    ) {
      context.addIssue({
        code: 'custom',
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET must be explicitly configured in production',
      });
    }
  });

export const config = schema.parse(process.env);
