import { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { getSupabaseAdminClient } from "../lib/supabase/admin";

const supabaseAdmin = getSupabaseAdminClient();

async function ensureAuthUser(email: string, password: string, fullName: string, role: "OWNER" | "WORKER") {
  const existing = await supabaseAdmin.auth.admin.listUsers();
  const found = existing.data.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());

  if (found) {
    await supabaseAdmin.auth.admin.updateUserById(found.id, {
      password,
      app_metadata: { role },
      user_metadata: { fullName }
    });
    return found.id;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
    user_metadata: { fullName }
  });

  if (error || !data.user) {
    throw new Error(error?.message || `Gagal membuat auth user: ${email}`);
  }

  return data.user.id;
}

async function main() {
  const ownerEmail = process.env.SEED_OWNER_EMAIL ?? "owner@tokokelontong.com";
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? "Owner123!";
  const ownerName = process.env.SEED_OWNER_NAME ?? "Owner Utama";

  const ownerId = await ensureAuthUser(ownerEmail, ownerPassword, ownerName, "OWNER");

  await prisma.user.upsert({
    where: { id: ownerId },
    update: { email: ownerEmail, fullName: ownerName, role: "OWNER", isActive: true },
    create: { id: ownerId, email: ownerEmail, fullName: ownerName, role: "OWNER", isActive: true }
  });

  const branchA = await prisma.branch.upsert({
    where: { code: "CBG-01" },
    update: { name: "Cabang Pusat", ownerId },
    create: { ownerId, name: "Cabang Pusat", code: "CBG-01", address: "Jl. Melati No. 1" }
  });

  const branchB = await prisma.branch.upsert({
    where: { code: "CBG-02" },
    update: { name: "Cabang Timur", ownerId },
    create: { ownerId, name: "Cabang Timur", code: "CBG-02", address: "Jl. Kenanga No. 7" }
  });

  const categoryMinuman = await prisma.category.upsert({
    where: { ownerId_name: { ownerId, name: "Minuman" } },
    update: {},
    create: { ownerId, name: "Minuman", description: "Minuman kemasan" }
  });

  const categorySembako = await prisma.category.upsert({
    where: { ownerId_name: { ownerId, name: "Sembako" } },
    update: {},
    create: { ownerId, name: "Sembako", description: "Kebutuhan pokok" }
  });

  const productA = await prisma.product.upsert({
    where: { ownerId_sku: { ownerId, sku: "SKU-AIR-600" } },
    update: {},
    create: {
      ownerId,
      name: "Air Mineral 600ml",
      sku: "SKU-AIR-600",
      categoryId: categoryMinuman.id,
      sellingPrice: new Prisma.Decimal(4000),
      purchasePrice: new Prisma.Decimal(2500),
      isActive: true
    }
  });

  const productB = await prisma.product.upsert({
    where: { ownerId_sku: { ownerId, sku: "SKU-GULA-1KG" } },
    update: {},
    create: {
      ownerId,
      name: "Gula Pasir 1kg",
      sku: "SKU-GULA-1KG",
      categoryId: categorySembako.id,
      sellingPrice: new Prisma.Decimal(18000),
      purchasePrice: new Prisma.Decimal(15000),
      isActive: true
    }
  });

  await prisma.branchStock.upsert({
    where: { branchId_productId: { branchId: branchA.id, productId: productA.id } },
    update: { stockQty: 100, minStock: 20 },
    create: { branchId: branchA.id, productId: productA.id, stockQty: 100, minStock: 20 }
  });

  await prisma.branchStock.upsert({
    where: { branchId_productId: { branchId: branchA.id, productId: productB.id } },
    update: { stockQty: 50, minStock: 10 },
    create: { branchId: branchA.id, productId: productB.id, stockQty: 50, minStock: 10 }
  });

  await prisma.branchStock.upsert({
    where: { branchId_productId: { branchId: branchB.id, productId: productA.id } },
    update: { stockQty: 60, minStock: 15 },
    create: { branchId: branchB.id, productId: productA.id, stockQty: 60, minStock: 15 }
  });

  const worker1Id = await ensureAuthUser("worker1@tokokelontong.com", "Worker123!", "Worker Satu", "WORKER");
  const worker2Id = await ensureAuthUser("worker2@tokokelontong.com", "Worker123!", "Worker Dua", "WORKER");

  await prisma.user.upsert({
    where: { id: worker1Id },
    update: { email: "worker1@tokokelontong.com", fullName: "Worker Satu", role: "WORKER", isActive: true },
    create: { id: worker1Id, email: "worker1@tokokelontong.com", fullName: "Worker Satu", role: "WORKER", isActive: true }
  });

  await prisma.user.upsert({
    where: { id: worker2Id },
    update: { email: "worker2@tokokelontong.com", fullName: "Worker Dua", role: "WORKER", isActive: true },
    create: { id: worker2Id, email: "worker2@tokokelontong.com", fullName: "Worker Dua", role: "WORKER", isActive: true }
  });

  await prisma.workerProfile.upsert({
    where: { userId: worker1Id },
    update: { branchId: branchA.id },
    create: { userId: worker1Id, branchId: branchA.id }
  });

  await prisma.workerProfile.upsert({
    where: { userId: worker2Id },
    update: { branchId: branchB.id },
    create: { userId: worker2Id, branchId: branchB.id }
  });

  const existingSale = await prisma.sale.findFirst({ where: { workerId: worker1Id } });

  if (!existingSale) {
    const sale = await prisma.sale.create({
      data: {
        ownerId,
        branchId: branchA.id,
        workerId: worker1Id,
        totalAmount: new Prisma.Decimal(26000),
        paidAmount: new Prisma.Decimal(30000),
        changeAmount: new Prisma.Decimal(4000)
      }
    });

    await prisma.saleItem.createMany({
      data: [
        {
          saleId: sale.id,
          productId: productA.id,
          qty: 2,
          sellingPrice: new Prisma.Decimal(4000),
          subtotal: new Prisma.Decimal(8000)
        },
        {
          saleId: sale.id,
          productId: productB.id,
          qty: 1,
          sellingPrice: new Prisma.Decimal(18000),
          subtotal: new Prisma.Decimal(18000)
        }
      ]
    });

    await prisma.branchStock.update({
      where: { branchId_productId: { branchId: branchA.id, productId: productA.id } },
      data: { stockQty: { decrement: 2 } }
    });

    await prisma.branchStock.update({
      where: { branchId_productId: { branchId: branchA.id, productId: productB.id } },
      data: { stockQty: { decrement: 1 } }
    });
  }

  console.log("Seed selesai.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
