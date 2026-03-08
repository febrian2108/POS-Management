import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import { requireOwner } from "@/lib/auth/session";
import { getDashboardStats } from "@/lib/services/admin";

export default async function AdminDashboardPage() {
  const owner = await requireOwner();
  const stats = await getDashboardStats(owner.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard Owner</h1>
        <p className="text-sm text-[var(--muted)]">Ringkasan operasional multi-cabang</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-sm text-[var(--muted)]">Cabang</p><p className="text-2xl font-semibold">{stats.branchCount}</p></Card>
        <Card><p className="text-sm text-[var(--muted)]">Produk</p><p className="text-2xl font-semibold">{stats.productCount}</p></Card>
        <Card><p className="text-sm text-[var(--muted)]">Worker</p><p className="text-2xl font-semibold">{stats.workerCount}</p></Card>
        <Card><p className="text-sm text-[var(--muted)]">Total Penjualan</p><p className="text-2xl font-semibold">{formatRupiah(stats.salesAmount)}</p></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Barang Terlaris</h2>
          <div className="mt-3 space-y-2">
            {stats.topProducts.length === 0 ? <p className="text-sm text-[var(--muted)]">Belum ada data</p> : null}
            {stats.topProducts.map((row) => (
              <div key={row.productId} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2">
                <p className="text-sm">{row.productName}</p>
                <Badge tone="success">{row.qty} terjual</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">Stok Menipis</h2>
          <div className="mt-3 space-y-2">
            {stats.lowStocks.length === 0 ? <p className="text-sm text-[var(--muted)]">Tidak ada stok menipis</p> : null}
            {stats.lowStocks.map((row) => (
              <div key={row.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2">
                <p className="text-sm">{row.product.name} ({row.branch.name})</p>
                <Badge tone="warning">{row.stockQty} / min {row.minStock}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
