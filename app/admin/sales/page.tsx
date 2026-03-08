import { SalesAnalyticsPanel } from "@/components/admin/sales-analytics-panel";
import { requireOwner } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function SalesPage() {
  const owner = await requireOwner();

  const [sales, branches, workers] = await Promise.all([
    prisma.sale.findMany({
      where: { ownerId: owner.id },
      include: {
        branch: true,
        worker: true,
        items: {
          include: {
            product: {
              select: {
                purchasePrice: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.branch.findMany({
      where: { ownerId: owner.id },
      select: { id: true, name: true }
    }),
    prisma.workerProfile.findMany({
      where: { branch: { ownerId: owner.id } },
      select: {
        userId: true,
        user: {
          select: {
            fullName: true
          }
        }
      }
    })
  ]);
  type WorkerRow = (typeof workers)[number];
  type SaleRow = (typeof sales)[number];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Riwayat Penjualan</h1>
        <p className="text-sm text-[var(--muted)]">
          Analitik penjualan antar cabang dengan filter waktu, cabang, dan worker.
        </p>
      </div>

      <SalesAnalyticsPanel
        branches={branches}
        workers={workers.map((worker: WorkerRow) => ({
          id: worker.userId,
          fullName: worker.user.fullName
        }))}
        sales={sales.map((sale: SaleRow) => ({
          id: sale.id,
          createdAt: sale.createdAt.toISOString(),
          branchId: sale.branchId,
          branchName: sale.branch.name,
          workerId: sale.workerId,
          workerName: sale.worker.fullName,
          totalAmount: Number(sale.totalAmount),
          itemCount: sale.items.reduce((acc, item) => acc + item.qty, 0),
          profitAmount: sale.items.reduce((acc, item) => {
            const purchase = Number(item.product.purchasePrice);
            const sell = Number(item.sellingPrice);
            return acc + (sell - purchase) * item.qty;
          }, 0)
        }))}
      />
    </div>
  );
}
