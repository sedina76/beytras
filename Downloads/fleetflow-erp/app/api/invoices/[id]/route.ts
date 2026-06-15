import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await requireAuth();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true, address: true } },
      order: { select: { orderNumber: true, productType: true, quantityOrdered: true, unit: true, deliveryAddress: true } },
      payments: { orderBy: { paidAt: "asc" } },
    },
  });

  if (!invoice || invoice.organizationId !== session.organizationId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(invoice);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requireAuth();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice || invoice.organizationId !== session.organizationId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(updated);
}
