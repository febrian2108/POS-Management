import { Badge } from "@/components/ui/badge";
import { DashboardBranchLineChart } from "@/components/admin/dashboard-branch-line-chart";
import { ProductProfitTable } from "@/components/admin/product-profit-table";
import { Card } from "@/components/ui/card";
import { requireOwner } from "@/lib/auth/session";
import { getDashboardStats } from "@/lib/services/admin";
import { formatRupiah } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const owner = await requireOwner();
  const stats = await getDashboardStats(owner.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">Dashboard Owner</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Ringkasan cepat untuk memahami kondisi operasional toko dalam satu layar.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="animate-fade-in">
          <p className="text-sm text-[var(--muted)]">Jumlah Cabang</p>
          <p className="mt-1 text-2xl font-semibold">{stats.branchCount}</p>
        </Card>
        <Card className="animate-fade-in">
          <p className="text-sm text-[var(--muted)]">Total Produk</p>
          <p className="mt-1 text-2xl font-semibold">{stats.productCount}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Aktif {stats.activeProductCount} - Nonaktif {stats.inactiveProductCount}
          </p>
        </Card>
        <Card className="animate-fade-in">
          <p className="text-sm text-[var(--muted)]">Produk Stok Habis</p>
          <p className="mt-1 text-2xl font-semibold">{stats.outOfStockProductCount}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Perlu restok segera untuk menjaga penjualan</p>
        </Card>
        <Card className="animate-fade-in">
          <p className="text-sm text-[var(--muted)]">Jumlah Worker</p>
          <p className="mt-1 text-2xl font-semibold">{stats.workerCount}</p>
        </Card>
        <Card className="animate-fade-in">
          <p className="text-sm text-[var(--muted)]">Total Penjualan</p>
          <p className="mt-1 text-2xl font-semibold">{formatRupiah(stats.salesAmount)}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{stats.salesCount} transaksi</p>
        </Card>
        <Card className="animate-fade-in">
          <p className="text-sm text-[var(--muted)]">Total Keuntungan</p>
          <p className="mt-1 text-2xl font-semibold">{formatRupiah(stats.totalGrossProfit)}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Nilai inventori masuk: {formatRupiah(stats.totalInventoryValue)}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card className="animate-fade-in">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Tren Penjualan 14 Hari (Grafik Garis)</h2>
            <span className="text-xs text-[var(--muted)]">Warna garis berbeda untuk tiap cabang</span>
          </div>
          <DashboardBranchLineChart trend={stats.branchSalesTrend} />
        </Card>

        <div className="space-y-4">
          <Card className="animate-fade-in">
            <h2 className="font-semibold">Barang Terlaris</h2>
            <div className="mt-3 space-y-2">
              {stats.topProducts.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">Belum ada data penjualan.</p>
              ) : null}
              {stats.topProducts.map((row) => (
                <div
                  key={row.productId}
                  className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 py-2"
                >
                  <p className="text-sm">{row.productName}</p>
                  <Badge tone="success">{row.qty} terjual</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="animate-fade-in">
            <h2 className="font-semibold">Stok Menipis</h2>
            <div className="mt-3 space-y-2">
              {stats.lowStocks.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">Tidak ada stok menipis.</p>
              ) : null}
              {stats.lowStocks.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 py-2"
                >
                  <p className="text-sm">
                    {row.product.name} ({row.branch.name})
                  </p>
                  <Badge tone="warning">
                    {row.stockQty} / min {row.minStock}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="animate-fade-in">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Profit Barang Masuk/Keluar</h2>
          <div className="text-xs text-[var(--muted)]">
            Nilai Masuk: {formatRupiah(stats.totalInventoryValue)}
          </div>
        </div>
        <ProductProfitTable rows={stats.productProfit} />
      </Card>
    </div>
  );
}
