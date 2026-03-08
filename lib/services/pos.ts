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

  const [products, soldItemsToday] = await Promise.all([
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
    })
  ]);

  const dailySoldQty = soldItemsToday.reduce(
    (acc: number, item: { qty: number }) => acc + item.qty,
    0
  );
  const dailyProfit = soldItemsToday.reduce(
    (
      acc: number,
      item: { qty: number; sellingPrice: unknown; product: { purchasePrice: unknown } }
    ) => {
    const buy = Number(item.product.purchasePrice);
    const sell = Number(item.sellingPrice);
    return acc + (sell - buy) * item.qty;
    },
    0
  );

  return {
    products,
    dailySoldQty,
    dailyProfit
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
    const totalItems = sale.items.reduce(
      (acc: number, item: { qty: number }) => acc + item.qty,
      0
    );
    const profit = sale.items.reduce(
      (
        acc: number,
        item: { qty: number; sellingPrice: unknown; product: { purchasePrice: unknown } }
      ) => {
      const purchasePrice = Number(item.product.purchasePrice);
      const sellingPrice = Number(item.sellingPrice);
      return acc + (sellingPrice - purchasePrice) * item.qty;
      },
      0
    );

    return {
      id: sale.id,
      createdAt: sale.createdAt,
      totalItems,
      profit,
      products: sale.items.map((item) => ({
        productId: item.productId,
        name: item.product.name,
        qty: item.qty
      }))
    };
  });
}
