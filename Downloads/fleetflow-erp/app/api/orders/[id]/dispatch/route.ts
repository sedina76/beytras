import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, organizationId: session.organizationId },
    include: { dispatchJob: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (["cancelled", "delivered"].includes(order.status))
    return NextResponse.json({ error: "Cannot create dispatch job for a cancelled or delivered order" }, { status: 400 });
  if (order.dispatchJob)
    return NextResponse.json({ error: "Dispatch job already exists", jobId: order.dispatchJob.id }, { status: 409 });

  const job = await prisma.dispatchJob.create({
    data: { organizationId: session.organizationId, orderId: order.id, status: "unassigned" },
  });

  return NextResponse.json(job, { status: 201 });
}
