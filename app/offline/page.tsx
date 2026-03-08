export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 text-center backdrop-blur">
        <h1 className="text-xl font-semibold">Koneksi internet terputus</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          POSKU akan mencoba menyimpan transaksi sementara di perangkat ini dan mengirimkan saat
          jaringan kembali normal.
        </p>
      </section>
    </main>
  );
}
