import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="not-found-pulse w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 text-center backdrop-blur">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">POSKU</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">404</h1>
        <p className="mt-2 text-lg font-semibold">Halaman tidak ditemukan</p>
        <p className="mt-3 text-sm text-[var(--muted)]">
          URL yang kamu akses tidak tersedia atau sudah dipindahkan.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--primary)] px-4 text-sm font-medium text-[var(--primary-foreground)] hover:brightness-110"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </section>
    </main>
  );
}
