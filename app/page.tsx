import Link from "next/link";

import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-5 py-10">
      <section className="surface w-full rounded-3xl border border-[var(--border)] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] md:p-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Multi Branch Retail Suite</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight md:text-4xl">
              POS Management untuk Toko Kelontong
            </h1>
          </div>
          <ThemeToggle />
        </div>

        <p className="mt-4 max-w-2xl text-sm text-[var(--muted)] md:text-base">
          Masuk sesuai role untuk mengelola operasional admin atau memproses transaksi kasir dengan alur stok per cabang.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            href="/login-owner"
            className="rounded-2xl bg-[var(--primary)] px-5 py-4 text-center text-sm font-semibold text-[var(--primary-foreground)] transition hover:brightness-110"
          >
            Login Owner
          </Link>
          <Link
            href="/login-worker"
            className="rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] px-5 py-4 text-center text-sm font-semibold transition hover:bg-[var(--background-elevated)]"
          >
            Login Worker
          </Link>
        </div>
      </section>
    </main>
  );
}
