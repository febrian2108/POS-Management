"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Search, TrendingUp, Boxes, Printer } from "lucide-react";
import { toast } from "sonner";

import { createSaleAction } from "@/lib/actions/sale";
import {
  enqueueSale,
  getQueuedSalesCount,
  syncQueuedSales
} from "@/lib/client/offline-sale-queue";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type PosProduct = {
  stockId: string;
  productId: string;
  name: string;
  sku: string;
  sellingPrice: number;
  stockQty: number;
  categoryName: string;
};

type CartItem = {
  productId: string;
  name: string;
  qty: number;
  sellingPrice: number;
  stockQty: number;
};

type ReceiptItem = {
  productId: string;
  productName: string;
  qty: number;
  sellingPrice: number;
  subtotal: number;
};

type ReceiptPayload = {
  saleId: string;
  createdAt: string;
  branchName: string;
  workerName: string;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  items: ReceiptItem[];
};

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildReceiptHtml(receipt: ReceiptPayload) {
  const itemsHtml = receipt.items
    .map(
      (item) => `
      <tr>
        <td style="padding:4px 0;">
          ${escapeHtml(item.productName)}
          <div style="font-size:11px;color:#4b5563;">${item.qty} x ${formatRupiah(item.sellingPrice)}</div>
        </td>
        <td style="padding:4px 0;text-align:right;">${formatRupiah(item.subtotal)}</td>
      </tr>
    `
    )
    .join("");

  const printedAt = new Date(receipt.createdAt).toLocaleString("id-ID");

  return `
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>Struk ${escapeHtml(receipt.saleId)}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 4mm;
          }
          body {
            margin: 0;
            font-family: "Segoe UI", Tahoma, sans-serif;
            color: #111827;
            font-size: 12px;
          }
          .wrap {
            width: 72mm;
            margin: 0 auto;
          }
          .center {
            text-align: center;
          }
          .muted {
            color: #4b5563;
          }
          .line {
            border-top: 1px dashed #6b7280;
            margin: 8px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          .totals td {
            padding: 2px 0;
          }
          .totals td:last-child {
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="center">
            <div style="font-weight:700;font-size:15px;">POSKU</div>
            <div>${escapeHtml(receipt.branchName)}</div>
          </div>
          <div class="line"></div>
          <div class="muted">No: ${escapeHtml(receipt.saleId)}</div>
          <div class="muted">Waktu: ${escapeHtml(printedAt)}</div>
          <div class="muted">Kasir: ${escapeHtml(receipt.workerName)}</div>
          <div class="line"></div>
          <table>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="line"></div>
          <table class="totals">
            <tbody>
              <tr><td>Total</td><td>${formatRupiah(receipt.totalAmount)}</td></tr>
              <tr><td>Bayar</td><td>${formatRupiah(receipt.paidAmount)}</td></tr>
              <tr><td>Kembalian</td><td>${formatRupiah(receipt.changeAmount)}</td></tr>
            </tbody>
          </table>
          <div class="line"></div>
          <div class="center muted">Terima kasih</div>
        </div>
      </body>
    </html>
  `;
}

function printReceipt(receipt: ReceiptPayload) {
  const win = window.open("", "_blank", "width=420,height=700");

  if (!win) {
    toast.error("Popup cetak diblokir browser. Izinkan popup lalu coba cetak ulang.");
    return;
  }

  win.document.open();
  win.document.write(buildReceiptHtml(receipt));
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 220);
}

export function PosTerminal({
  workerName,
  branchName,
  branchId,
  products,
  dailySoldQty,
  dailyProfit
}: {
  workerName: string;
  branchName: string;
  branchId: string;
  products: PosProduct[];
  dailySoldQty: number;
  dailyProfit: number;
}) {
  const [query, setQuery] = useState("");
  const [paidAmountInput, setPaidAmountInput] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastReceipt, setLastReceipt] = useState<ReceiptPayload | null>(null);
  const [queuedCount, setQueuedCount] = useState(0);
  const [syncingQueue, setSyncingQueue] = useState(false);
  const [pending, startTransition] = useTransition();

  const paidAmount = paidAmountInput === "" ? 0 : Number(paidAmountInput);

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

  const change = paidAmount - subtotal;

  useEffect(() => {
    setQueuedCount(getQueuedSalesCount());

    const updateQueueCounter = () => {
      setQueuedCount(getQueuedSalesCount());
    };

    window.addEventListener("posku-offline-queue-updated", updateQueueCounter);

    return () => {
      window.removeEventListener("posku-offline-queue-updated", updateQueueCounter);
    };
  }, []);

  async function handleSyncQueue() {
    if (syncingQueue) return;
    setSyncingQueue(true);

    try {
      const result = await syncQueuedSales();
      if (result.synced > 0) {
        toast.success(`${result.synced} transaksi offline berhasil dikirim.`);
        setQueuedCount(result.remaining);
        window.location.reload();
        return;
      }

      if (result.remaining > 0) {
        toast.error("Masih ada transaksi offline yang belum terkirim.");
      }
    } finally {
      setSyncingQueue(false);
    }
  }

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

    if (!paidAmountInput) {
      toast.error("Masukkan jumlah uang yang dibayar pelanggan");
      return;
    }

    if (paidAmount < subtotal) {
      toast.error("Jumlah bayar kurang");
      return;
    }

    const payload = {
      branchId,
      paidAmount,
      items: cart.map((item) => ({ productId: item.productId, qty: item.qty }))
    };

    startTransition(async () => {
      try {
        const result = await createSaleAction(payload);

        if ("error" in result) {
          toast.error(result.error);
          return;
        }

        const receipt = result.receipt;
        if (receipt) {
          setLastReceipt(receipt);
          printReceipt(receipt);
        }

        toast.success(result.success || "Transaksi sukses");
        setCart([]);
        setPaidAmountInput("");
        window.location.reload();
      } catch {
        const saved = enqueueSale(payload);
        if (saved) {
          toast.warning(
            "Koneksi terputus. Transaksi disimpan sementara dan akan dikirim saat online."
          );
          setCart([]);
          setPaidAmountInput("");
          setQueuedCount(getQueuedSalesCount());
          return;
        }

        toast.error("Transaksi gagal diproses.");
      }
    });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
      <Card className="animate-fade-in space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Transaksi Cepat</p>
            <h2 className="text-lg font-semibold">
              {workerName} - {branchName}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {queuedCount > 0 ? (
              <Button
                variant="outline"
                size="sm"
                disabled={syncingQueue}
                onClick={handleSyncQueue}
              >
                {syncingQueue ? "Sync..." : `Sync Offline (${queuedCount})`}
              </Button>
            ) : null}
            <p className="text-sm text-[var(--muted)]">Klik produk untuk tambah ke keranjang</p>
          </div>
        </div>

        {queuedCount > 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 py-2 text-xs text-[var(--muted)]">
            Ada {queuedCount} transaksi offline yang belum terkirim. Sistem akan mencoba kirim ulang
            saat jaringan kembali normal.
          </div>
        ) : null}

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            size={16}
          />
          <Input
            className="pl-9"
            placeholder="Cari nama, SKU, atau kategori..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="grid max-h-[520px] gap-2 overflow-auto pr-1">
          {filtered.map((product) => (
            <button
              key={product.productId}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 py-2.5 text-left transition hover:bg-[var(--background-elevated)]"
              onClick={() => addToCart(product)}
            >
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-xs text-[var(--muted)]">
                  {product.sku} - {product.categoryName} - stok: {product.stockQty}
                </p>
              </div>
              <p className="font-semibold">{formatRupiah(product.sellingPrice)}</p>
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="animate-fade-in grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-solid)] p-3">
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              <Boxes size={14} />
              Barang Terjual Hari Ini
            </p>
            <p className="mt-1 text-2xl font-semibold">{dailySoldQty}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-solid)] p-3">
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              <TrendingUp size={14} />
              Keuntungan Hari Ini
            </p>
            <p className="mt-1 text-2xl font-semibold">{formatRupiah(dailyProfit)}</p>
          </div>
        </Card>

        <Card className="animate-fade-in space-y-3">
          <h2 className="text-lg font-semibold">Keranjang</h2>

          <div className="max-h-[260px] space-y-2 overflow-auto pr-1">
            {cart.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
                Belum ada item di keranjang.
              </div>
            ) : null}

            {cart.map((item) => (
              <div
                key={item.productId}
                className="rounded-xl border border-[var(--border)] bg-[var(--card-solid)] p-3"
              >
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
                placeholder="Masukkan uang pelanggan"
                value={paidAmountInput}
                onChange={(e) => setPaidAmountInput(e.target.value)}
              />
            </div>

            <p className="flex items-center justify-between text-sm">
              <span>Kembalian</span>
              <b className="text-base">{formatRupiah(change)}</b>
            </p>

            <Button className="w-full" onClick={checkout} disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan Transaksi"}
            </Button>

            {lastReceipt ? (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => printReceipt(lastReceipt)}
                type="button"
              >
                <Printer size={14} />
                Cetak Ulang Struk
              </Button>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
