import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requireOwner } from "@/lib/auth/session";
import { getDashboardStats } from "@/lib/services/admin";
import { formatRupiah } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const owner = await requireOwner();
  const stats = await getDashboardStats(owner.id);
  const maxBranchSales = Math.max(...stats.branchSales.map((row) => row.totalAmount), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">Dashboard Owner</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Pantau performa cabang, stok, dan profit barang masuk/keluar secara terpusat.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card>
          <p className="text-sm text-[var(--muted)]">Cabang</p>
          <p className="mt-1 text-2xl font-semibold">{stats.branchCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--muted)]">Produk</p>
          <p className="mt-1 text-2xl font-semibold">{stats.productCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--muted)]">Worker</p>
          <p className="mt-1 text-2xl font-semibold">{stats.workerCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--muted)]">Total Penjualan</p>
          <p className="mt-1 text-2xl font-semibold">{formatRupiah(stats.salesAmount)}</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--muted)]">Total Keuntungan</p>
          <p className="mt-1 text-2xl font-semibold">{formatRupiah(stats.totalGrossProfit)}</p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Grafik Penjualan per Cabang</h2>
            <span className="text-xs text-[var(--muted)]">Berdasarkan nominal transaksi</span>
          </div>

          <div className="space-y-3">
            {stats.branchSales.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Belum ada transaksi untuk divisualisasikan.</p>
            ) : null}

            {stats.branchSales.map((row) => {
              const widthPercent = Math.max((row.totalAmount / maxBranchSales) * 100, 4);
              return (
                <div key={row.branchId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{row.branchName}</span>
                    <span className="text-[var(--muted)]">
                      {formatRupiah(row.totalAmount)} ({row.transactionCount} trx)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--primary-soft)]">
                    <div
                      className="h-full rounded-full bg-[var(--primary)]"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
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

          <Card>
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

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Profit Barang Masuk/Keluar</h2>
          <div className="text-xs text-[var(--muted)]">
            Nilai Masuk: {formatRupiah(stats.totalInventoryValue)}
          </div>
        </div>

        <div className="overflow-auto rounded-xl border border-[var(--border)]">
          <Table>
            <THead>
              <TR>
                <TH>Produk</TH>
                <TH>Qty Masuk</TH>
                <TH>Nilai Masuk</TH>
                <TH>Qty Keluar</TH>
                <TH>Nilai Keluar</TH>
                <TH>Keuntungan</TH>
              </TR>
            </THead>
            <TBody>
              {stats.productProfit.slice(0, 14).map((row) => (
                <TR key={row.productId}>
                  <TD>
                    <p className="font-medium">{row.productName}</p>
                    <p className="text-xs text-[var(--muted)]">{row.sku}</p>
                  </TD>
                  <TD>{row.qtyMasuk}</TD>
                  <TD>{formatRupiah(row.nilaiMasuk)}</TD>
                  <TD>{row.qtyKeluar}</TD>
                  <TD>{formatRupiah(row.nilaiKeluar)}</TD>
                  <TD className="font-medium">{formatRupiah(row.keuntunganKeluar)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
