"use server";

import { revalidatePath } from "next/cache";

import { requireWorker } from "@/lib/auth/session";
import { createSaleForWorker } from "@/lib/services/sale";

export async function createSaleAction(payload: unknown) {
  const worker = await requireWorker();
  if (!worker.workerProfile) {
    return { error: "Worker hanya boleh transaksi di cabang assignment." };
  }

  const result = await createSaleForWorker(
    {
      workerId: worker.id,
      workerName: worker.fullName,
      assignedBranchId: worker.workerProfile.branchId,
      ownerId: worker.workerProfile.branch.ownerId
    },
    payload
  );

  if ("error" in result) return result;

  revalidatePath("/pos");
  revalidatePath("/pos/history");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/sales");
  revalidatePath("/admin/stocks");

  return result;
}
