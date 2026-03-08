import { requireOwner } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export default async function SalesPage() {
  const owner = await requireOwner();

  const [sales, summaryByBranch] = await Promise.all([
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
    })
  ]);

  const branches = await prisma.branch.findMany({
    where: { id: { in: summaryByBranch.map((x) => x.branchId) } }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Riwayat Penjualan</h1>
      <Card>
        <h2 className="font-semibold">Ringkasan Per Cabang</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {summaryByBranch.map((s) => {
            const branch = branches.find((b) => b.id === s.branchId);
            return (
              <div key={s.branchId} className="rounded-lg border border-[var(--border)] p-3">
                <p className="text-sm text-[var(--muted)]">{branch?.name || "Cabang"}</p>
                <p className="text-lg font-semibold">{formatRupiah(Number(s._sum.totalAmount || 0))}</p>
                <p className="text-xs text-[var(--muted)]">{s._count.id} transaksi</p>
              </div>
            );
          })}
        </div>
      </Card>
      <Card>
        <Table>
          <THead><TR><TH>Waktu</TH><TH>Cabang</TH><TH>Worker</TH><TH>Total</TH><TH>Item</TH></TR></THead>
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
      </Card>
    </div>
  );
}
