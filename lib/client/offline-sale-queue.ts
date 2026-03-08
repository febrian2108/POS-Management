"use client";

import { createSaleSchema } from "@/lib/validators/sale";

const STORAGE_KEY = "posku.offline.sale.queue.v1";

export type QueuedSale = {
  id: string;
  createdAt: string;
  payload: {
    branchId: string;
    paidAmount: number;
    items: Array<{ productId: string; qty: number }>;
  };
};

type SyncResult = {
  synced: number;
  failed: number;
  remaining: number;
};

function readQueue(): QueuedSale[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as QueuedSale[];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedSale[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

function notifyQueueChanged() {
  window.dispatchEvent(new Event("posku-offline-queue-updated"));
}

export function getQueuedSalesCount() {
  return readQueue().length;
}

export function enqueueSale(payload: unknown): boolean {
  const parsed = createSaleSchema.safeParse(payload);
  if (!parsed.success) return false;

  const queue = readQueue();
  queue.push({
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${queue.length + 1}`,
    createdAt: new Date().toISOString(),
    payload: parsed.data
  });
  writeQueue(queue);
  notifyQueueChanged();
  return true;
}

export async function syncQueuedSales(): Promise<SyncResult> {
  if (typeof window === "undefined") {
    return { synced: 0, failed: 0, remaining: 0 };
  }

  const queue = readQueue();
  if (!queue.length) {
    return { synced: 0, failed: 0, remaining: 0 };
  }

  if (!window.navigator.onLine) {
    return { synced: 0, failed: queue.length, remaining: queue.length };
  }

  const failed: QueuedSale[] = [];
  let synced = 0;

  for (const entry of queue) {
    try {
      const response = await fetch("/api/pos/sales/sync", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(entry.payload)
      });

      if (!response.ok) {
        failed.push(entry);
        continue;
      }

      synced += 1;
    } catch {
      failed.push(entry);
    }
  }

  writeQueue(failed);
  notifyQueueChanged();

  return {
    synced,
    failed: failed.length,
    remaining: failed.length
  };
}
