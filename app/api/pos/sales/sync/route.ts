import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { createSaleForWorker } from "@/lib/services/sale";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (
      !currentUser ||
      !currentUser.isActive ||
      currentUser.role !== "WORKER" ||
      !currentUser.workerProfile
    ) {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya worker aktif yang dapat sinkronisasi transaksi." },
        { status: 401 }
      );
    }

    const payload = await request.json();

    const result = await createSaleForWorker(
      {
        workerId: currentUser.id,
        workerName: currentUser.fullName,
        assignedBranchId: currentUser.workerProfile.branchId,
        ownerId: currentUser.workerProfile.branch.ownerId
      },
      payload
    );

    if ("error" in result) {
      return NextResponse.json(result, { status: 400 });
    }

    revalidatePath("/pos");
    revalidatePath("/pos/history");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/sales");
    revalidatePath("/admin/stocks");

    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Sinkronisasi transaksi offline gagal. Coba lagi saat jaringan stabil." },
      { status: 500 }
    );
  }
}
