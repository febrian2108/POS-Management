import { prisma } from "@/lib/prisma";

export async function getPosData(branchId: string) {
  const [products, recentSales] = await Promise.all([
    prisma.branchStock.findMany({
      where: {
        branchId,
        product: { isActive: true }
      },
      include: {
        product: {
          include: {
            category: true
          }
        }
      },
      orderBy: { product: { name: "asc" } }
    }),
    prisma.sale.findMany({
      where: { branchId },
      include: {
        worker: true
      },
      orderBy: { createdAt: "desc" },
      take: 20
    })
  ]);

  return { products, recentSales };
}
