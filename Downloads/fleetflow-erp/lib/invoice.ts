import { prisma } from "@/lib/db";

// Creates an invoice for an order on delivery. Idempotent — skips if one already exists.
export async function generateInvoiceForOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { invoice: true, customer: true },
  });
  if (!order) return null;
  if (order.invoice) return order.invoice; // already generated

  const subtotal = order.totalAmount;
  const totalAmount = subtotal;

  const count = await prisma.invoice.count({ where: { organizationId: order.organizationId } });
  const invoiceNumber = `INV-${String(count + 1).padStart(5, "0")}`;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const invoice = await prisma.invoice.create({
    data: {
      organizationId: order.organizationId,
      customerId: order.customerId,
      orderId: order.id,
      invoiceNumber,
      status: "sent",
      subtotal,
      taxRate: 0,
      taxAmount: 0,
      totalAmount,
      paidAmount: 0,
      dueDate,
      notes: `Auto-generated on delivery of ${order.orderNumber}`,
    },
  });

  return invoice;
}
