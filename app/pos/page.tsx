import { PosTerminal } from "@/components/pos/pos-terminal";
import { getPosData } from "@/lib/services/pos";
import { requireWorker } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const worker = await requireWorker();

  if (!worker.workerProfile) {
    return <main className="p-6">Akun worker belum di-assign ke cabang.</main>;
  }

  const { products, dailySoldQty, dailyProfit, topSoldProductsToday } = await getPosData(
    worker.workerProfile.branchId
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">POS Kasir</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Proses transaksi cepat untuk cabang {worker.workerProfile.branch.name}.
        </p>
      </div>
      <PosTerminal
        workerName={worker.fullName}
        branchName={worker.workerProfile.branch.name}
        branchId={worker.workerProfile.branchId}
        dailySoldQty={dailySoldQty}
        dailyProfit={dailyProfit}
        topSoldProductsToday={topSoldProductsToday}
        products={products.map((p) => ({
          stockId: p.id,
          productId: p.product.id,
          name: p.product.name,
          sku: p.product.sku,
          sellingPrice: Number(p.product.sellingPrice),
          stockQty: p.stockQty,
          categoryName: p.product.category.name
        }))}
      />
    </div>
  );
}
