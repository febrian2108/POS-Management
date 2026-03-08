import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { createWorkerAction, deleteWorkerAction } from "@/lib/actions/admin";
import { requireOwner } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function WorkersPage() {
  const owner = await requireOwner();
  const [workers, branches] = await Promise.all([
    prisma.workerProfile.findMany({
      where: { branch: { ownerId: owner.id } },
      include: { user: true, branch: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.branch.findMany({ where: { ownerId: owner.id }, orderBy: { name: "asc" } })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Worker</h1>
        <p className="text-sm text-[var(--muted)]">Buat akun karyawan, tetapkan cabang, dan hapus akun bila tidak digunakan.</p>
      </div>

      <Card className="animate-fade-in">
        <h2 className="font-semibold">Tambah Worker</h2>
        <form action={createWorkerAction} className="mt-4 grid gap-3 md:grid-cols-4">
          <div>
            <Label>Nama</Label>
            <Input name="fullName" required />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" name="email" required />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" name="password" required />
          </div>
          <div>
            <Label>Cabang</Label>
            <select
              name="branchId"
              required
              className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 text-sm"
            >
              <option value="">Pilih</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-4">
            <SubmitButton>Buat Akun Worker</SubmitButton>
          </div>
        </form>
      </Card>

      <Card className="animate-fade-in">
        <div className="overflow-auto rounded-xl border border-[var(--border)]">
          <Table>
            <THead>
              <TR>
                <TH>Nama</TH>
                <TH>Email</TH>
                <TH>Cabang</TH>
                <TH>Status</TH>
                <TH>Aksi</TH>
              </TR>
            </THead>
            <TBody>
              {workers.map((row) => (
                <TR key={row.id}>
                  <TD>{row.user.fullName}</TD>
                  <TD>{row.user.email}</TD>
                  <TD>{row.branch.name}</TD>
                  <TD>{row.user.isActive ? "Aktif" : "Nonaktif"}</TD>
                  <TD>
                    <form action={deleteWorkerAction}>
                      <input type="hidden" name="workerId" value={row.userId} />
                      <SubmitButton variant="danger" size="sm" loadingText="Menghapus...">
                        Hapus Akun
                      </SubmitButton>
                    </form>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Jika worker sudah punya transaksi, akun akan dinonaktifkan agar histori penjualan tetap utuh.
        </p>
      </Card>
    </div>
  );
}
