import { createBranchAction } from "@/lib/actions/admin";
import { requireOwner } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export default async function BranchesPage() {
  const owner = await requireOwner();
  const branches = await prisma.branch.findMany({
    where: { ownerId: owner.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Cabang</h1>
      <Card>
        <h2 className="font-semibold">Tambah Cabang</h2>
        <form action={createBranchAction} className="mt-4 grid gap-3 md:grid-cols-4">
          <div><Label>Nama</Label><Input name="name" required /></div>
          <div><Label>Kode</Label><Input name="code" required /></div>
          <div className="md:col-span-2"><Label>Alamat</Label><Input name="address" /></div>
          <div className="md:col-span-4"><Button type="submit">Simpan</Button></div>
        </form>
      </Card>

      <Card>
        <Table>
          <THead><TR><TH>Nama</TH><TH>Kode</TH><TH>Alamat</TH></TR></THead>
          <TBody>
            {branches.map((row) => (
              <TR key={row.id}><TD>{row.name}</TD><TD>{row.code}</TD><TD>{row.address || "-"}</TD></TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
