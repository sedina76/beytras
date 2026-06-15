import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || !session.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = session.organizationId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalCustomers,
    totalVehicles,
    totalDrivers,
    activeOrders,
    todayOrders,
    monthOrders,
    pendingInvoices,
    recentOrders,
    driverStatuses,
    vehicleStatuses,
    recentJobs,
  ] = await Promise.all([
    prisma.customer.count({ where: { organizationId: orgId, status: "active" } }),
    prisma.vehicle.count({ where: { organizationId: orgId } }),
    prisma.driver.count({ where: { organizationId: orgId, status: { not: "suspended" } } }),
    prisma.order.count({ where: { organizationId: orgId, status: { in: ["pending", "confirmed", "dispatched", "in_progress"] } } }),
    prisma.order.count({ where: { organizationId: orgId, createdAt: { gte: today } } }),
    prisma.order.count({ where: { organizationId: orgId, createdAt: { gte: monthStart } } }),
    prisma.invoice.aggregate({ where: { organizationId: orgId, status: { in: ["sent", "overdue"] } }, _sum: { totalAmount: true } }),
    prisma.order.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { customer: { select: { name: true } }, dispatchJob: { include: { driver: { select: { name: true } } } } },
    }),
    prisma.driver.groupBy({ by: ["status"], where: { organizationId: orgId }, _count: true }),
    prisma.vehicle.groupBy({ by: ["status"], where: { organizationId: orgId }, _count: true }),
    prisma.dispatchJob.findMany({
      where: { organizationId: orgId, status: { in: ["assigned", "en_route_source", "loading", "en_route_customer"] } },
      take: 6,
      include: { driver: { select: { name: true, phone: true } }, vehicle: { select: { plateNumber: true } }, order: { include: { customer: { select: { name: true } } } } },
    }),
  ]);

  const monthRevenue = await prisma.payment.aggregate({
    where: { organizationId: orgId, paidAt: { gte: monthStart } },
    _sum: { amount: true },
  });

  return NextResponse.json({
    kpis: {
      totalCustomers,
      totalVehicles,
      totalDrivers,
      activeOrders,
      todayOrders,
      monthOrders,
      pendingInvoices: pendingInvoices._sum.totalAmount ?? 0,
      monthRevenue: monthRevenue._sum.amount ?? 0,
    },
    recentOrders,
    driverStatuses,
    vehicleStatuses,
    activeJobs: recentJobs,
  });
}
