import { ProductCreateForm } from "@/components/admin/product-create-form";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import {
  deleteProductAction,
  updateProductAction
} from "@/lib/actions/admin";
import { requireOwner } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";

export default async function ProductsPage() {
  const owner = await requireOwner();
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { ownerId: owner.id },
      include: { category: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.category.findMany({ where: { ownerId: owner.id }, orderBy: { name: "asc" } })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Produk</h1>
        <p className="text-sm text-[var(--muted)]">Atur harga jual, harga beli, profit, dan status produk aktif.</p>
      </div>

      <Card className="animate-fade-in">
        <h2 className="font-semibold">Tambah Produk</h2>
        <ProductCreateForm categories={categories.map((item) => ({ id: item.id, name: item.name }))} />
      </Card>

      <Card className="animate-fade-in">
        <div className="overflow-auto rounded-xl border border-[var(--border)]">
          <Table>
            <THead>
              <TR>
                <TH>Nama</TH>
                <TH>SKU</TH>
                <TH>Kategori</TH>
                <TH>Harga Jual</TH>
                <TH>Harga Beli</TH>
                <TH>Profit/Item</TH>
                <TH>Aksi</TH>
              </TR>
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
                    <TD className="font-medium">{formatRupiah(profit)}</TD>
                    <TD>
                      <div className="flex flex-wrap gap-2">
                        <details className="rounded-lg border border-[var(--border)] bg-[var(--card-solid)] p-2">
                          <summary className="cursor-pointer text-xs font-medium">Edit</summary>
                          <form action={updateProductAction} className="mt-2 grid gap-2">
                            <input type="hidden" name="productId" value={row.id} />
                            <Input name="name" defaultValue={row.name} required />
                            <Input name="sku" defaultValue={row.sku} required />
                            <Input name="barcode" defaultValue={row.barcode ?? ""} />
                            <select
                              name="categoryId"
                              defaultValue={row.categoryId}
                              className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 text-sm"
                              required
                            >
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                            <Input type="number" name="sellingPrice" min={0} defaultValue={Number(row.sellingPrice)} required />
                            <Input type="number" name="purchasePrice" min={0} defaultValue={Number(row.purchasePrice)} required />
                            <label className="flex items-center gap-2 text-xs">
                              <input type="checkbox" name="isActive" defaultChecked={row.isActive} />
                              Produk aktif
                            </label>
                            <SubmitButton size="sm" loadingText="Menyimpan...">
                              Simpan
                            </SubmitButton>
                          </form>
                        </details>

                        <form action={deleteProductAction}>
                          <input type="hidden" name="productId" value={row.id} />
                          <SubmitButton variant="danger" size="sm" loadingText="Menghapus...">
                            Hapus
                          </SubmitButton>
                        </form>
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Produk dengan histori penjualan tidak dapat dihapus demi konsistensi laporan.
        </p>
      </Card>
    </div>
  );
}
