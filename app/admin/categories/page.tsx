import { createCategoryAction } from "@/lib/actions/admin";
import { requireOwner } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export default async function CategoriesPage() {
  const owner = await requireOwner();
  const categories = await prisma.category.findMany({
    where: { ownerId: owner.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Kategori</h1>
      <Card>
        <h2 className="font-semibold">Tambah Kategori</h2>
        <form action={createCategoryAction} className="mt-4 grid gap-3 md:grid-cols-3">
          <div><Label>Nama</Label><Input name="name" required /></div>
          <div className="md:col-span-2"><Label>Deskripsi</Label><Input name="description" /></div>
          <div className="md:col-span-3"><Button type="submit">Simpan</Button></div>
        </form>
      </Card>

      <Card>
        <Table>
          <THead><TR><TH>Nama</TH><TH>Deskripsi</TH></TR></THead>
          <TBody>
            {categories.map((row) => (
              <TR key={row.id}><TD>{row.name}</TD><TD>{row.description || "-"}</TD></TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
