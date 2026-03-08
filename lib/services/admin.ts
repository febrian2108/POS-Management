import { prisma } from "@/lib/prisma";

export async function getDashboardStats(ownerId: string) {
  const trendDays = 14;
  const trendStart = new Date();
  trendStart.setHours(0, 0, 0, 0);
  trendStart.setDate(trendStart.getDate() - (trendDays - 1));

  const [
    branchCount,
    productCount,
    workerCount,
    totalSalesAgg,
    saleItemsAgg,
    stockRows,
    topProductAgg,
    branchSalesAgg,
    saleAggByProduct,
    stockAggByProduct,
    branches,
    products,
    salesTrendRows
  ] = await Promise.all([
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
      take: 220,
      orderBy: { updatedAt: "desc" }
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      where: { sale: { ownerId } },
      _sum: { qty: true },
      orderBy: { _sum: { qty: "desc" } },
      take: 5
    }),
    prisma.sale.groupBy({
      by: ["branchId"],
      where: { ownerId },
      _sum: { totalAmount: true },
      _count: { id: true }
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      where: { sale: { ownerId } },
      _sum: {
        qty: true,
        subtotal: true
      }
    }),
    prisma.branchStock.groupBy({
      by: ["productId"],
      where: { branch: { ownerId } },
      _sum: { stockQty: true }
    }),
    prisma.branch.findMany({
      where: { ownerId },
      select: { id: true, name: true }
    }),
    prisma.product.findMany({
      where: { ownerId },
      select: {
        id: true,
        name: true,
        sku: true,
        sellingPrice: true,
        purchasePrice: true,
        isActive: true
      }
    }),
    prisma.sale.findMany({
      where: {
        ownerId,
        createdAt: { gte: trendStart }
      },
      select: {
        branchId: true,
        totalAmount: true,
        createdAt: true
      }
    })
  ]);

  const lowStocks = stockRows.filter((item) => item.stockQty <= item.minStock).slice(0, 10);

  const productMap = new Map(products.map((item) => [item.id, item]));
  const branchMap = new Map(branches.map((item) => [item.id, item.name]));

  const topProducts = topProductAgg.map((item) => ({
    productId: item.productId,
    productName: productMap.get(item.productId)?.name ?? "Produk",
    qty: item._sum.qty ?? 0
  }));

  const branchSales = branchSalesAgg
    .map((item) => ({
      branchId: item.branchId,
      branchName: branchMap.get(item.branchId) ?? "Cabang",
      totalAmount: Number(item._sum.totalAmount ?? 0),
      transactionCount: item._count.id
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const dayKeys: string[] = [];
  const dayLabels: string[] = [];
  const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short"
  });

  for (let i = 0; i < trendDays; i += 1) {
    const d = new Date(trendStart);
    d.setDate(trendStart.getDate() + i);
    dayKeys.push(d.toISOString().slice(0, 10));
    dayLabels.push(dateFormatter.format(d));
  }

  const dayIndexMap = new Map(dayKeys.map((key, idx) => [key, idx]));
  const branchTrendMap = new Map(
    branches.map((branch) => [branch.id, new Array<number>(trendDays).fill(0)])
  );

  for (const row of salesTrendRows) {
    const dayKey = row.createdAt.toISOString().slice(0, 10);
    const dayIndex = dayIndexMap.get(dayKey);
    const dataPoints = branchTrendMap.get(row.branchId);
    if (dayIndex === undefined || !dataPoints) continue;
    dataPoints[dayIndex] += Number(row.totalAmount);
  }

  const branchSalesTrend = {
    labels: dayLabels,
    series: branches.map((branch) => ({
      branchId: branch.id,
      branchName: branch.name,
      data: branchTrendMap.get(branch.id) ?? new Array<number>(trendDays).fill(0)
    }))
  };

  const saleByProductMap = new Map(
    saleAggByProduct.map((item) => [
      item.productId,
      {
        qtyKeluar: item._sum.qty ?? 0,
        nilaiKeluar: Number(item._sum.subtotal ?? 0)
      }
    ])
  );

  const stockByProductMap = new Map(
    stockAggByProduct.map((item) => [item.productId, item._sum.stockQty ?? 0])
  );

  const productProfit = products
    .map((product) => {
      const saleData = saleByProductMap.get(product.id);
      const qtyKeluar = saleData?.qtyKeluar ?? 0;
      const nilaiKeluar = saleData?.nilaiKeluar ?? 0;
      const qtyMasuk = stockByProductMap.get(product.id) ?? 0;
      const purchasePrice = Number(product.purchasePrice);

      const nilaiMasuk = qtyMasuk * purchasePrice;
      const hppKeluar = qtyKeluar * purchasePrice;
      const keuntunganKeluar = nilaiKeluar - hppKeluar;

      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        isActive: product.isActive,
        qtyMasuk,
        nilaiMasuk,
        qtyKeluar,
        nilaiKeluar,
        keuntunganKeluar
      };
    })
    .sort((a, b) => b.keuntunganKeluar - a.keuntunganKeluar);

  const totalGrossProfit = productProfit.reduce((acc, item) => acc + item.keuntunganKeluar, 0);
  const totalInventoryValue = productProfit.reduce((acc, item) => acc + item.nilaiMasuk, 0);

  const activeProductCount = products.filter((item) => item.isActive).length;
  const inactiveProductCount = products.length - activeProductCount;
  const outOfStockProductCount = products.filter((item) => (stockByProductMap.get(item.id) ?? 0) <= 0).length;

  return {
    branchCount,
    productCount,
    workerCount,
    salesCount: totalSalesAgg._count.id,
    salesAmount: Number(totalSalesAgg._sum.totalAmount || 0),
    soldItems: Number(saleItemsAgg._sum.qty || 0),
    activeProductCount,
    inactiveProductCount,
    outOfStockProductCount,
    totalGrossProfit,
    totalInventoryValue,
    lowStocks,
    topProducts,
    branchSales,
    branchSalesTrend,
    productProfit
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
