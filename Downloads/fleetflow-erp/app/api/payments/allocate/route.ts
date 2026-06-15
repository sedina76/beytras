import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// GET /api/payments/allocate?customerId=xxx
// Returns outstanding invoices for a customer with suggested FIFO allocation
export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customerId = new URL(req.url).searchParams.get("customerId");
  if (!customerId) return NextResponse.json({ error: "customerId required" }, { status: 400 });

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId: session.organizationId,
      customerId,
      status: { in: ["sent", "overdue", "draft"] },
    },
    orderBy: { dueDate: "asc" },
    select: {
      id: true, invoiceNumber: true, totalAmount: true, paidAmount: true,
      dueDate: true, status: true,
      order: { select: { orderNumber: true } },
    },
  });

  return NextResponse.json(
    invoices.map(inv => ({
      ...inv,
      balance: parseFloat((inv.totalAmount - inv.paidAmount).toFixed(2)),
    }))
  );
}

// POST /api/payments/allocate
// Body: { customerId, method, reference, notes, allocations: [{ invoiceId, amount }] }
export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { customerId, method, reference, notes, allocations } = await req.json();
  if (!customerId || !method || !Array.isArray(allocations) || allocations.length === 0) {
    return NextResponse.json({ error: "customerId, method and allocations are required" }, { status: 400 });
  }

  const validAllocations = (allocations as { invoiceId: string; amount: number }[])
    .filter(a => a.amount > 0);

  if (validAllocations.length === 0) {
    return NextResponse.json({ error: "No amounts entered" }, { status: 400 });
  }

  const totalAllocated = validAllocations.reduce((s, a) => s + a.amount, 0);

  // Verify all invoices belong to this org + customer
  const invoices = await prisma.invoice.findMany({
    where: { id: { in: validAllocations.map(a => a.invoiceId) }, organizationId: session.organizationId, customerId },
  });
  if (invoices.length !== validAllocations.length) {
    return NextResponse.json({ error: "One or more invoices not found" }, { status: 404 });
  }

  await prisma.$transaction([
    ...validAllocations.map(({ invoiceId, amount }) => {
      const inv = invoices.find(i => i.id === invoiceId)!;
      const newPaid = parseFloat((inv.paidAmount + amount).toFixed(2));
      const newStatus = newPaid >= inv.totalAmount ? "paid" : inv.status;
      return prisma.payment.create({
        data: {
          organizationId: session.organizationId!,
          invoiceId,
          amount,
          method,
          reference: reference || null,
          notes: notes || null,
        },
      });
    }),
    ...validAllocations.map(({ invoiceId, amount }) => {
      const inv = invoices.find(i => i.id === invoiceId)!;
      const newPaid = parseFloat((inv.paidAmount + amount).toFixed(2));
      const newStatus = newPaid >= inv.totalAmount ? "paid" : inv.status;
      return prisma.invoice.update({
        where: { id: invoiceId },
        data: { paidAmount: newPaid, status: newStatus },
      });
    }),
    prisma.customer.update({
      where: { id: customerId },
      data: { balance: { decrement: totalAllocated } },
    }),
  ]);

  return NextResponse.json({ ok: true, totalAllocated, count: validAllocations.length });
}
