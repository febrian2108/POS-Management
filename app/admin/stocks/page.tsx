import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import {
  deleteStockAction,
  updateStockAction,
  upsertStockAction
} from "@/lib/actions/admin";
import { requireOwner } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function StocksPage() {
  const owner = await requireOwner();
  const [rows, branches, products] = await Promise.all([
    prisma.branchStock.findMany({
      where: { branch: { ownerId: owner.id } },
      include: { branch: true, product: true },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.branch.findMany({ where: { ownerId: owner.id }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { ownerId: owner.id }, orderBy: { name: "asc" } })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Stok Per Cabang</h1>
        <p className="text-sm text-[var(--muted)]">
          Kontrol minimum stok, edit koreksi input stok, atau hapus data stok yang keliru.
        </p>
      </div>

      <Card className="animate-fade-in">
        <h2 className="font-semibold">Atur Stok Baru</h2>
        <form action={upsertStockAction} className="mt-4 grid gap-3 md:grid-cols-5">
          <div>
            <Label>Cabang</Label>
            <select
              name="branchId"
              required
              className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 text-sm"
            >
              <option value="">Pilih</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Produk</Label>
            <select
              name="productId"
              required
              className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 text-sm"
            >
              <option value="">Pilih</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Stok Qty</Label>
            <Input type="number" min={0} name="stockQty" required />
          </div>
          <div>
            <Label>Min Stok</Label>
            <Input type="number" min={0} name="minStock" required />
          </div>
          <div className="flex items-end">
            <SubmitButton>Simpan Stok</SubmitButton>
          </div>
        </form>
      </Card>

      <Card className="animate-fade-in">
        <div className="overflow-auto rounded-xl border border-[var(--border)]">
          <Table>
            <THead>
              <TR>
                <TH>Cabang</TH>
                <TH>Produk</TH>
                <TH>Qty</TH>
                <TH>Min</TH>
                <TH>Aksi</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((row) => (
                <TR key={row.id}>
                  <TD>{row.branch.name}</TD>
                  <TD>{row.product.name}</TD>
                  <TD>{row.stockQty}</TD>
                  <TD>{row.minStock}</TD>
                  <TD>
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={updateStockAction} className="flex items-center gap-2">
                        <input type="hidden" name="stockId" value={row.id} />
                        <Input name="stockQty" type="number" min={0} defaultValue={row.stockQty} className="w-24" required />
                        <Input name="minStock" type="number" min={0} defaultValue={row.minStock} className="w-24" required />
                        <SubmitButton size="sm" loadingText="Menyimpan...">
                          Edit
                        </SubmitButton>
                      </form>

                      <form action={deleteStockAction}>
                        <input type="hidden" name="stockId" value={row.id} />
                        <SubmitButton variant="danger" size="sm" loadingText="Menghapus...">
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
