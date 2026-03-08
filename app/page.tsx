import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6">
      <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] p-10 shadow-sm">
        <h1 className="text-2xl font-semibold">POS Management Toko Kelontong</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Pilih area login sesuai role Anda.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            href="/login-owner"
            className="rounded-lg bg-[var(--primary)] px-4 py-3 text-center font-medium text-[var(--primary-foreground)]"
          >
            Login Owner
          </Link>
          <Link
            href="/login-worker"
            className="rounded-lg border border-[var(--border)] px-4 py-3 text-center font-medium"
          >
            Login Worker
          </Link>
        </div>
      </div>
    </main>
  );
}
