import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = session.organizationId;

  const pendingOrders = await prisma.order.count({
    where: { organizationId: orgId, status: { in: ["pending", "confirmed"] } },
  });

  const dispatchRecords = await prisma.dispatchJob.count({
    where: { organizationId: orgId },
  });

  const unassignedDispatch = await prisma.dispatchJob.count({
    where: { organizationId: orgId, status: "unassigned" },
  });

  // Count pending orders with no dispatch record using JS (avoids Prisma relation filter)
  const pendingIds = (await prisma.order.findMany({
    where: { organizationId: orgId, status: { in: ["pending", "confirmed"] } },
    select: { id: true },
  })).map(o => o.id);

  const coveredIds = new Set((await prisma.dispatchJob.findMany({
    where: { orderId: { in: pendingIds } },
    select: { orderId: true },
  })).map(j => j.orderId));

  const missingCount = pendingIds.filter(id => !coveredIds.has(id)).length;

  return NextResponse.json({ pendingOrders, dispatchRecords, unassignedDispatch, missingCount });
}

export async function POST(_req: NextRequest) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = session.organizationId;

  const pendingIds = (await prisma.order.findMany({
    where: { organizationId: orgId, status: { in: ["pending", "confirmed"] } },
    select: { id: true },
  })).map(o => o.id);

  const coveredIds = new Set((await prisma.dispatchJob.findMany({
    where: { orderId: { in: pendingIds } },
    select: { orderId: true },
  })).map(j => j.orderId));

  const missingIds = pendingIds.filter(id => !coveredIds.has(id));

  if (missingIds.length > 0) {
    await prisma.$transaction(
      missingIds.map(id => prisma.dispatchJob.create({
        data: { organizationId: orgId, orderId: id, status: "unassigned" },
      }))
    );
  }

  return NextResponse.json({ created: missingIds.length });
}
