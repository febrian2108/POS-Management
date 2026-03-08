import { z } from "zod";

export const idSchema = z.object({
  id: z.string().uuid()
});

export const branchSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  address: z.string().optional()
});

export const branchUpdateSchema = branchSchema.extend({
  branchId: z.string().uuid()
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

export const productUpdateSchema = productSchema.extend({
  productId: z.string().uuid()
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

export const stockBulkSchema = z.object({
  branchIds: z.array(z.string().uuid()).min(1),
  productId: z.string().uuid(),
  stockQty: z.coerce.number().int().nonnegative(),
  minStock: z.coerce.number().int().nonnegative()
});

export const stockUpdateSchema = z.object({
  stockId: z.string().uuid(),
  stockQty: z.coerce.number().int().nonnegative(),
  minStock: z.coerce.number().int().nonnegative()
});

export const workerStockSchema = z.object({
  productId: z.string().uuid(),
  stockQty: z.coerce.number().int().nonnegative(),
  minStock: z.coerce.number().int().nonnegative()
});

export const workerStockUpdateSchema = z.object({
  stockId: z.string().uuid(),
  stockQty: z.coerce.number().int().nonnegative(),
  minStock: z.coerce.number().int().nonnegative()
});
