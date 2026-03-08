import { Card } from "@/components/ui/card";
import { WorkerHistoryFilterTable } from "@/components/pos/history-filter-table";
import { requireWorker } from "@/lib/auth/session";
import { getPosHistoryData } from "@/lib/services/pos";

export const dynamic = "force-dynamic";

export default async function PosHistoryPage() {
  const worker = await requireWorker();

  if (!worker.workerProfile) {
    return <main className="p-6">Akun worker belum di-assign ke cabang.</main>;
  }

  const history = await getPosHistoryData(worker.workerProfile.branchId);
  type HistoryRow = (typeof history)[number];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Riwayat Produk Terjual</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Histori transaksi cabang {worker.workerProfile.branch.name}.
        </p>
      </div>
      <Card className="animate-fade-in">
        <WorkerHistoryFilterTable
          sales={history.map((sale: HistoryRow) => ({
            ...sale,
            createdAt: sale.createdAt.toISOString()
          }))}
        />
      </Card>
    </div>
  );
}
