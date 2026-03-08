import Link from "next/link";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";

const menus = [
  { href: "/pos", label: "Kasir" },
  { href: "/pos/history", label: "Riwayat" },
  { href: "/pos/stocks", label: "Stok Cabang" }
] as const;

export function WorkerShell({
  workerName,
  branchName,
  children
}: {
  workerName: string;
  branchName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[250px_1fr]">
      <aside className="surface border-b border-r border-[var(--border)] md:min-h-screen">
        <div className="flex h-full flex-col p-4">
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
        <main className="p-4 md:p-8">{children}</main>
      </section>
    </div>
  );
}
