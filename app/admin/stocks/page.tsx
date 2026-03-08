import Link from "next/link";

import { Card } from "@/components/ui/card";
import { FileImportForm } from "@/components/ui/file-import-form";
import { FieldTooltip } from "@/components/ui/field-tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import {
  deleteStockAction,
  updateStockAction,
  upsertStockBulkAction
} from "@/lib/actions/admin";
import { importStocksFromExcelAction } from "@/lib/actions/imports";
import { requireOwner } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function StocksPage({
  searchParams
}: {
  searchParams: Promise<{ branchId?: string; productId?: string }>;
}) {
  const owner = await requireOwner();
  const params = await searchParams;
  const selectedBranchId = params.branchId ?? "all";
  const selectedProductId = params.productId ?? "all";

  const [rows, branches, products] = await Promise.all([
    prisma.branchStock.findMany({
      where: {
        branch: { ownerId: owner.id },
        ...(selectedBranchId !== "all" ? { branchId: selectedBranchId } : {}),
        ...(selectedProductId !== "all" ? { productId: selectedProductId } : {})
      },
      include: { branch: true, product: true },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.branch.findMany({ where: { ownerId: owner.id }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { ownerId: owner.id }, orderBy: { name: "asc" } })
  ]);
  type StockRow = (typeof rows)[number];
  type BranchRow = (typeof branches)[number];
  type ProductRow = (typeof products)[number];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Stok Per Cabang</h1>
        <p className="text-sm text-[var(--muted)]">
          Kelola jumlah stok barang untuk setiap cabang dengan langkah yang lebih sederhana.
        </p>
      </div>

      <Card className="animate-fade-in">
        <h2 className="font-semibold">Filter Data Stok</h2>
        <form className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
          <div>
            <Label>Filter Cabang</Label>
            <select
              name="branchId"
              defaultValue={selectedBranchId}
              className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 text-sm"
            >
              <option value="all">Semua Cabang</option>
              {branches.map((branch: BranchRow) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Filter Produk</Label>
            <select
              name="productId"
              defaultValue={selectedProductId}
              className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 text-sm"
            >
              <option value="all">Semua Produk</option>
              {products.map((product: ProductRow) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <SubmitButton>Terapkan Filter</SubmitButton>
          </div>
          <div className="flex items-end">
            <Link
              href="/admin/stocks"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] px-4 text-sm"
            >
              Reset
            </Link>
          </div>
        </form>
      </Card>

      <Card className="animate-fade-in">
        <h2 className="font-semibold">Tambah Stok Sekaligus ke Banyak Cabang</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Pilih produk, isi jumlah stok, lalu centang cabang tujuan. Sistem akan menambahkan/memperbarui
          stok ke semua cabang yang dipilih.
        </p>
        <form action={upsertStockBulkAction} className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label className="flex items-center gap-1.5">
                Produk
                <FieldTooltip text="Pilih produk yang ingin diatur stoknya." />
              </Label>
              <select
                name="productId"
                required
                className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 text-sm"
                title="Pilih produk"
              >
                <option value="">Pilih produk</option>
                {products.map((p: ProductRow) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="flex items-center gap-1.5">
                Jumlah Stok
                <FieldTooltip text="Masukkan jumlah stok fisik terbaru yang tersedia di gudang/rak cabang." />
              </Label>
              <Input
                type="number"
                min={0}
                name="stockQty"
                required
                title="Jumlah stok fisik terbaru"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5">
                Batas Minimum Stok
                <FieldTooltip text="Jika stok menyentuh angka ini, produk dianggap menipis dan perlu restok." />
              </Label>
              <Input
                type="number"
                min={0}
                name="minStock"
                required
                title="Batas minimum untuk peringatan stok menipis"
              />
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-1.5">
              Pilih Cabang Tujuan
              <FieldTooltip text="Centang satu atau beberapa cabang yang akan menerima pengaturan stok ini." />
            </Label>
            <div className="mt-2 grid gap-2 rounded-xl border border-[var(--border)] bg-[var(--card-solid)] p-3 sm:grid-cols-2 lg:grid-cols-3">
              {branches.map((branch: BranchRow) => (
                <label key={branch.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="branchIds" value={branch.id} className="h-4 w-4" />
                  {branch.name}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-end">
            <SubmitButton>Simpan ke Cabang Terpilih</SubmitButton>
          </div>
        </form>
      </Card>

      <Card className="animate-fade-in">
        <h2 className="font-semibold">Import Stok via Excel</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Gunakan file Excel untuk memperbarui stok massal berdasarkan `branch_code` dan `product_sku`.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
          <FileImportForm
            action={importStocksFromExcelAction}
            submitLabel="Import Stok"
            loadingText="Mengimpor..."
          />
          <Link
            href="/templates/stocks-import-template.csv"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-4 text-sm"
          >
            Download Template CSV
          </Link>
        </div>
        <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--card-solid)] p-3 text-xs text-[var(--muted)]">
          Kolom wajib: `branch_code`, `product_sku`, `stock_qty`, `min_stock`.
        </div>
      </Card>

      <Card className="animate-fade-in">
        <div className="overflow-auto rounded-xl border border-[var(--border)]">
          <Table>
            <THead>
              <TR>
                <TH>Cabang</TH>
                <TH>Produk</TH>
                <TH>Stok</TH>
                <TH>Batas Min</TH>
                <TH>Aksi</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((row: StockRow) => (
                <TR key={row.id}>
                  <TD>{row.branch.name}</TD>
                  <TD>{row.product.name}</TD>
                  <TD>{row.stockQty}</TD>
                  <TD>{row.minStock}</TD>
                  <TD>
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={updateStockAction} className="flex items-center gap-2">
                        <input type="hidden" name="stockId" value={row.id} />
                        <Input
                          name="stockQty"
                          type="number"
                          min={0}
                          defaultValue={row.stockQty}
                          className="w-24"
                          required
                          title="Ubah jumlah stok fisik terbaru"
                        />
                        <Input
                          name="minStock"
                          type="number"
                          min={0}
                          defaultValue={row.minStock}
                          className="w-24"
                          required
                          title="Ubah batas minimum stok menipis"
                        />
                        <SubmitButton size="sm" loadingText="Menyimpan...">
                          Simpan
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
