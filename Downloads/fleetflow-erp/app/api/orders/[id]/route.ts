import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { generateInvoiceForOrder } from "@/lib/invoice";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, organizationId: session.organizationId },
    include: { customer: true, dispatchJob: { include: { driver: true, vehicle: true, proofOfDelivery: true } }, invoice: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.order.findFirst({ where: { id, organizationId: session.organizationId } });
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const body = await req.json();

  const ALLOWED_STATUSES = ["pending", "confirmed", "dispatched", "in_progress", "delivered", "cancelled"];
  const ALLOWED_PRIORITIES = ["low", "normal", "high", "urgent"];

  const data: Record<string, unknown> = { updatedAt: new Date() };
  if (body.status !== undefined) {
    if (!ALLOWED_STATUSES.includes(body.status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    data.status = body.status;
  }
  if (body.priority !== undefined) {
    if (!ALLOWED_PRIORITIES.includes(body.priority)) return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    data.priority = body.priority;
  }
  if (body.productType !== undefined) data.productType = body.productType;
  if (body.type !== undefined) data.type = body.type;
  if (body.quantityOrdered !== undefined) data.quantityOrdered = Number(body.quantityOrdered);
  if (body.unit !== undefined) data.unit = body.unit;
  if (body.totalAmount !== undefined) data.totalAmount = Number(body.totalAmount);
  if (body.deliveryAddress !== undefined) data.deliveryAddress = body.deliveryAddress;
  if (body.scheduledAt !== undefined) data.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
  if (body.notes !== undefined) data.notes = body.notes;

  const order = await prisma.order.update({ where: { id }, data, include: { customer: { select: { name: true } } } });

  if (body.status === "delivered") {
    await generateInvoiceForOrder(id);
  }

  return NextResponse.json(order);
}
