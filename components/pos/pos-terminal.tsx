"use client";

import { useMemo, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { createSaleAction } from "@/lib/actions/sale";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

type PosProduct = {
  stockId: string;
  productId: string;
  name: string;
  sku: string;
  sellingPrice: number;
  stockQty: number;
  categoryName: string;
};

type RecentSale = {
  id: string;
  totalAmount: number;
  createdAt: string;
  workerName: string;
};

type CartItem = {
  productId: string;
  name: string;
  qty: number;
  sellingPrice: number;
  stockQty: number;
};

export function PosTerminal({
  workerName,
  branchName,
  branchId,
  products,
  recentSales
}: {
  workerName: string;
  branchName: string;
  branchId: string;
  products: PosProduct[];
  recentSales: RecentSale[];
}) {
  const [query, setQuery] = useState("");
  const [paidAmount, setPaidAmount] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (!query) return products;
    const q = query.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
    );
  }, [products, query]);

  const subtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.qty * item.sellingPrice, 0),
    [cart]
  );

  const change = Math.max(paidAmount - subtotal, 0);

  function addToCart(product: PosProduct) {
    setCart((prev) => {
      const existing = prev.find((x) => x.productId === product.productId);
      if (existing) {
        if (existing.qty + 1 > existing.stockQty) {
          toast.error("Stok tidak cukup");
          return prev;
        }

        return prev.map((x) =>
          x.productId === product.productId ? { ...x, qty: x.qty + 1 } : x
        );
      }

      if (product.stockQty <= 0) {
        toast.error("Stok kosong");
        return prev;
      }

      return [
        ...prev,
        {
          productId: product.productId,
          name: product.name,
          qty: 1,
          sellingPrice: product.sellingPrice,
          stockQty: product.stockQty
        }
      ];
    });
  }

  function setQty(productId: string, qty: number) {
    if (qty <= 0) return;

    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;

        if (qty > item.stockQty) {
          toast.error("Qty melebihi stok");
          return item;
        }

        return { ...item, qty };
      })
    );
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((x) => x.productId !== productId));
  }

  function checkout() {
    if (cart.length === 0) {
      toast.error("Keranjang kosong");
      return;
    }

    if (paidAmount < subtotal) {
      toast.error("Jumlah bayar kurang");
      return;
    }

    startTransition(async () => {
      const result = await createSaleAction({
        branchId,
        paidAmount,
        items: cart.map((item) => ({ productId: item.productId, qty: item.qty }))
      });

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result?.success || "Transaksi sukses");
      setCart([]);
      setPaidAmount(0);
      window.location.reload();
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Kasir Aktif</p>
            <h2 className="text-lg font-semibold">
              {workerName} - {branchName}
            </h2>
          </div>
          <p className="text-sm text-[var(--muted)]">Klik produk untuk tambah ke keranjang</p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
          <Input
            className="pl-9"
            placeholder="Cari nama, SKU, atau kategori..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="grid max-h-[510px] gap-2 overflow-auto pr-1">
          {filtered.map((product) => (
            <button
              key={product.productId}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 py-2.5 text-left transition hover:bg-[var(--background-elevated)]"
              onClick={() => addToCart(product)}
            >
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-xs text-[var(--muted)]">
                  {product.sku} - stok: {product.stockQty}
                </p>
              </div>
              <p className="font-semibold">{formatRupiah(product.sellingPrice)}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Keranjang</h2>

        <div className="max-h-[320px] space-y-2 overflow-auto pr-1">
          {cart.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
              Belum ada item di keranjang.
            </div>
          ) : null}

          {cart.map((item) => (
            <div key={item.productId} className="rounded-xl border border-[var(--border)] bg-[var(--card-solid)] p-3">
              <p className="font-medium">{item.name}</p>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={item.stockQty}
                  value={item.qty}
                  onChange={(e) => setQty(item.productId, Number(e.target.value))}
                />
                <Button variant="danger" size="sm" onClick={() => removeItem(item.productId)}>
                  Hapus
                </Button>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Subtotal: {formatRupiah(item.qty * item.sellingPrice)}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-3 border-t border-[var(--border)] pt-3">
          <p className="flex items-center justify-between text-sm">
            <span>Total</span>
            <b className="text-base">{formatRupiah(subtotal)}</b>
          </p>

          <div>
            <p className="mb-1 text-sm text-[var(--muted)]">Jumlah Bayar</p>
            <Input
              type="number"
              min={0}
              value={paidAmount}
              onChange={(e) => setPaidAmount(Number(e.target.value))}
            />
          </div>

          <p className="flex items-center justify-between text-sm">
            <span>Kembalian</span>
            <b className="text-base">{formatRupiah(change)}</b>
          </p>

          <Button className="w-full" onClick={checkout} disabled={pending}>
            {pending ? "Menyimpan..." : "Simpan Transaksi"}
          </Button>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Riwayat Transaksi Cabang</h2>
          <p className="text-xs text-[var(--muted)]">20 transaksi terbaru</p>
        </div>

        <div className="overflow-auto rounded-xl border border-[var(--border)]">
          <Table>
            <THead>
              <TR>
                <TH>Waktu</TH>
                <TH>Worker</TH>
                <TH className="text-right">Total</TH>
              </TR>
            </THead>
            <TBody>
              {recentSales.map((sale) => (
                <TR key={sale.id}>
                  <TD>{new Date(sale.createdAt).toLocaleString("id-ID")}</TD>
                  <TD>{sale.workerName}</TD>
                  <TD className="text-right font-medium">{formatRupiah(sale.totalAmount)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
