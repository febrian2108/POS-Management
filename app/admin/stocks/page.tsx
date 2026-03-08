import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { upsertStockAction } from "@/lib/actions/admin";
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
        <p className="text-sm text-[var(--muted)]">Kontrol minimum stok dan jumlah stok aktual setiap cabang.</p>
      </div>

      <Card>
        <h2 className="font-semibold">Atur Stok</h2>
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
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="overflow-auto rounded-xl border border-[var(--border)]">
          <Table>
            <THead>
              <TR>
                <TH>Cabang</TH>
                <TH>Produk</TH>
                <TH>Qty</TH>
                <TH>Min</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((row) => (
                <TR key={row.id}>
                  <TD>{row.branch.name}</TD>
                  <TD>{row.product.name}</TD>
                  <TD>{row.stockQty}</TD>
                  <TD>{row.minStock}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
