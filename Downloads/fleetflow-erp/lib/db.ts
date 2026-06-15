import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

function createPrismaClient() {
  const rawUrl = process.env.DATABASE_URL ?? `file:./prisma/dev.db`;
  // libsql needs an absolute path for local files
  const url = rawUrl.startsWith("file:./") || rawUrl.startsWith("file:../")
    ? `file:${path.resolve(process.cwd(), rawUrl.slice(5))}`
    : rawUrl;
  const adapter = new PrismaLibSql({ url });
  return new PrismaClient({ adapter });
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
