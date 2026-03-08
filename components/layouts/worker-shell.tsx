"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";

const menus = [
  { href: "/pos", label: "Kasir" },
  { href: "/pos/history", label: "Riwayat" },
  { href: "/pos/stocks", label: "Stok Cabang" }
] as const;

function SidebarContent({
  workerName,
  branchName,
  onNavigate
}: {
  workerName: string;
  branchName: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Panel Karyawan</p>
        <h2 className="mt-1 text-xl font-semibold">POSKU</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{workerName}</p>
        <p className="text-xs text-[var(--muted)]">Cabang: {branchName}</p>
      </div>

      <nav className="mt-6 grid gap-1">
        {menus.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="rounded-xl px-3 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--primary-soft)]"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 flex items-center gap-2 md:mt-auto">
        <ThemeToggle />
        <form action={logoutAction} className="w-full">
          <Button className="w-full" variant="outline" type="submit">
            Logout
          </Button>
        </form>
      </div>
    </div>
  );
}

export function WorkerShell({
  workerName,
  branchName,
  children
}: {
  workerName: string;
  branchName: string;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen md:grid md:grid-cols-[250px_1fr]">
      <aside className="surface hidden border-r border-[var(--border)] p-4 md:block md:min-h-screen">
        <SidebarContent workerName={workerName} branchName={branchName} />
      </aside>

      <div className="surface sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border)] p-4 md:hidden">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Panel Karyawan</p>
          <h2 className="text-lg font-semibold">POSKU</h2>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen((prev) => !prev)}
          aria-label="Buka menu"
        >
          <Menu size={18} />
        </Button>
      </div>

      <div className={`fixed inset-0 z-40 md:hidden ${sidebarOpen ? "" : "pointer-events-none"}`}>
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() => setSidebarOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            sidebarOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`surface absolute left-0 top-0 h-full w-72 border-r border-[var(--border)] p-4 transition-transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-2 flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              aria-label="Tutup sidebar"
            >
              <X size={18} />
            </Button>
          </div>
          <SidebarContent
            workerName={workerName}
            branchName={branchName}
            onNavigate={() => setSidebarOpen(false)}
          />
        </aside>
      </div>

      <section className="min-w-0">
        <main className="p-4 md:p-8">{children}</main>
      </section>
    </div>
  );
}
