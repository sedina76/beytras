import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [drivers, users] = await Promise.all([
    prisma.driver.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { name: "asc" },
      take: 500,
    }),
    prisma.user.findMany({
      where: { organizationId: session.organizationId, isActive: true },
      orderBy: { name: "asc" },
      take: 500,
      select: { id: true, name: true, email: true, role: true, lastLoginAt: true, isActive: true, monthlySalary: true, avatarUrl: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({ users, drivers });
}
