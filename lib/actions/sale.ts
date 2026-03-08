"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireWorker } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { createSaleSchema } from "@/lib/validators/sale";

export async function createSaleAction(payload: unknown) {
  const worker = await requireWorker();
  const parsed = createSaleSchema.safeParse(payload);

  if (!parsed.success) return { error: "Payload transaksi tidak valid." };

  if (!worker.workerProfile || worker.workerProfile.branchId !== parsed.data.branchId) {
    return { error: "Worker hanya boleh transaksi di cabang assignment." };
  }

  for (const item of parsed.data.items) {
    if (item.qty <= 0) return { error: "Qty harus lebih dari 0." };
  }

  const productIds = parsed.data.items.map((x) => x.productId);

  const [stocks, products, branch] = await Promise.all([
    prisma.branchStock.findMany({
      where: {
        branchId: parsed.data.branchId,
        productId: { in: productIds }
      }
    }),
    prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true
      }
    }),
    prisma.branch.findUnique({ where: { id: parsed.data.branchId } })
  ]);

  if (!branch) return { error: "Cabang tidak ditemukan." };

  const stockMap = new Map(stocks.map((stock) => [stock.productId, stock.stockQty]));
  const productMap = new Map(products.map((product) => [product.id, product]));

  for (const item of parsed.data.items) {
    const qty = stockMap.get(item.productId) ?? 0;
    if (qty < item.qty) {
      return { error: "Stok tidak cukup untuk satu atau lebih item." };
    }
    if (!productMap.has(item.productId)) {
      return { error: "Produk tidak valid atau nonaktif." };
    }
  }

  const items = parsed.data.items.map((item) => {
    const product = productMap.get(item.productId)!;
    const sellingPrice = new Prisma.Decimal(product.sellingPrice);
    const subtotal = sellingPrice.mul(item.qty);

    return {
      productId: item.productId,
      productName: product.name,
      qty: item.qty,
      sellingPrice,
      subtotal
    };
  });

  const totalAmount = items.reduce((acc, item) => acc.add(item.subtotal), new Prisma.Decimal(0));
  const paidAmount = new Prisma.Decimal(parsed.data.paidAmount);

  if (paidAmount.lessThan(totalAmount)) {
    return { error: "Jumlah bayar kurang dari total transaksi." };
  }

  const changeAmount = paidAmount.sub(totalAmount);

  const savedSale = await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        ownerId: branch.ownerId,
        branchId: parsed.data.branchId,
        workerId: worker.id,
        totalAmount,
        paidAmount,
        changeAmount
      }
    });

    await tx.saleItem.createMany({
      data: items.map((item) => ({
        saleId: sale.id,
        productId: item.productId,
        qty: item.qty,
        sellingPrice: item.sellingPrice,
        subtotal: item.subtotal
      }))
    });

    for (const item of items) {
      await tx.branchStock.update({
        where: {
          branchId_productId: {
            branchId: parsed.data.branchId,
            productId: item.productId
          }
        },
        data: {
          stockQty: {
            decrement: item.qty
          }
        }
      });
    }

    return {
      id: sale.id,
      createdAt: sale.createdAt
    };
  });

  revalidatePath("/pos");
  revalidatePath("/pos/history");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/sales");
  revalidatePath("/admin/stocks");

  return {
    success: "Transaksi berhasil disimpan.",
    receipt: {
      saleId: savedSale.id,
      createdAt: savedSale.createdAt.toISOString(),
      branchName: worker.workerProfile.branch.name,
      workerName: worker.fullName,
      totalAmount: Number(totalAmount),
      paidAmount: Number(paidAmount),
      changeAmount: Number(changeAmount),
      items: items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        qty: item.qty,
        sellingPrice: Number(item.sellingPrice),
        subtotal: Number(item.subtotal)
      }))
    }
  };
}
