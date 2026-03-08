import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Riwayat Produk Terjual</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Histori transaksi cabang {worker.workerProfile.branch.name}.
        </p>
      </div>
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
    </div>
  );
}
