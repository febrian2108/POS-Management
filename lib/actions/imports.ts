"use server";

import { revalidatePath } from "next/cache";

import * as XLSX from "xlsx";

import { requireOwner } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type RawRow = Record<string, unknown>;

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function toText(value: unknown) {
  return String(value ?? "").trim();
}

function toNumber(value: unknown) {
  const numeric = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(numeric) ? numeric : NaN;
}

function toBoolean(value: unknown, fallback = true) {
  const normalized = toText(value).toLowerCase();
  if (["1", "true", "yes", "aktif"].includes(normalized)) return true;
  if (["0", "false", "no", "nonaktif"].includes(normalized)) return false;
  return fallback;
}

function createSlug(input: string) {
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createSkuFromName(name: string, seed: number) {
  const slug = createSlug(name);
  return `SKU-${slug || `AUTO-${seed}`}`;
}

async function readRowsFromFile(file: File): Promise<RawRow[]> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) return [];

  const sheet = workbook.Sheets[firstSheet];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: ""
  });

  return raw.map((row) => {
    const normalized: RawRow = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[normalizeHeader(key)] = value;
    }
    return normalized;
  });
}

export async function importProductsFromExcelAction(formData: FormData): Promise<void> {
  const owner = await requireOwner();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size <= 0) return;

  const rows = await readRowsFromFile(file);
  if (!rows.length) return;

  const [categories, existingProducts] = await Promise.all([
    prisma.category.findMany({
      where: { ownerId: owner.id },
      select: { id: true, name: true }
    }),
    prisma.product.findMany({
      where: { ownerId: owner.id },
      select: { id: true, sku: true }
    })
  ]);

  const categoryMap = new Map(categories.map((category) => [category.name.toLowerCase(), category.id]));
  const existingSkuMap = new Map(existingProducts.map((product) => [product.sku.toUpperCase(), product.id]));
  const usedSkus = new Set(existingProducts.map((product) => product.sku.toUpperCase()));

  async function ensureCategoryId(name: string) {
    const key = name.toLowerCase();
    const existing = categoryMap.get(key);
    if (existing) return existing;

    const created = await prisma.category.create({
      data: {
        ownerId: owner.id,
        name
      },
      select: { id: true, name: true }
    });

    categoryMap.set(created.name.toLowerCase(), created.id);
    return created.id;
  }

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const name = toText(row.name || row.product_name);
    if (!name) continue;

    const categoryName = toText(row.category_name || row.category || "Umum");
    const categoryId = await ensureCategoryId(categoryName || "Umum");

    let sku = toText(row.sku).toUpperCase();
    if (!sku) {
      sku = createSkuFromName(name, index + 1);
      let suffix = 1;
      while (usedSkus.has(sku)) {
        suffix += 1;
        sku = `${createSkuFromName(name, index + 1)}-${suffix}`;
      }
    }
    usedSkus.add(sku);

    const sellingPrice = toNumber(row.selling_price ?? row.sellingprice);
    const purchasePrice = toNumber(row.purchase_price ?? row.purchaseprice);

    if (!Number.isFinite(sellingPrice) || sellingPrice < 0) continue;
    if (!Number.isFinite(purchasePrice) || purchasePrice < 0) continue;

    const barcode = toText(row.barcode) || null;
    const isActive = toBoolean(row.is_active ?? row.active, true);

    await prisma.product.upsert({
      where: {
        ownerId_sku: {
          ownerId: owner.id,
          sku
        }
      },
      create: {
        ownerId: owner.id,
        name,
        sku,
        barcode,
        categoryId,
        sellingPrice,
        purchasePrice,
        isActive
      },
      update: {
        name,
        barcode,
        categoryId,
        sellingPrice,
        purchasePrice,
        isActive
      }
    });

    if (!existingSkuMap.has(sku)) {
      existingSkuMap.set(sku, "new");
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/stocks");
  revalidatePath("/admin/dashboard");
}

export async function importStocksFromExcelAction(formData: FormData): Promise<void> {
  const owner = await requireOwner();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size <= 0) return;

  const rows = await readRowsFromFile(file);
  if (!rows.length) return;

  const [branches, products] = await Promise.all([
    prisma.branch.findMany({
      where: { ownerId: owner.id },
      select: { id: true, code: true }
    }),
    prisma.product.findMany({
      where: { ownerId: owner.id },
      select: { id: true, sku: true }
    })
  ]);

  const branchByCode = new Map(branches.map((branch) => [branch.code.toUpperCase(), branch.id]));
  const productBySku = new Map(products.map((product) => [product.sku.toUpperCase(), product.id]));

  for (const row of rows) {
    const branchCode = toText(row.branch_code || row.branch).toUpperCase();
    const productSku = toText(row.product_sku || row.sku).toUpperCase();
    const stockQty = Math.max(0, Math.trunc(toNumber(row.stock_qty ?? row.stockqty)));
    const minStock = Math.max(0, Math.trunc(toNumber(row.min_stock ?? row.minstock)));

    const branchId = branchByCode.get(branchCode);
    const productId = productBySku.get(productSku);
    if (!branchId || !productId) continue;

    if (!Number.isFinite(stockQty) || !Number.isFinite(minStock)) continue;

    await prisma.branchStock.upsert({
      where: {
        branchId_productId: {
          branchId,
          productId
        }
      },
      create: {
        branchId,
        productId,
        stockQty,
        minStock
      },
      update: {
        stockQty,
        minStock
      }
    });
  }

  revalidatePath("/admin/stocks");
  revalidatePath("/admin/dashboard");
}
