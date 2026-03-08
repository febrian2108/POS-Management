import { BranchSalesChart } from "@/components/admin/branch-sales-chart";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requireOwner } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";

export default async function SalesPage() {
  const owner = await requireOwner();

  const [sales, summaryByBranch, branches] = await Promise.all([
    prisma.sale.findMany({
      where: { ownerId: owner.id },
      include: { branch: true, worker: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 100
    }),
    prisma.sale.groupBy({
      by: ["branchId"],
      where: { ownerId: owner.id },
      _sum: { totalAmount: true },
      _count: { id: true }
    }),
    prisma.branch.findMany({
      where: { ownerId: owner.id },
      select: { id: true, name: true }
    })
  ]);

  const branchMap = new Map(branches.map((branch) => [branch.id, branch.name]));

  const chartSeries = summaryByBranch
    .map((item) => ({
      branchId: item.branchId,
      branchName: branchMap.get(item.branchId) ?? "Cabang",
      totalAmount: Number(item._sum.totalAmount ?? 0),
      transactionCount: item._count.id
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Riwayat Penjualan</h1>
        <p className="text-sm text-[var(--muted)]">
          Analitik penjualan antar cabang dengan visual chart dan filter per cabang.
        </p>
      </div>

      <Card className="animate-fade-in">
        <h2 className="font-semibold">Grafik Penjualan Cabang (Chart.js)</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Centang cabang yang ingin ditampilkan agar analisis owner lebih fokus.
        </p>
        <div className="mt-4">
          <BranchSalesChart data={chartSeries} />
        </div>
      </Card>

      <Card className="animate-fade-in">
        <h2 className="font-semibold">Ringkasan Per Cabang</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {chartSeries.map((series) => (
            <div
              key={series.branchId}
              className="rounded-xl border border-[var(--border)] bg-[var(--card-solid)] p-3"
            >
              <p className="text-sm text-[var(--muted)]">{series.branchName}</p>
              <p className="text-lg font-semibold">{formatRupiah(series.totalAmount)}</p>
              <p className="text-xs text-[var(--muted)]">{series.transactionCount} transaksi</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="animate-fade-in">
        <div className="overflow-auto rounded-xl border border-[var(--border)]">
          <Table>
            <THead>
              <TR>
                <TH>Waktu</TH>
                <TH>Cabang</TH>
                <TH>Worker</TH>
                <TH>Total</TH>
                <TH>Item</TH>
              </TR>
            </THead>
            <TBody>
              {sales.map((row) => (
                <TR key={row.id}>
                  <TD>{new Date(row.createdAt).toLocaleString("id-ID")}</TD>
                  <TD>{row.branch.name}</TD>
                  <TD>{row.worker.fullName}</TD>
                  <TD>{formatRupiah(Number(row.totalAmount))}</TD>
                  <TD>{row.items.reduce((acc, item) => acc + item.qty, 0)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
