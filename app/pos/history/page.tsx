import Link from "next/link";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { logoutAction } from "@/lib/actions/auth";
import { requireWorker } from "@/lib/auth/session";
import { getPosHistoryData } from "@/lib/services/pos";
import { formatRupiah } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PosHistoryPage() {
  const worker = await requireWorker();

  if (!worker.workerProfile) {
    return <main className="p-6">Akun worker belum di-assign ke cabang.</main>;
  }

  const history = await getPosHistoryData(worker.workerProfile.branchId);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-4 md:px-6 md:py-6">
      <section className="surface mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">POSKU Worker Panel</p>
          <h1 className="text-base font-semibold md:text-lg">
            Riwayat Produk Terjual - {worker.workerProfile.branch.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/pos">
            <Button variant="outline">Kembali ke POS</Button>
          </Link>
          <ThemeToggle />
          <form action={logoutAction}>
            <Button variant="outline" type="submit">
              Logout
            </Button>
          </form>
        </div>
      </section>

      <Card className="animate-fade-in">
        <div className="overflow-auto rounded-xl border border-[var(--border)]">
          <Table>
            <THead>
              <TR>
                <TH>Waktu</TH>
                <TH>Produk Terjual</TH>
                <TH>Jumlah Barang</TH>
                <TH>Keuntungan</TH>
              </TR>
            </THead>
            <TBody>
              {history.map((sale) => (
                <TR key={sale.id}>
                  <TD>{new Date(sale.createdAt).toLocaleString("id-ID")}</TD>
                  <TD>
                    <div className="space-y-1">
                      {sale.products.map((product, idx) => (
                        <p key={`${sale.id}-${idx}`} className="text-sm">
                          {product.name} x{product.qty}
                        </p>
                      ))}
                    </div>
                  </TD>
                  <TD>{sale.totalItems}</TD>
                  <TD>{formatRupiah(sale.profit)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </Card>
    </main>
  );
}
