import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "super_admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscription: { include: { plan: true } },
      _count: { select: { users: true, vehicles: true, drivers: true, orders: true } },
    },
  });

  return NextResponse.json(orgs);
}
