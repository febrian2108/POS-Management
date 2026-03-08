"use client";

import { useMemo, useState } from "react";

import { FieldTooltip } from "@/components/ui/field-tooltip";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatRupiah } from "@/lib/utils";

type HistoryProduct = {
  productId: string;
  name: string;
  qty: number;
};

type HistorySale = {
  id: string;
  createdAt: string;
  totalItems: number;
  profit: number;
  products: HistoryProduct[];
};

function toStartOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function toEndOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

export function WorkerHistoryFilterTable({ sales }: { sales: HistorySale[] }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("all");

  const productOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const sale of sales) {
      for (const product of sale.products) {
        if (!map.has(product.productId)) {
          map.set(product.productId, product.name);
        }
      }
    }
    return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [sales]);

  const filteredSales = useMemo(() => {
    const customStart = dateFrom ? toStartOfDay(new Date(dateFrom)) : null;
    const customEnd = dateTo ? toEndOfDay(new Date(dateTo)) : null;

    return sales.filter((sale) => {
      const saleDate = new Date(sale.createdAt);

      const passDate =
        (!customStart || saleDate >= customStart) &&
        (!customEnd || saleDate <= customEnd);
      if (!passDate) return false;

      if (selectedProduct !== "all") {
        return sale.products.some((product) => product.productId === selectedProduct);
      }

      return true;
    });
  }, [sales, dateFrom, dateTo, selectedProduct]);

  const totalProfit = useMemo(
    () => filteredSales.reduce((acc: number, sale) => acc + sale.profit, 0),
    [filteredSales]
  );

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <p className="mb-1 text-sm text-[var(--muted)]">Produk</p>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 text-sm"
          >
            <option value="all">Semua Produk</option>
            {productOptions.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-1 flex items-center gap-1.5 text-sm text-[var(--muted)]">
            Dari Tanggal
            <FieldTooltip text="Menampilkan transaksi mulai tanggal ini (jam 00:00)." />
          </p>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div>
          <p className="mb-1 flex items-center gap-1.5 text-sm text-[var(--muted)]">
            Sampai Tanggal
            <FieldTooltip text="Menampilkan transaksi hingga tanggal ini (jam 23:59)." />
          </p>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 py-2">
          <p className="text-xs text-[var(--muted)]">Jumlah Transaksi</p>
          <p className="text-lg font-semibold">{filteredSales.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 py-2">
          <p className="text-xs text-[var(--muted)]">Total Keuntungan</p>
          <p className="text-lg font-semibold">{formatRupiah(totalProfit)}</p>
        </div>
      </div>

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
            {filteredSales.map((sale) => (
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
    </div>
  );
}
