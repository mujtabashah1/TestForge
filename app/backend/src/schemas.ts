import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72),
});
export const registerSchema = credentialsSchema.extend({ name: z.string().trim().min(2).max(80) });
export const productSchema = z.object({
  sku: z.string().trim().min(3).max(40),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(5).max(1000),
  priceCents: z.number().int().positive().max(10_000_000),
  inventory: z.number().int().min(0).max(1_000_000),
  category: z.string().trim().min(2).max(60),
});
export const productPatchSchema = productSchema.partial().refine((v) => Object.keys(v).length > 0);
export const productQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  sort: z.enum(['name', 'priceAsc', 'priceDesc']).default('name'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const cartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});
export const checkoutSchema = z.object({
  idempotencyKey: z.string().min(8).max(100),
  paymentToken: z.enum(['tok_success', 'tok_fail']),
});
export const paymentRetrySchema = z.object({
  idempotencyKey: z.string().min(8).max(100),
  paymentToken: z.enum(['tok_success', 'tok_fail']),
});
export const statusSchema = z.object({
  status: z.enum(['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});
