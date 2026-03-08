import Link from "next/link";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";

const menus = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/branches", label: "Cabang" },
  { href: "/admin/categories", label: "Kategori" },
  { href: "/admin/products", label: "Produk" },
  { href: "/admin/stocks", label: "Stok" },
  { href: "/admin/workers", label: "Worker" },
  { href: "/admin/sales", label: "Penjualan" }
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
      <aside className="surface border-b border-r border-[var(--border)] md:min-h-screen">
        <div className="flex h-full flex-col p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Owner Console</p>
            <h2 className="mt-1 text-xl font-semibold">POS Management</h2>
          </div>

          <nav className="mt-6 grid gap-1">
            {menus.map((item) => (
              <Link
                key={item.href}
                href={item.href}
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
      </aside>

      <section className="min-w-0">
        <header className="surface sticky top-0 z-30 border-b border-[var(--border)] px-4 py-3 md:px-8">
          <p className="text-sm text-[var(--muted)]">
            Ringkasan operasional toko multi-cabang, pembaruan real-time per transaksi.
          </p>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </section>
    </div>
  );
}
