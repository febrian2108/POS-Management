"use client";

import { useMemo, useState } from "react";

import { createProductAction } from "@/lib/actions/admin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

function generateSku(name: string) {
  const cleaned = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned.length > 0 ? `SKU-${cleaned}` : "SKU-";
}

type CategoryOption = {
  id: string;
  name: string;
};

export function ProductCreateForm({ categories }: { categories: CategoryOption[] }) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("SKU-");
  const suggestedSku = useMemo(() => generateSku(name), [name]);

  return (
    <form action={createProductAction} className="mt-4 grid gap-3 md:grid-cols-4">
      <div>
        <Label>Nama</Label>
        <Input
          name="name"
          value={name}
          onChange={(e) => {
            const nextName = e.target.value;
            setName(nextName);
            setSku(generateSku(nextName));
          }}
          required
        />
      </div>
      <div>
        <Label>SKU (Otomatis)</Label>
        <Input
          name="sku"
          value={sku}
          onChange={(e) => setSku(e.target.value.toUpperCase())}
          required
          title={`Saran otomatis: ${suggestedSku}`} disabled
        />
      </div>
      <div>
        <Label>Barcode</Label>
        <Input name="barcode" />
      </div>
      <div>
        <Label>Kategori</Label>
        <select
          name="categoryId"
          className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card-solid)] px-3 text-sm"
          required
        >
          <option value="">Pilih</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Harga Jual</Label>
        <Input type="number" name="sellingPrice" min={0} required />
      </div>
      <div>
        <Label>Harga Beli</Label>
        <Input type="number" name="purchasePrice" min={0} required />
      </div>
      <div className="flex items-end gap-2">
        <input type="checkbox" name="isActive" defaultChecked />
        <Label>Aktif</Label>
      </div>
      <div className="md:col-span-4">
        <SubmitButton>Simpan Produk</SubmitButton>
      </div>
    </form>
  );
}
