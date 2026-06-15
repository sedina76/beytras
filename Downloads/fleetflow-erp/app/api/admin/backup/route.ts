import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    organizations,
    subscriptionPlans,
    subscriptions,
    users,
    customers,
    vehicleTypes,
    vehicles,
    drivers,
    orders,
    dispatchJobs,
    proofOfDelivery,
    invoices,
    payments,
    expenses,
    fuelRecords,
    maintenanceRecords,
    inventoryItems,
    inventoryTransactions,
    notifications,
    auditLogs,
    companySettings,
    driverPayRates,
    payrollRuns,
    payrollRunLines,
    customerPortalAccounts,
  ] = await Promise.all([
    prisma.organization.findMany(),
    prisma.subscriptionPlan.findMany(),
    prisma.subscription.findMany(),
    prisma.user.findMany(),
    prisma.customer.findMany(),
    prisma.vehicleType.findMany(),
    prisma.vehicle.findMany(),
    prisma.driver.findMany(),
    prisma.order.findMany(),
    prisma.dispatchJob.findMany(),
    prisma.proofOfDelivery.findMany(),
    prisma.invoice.findMany(),
    prisma.payment.findMany(),
    prisma.expense.findMany(),
    prisma.fuelRecord.findMany(),
    prisma.maintenanceRecord.findMany(),
    prisma.inventoryItem.findMany(),
    prisma.inventoryTransaction.findMany(),
    prisma.notification.findMany(),
    prisma.auditLog.findMany(),
    prisma.companySettings.findMany(),
    prisma.driverPayRate.findMany(),
    prisma.payrollRun.findMany(),
    prisma.payrollRunLine.findMany(),
    prisma.customerPortalAccount.findMany(),
  ]);

  const backup = {
    version: "1",
    app: "FleetFlow ERP",
    exportedAt: new Date().toISOString(),
    counts: {
      organizations: organizations.length,
      users: users.length,
      customers: customers.length,
      orders: orders.length,
      vehicles: vehicles.length,
      drivers: drivers.length,
      invoices: invoices.length,
      payments: payments.length,
      fuelRecords: fuelRecords.length,
      maintenanceRecords: maintenanceRecords.length,
    },
    data: {
      subscriptionPlans,
      organizations,
      subscriptions,
      users,
      customers,
      vehicleTypes,
      vehicles,
      drivers,
      orders,
      dispatchJobs,
      proofOfDelivery,
      invoices,
      payments,
      expenses,
      fuelRecords,
      maintenanceRecords,
      inventoryItems,
      inventoryTransactions,
      notifications,
      auditLogs,
      companySettings,
      driverPayRates,
      payrollRuns,
      payrollRunLines,
      customerPortalAccounts,
    },
  };

  const body = JSON.stringify(backup, null, 2);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="fleetflow-backup-${date}.json"`,
    },
  });
}
