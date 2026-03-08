import { createProductAction } from "@/lib/actions/admin";
import { requireOwner } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export default async function ProductsPage() {
  const owner = await requireOwner();
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ where: { ownerId: owner.id }, include: { category: true }, orderBy: { createdAt: "desc" } }),
    prisma.category.findMany({ where: { ownerId: owner.id }, orderBy: { name: "asc" } })
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Produk</h1>
      <Card>
        <h2 className="font-semibold">Tambah Produk</h2>
        <form action={createProductAction} className="mt-4 grid gap-3 md:grid-cols-4">
          <div><Label>Nama</Label><Input name="name" required /></div>
          <div><Label>SKU</Label><Input name="sku" required /></div>
          <div><Label>Barcode</Label><Input name="barcode" /></div>
          <div>
            <Label>Kategori</Label>
            <select name="categoryId" className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm" required>
              <option value="">Pilih</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><Label>Harga Jual</Label><Input type="number" name="sellingPrice" min={0} required /></div>
          <div><Label>Harga Beli</Label><Input type="number" name="purchasePrice" min={0} required /></div>
          <div className="flex items-end gap-2"><input type="checkbox" name="isActive" defaultChecked /><Label>Aktif</Label></div>
          <div className="md:col-span-4"><Button type="submit">Simpan</Button></div>
        </form>
      </Card>

      <Card>
        <Table>
          <THead>
            <TR><TH>Nama</TH><TH>SKU</TH><TH>Kategori</TH><TH>Harga Jual</TH><TH>Harga Beli</TH><TH>Profit/Item</TH></TR>
          </THead>
          <TBody>
            {products.map((row) => {
              const profit = Number(row.sellingPrice) - Number(row.purchasePrice);
              return (
                <TR key={row.id}>
                  <TD>{row.name}</TD>
                  <TD>{row.sku}</TD>
                  <TD>{row.category.name}</TD>
                  <TD>{formatRupiah(Number(row.sellingPrice))}</TD>
                  <TD>{formatRupiah(Number(row.purchasePrice))}</TD>
                  <TD>{formatRupiah(profit)}</TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
