# Tata Cara Konfigurasi Database Supabase (Detail)

Panduan ini khusus project POS-Management (Next.js + Supabase + Prisma).

## 1) Buat Project Supabase
1. Login ke https://supabase.com.
2. Klik **New project**.
3. Isi nama project, region, dan **Database Password**.
4. Tunggu sampai project aktif.

## 2) Ambil Kredensial yang Dibutuhkan
Di dashboard Supabase:

1. **Project Settings > API**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

2. **Project Settings > Database**
- URI untuk **Pooler** (runtime app)
- URI untuk **Direct connection** (Prisma migrate)

## 3) Format Env yang Benar untuk Prisma + Supabase

Gunakan **dua URL**:
- `DATABASE_URL` = Pooler (runtime query)
- `DIRECT_URL` = Direct DB (migrate/introspect)

Contoh:

```env
# Runtime (pooler)
DATABASE_URL="postgresql://postgres.<PROJECT_REF>:<DB_PASSWORD_URL_ENCODED>@aws-<REGION>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Migrate (direct)
DIRECT_URL="postgresql://postgres:<DB_PASSWORD_URL_ENCODED>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require"
```

Penting:
- Username pooler: `postgres.<PROJECT_REF>`
- Username direct: `postgres`
- Jika password ada karakter spesial (`@`, `#`, `:` dll), **harus URL-encoded**.

## 4) Isi File `.env`

```bash
cp .env.example .env
```

Isi variable ini:
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SEED_OWNER_EMAIL`
- `SEED_OWNER_PASSWORD`
- `SEED_OWNER_NAME`

## 5) Pastikan Prisma Schema Memakai `directUrl`

`prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## 6) Matikan Public Signup (Sesuai Rule Bisnis)

Di Supabase:
- **Authentication > Providers > Email**
- Matikan opsi signup publik (nama opsi bisa berbeda antar versi UI)

Tujuan: user worker hanya dibuat owner dari admin panel.

## 7) Jalankan Prisma

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

## 8) Verifikasi di Supabase

1. Cek **Table Editor**: tabel `User`, `Branch`, `Product`, `BranchStock`, `Sale`, dll.
2. Cek **Authentication > Users**: owner/worker tersedia.

## 9) Jalankan Aplikasi

```bash
npm run dev
```

Akses:
- `/login-owner`
- `/login-worker`
- `/admin/dashboard`
- `/pos`

## 10) Troubleshooting Cepat

1. `P1000 Authentication failed`
- Password DB salah.
- Username salah (pooler vs direct tertukar).
- Password belum URL-encoded.

2. `P1001 Can't reach database`
- Host/port salah.
- Project Supabase pause.
- Jaringan memblokir port DB.

3. Build/seed gagal karena env
- Pastikan semua env terisi (terutama `NEXT_PUBLIC_SUPABASE_URL` dan service role key).

## 11) Checklist
- [ ] `.env` sudah pakai `DATABASE_URL` + `DIRECT_URL`
- [ ] Password DB sudah URL-encoded
- [ ] `npm run db:migrate` sukses
- [ ] `npm run db:seed` sukses
- [ ] Login owner/worker berhasil
