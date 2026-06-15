import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const customer = await prisma.customer.findFirst({
    where: { id, organizationId: session.organizationId },
    include: {
      orders: {
        orderBy: { createdAt: "desc" }, take: 10,
        include: { dispatchJob: { include: { driver: { select: { name: true } } } } },
      },
      invoices: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const customer = await prisma.customer.updateMany({
    where: { id, organizationId: session.organizationId },
    data: { ...body, updatedAt: new Date() },
  });
  return NextResponse.json(customer);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.customer.updateMany({ where: { id, organizationId: session.organizationId }, data: { status: "inactive" } });
  return NextResponse.json({ ok: true });
}
