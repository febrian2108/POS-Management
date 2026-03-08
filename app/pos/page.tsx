import { requireWorker } from "@/lib/auth/session";
import { getPosData } from "@/lib/services/pos";
import { PosTerminal } from "@/components/pos/pos-terminal";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const worker = await requireWorker();

  if (!worker.workerProfile) {
    return <main className="p-6">Akun worker belum di-assign ke cabang.</main>;
  }

  const { products, recentSales } = await getPosData(worker.workerProfile.branchId);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl p-4 md:p-6">
      <PosTerminal
        workerName={worker.fullName}
        branchId={worker.workerProfile.branchId}
        products={products.map((p) => ({
          stockId: p.id,
          productId: p.product.id,
          name: p.product.name,
          sku: p.product.sku,
          sellingPrice: Number(p.product.sellingPrice),
          stockQty: p.stockQty,
          categoryName: p.product.category.name
        }))}
        recentSales={recentSales.map((sale) => ({
          id: sale.id,
          totalAmount: Number(sale.totalAmount),
          createdAt: sale.createdAt.toISOString(),
          workerName: sale.worker.fullName
        }))}
      />
    </main>
  );
}
