import { prisma } from "@/lib/prisma";

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export async function getPosData(branchId: string) {
  const { start, end } = getTodayRange();

  const [products, soldItemsToday, topProductsAgg] = await Promise.all([
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
    prisma.saleItem.findMany({
      where: {
        sale: {
          branchId,
          createdAt: {
            gte: start,
            lt: end
          }
        }
      },
      include: {
        product: {
          select: {
            purchasePrice: true
          }
        }
      }
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      where: {
        sale: {
          branchId,
          createdAt: {
            gte: start,
            lt: end
          }
        }
      },
      _sum: { qty: true },
      orderBy: { _sum: { qty: "desc" } },
      take: 8
    })
  ]);

  const productNames = await prisma.product.findMany({
    where: {
      id: { in: topProductsAgg.map((item) => item.productId) }
    },
    select: {
      id: true,
      name: true
    }
  });

  const productNameMap = new Map(productNames.map((item) => [item.id, item.name]));

  const topSoldProductsToday = topProductsAgg.map((item) => ({
    productId: item.productId,
    productName: productNameMap.get(item.productId) ?? "Produk",
    qty: item._sum.qty ?? 0
  }));

  const dailySoldQty = soldItemsToday.reduce((acc, item) => acc + item.qty, 0);
  const dailyProfit = soldItemsToday.reduce((acc, item) => {
    const buy = Number(item.product.purchasePrice);
    const sell = Number(item.sellingPrice);
    return acc + (sell - buy) * item.qty;
  }, 0);

  return {
    products,
    dailySoldQty,
    dailyProfit,
    topSoldProductsToday
  };
}

export async function getPosHistoryData(branchId: string) {
  const sales = await prisma.sale.findMany({
    where: { branchId },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              purchasePrice: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 80
  });

  return sales.map((sale) => {
    const totalItems = sale.items.reduce((acc, item) => acc + item.qty, 0);
    const profit = sale.items.reduce((acc, item) => {
      const purchasePrice = Number(item.product.purchasePrice);
      const sellingPrice = Number(item.sellingPrice);
      return acc + (sellingPrice - purchasePrice) * item.qty;
    }, 0);

    return {
      id: sale.id,
      createdAt: sale.createdAt,
      totalItems,
      profit,
      products: sale.items.map((item) => ({
        name: item.product.name,
        qty: item.qty
      }))
    };
  });
}
