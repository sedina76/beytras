import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") ?? 100)));

  const where = {
    organizationId: session.organizationId,
    ...(status ? { status } : {}),
  };

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      include: { customer: { select: { name: true } }, payments: true },
    }),
    prisma.invoice.count({ where }),
  ]);

  return NextResponse.json(invoices, {
    headers: { "X-Total-Count": String(total) },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { customerId, orderId, subtotal, dueDate, notes } = body;

  if (!customerId || !subtotal) return NextResponse.json({ error: "Customer and subtotal required" }, { status: 400 });

  const count = await prisma.invoice.count({ where: { organizationId: session.organizationId } });
  const invoiceNumber = `INV-${String(count + 1).padStart(5, "0")}`;
  const total = parseFloat(subtotal);

  const invoice = await prisma.invoice.create({
    data: {
      organizationId: session.organizationId,
      customerId, orderId: orderId || null,
      invoiceNumber, subtotal: parseFloat(subtotal),
      taxRate: 0,
      taxAmount: 0, totalAmount: total,
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: notes || null,
      status: "draft",
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
