import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let backup: Record<string, unknown>;
  try {
    backup = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON file" }, { status: 400 });
  }

  if (!backup.version || backup.app !== "FleetFlow ERP") {
    return NextResponse.json({ error: "Unrecognized backup format" }, { status: 400 });
  }

  const data = backup.data as Record<string, unknown[]>;
  if (!data) return NextResponse.json({ error: "Backup has no data section" }, { status: 400 });

  const results: Record<string, number> = {};

  try {
    // Restore in FK-safe order
    if (data.subscriptionPlans?.length) {
      for (const r of data.subscriptionPlans as Record<string, unknown>[]) {
        await prisma.subscriptionPlan.upsert({ where: { id: r.id as string }, create: r as never, update: r as never });
      }
      results.subscriptionPlans = data.subscriptionPlans.length;
    }

    if (data.organizations?.length) {
      for (const r of data.organizations as Record<string, unknown>[]) {
        await prisma.organization.upsert({ where: { id: r.id as string }, create: r as never, update: r as never });
      }
      results.organizations = data.organizations.length;
    }

    if (data.subscriptions?.length) {
      for (const r of data.subscriptions as Record<string, unknown>[]) {
        await prisma.subscription.upsert({ where: { id: r.id as string }, create: r as never, update: r as never });
      }
      results.subscriptions = data.subscriptions.length;
    }

    if (data.users?.length) {
      for (const r of data.users as Record<string, unknown>[]) {
        await prisma.user.upsert({ where: { id: r.id as string }, create: r as never, update: r as never });
      }
      results.users = data.users.length;
    }

    if (data.customers?.length) {
      for (const r of data.customers as Record<string, unknown>[]) {
        await prisma.customer.upsert({ where: { id: r.id as string }, create: r as never, update: r as never });
      }
      results.customers = data.customers.length;
    }

    if (data.vehicleTypes?.length) {
      for (const r of data.vehicleTypes as Record<string, unknown>[]) {
        await prisma.vehicleType.upsert({ where: { id: r.id as string }, create: r as never, update: r as never });
      }
      results.vehicleTypes = data.vehicleTypes.length;
    }

    if (data.vehicles?.length) {
      for (const r of data.vehicles as Record<string, unknown>[]) {
        await prisma.vehicle.upsert({ where: { id: r.id as string }, create: r as never, update: r as never });
      }
      results.vehicles = data.vehicles.length;
    }

    if (data.drivers?.length) {
      for (const r of data.drivers as Record<string, unknown>[]) {
        await prisma.driver.upsert({ where: { id: r.id as string }, create: r as never, update: r as never });
      }
      results.drivers = data.drivers.length;
    }

    if (data.orders?.length) {
      for (const r of data.orders as Record<string, unknown>[]) {
        await prisma.order.upsert({ where: { id: r.id as string }, create: r as never, update: r as never });
      }
      results.orders = data.orders.length;
    }

    if (data.dispatchJobs?.length) {
      for (const r of data.dispatchJobs as Record<string, unknown>[]) {
        await prisma.dispatchJob.upsert({ where: { id: r.id as string }, create: r as never, update: r as never });
      }
      results.dispatchJobs = data.dispatchJobs.length;
    }

    if (data.proofOfDelivery?.length) {
      for (const r of data.proofOfDelivery as Record<string, unknown>[]) {
        await prisma.proofOfDelivery.upsert({ where: { id: r.id as string }, create: r as never, update: r as never });
      }
      results.proofOfDelivery = data.proofOfDelivery.length;
    }

    if (data.invoices?.length) {
      for (const r of data.invoices as Record<string, unknown>[]) {
        await prisma.invoice.upsert({ where: { id: r.id as string }, create: r as never, update: r as never });
      }
      results.invoices = data.invoices.length;
    }

    if (data.payments?.length) {
      for (const r of data.payments as Record<string, unknown>[]) {
        await prisma.payment.upsert({ where: { id: r.id as string }, create: r as never, update: r as never });
      }
      results.payments = data.payments.length;
    }

    if (data.expenses?.length) {
      for (const r of data.expenses as Record<string, unknown>[]) {
        await prisma.expense.upsert({ where: { id: r.id as string }, create: r as never, update: r as never });
      }
      results.expenses = data.expenses.length;
    }

    if (data.fuelRecords?.length) {
      for (const r of data.fuelRecords as Record<string, unknown>[]) {
        await prisma.fuelRecord.upsert({ where: { id: r.id as string }, create: r as never, update: r as never });
      }
      results.fuelRecords = data.fuelRecords.length;
    }

    if (data.maintenanceRecords?.length) {
      for (const r of data.maintenanceRecords as Record<string, unknown>[]) {
        await prisma.maintenanceRecord.upsert({ where: { id: r.id as string }, create: r as never, update: r as never });
      }
      results.maintenanceRecords = data.maintenanceRecords.length;
    }

    if (data.inventoryItems?.length) {
      for (const r of data.inventoryItems as Record<string, unknown>[]) {
        await prisma.inventoryItem.upsert({ where: { id: r.id as string }, create: r as never, update: r as never });
      }
      results.inventoryItems = data.inventoryItems.length;
    }

    if (data.inventoryTransactions?.length) {
      for (const r of data.inventoryTransactions as Record<string, unknown>[]) {
        await prisma.inventoryTransaction.upsert({ where: { id: r.id as string }, create: r as never, update: r as never });
      }
      results.inventoryTransactions = data.inventoryTransactions.length;
    }

    if (data.companySettings?.length) {
      for (const r of data.companySettings as Record<string, unknown>[]) {
        await prisma.companySettings.upsert({ where: { id: r.id as string }, create: r as never, update: r as never });
      }
      results.companySettings = data.companySettings.length;
    }

    if (data.driverPayRates?.length) {
      for (const r of data.driverPayRates as Record<string, unknown>[]) {
        await prisma.driverPayRate.upsert({ where: { id: r.id as string }, create: r as never, update: r as never });
      }
      results.driverPayRates = data.driverPayRates.length;
    }

    if (data.payrollRuns?.length) {
      for (const r of data.payrollRuns as Record<string, unknown>[]) {
        await prisma.payrollRun.upsert({ where: { id: r.id as string }, create: r as never, update: r as never });
      }
      results.payrollRuns = data.payrollRuns.length;
    }

    if (data.payrollRunLines?.length) {
      for (const r of data.payrollRunLines as Record<string, unknown>[]) {
        await prisma.payrollRunLine.upsert({ where: { id: r.id as string }, create: r as never, update: r as never });
      }
      results.payrollRunLines = data.payrollRunLines.length;
    }

    if (data.customerPortalAccounts?.length) {
      for (const r of data.customerPortalAccounts as Record<string, unknown>[]) {
        await prisma.customerPortalAccount.upsert({ where: { id: r.id as string }, create: r as never, update: r as never });
      }
      results.customerPortalAccounts = data.customerPortalAccounts.length;
    }

    return NextResponse.json({
      ok: true,
      restoredAt: new Date().toISOString(),
      backupDate: backup.exportedAt,
      results,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Restore failed: ${msg}` }, { status: 500 });
  }
}
