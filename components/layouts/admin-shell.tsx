import Link from "next/link";

import { logoutAction } from "@/lib/actions/auth";

const menus = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/branches", label: "Cabang" },
  { href: "/admin/categories", label: "Kategori" },
  { href: "/admin/products", label: "Produk" },
  { href: "/admin/stocks", label: "Stok" },
  { href: "/admin/workers", label: "Worker" },
  { href: "/admin/sales", label: "Penjualan" }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[250px_1fr]">
      <aside className="border-r border-[var(--border)] bg-white p-4">
        <h2 className="text-lg font-semibold">POS Owner</h2>
        <nav className="mt-6 space-y-1">
          {menus.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm hover:bg-gray-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction} className="mt-8">
          <button className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
            Logout
          </button>
        </form>
      </aside>
      <main className="p-4 md:p-8">{children}</main>
    </div>
  );
}
