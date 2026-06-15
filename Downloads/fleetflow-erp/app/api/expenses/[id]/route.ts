import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.expense.findFirst({ where: { id, organizationId: session.organizationId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.expense.findFirst({ where: { id, organizationId: session.organizationId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { category, description, amount, vendor, date, approvedBy } = await req.json();
  const expense = await prisma.expense.update({
    where: { id },
    data: {
      ...(category && { category }),
      ...(description && { description }),
      ...(amount !== undefined && { amount: parseFloat(amount) }),
      ...(vendor !== undefined && { vendor: vendor || null }),
      ...(date && { date: new Date(date) }),
      ...(approvedBy !== undefined && { approvedBy: approvedBy || null }),
    },
  });
  return NextResponse.json(expense);
}
