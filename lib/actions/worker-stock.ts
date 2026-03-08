"use server";

import { revalidatePath } from "next/cache";

import { requireWorker } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  idSchema,
  workerStockSchema,
  workerStockUpdateSchema
} from "@/lib/validators/master";

export async function upsertWorkerStockAction(formData: FormData): Promise<void> {
  const worker = await requireWorker();

  if (!worker.workerProfile) return;

  const parsed = workerStockSchema.safeParse({
    productId: formData.get("productId"),
    stockQty: formData.get("stockQty"),
    minStock: formData.get("minStock")
  });

  if (!parsed.success) return;

  const branchId = worker.workerProfile.branchId;
  const ownerId = worker.workerProfile.branch.ownerId;

  const product = await prisma.product.findFirst({
    where: {
      id: parsed.data.productId,
      ownerId
    }
  });

  if (!product) return;

  await prisma.branchStock.upsert({
    where: {
      branchId_productId: {
        branchId,
        productId: parsed.data.productId
      }
    },
    create: {
      branchId,
      productId: parsed.data.productId,
      stockQty: parsed.data.stockQty,
      minStock: parsed.data.minStock
    },
    update: {
      stockQty: parsed.data.stockQty,
      minStock: parsed.data.minStock
    }
  });

  revalidatePath("/pos");
  revalidatePath("/pos/stocks");
  revalidatePath("/admin/stocks");
  revalidatePath("/admin/dashboard");
}

export async function updateWorkerStockAction(formData: FormData): Promise<void> {
  const worker = await requireWorker();
  if (!worker.workerProfile) return;

  const parsed = workerStockUpdateSchema.safeParse({
    stockId: formData.get("stockId"),
    stockQty: formData.get("stockQty"),
    minStock: formData.get("minStock")
  });

  if (!parsed.success) return;

  const stock = await prisma.branchStock.findFirst({
    where: {
      id: parsed.data.stockId,
      branchId: worker.workerProfile.branchId
    }
  });

  if (!stock) return;

  await prisma.branchStock.update({
    where: { id: stock.id },
    data: {
      stockQty: parsed.data.stockQty,
      minStock: parsed.data.minStock
    }
  });

  revalidatePath("/pos");
  revalidatePath("/pos/stocks");
  revalidatePath("/admin/stocks");
  revalidatePath("/admin/dashboard");
}

export async function deleteWorkerStockAction(formData: FormData): Promise<void> {
  const worker = await requireWorker();
  if (!worker.workerProfile) return;

  const parsed = idSchema.safeParse({
    id: formData.get("stockId")
  });

  if (!parsed.success) return;

  const stock = await prisma.branchStock.findFirst({
    where: {
      id: parsed.data.id,
      branchId: worker.workerProfile.branchId
    }
  });

  if (!stock) return;

  await prisma.branchStock.delete({ where: { id: stock.id } });

  revalidatePath("/pos");
  revalidatePath("/pos/stocks");
  revalidatePath("/admin/stocks");
  revalidatePath("/admin/dashboard");
}
