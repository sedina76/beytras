import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = session.organizationId;

    const [org, customers, orders, drivers, vehicles, dispatchJobs, invoices, payments,
      fuelRecords, maintenanceRecords, inventoryItems, expenses, driverPayRates,
      payrollRuns, payrollRunLines, users] = await Promise.all([
      prisma.organization.findUnique({ where: { id: orgId } }),
      prisma.customer.findMany({ where: { organizationId: orgId } }),
      prisma.order.findMany({ where: { organizationId: orgId } }),
      prisma.driver.findMany({ where: { organizationId: orgId } }),
      prisma.vehicle.findMany({ where: { organizationId: orgId } }),
      prisma.dispatchJob.findMany({ where: { organizationId: orgId } }),
      prisma.invoice.findMany({ where: { organizationId: orgId } }),
      prisma.payment.findMany({ where: { organizationId: orgId } }),
      prisma.fuelRecord.findMany({ where: { organizationId: orgId } }),
      prisma.maintenanceRecord.findMany({ where: { organizationId: orgId } }),
      prisma.inventoryItem.findMany({ where: { organizationId: orgId } }),
      prisma.expense.findMany({ where: { organizationId: orgId } }),
      prisma.driverPayRate.findMany({ where: { organizationId: orgId } }),
      prisma.payrollRun.findMany({ where: { organizationId: orgId } }),
      prisma.payrollRunLine.findMany({ where: { payrollRun: { organizationId: orgId } } }),
      prisma.user.findMany({ where: { organizationId: orgId }, select: { id: true, name: true, email: true, role: true, phone: true, isActive: true, monthlySalary: true, createdAt: true } }),
    ]);

    const backup = {
      version: "1",
      app: "FleetFlow ERP",
      exportedAt: new Date().toISOString(),
      organization: org?.name,
      data: { customers, orders, drivers, vehicles, dispatchJobs, invoices, payments,
        fuelRecords, maintenanceRecords, inventoryItems, expenses, driverPayRates,
        payrollRuns, payrollRunLines, users },
    };

    const date = new Date().toISOString().slice(0, 10);
    return new Response(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="fleetflow-backup-${date}.json"`,
      },
    });
  } catch (err) {
    console.error("[export/json]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
