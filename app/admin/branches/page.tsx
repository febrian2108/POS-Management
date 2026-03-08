import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import {
  createBranchAction,
  deleteBranchAction,
  updateBranchAction
} from "@/lib/actions/admin";
import { requireOwner } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function BranchesPage() {
  const owner = await requireOwner();
  const branches = await prisma.branch.findMany({
    where: { ownerId: owner.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Cabang</h1>
        <p className="text-sm text-[var(--muted)]">Kelola struktur cabang toko beserta kode operasionalnya.</p>
      </div>

      <Card className="animate-fade-in">
        <h2 className="font-semibold">Tambah Cabang</h2>
        <form action={createBranchAction} className="mt-4 grid gap-3 md:grid-cols-4">
          <div>
            <Label>Nama</Label>
            <Input name="name" required />
          </div>
          <div>
            <Label>Kode</Label>
            <Input name="code" required />
          </div>
          <div className="md:col-span-2">
            <Label>Alamat</Label>
            <Input name="address" />
          </div>
          <div className="md:col-span-4">
            <SubmitButton>Simpan Cabang</SubmitButton>
          </div>
        </form>
      </Card>

      <Card className="animate-fade-in">
        <div className="overflow-auto rounded-xl border border-[var(--border)]">
          <Table>
            <THead>
              <TR>
                <TH>Nama</TH>
                <TH>Kode</TH>
                <TH>Alamat</TH>
                <TH>Aksi</TH>
              </TR>
            </THead>
            <TBody>
              {branches.map((row) => (
                <TR key={row.id}>
                  <TD>{row.name}</TD>
                  <TD>{row.code}</TD>
                  <TD>{row.address || "-"}</TD>
                  <TD>
                    <div className="flex flex-wrap items-center gap-2">
                      <details className="rounded-lg border border-[var(--border)] bg-[var(--card-solid)] p-2">
                        <summary className="cursor-pointer text-xs font-medium">Edit</summary>
                        <form action={updateBranchAction} className="mt-2 grid gap-2">
                          <input type="hidden" name="branchId" value={row.id} />
                          <Input name="name" defaultValue={row.name} required />
                          <Input name="code" defaultValue={row.code} required />
                          <Input name="address" defaultValue={row.address ?? ""} />
                          <SubmitButton size="sm" loadingText="Menyimpan...">
                            Simpan
                          </SubmitButton>
                        </form>
                      </details>

                      <form action={deleteBranchAction}>
                        <input type="hidden" name="branchId" value={row.id} />
                        <SubmitButton variant="danger" size="sm" loadingText="Menghapus...">
                          Hapus
                        </SubmitButton>
                      </form>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Cabang dengan data transaksi/worker aktif tidak dapat dihapus.
        </p>
      </Card>
    </div>
  );
}
