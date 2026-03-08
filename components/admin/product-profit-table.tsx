"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatRupiah } from "@/lib/utils";

type ProductProfitRow = {
  productId: string;
  productName: string;
  sku: string;
  isActive: boolean;
  qtyMasuk: number;
  nilaiMasuk: number;
  qtyKeluar: number;
  nilaiKeluar: number;
  keuntunganKeluar: number;
};

type ProfitFilter = "all" | "profit" | "loss" | "sold" | "active";

export function ProductProfitTable({ rows }: { rows: ProductProfitRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProfitFilter>("all");

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows.filter((row) => {
      const passSearch =
        q.length === 0 || row.productName.toLowerCase().includes(q) || row.sku.toLowerCase().includes(q);

      if (!passSearch) return false;

      if (filter === "profit") return row.keuntunganKeluar > 0;
      if (filter === "loss") return row.keuntunganKeluar < 0;
      if (filter === "sold") return row.qtyKeluar > 0;
      if (filter === "active") return row.isActive;
      return true;
    });
  }, [rows, query, filter]);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <div>
          <p className="mb-1 text-sm text-[var(--muted)]">Cari Produk / SKU</p>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Contoh: Beras / SKU-001"
          />
        </div>
        <div>
          <p className="mb-1 text-sm text-[var(--muted)]">Filter Data</p>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as ProfitFilter)}
            className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 text-sm"
          >
            <option value="all">Semua Produk</option>
            <option value="profit">Hanya Untung</option>
            <option value="loss">Hanya Rugi</option>
            <option value="sold">Yang Sudah Terjual</option>
            <option value="active">Produk Aktif</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-[var(--muted)]">Menampilkan {filteredRows.length} produk</p>

      <div className="overflow-auto rounded-xl border border-[var(--border)]">
        <Table>
          <THead>
            <TR>
              <TH>Produk</TH>
              <TH>Qty Masuk</TH>
              <TH>Nilai Masuk</TH>
              <TH>Qty Keluar</TH>
              <TH>Nilai Keluar</TH>
              <TH>Keuntungan</TH>
            </TR>
          </THead>
          <TBody>
            {filteredRows.map((row) => (
              <TR key={row.productId}>
                <TD>
                  <p className="font-medium">{row.productName}</p>
                  <p className="text-xs text-[var(--muted)]">{row.sku}</p>
                </TD>
                <TD>{row.qtyMasuk}</TD>
                <TD>{formatRupiah(row.nilaiMasuk)}</TD>
                <TD>{row.qtyKeluar}</TD>
                <TD>{formatRupiah(row.nilaiKeluar)}</TD>
                <TD className="font-medium">{formatRupiah(row.keuntunganKeluar)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
