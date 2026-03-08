import { prisma } from "@/lib/prisma";

export async function getDashboardStats(ownerId: string) {
  const [branchCount, productCount, workerCount, totalSalesAgg, saleItemsAgg, stockRows, topProducts] =
    await Promise.all([
      prisma.branch.count({ where: { ownerId } }),
      prisma.product.count({ where: { ownerId } }),
      prisma.user.count({ where: { role: "WORKER", workerProfile: { branch: { ownerId } } } }),
      prisma.sale.aggregate({
        where: { ownerId },
        _sum: { totalAmount: true },
        _count: { id: true }
      }),
      prisma.saleItem.aggregate({
        where: {
          sale: {
            ownerId
          }
        },
        _sum: { qty: true }
      }),
      prisma.branchStock.findMany({
        where: {
          branch: { ownerId }
        },
        include: { product: true, branch: true },
        take: 200,
        orderBy: { updatedAt: "desc" }
      }),
      prisma.saleItem.groupBy({
        by: ["productId"],
        where: { sale: { ownerId } },
        _sum: { qty: true },
        orderBy: { _sum: { qty: "desc" } },
        take: 5
      })
    ]);

  const lowStocks = stockRows.filter((item) => item.stockQty <= item.minStock).slice(0, 10);

  const topProductsWithName = await Promise.all(
    topProducts.map(async (item) => {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      return {
        productId: item.productId,
        productName: product?.name ?? "Produk",
        qty: item._sum.qty ?? 0
      };
    })
  );

  return {
    branchCount,
    productCount,
    workerCount,
    salesCount: totalSalesAgg._count.id,
    salesAmount: Number(totalSalesAgg._sum.totalAmount || 0),
    soldItems: Number(saleItemsAgg._sum.qty || 0),
    lowStocks,
    topProducts: topProductsWithName
  };
}

export async function getAdminMasterData(ownerId: string) {
  const [branches, categories, products, workers, sales] = await Promise.all([
    prisma.branch.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" } }),
    prisma.category.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({
      where: { ownerId },
      include: { category: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.workerProfile.findMany({
      where: { branch: { ownerId } },
      include: { user: true, branch: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.sale.findMany({
      where: { ownerId },
      include: { branch: true, worker: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 100
    })
  ]);

  return { branches, categories, products, workers, sales };
}

export async function getStockData(ownerId: string) {
  return prisma.branchStock.findMany({
    where: {
      branch: { ownerId }
    },
    include: {
      branch: true,
      product: true
    },
    orderBy: {
      updatedAt: "desc"
    }
  });
}
