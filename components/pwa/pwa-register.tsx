"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getQueuedSalesCount, syncQueuedSales } from "@/lib/client/offline-sale-queue";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in window.navigator) {
      window.navigator.serviceWorker.register("/sw.js").catch(() => {
        // Silent fallback: app still works without SW.
      });
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const trySyncOfflineQueue = async () => {
      const hasQueue = getQueuedSalesCount() > 0;
      if (!hasQueue) return;

      const result = await syncQueuedSales();
      if (result.synced > 0) {
        toast.success(`${result.synced} transaksi offline berhasil dikirim ke server.`);
        window.location.reload();
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("online", trySyncOfflineQueue);
    void trySyncOfflineQueue();

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("online", trySyncOfflineQueue);
    };
  }, []);

  async function installApp() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  if (!deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button className="h-8 px-3 text-sm" onClick={installApp}>
        <Download size={14} />
        Install Aplikasi POSKU
      </Button>
    </div>
  );
}
