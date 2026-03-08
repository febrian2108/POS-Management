import { Card } from "@/components/ui/card";
import { FieldTooltip } from "@/components/ui/field-tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import {
  deleteWorkerStockAction,
  updateWorkerStockAction,
  upsertWorkerStockAction
} from "@/lib/actions/worker-stock";
import { requireWorker } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PosStocksPage() {
  const worker = await requireWorker();

  if (!worker.workerProfile) {
    return <main className="p-6">Akun worker belum di-assign ke cabang.</main>;
  }

  const branchId = worker.workerProfile.branchId;
  const ownerId = worker.workerProfile.branch.ownerId;

  const [rows, products] = await Promise.all([
    prisma.branchStock.findMany({
      where: { branchId },
      include: {
        product: {
          include: {
            category: true
          }
        }
      },
      orderBy: { product: { name: "asc" } }
    }),
    prisma.product.findMany({
      where: { ownerId, isActive: true },
      orderBy: { name: "asc" },
      include: { category: true }
    })
  ]);
  type StockRow = (typeof rows)[number];
  type ProductRow = (typeof products)[number];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Kontrol Stok Cabang</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Ubah stok produk untuk cabang {worker.workerProfile.branch.name}. Data langsung terlihat di
          dashboard owner.
        </p>
      </div>

      <Card className="animate-fade-in">
        <h2 className="font-semibold">Tambah / Perbarui Stok Produk</h2>
        <form action={upsertWorkerStockAction} className="mt-4 grid gap-3 md:grid-cols-4">
          <div>
            <Label className="flex items-center gap-1.5">
              Produk
              <FieldTooltip text="Pilih produk yang stoknya ingin Anda perbarui." />
            </Label>
            <select
              name="productId"
              required
              className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 text-sm"
              title="Pilih produk"
            >
              <option value="">Pilih produk</option>
              {products.map((product: ProductRow) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.category.name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="flex items-center gap-1.5">
              Jumlah Stok
              <FieldTooltip text="Isi jumlah stok fisik saat ini untuk produk ini di cabang Anda." />
            </Label>
            <Input
              name="stockQty"
              type="number"
              min={0}
              required
              title="Jumlah stok fisik saat ini"
            />
          </div>
          <div>
            <Label className="flex items-center gap-1.5">
              Batas Minimum
              <FieldTooltip text="Saat stok berada di angka ini atau lebih rendah, barang dianggap hampir habis." />
            </Label>
            <Input
              name="minStock"
              type="number"
              min={0}
              required
              title="Batas minimum peringatan stok menipis"
            />
          </div>
          <div className="flex items-end">
            <SubmitButton>Simpan</SubmitButton>
          </div>
        </form>
      </Card>

      <Card className="animate-fade-in">
        <h2 className="mb-3 font-semibold">Daftar Stok Cabang</h2>
        <div className="overflow-auto rounded-xl border border-[var(--border)]">
          <Table>
            <THead>
              <TR>
                <TH>Produk</TH>
                <TH>Kategori</TH>
                <TH>
                  <span className="inline-flex items-center gap-1.5">
                    Stok Saat Ini
                    <FieldTooltip text="Jumlah stok produk yang tersisa saat ini di cabang Anda." />
                  </span>
                </TH>
                <TH>
                  <span className="inline-flex items-center gap-1.5">
                    Batas Minimum
                    <FieldTooltip text="Angka minimal stok sebelum barang dianggap menipis." />
                  </span>
                </TH>
                <TH>Aksi</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((row: StockRow) => (
                <TR key={row.id}>
                  <TD>{row.product.name}</TD>
                  <TD>{row.product.category.name}</TD>
                  <TD>{row.stockQty}</TD>
                  <TD>{row.minStock}</TD>
                  <TD>
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={updateWorkerStockAction} className="flex items-center gap-2">
                        <input type="hidden" name="stockId" value={row.id} />
                        <Input
                          name="stockQty"
                          type="number"
                          min={0}
                          defaultValue={row.stockQty}
                          className="w-24"
                          required
                          title="Ubah jumlah stok fisik"
                        />
                        <Input
                          name="minStock"
                          type="number"
                          min={0}
                          defaultValue={row.minStock}
                          className="w-24"
                          required
                          title="Ubah batas minimum stok"
                        />
                        <SubmitButton size="sm" loadingText="Menyimpan...">
                          Simpan
                        </SubmitButton>
                      </form>

                      <form action={deleteWorkerStockAction}>
                        <input type="hidden" name="stockId" value={row.id} />
                        <SubmitButton size="sm" variant="danger" loadingText="Menghapus...">
                          Hapus
                        </SubmitButton>
                      </form>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
