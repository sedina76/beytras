import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { invoiceId, amount, method, reference, notes } = await req.json();
  if (!invoiceId || !amount || !method) {
    return NextResponse.json({ error: "invoiceId, amount and method are required" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.organizationId !== session.organizationId) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const payAmount = Number(amount);
  if (payAmount <= 0) return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });

  const newPaid = invoice.paidAmount + payAmount;
  const newStatus = newPaid >= invoice.totalAmount ? "paid" : invoice.status === "draft" ? "sent" : invoice.status;

  const [payment] = await prisma.$transaction([
    prisma.payment.create({
      data: {
        organizationId: session.organizationId,
        invoiceId,
        amount: payAmount,
        method,
        reference: reference || null,
        notes: notes || null,
      },
    }),
    prisma.invoice.update({
      where: { id: invoiceId },
      data: { paidAmount: newPaid, status: newStatus },
    }),
    prisma.customer.update({
      where: { id: invoice.customerId },
      data: { balance: { decrement: payAmount } },
    }),
  ]);

  return NextResponse.json(payment, { status: 201 });
}
