import { z } from 'zod';
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['CUSTOMER', 'ADMIN']),
});
export const productSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  description: z.string(),
  priceCents: z.number().int().positive(),
  inventory: z.number().int().nonnegative(),
  category: z.string(),
  archived: z.boolean(),
});
export const paymentSchema = z.object({
  id: z.string(),
  status: z.enum(['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED']),
  amountCents: z.number().int(),
});
export const orderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.string(),
  totalCents: z.number().int(),
  items: z.array(
    z.object({
      productId: z.string(),
      productName: z.string(),
      unitPriceCents: z.number().int(),
      quantity: z.number().int(),
    }),
  ),
  payment: paymentSchema.nullable(),
});
