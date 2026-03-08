"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireOwner } from "@/lib/auth/session";
import {
  branchSchema,
  categorySchema,
  productSchema,
  stockSchema,
  workerSchema
} from "@/lib/validators/master";

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
      ...parsed.data,
      ownerId: owner.id
    }
  });

  revalidatePath("/admin/branches");
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

  if (parsed.data.sellingPrice < 0 || parsed.data.purchasePrice < 0) return;

  await prisma.product.create({
    data: {
      ...parsed.data,
      ownerId: owner.id
    }
  });

  revalidatePath("/admin/products");
}

export async function upsertStockAction(formData: FormData): Promise<void> {
  await requireOwner();

  const parsed = stockSchema.safeParse({
    branchId: formData.get("branchId"),
    productId: formData.get("productId"),
    stockQty: formData.get("stockQty"),
    minStock: formData.get("minStock")
  });

  if (!parsed.success) return;

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
}

export async function createWorkerAction(formData: FormData): Promise<void> {
  await requireOwner();

  const parsed = workerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    branchId: formData.get("branchId")
  });

  if (!parsed.success) return;

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
}
