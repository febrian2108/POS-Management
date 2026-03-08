import { PosTerminal } from "@/components/pos/pos-terminal";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { requireWorker } from "@/lib/auth/session";
import { logoutAction } from "@/lib/actions/auth";
import { getPosData } from "@/lib/services/pos";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const worker = await requireWorker();

  if (!worker.workerProfile) {
    return <main className="p-6">Akun worker belum di-assign ke cabang.</main>;
  }

  const { products, recentSales } = await getPosData(worker.workerProfile.branchId);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-4 md:px-6 md:py-6">
      <section className="surface mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Worker POS</p>
          <h1 className="text-base font-semibold md:text-lg">
            {worker.fullName} - {worker.workerProfile.branch.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <form action={logoutAction}>
            <Button variant="outline" type="submit">
              Logout
            </Button>
          </form>
        </div>
      </section>

      <PosTerminal
        workerName={worker.fullName}
        branchName={worker.workerProfile.branch.name}
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
