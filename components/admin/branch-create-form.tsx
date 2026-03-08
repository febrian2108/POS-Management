"use client";

import { useMemo, useState } from "react";

import { createBranchAction } from "@/lib/actions/admin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

function generateBranchCode(name: string) {
  const cleaned = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return cleaned.length > 0 ? `CBG_${cleaned}` : "CBG_";
}

export function BranchCreateForm() {
  const [name, setName] = useState("");
  const autoCode = useMemo(() => generateBranchCode(name), [name]);

  return (
    <form action={createBranchAction} className="mt-4 grid gap-3 md:grid-cols-4">
      <div>
        <Label>Nama</Label>
        <Input name="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label>Kode (Otomatis)</Label>
        <Input value={autoCode} disabled />
        <input type="hidden" name="code" value={autoCode} />
      </div>
      <div className="md:col-span-2">
        <Label>Alamat</Label>
        <Input name="address" />
      </div>
      <div className="md:col-span-4">
        <SubmitButton>Simpan Cabang</SubmitButton>
      </div>
    </form>
  );
}
