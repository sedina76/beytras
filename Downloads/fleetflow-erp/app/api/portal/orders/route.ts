import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

async function getPortalCustomer(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session?.email || !session.organizationId || session.role !== "customer_portal_user") return null;
  const email: string = session.email;
  const organizationId: string = session.organizationId;
  return prisma.customerPortalAccount.findFirst({
    where: { email, organizationId },
    select: { customerId: true, organizationId: true },
  });
}

export async function GET() {
  const session = await getSession();
  const account = await getPortalCustomer(session);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { customerId: account.customerId, organizationId: account.organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      dispatchJob: {
        select: {
          status: true,
          driver: { select: { name: true, phone: true } },
          vehicle: { select: { plateNumber: true } },
          completedAt: true,
        },
      },
    },
  });

  return NextResponse.json(orders);
}

// Order creation via the customer portal is disabled.
// Orders must be created by admin or dispatcher from the internal ERP.
export async function POST() {
  return NextResponse.json(
    { error: "Order creation is not available via the customer portal. Please contact our office to create a new transport order." },
    { status: 403 }
  );
}
