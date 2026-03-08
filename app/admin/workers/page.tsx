import { createWorkerAction } from "@/lib/actions/admin";
import { requireOwner } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

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
      <h1 className="text-2xl font-semibold">Worker</h1>
      <Card>
        <h2 className="font-semibold">Tambah Worker</h2>
        <form action={createWorkerAction} className="mt-4 grid gap-3 md:grid-cols-4">
          <div><Label>Nama</Label><Input name="fullName" required /></div>
          <div><Label>Email</Label><Input type="email" name="email" required /></div>
          <div><Label>Password</Label><Input type="password" name="password" required /></div>
          <div>
            <Label>Cabang</Label>
            <select name="branchId" required className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
              <option value="">Pilih</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-4"><Button type="submit">Simpan</Button></div>
        </form>
      </Card>
      <Card>
        <Table>
          <THead><TR><TH>Nama</TH><TH>Email</TH><TH>Cabang</TH></TR></THead>
          <TBody>
            {workers.map((row) => (
              <TR key={row.id}><TD>{row.user.fullName}</TD><TD>{row.user.email}</TD><TD>{row.branch.name}</TD></TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
