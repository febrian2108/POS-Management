import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

const runtimeUrl = process.env.DATABASE_URL;

if (!runtimeUrl) {
  throw new Error("DATABASE_URL harus di-set.");
}

const adapter = new PrismaPg({ connectionString: runtimeUrl });

export const prisma = global.prismaGlobal ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}
