import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") ?? 100)));

  const where = {
    organizationId: session.organizationId,
    ...(search ? { orderNumber: { contains: search } } : {}),
    ...(status ? { status } : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        customer: { select: { name: true, phone: true } },
        dispatchJob: { include: { driver: { select: { name: true } }, vehicle: { select: { plateNumber: true } } } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json(orders, {
    headers: { "X-Total-Count": String(total), "X-Page": String(page), "X-Limit": String(limit) },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { customerId, productType, quantityOrdered, unit, deliveryAddress, priority, notes, scheduledAt, totalAmount, waterSourceId } = body;

  if (!customerId || !quantityOrdered || !deliveryAddress) {
    return NextResponse.json({ error: "Customer, quantity and address required" }, { status: 400 });
  }

  const count = await prisma.order.count({ where: { organizationId: session.organizationId } });
  const orderNumber = `ORD-${String(count + 1).padStart(5, "0")}`;

  const order = await prisma.order.create({
    data: {
      organizationId: session.organizationId,
      customerId,
      orderNumber,
      productType: productType || "water",
      quantityOrdered: parseFloat(quantityOrdered),
      unit: unit || "litres",
      deliveryAddress,
      priority: priority || "normal",
      notes: notes || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      totalAmount: parseFloat(totalAmount) || 0,
      waterSourceId: waterSourceId || null,
      status: "pending",
    },
  });

  await prisma.dispatchJob.create({
    data: { organizationId: session.organizationId, orderId: order.id, status: "unassigned" },
  });

  return NextResponse.json(order, { status: 201 });
}
