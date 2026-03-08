"use server";

import { revalidatePath } from "next/cache";

import { requireOwner } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  branchSchema,
  branchUpdateSchema,
  categorySchema,
  idSchema,
  productSchema,
  productUpdateSchema,
  stockBulkSchema,
  stockSchema,
  stockUpdateSchema,
  workerSchema,
  workerStatusSchema
} from "@/lib/validators/master";

function textOrNull(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function createBranchAction(formData: FormData): Promise<void> {
  const owner = await requireOwner();
  const parsed = branchSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    address: formData.get("address")
  });

  if (!parsed.success) return;

  await prisma.branch.create({
    data: {
      name: parsed.data.name,
      code: parsed.data.code,
      address: textOrNull(parsed.data.address ?? null),
      ownerId: owner.id
    }
  });

  revalidatePath("/admin/branches");
  revalidatePath("/admin/dashboard");
}

export async function updateBranchAction(formData: FormData): Promise<void> {
  const owner = await requireOwner();
  const parsed = branchUpdateSchema.safeParse({
    branchId: formData.get("branchId"),
    name: formData.get("name"),
    code: formData.get("code"),
    address: formData.get("address")
  });

  if (!parsed.success) return;

  const branch = await prisma.branch.findFirst({
    where: {
      id: parsed.data.branchId,
      ownerId: owner.id
    }
  });

  if (!branch) return;

  await prisma.branch.update({
    where: { id: parsed.data.branchId },
    data: {
      name: parsed.data.name,
      code: parsed.data.code,
      address: textOrNull(parsed.data.address ?? null)
    }
  });

  revalidatePath("/admin/branches");
  revalidatePath("/admin/dashboard");
}

export async function deleteBranchAction(formData: FormData): Promise<void> {
  const owner = await requireOwner();
  const parsed = idSchema.safeParse({
    id: formData.get("branchId")
  });

  if (!parsed.success) return;

  const branch = await prisma.branch.findFirst({
    where: {
      id: parsed.data.id,
      ownerId: owner.id
    }
  });

  if (!branch) return;

  const [workerCount, salesCount] = await Promise.all([
    prisma.workerProfile.count({ where: { branchId: branch.id } }),
    prisma.sale.count({ where: { branchId: branch.id } })
  ]);

  if (workerCount > 0 || salesCount > 0) return;

  await prisma.branch.delete({
    where: { id: branch.id }
  });

  revalidatePath("/admin/branches");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/stocks");
}

export async function createCategoryAction(formData: FormData): Promise<void> {
  const owner = await requireOwner();
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description")
  });

  if (!parsed.success) return;

  await prisma.category.create({
    data: {
      ...parsed.data,
      ownerId: owner.id
    }
  });

  revalidatePath("/admin/categories");
}

export async function createProductAction(formData: FormData): Promise<void> {
  const owner = await requireOwner();
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    barcode: formData.get("barcode"),
    categoryId: formData.get("categoryId"),
    sellingPrice: formData.get("sellingPrice"),
    purchasePrice: formData.get("purchasePrice"),
    isActive: formData.get("isActive") === "on"
  });

  if (!parsed.success) return;

  await prisma.product.create({
    data: {
      ...parsed.data,
      ownerId: owner.id,
      barcode: textOrNull(parsed.data.barcode ?? null)
    }
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/dashboard");
}

export async function updateProductAction(formData: FormData): Promise<void> {
  const owner = await requireOwner();
  const parsed = productUpdateSchema.safeParse({
    productId: formData.get("productId"),
    name: formData.get("name"),
    sku: formData.get("sku"),
    barcode: formData.get("barcode"),
    categoryId: formData.get("categoryId"),
    sellingPrice: formData.get("sellingPrice"),
    purchasePrice: formData.get("purchasePrice"),
    isActive: formData.get("isActive") === "on"
  });

  if (!parsed.success) return;

  const product = await prisma.product.findFirst({
    where: {
      id: parsed.data.productId,
      ownerId: owner.id
    }
  });

  if (!product) return;

  await prisma.product.update({
    where: { id: product.id },
    data: {
      name: parsed.data.name,
      sku: parsed.data.sku,
      barcode: textOrNull(parsed.data.barcode ?? null),
      categoryId: parsed.data.categoryId,
      sellingPrice: parsed.data.sellingPrice,
      purchasePrice: parsed.data.purchasePrice,
      isActive: parsed.data.isActive
    }
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/dashboard");
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const owner = await requireOwner();
  const parsed = idSchema.safeParse({
    id: formData.get("productId")
  });

  if (!parsed.success) return;

  const product = await prisma.product.findFirst({
    where: {
      id: parsed.data.id,
      ownerId: owner.id
    }
  });

  if (!product) return;

  const saleItemCount = await prisma.saleItem.count({
    where: { productId: product.id }
  });

  if (saleItemCount > 0) return;

  await prisma.product.delete({
    where: { id: product.id }
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/stocks");
  revalidatePath("/admin/dashboard");
}

export async function upsertStockAction(formData: FormData): Promise<void> {
  const owner = await requireOwner();

  const parsed = stockSchema.safeParse({
    branchId: formData.get("branchId"),
    productId: formData.get("productId"),
    stockQty: formData.get("stockQty"),
    minStock: formData.get("minStock")
  });

  if (!parsed.success) return;

  const [branch, product] = await Promise.all([
    prisma.branch.findFirst({
      where: {
        id: parsed.data.branchId,
        ownerId: owner.id
      }
    }),
    prisma.product.findFirst({
      where: {
        id: parsed.data.productId,
        ownerId: owner.id
      }
    })
  ]);

  if (!branch || !product) return;

  await prisma.branchStock.upsert({
    where: {
      branchId_productId: {
        branchId: parsed.data.branchId,
        productId: parsed.data.productId
      }
    },
    create: parsed.data,
    update: {
      stockQty: parsed.data.stockQty,
      minStock: parsed.data.minStock
    }
  });

  revalidatePath("/admin/stocks");
  revalidatePath("/admin/dashboard");
}

export async function upsertStockBulkAction(formData: FormData): Promise<void> {
  const owner = await requireOwner();

  const branchIds = formData
    .getAll("branchIds")
    .map((item) => String(item))
    .filter(Boolean);

  const parsed = stockBulkSchema.safeParse({
    branchIds,
    productId: formData.get("productId"),
    stockQty: formData.get("stockQty"),
    minStock: formData.get("minStock")
  });

  if (!parsed.success) return;

  const [branches, product] = await Promise.all([
    prisma.branch.findMany({
      where: {
        id: { in: parsed.data.branchIds },
        ownerId: owner.id
      },
      select: { id: true }
    }),
    prisma.product.findFirst({
      where: {
        id: parsed.data.productId,
        ownerId: owner.id
      }
    })
  ]);

  if (!product || branches.length !== parsed.data.branchIds.length) return;

  await prisma.$transaction(
    branches.map((branch) =>
      prisma.branchStock.upsert({
        where: {
          branchId_productId: {
            branchId: branch.id,
            productId: parsed.data.productId
          }
        },
        create: {
          branchId: branch.id,
          productId: parsed.data.productId,
          stockQty: parsed.data.stockQty,
          minStock: parsed.data.minStock
        },
        update: {
          stockQty: parsed.data.stockQty,
          minStock: parsed.data.minStock
        }
      })
    )
  );

  revalidatePath("/admin/stocks");
  revalidatePath("/admin/dashboard");
}

export async function updateStockAction(formData: FormData): Promise<void> {
  const owner = await requireOwner();
  const parsed = stockUpdateSchema.safeParse({
    stockId: formData.get("stockId"),
    stockQty: formData.get("stockQty"),
    minStock: formData.get("minStock")
  });

  if (!parsed.success) return;

  const stock = await prisma.branchStock.findFirst({
    where: {
      id: parsed.data.stockId,
      branch: { ownerId: owner.id }
    }
  });

  if (!stock) return;

  await prisma.branchStock.update({
    where: { id: stock.id },
    data: {
      stockQty: parsed.data.stockQty,
      minStock: parsed.data.minStock
    }
  });

  revalidatePath("/admin/stocks");
  revalidatePath("/admin/dashboard");
}

export async function deleteStockAction(formData: FormData): Promise<void> {
  const owner = await requireOwner();
  const parsed = idSchema.safeParse({
    id: formData.get("stockId")
  });

  if (!parsed.success) return;

  const stock = await prisma.branchStock.findFirst({
    where: {
      id: parsed.data.id,
      branch: { ownerId: owner.id }
    }
  });

  if (!stock) return;

  await prisma.branchStock.delete({ where: { id: stock.id } });

  revalidatePath("/admin/stocks");
  revalidatePath("/admin/dashboard");
}

export async function createWorkerAction(formData: FormData): Promise<void> {
  const owner = await requireOwner();

  const parsed = workerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    branchId: formData.get("branchId")
  });

  if (!parsed.success) return;

  const branch = await prisma.branch.findFirst({
    where: {
      id: parsed.data.branchId,
      ownerId: owner.id
    }
  });

  if (!branch) return;

  const supabaseAdmin = getSupabaseAdminClient();
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    app_metadata: { role: "WORKER" },
    user_metadata: { fullName: parsed.data.fullName }
  });

  if (authError || !authUser.user) return;

  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        id: authUser.user.id,
        email: parsed.data.email,
        fullName: parsed.data.fullName,
        role: "WORKER"
      }
    });

    await tx.workerProfile.create({
      data: {
        userId: authUser.user.id,
        branchId: parsed.data.branchId
      }
    });
  });

  revalidatePath("/admin/workers");
  revalidatePath("/admin/dashboard");
}

export async function deleteWorkerAction(formData: FormData): Promise<void> {
  const owner = await requireOwner();
  const parsed = idSchema.safeParse({
    id: formData.get("workerId")
  });

  if (!parsed.success) return;

  const workerProfile = await prisma.workerProfile.findFirst({
    where: {
      userId: parsed.data.id,
      branch: { ownerId: owner.id }
    },
    include: { user: true }
  });

  if (!workerProfile) return;

  const salesCount = await prisma.sale.count({
    where: {
      workerId: workerProfile.userId
    }
  });

  if (salesCount > 0) {
    await prisma.$transaction(async (tx) => {
      await tx.workerProfile.deleteMany({ where: { userId: workerProfile.userId } });
      await tx.user.update({
        where: { id: workerProfile.userId },
        data: { isActive: false }
      });
    });
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.workerProfile.deleteMany({ where: { userId: workerProfile.userId } });
      await tx.user.delete({ where: { id: workerProfile.userId } });
    });
  }

  const supabaseAdmin = getSupabaseAdminClient();
  await supabaseAdmin.auth.admin.deleteUser(workerProfile.userId);

  revalidatePath("/admin/workers");
  revalidatePath("/admin/dashboard");
}

export async function toggleWorkerStatusAction(formData: FormData): Promise<void> {
  const owner = await requireOwner();
  const parsed = workerStatusSchema.safeParse({
    workerId: formData.get("workerId"),
    isActive: formData.get("isActive")
  });

  if (!parsed.success) return;

  const workerProfile = await prisma.workerProfile.findFirst({
    where: {
      userId: parsed.data.workerId,
      branch: { ownerId: owner.id }
    }
  });

  if (!workerProfile) return;

  await prisma.user.update({
    where: { id: workerProfile.userId },
    data: { isActive: parsed.data.isActive }
  });

  revalidatePath("/admin/workers");
  revalidatePath("/admin/dashboard");
}
