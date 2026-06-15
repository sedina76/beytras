import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { reason } = await req.json();

  if (!reason?.trim() || reason.trim().length < 5) {
    return NextResponse.json({ error: "A cancellation reason of at least 5 characters is required" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({ where: { id, organizationId: session.organizationId } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status === "delivered") return NextResponse.json({ error: "Delivered orders cannot be cancelled" }, { status: 400 });
  if (order.status === "cancelled") return NextResponse.json({ error: "Order is already cancelled" }, { status: 400 });

  await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: {
        status: "cancelled",
        notes: order.notes
          ? `${order.notes}\n\nCANCELLED: ${reason.trim()}`
          : `CANCELLED: ${reason.trim()}`,
        updatedAt: new Date(),
      },
    }),
    prisma.auditLog.create({
      data: {
        organizationId: session.organizationId!,
        userId: session.userId,
        action: "status_changed",
        entityType: "order",
        metadata: JSON.stringify({
          orderId: id,
          orderNumber: order.orderNumber,
          from: order.status,
          to: "cancelled",
          reason: reason.trim(),
        }),
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
