import { z } from "zod";

export const saleItemSchema = z.object({
  productId: z.string().uuid(),
  qty: z.number().int().positive()
});

export const createSaleSchema = z.object({
  branchId: z.string().uuid(),
  paidAmount: z.number().nonnegative(),
  items: z.array(saleItemSchema).min(1)
});
