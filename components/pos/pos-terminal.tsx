"use client";

import { useMemo, useState, useTransition } from "react";
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
  branchId,
  products,
  recentSales
}: {
  workerName: string;
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
      return [...prev, { productId: product.productId, name: product.name, qty: 1, sellingPrice: product.sellingPrice, stockQty: product.stockQty }];
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
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">POS Kasir - {workerName}</h1>
          <span className="text-sm text-[var(--muted)]">Cabang aktif</span>
        </div>
        <Input placeholder="Cari produk..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="mt-4 grid max-h-[500px] gap-2 overflow-auto">
          {filtered.map((product) => (
            <button
              key={product.productId}
              className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3 text-left hover:bg-gray-50"
              onClick={() => addToCart(product)}
            >
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-xs text-[var(--muted)]">{product.sku} - stok: {product.stockQty}</p>
              </div>
              <p className="font-semibold">{formatRupiah(product.sellingPrice)}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Keranjang</h2>
        <div className="mt-3 space-y-2">
          {cart.map((item) => (
            <div key={item.productId} className="rounded-lg border border-[var(--border)] p-3">
              <p className="font-medium">{item.name}</p>
              <div className="mt-2 flex items-center gap-2">
                <Input type="number" min={1} max={item.stockQty} value={item.qty} onChange={(e) => setQty(item.productId, Number(e.target.value))} />
                <Button variant="danger" onClick={() => removeItem(item.productId)}>Hapus</Button>
              </div>
              <p className="mt-2 text-sm">Subtotal: {formatRupiah(item.qty * item.sellingPrice)}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-3">
          <p className="flex justify-between"><span>Total</span><b>{formatRupiah(subtotal)}</b></p>
          <div>
            <p className="mb-1 text-sm">Jumlah Bayar</p>
            <Input type="number" min={0} value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))} />
          </div>
          <p className="flex justify-between"><span>Kembalian</span><b>{formatRupiah(change)}</b></p>
          <Button className="w-full" onClick={checkout} disabled={pending}>Simpan Transaksi</Button>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <h2 className="font-semibold">Riwayat Transaksi Cabang</h2>
        <Table className="mt-3">
          <THead><TR><TH>Waktu</TH><TH>Worker</TH><TH>Total</TH></TR></THead>
          <TBody>
            {recentSales.map((sale) => (
              <TR key={sale.id}>
                <TD>{new Date(sale.createdAt).toLocaleString("id-ID")}</TD>
                <TD>{sale.workerName}</TD>
                <TD>{formatRupiah(sale.totalAmount)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
