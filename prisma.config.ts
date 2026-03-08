import "dotenv/config";

import { defineConfig } from "prisma/config";

const migrateUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!migrateUrl) {
  throw new Error("DATABASE_URL atau DIRECT_URL harus di-set di .env.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    url: migrateUrl
  }
});
