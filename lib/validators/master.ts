import { z } from "zod";

export const branchSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  address: z.string().optional()
});

export const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional()
});

export const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  barcode: z.string().optional(),
  categoryId: z.string().uuid(),
  sellingPrice: z.coerce.number().nonnegative(),
  purchasePrice: z.coerce.number().nonnegative(),
  isActive: z.coerce.boolean().default(true)
});

export const workerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  branchId: z.string().uuid()
});

export const stockSchema = z.object({
  branchId: z.string().uuid(),
  productId: z.string().uuid(),
  stockQty: z.coerce.number().int().nonnegative(),
  minStock: z.coerce.number().int().nonnegative()
});
