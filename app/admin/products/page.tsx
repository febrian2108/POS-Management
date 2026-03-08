import Link from "next/link";

import { ProductCreateForm } from "@/components/admin/product-create-form";
import { Card } from "@/components/ui/card";
import { FileImportForm } from "@/components/ui/file-import-form";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import {
  deleteProductAction,
  updateProductAction
} from "@/lib/actions/admin";
import { importProductsFromExcelAction } from "@/lib/actions/imports";
import { requireOwner } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<{ name?: string; categoryId?: string }>;
}) {
  const owner = await requireOwner();
  const params = await searchParams;
  const selectedName = params.name?.trim() ?? "";
  const selectedCategoryId = params.categoryId ?? "all";

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        ownerId: owner.id,
        ...(selectedName
          ? {
              name: {
                contains: selectedName,
                mode: "insensitive"
              }
            }
          : {}),
        ...(selectedCategoryId !== "all" ? { categoryId: selectedCategoryId } : {})
      },
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
        <h2 className="font-semibold">Filter Produk</h2>
        <form className="mt-3 grid gap-3 md:grid-cols-[1.4fr_1fr_auto_auto]">
          <div>
            <p className="mb-1 text-sm text-[var(--muted)]">Nama Produk</p>
            <Input
              name="name"
              placeholder="Contoh: beras, minyak..."
              defaultValue={selectedName}
            />
          </div>
          <div>
            <p className="mb-1 text-sm text-[var(--muted)]">Kategori</p>
            <select
              name="categoryId"
              defaultValue={selectedCategoryId}
              className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 text-sm"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <SubmitButton>Terapkan</SubmitButton>
          </div>
          <div className="flex items-end">
            <Link
              href="/admin/products"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] px-4 text-sm"
            >
              Reset
            </Link>
          </div>
        </form>
      </Card>

      <Card className="animate-fade-in">
        <h2 className="font-semibold">Import Produk via Excel</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Upload `.xlsx`, `.xls`, atau `.csv` agar produk terinput massal dengan cepat.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
          <FileImportForm
            action={importProductsFromExcelAction}
            submitLabel="Import Produk"
            loadingText="Mengimpor..."
          />
          <Link
            href="/templates/products-import-template.csv"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-4 text-sm"
          >
            Download Template CSV
          </Link>
        </div>
        <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--card-solid)] p-3 text-xs text-[var(--muted)]">
          Kolom wajib: `name`, `category_name`, `selling_price`, `purchase_price`. Kolom opsional:
          `sku`, `barcode`, `is_active`.
        </div>
      </Card>

      <Card className="animate-fade-in">
        <div className="mb-2 text-xs text-[var(--muted)]">Menampilkan {products.length} produk</div>
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
