# POS Management Multi-Cabang (Next.js 16 + Supabase + Prisma)

Aplikasi web POS sekaligus manajemen barang untuk toko kelontong multi-cabang dengan role ketat:
- `OWNER`: akses area `/admin/*`
- `WORKER`: akses area `/pos`

## 1. Stack & versi

- Next.js `16.x` (App Router)
- React `19.x`
- TypeScript `5.x`
- Tailwind CSS `4.x`
- shadcn/ui style setup (`components.json` + reusable UI components)
- Supabase Auth (SSR + Admin API)
- PostgreSQL + Prisma ORM `6.x`
- Vercel-ready

## 2. Struktur folder

```text
app/
  (auth)/
    login-owner/page.tsx
    login-worker/page.tsx
  admin/
    page.tsx
    layout.tsx
    dashboard/page.tsx
    branches/page.tsx
    categories/page.tsx
    products/page.tsx
    stocks/page.tsx
    workers/page.tsx
    sales/page.tsx
  pos/page.tsx
  api/health/route.ts
  globals.css
  layout.tsx
  page.tsx
components/
  auth/login-form.tsx
  layouts/admin-shell.tsx
  pos/pos-terminal.tsx
  ui/*
lib/
  actions/
    auth.ts
    admin.ts
    sale.ts
  auth/
    guards.ts
    session.ts
  services/
    admin.ts
    owner-context.ts
    pos.ts
  supabase/
    admin.ts
    client.ts
    server.ts
  validators/
    auth.ts
    master.ts
    sale.ts
  constants/roles.ts
  prisma.ts
  utils.ts
prisma/
  schema.prisma
  seed.ts
  migrations/0001_init/migration.sql
proxy.ts
.env.example
```

## 3. Schema database

Schema lengkap ada di:
- `prisma/schema.prisma`
- `prisma/migrations/0001_init/migration.sql`

Tabel utama sesuai kebutuhan:
- `User`
- `Branch`
- `WorkerProfile`
- `Category`
- `Product`
- `BranchStock`
- `Sale`
- `SaleItem`

Relasi penting:
- Owner -> banyak branch
- Branch -> banyak worker
- Category -> banyak product
- Product -> stok per branch via `BranchStock`
- Sale -> 1 branch + 1 worker
- Sale -> banyak `SaleItem`

## 4. Setup lokal (Tahap 1)

1. Copy env:
```bash
cp .env.example .env
```

2. Install dependency:
```bash
npm install
```

3. Generate Prisma client:
```bash
npm run db:generate
```

4. Jalankan migration:
```bash
npm run db:migrate
```

5. Seed dummy data:
```bash
npm run db:seed
```

6. Jalankan app:
```bash
npm run dev
```

## 5. Isi `.env.example`

Lihat file `.env.example`.
Variable wajib:
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SEED_OWNER_EMAIL`
- `SEED_OWNER_PASSWORD`
- `SEED_OWNER_NAME`

## 6. Auth flow & role protection (Tahap 2)

- Login owner: `/login-owner`
- Login worker: `/login-worker`
- Tidak ada public register.
- Owner membuat akun worker dari halaman `/admin/workers` menggunakan Supabase Admin API.
- `proxy.ts` + guard role:
  - `OWNER` tidak boleh ke `/pos`
  - `WORKER` tidak boleh ke `/admin/*`
- Server actions admin pakai `requireOwner()`.
- Server action transaksi POS pakai `requireWorker()`.

## 7. Halaman admin (Tahap 3 + 5)

- `/admin/dashboard`
  - ringkasan cabang, produk, worker, total penjualan
  - barang terlaris
  - stok menipis
- `/admin/branches` CRUD cabang (create + list)
- `/admin/categories` CRUD kategori (create + list)
- `/admin/products` CRUD produk (create + list)
  - harga jual
  - harga beli
  - profit per item
- `/admin/stocks`
  - kelola stok per cabang
- `/admin/workers`
  - create akun worker + assignment branch
- `/admin/sales`
  - riwayat transaksi
  - ringkasan penjualan per cabang

## 8. Halaman POS (Tahap 4)

- `/pos` khusus worker
- Cari produk cepat
- Tambah ke keranjang
- Ubah qty / hapus item
- Subtotal otomatis
- Total otomatis
- Input bayar
- Hitung kembalian
- Simpan transaksi
- Stok cabang berkurang otomatis
- Riwayat transaksi sederhana cabang aktif

## 9. Business logic yang diterapkan

- Tidak izinkan qty <= 0
- Tidak izinkan harga negatif
- Tidak izinkan transaksi jika stok tidak cukup
- Simpan snapshot harga jual di `SaleItem.sellingPrice`
- Subtotal = `qty * sellingPrice`
- Total transaksi = jumlah subtotal item
- Setelah sukses, `BranchStock.stockQty` dikurangi sesuai cabang
- Harga beli/profit hanya ada di area admin (tidak ditampilkan di POS)

## 10. Deploy ke Vercel

1. Push project ke GitHub.
2. Import repo di Vercel.
3. Set environment variables di Vercel sesuai `.env.example`.
4. Build command:
```bash
npm run build
```
5. Install command:
```bash
npm install
```
6. Start command (opsional, Vercel auto detect Next.js):
```bash
npm run start
```
7. Jalankan migration ke DB production:
```bash
npm run db:migrate
```
8. (Opsional) seed data awal:
```bash
npm run db:seed
```

## 11. Akun dummy seed

- Owner:
  - email: `owner@tokokelontong.com`
  - password: `Owner123!`
- Worker:
  - `worker1@tokokelontong.com` / `Worker123!`
  - `worker2@tokokelontong.com` / `Worker123!`

## 12. Tahap implementasi

- Tahap 1: setup project, dependencies, struktur folder, schema + migration -> selesai
- Tahap 2: auth flow dan proteksi role -> selesai
- Tahap 3: halaman admin master data -> selesai (create/list)
- Tahap 4: halaman POS & transaksi -> selesai
- Tahap 5: dashboard & laporan ringkas -> selesai
- Tahap 6: final review & perbaikan logika -> selesai pada validasi server action + guard role

## Catatan

Project ini sudah siap dikembangkan lanjut untuk:
- edit/delete pada semua master data
- pagination/filter lanjutan
- export laporan
- test otomatis
