import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";

function flat(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map(row => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      if (v instanceof Date) out[k] = v.toISOString();
      else if (typeof v === "object" && v !== null) out[k] = JSON.stringify(v);
      else out[k] = v;
    }
    return out;
  });
}

function addSheet(wb: XLSX.WorkBook, name: string, rows: Record<string, unknown>[]) {
  const ws = rows.length
    ? XLSX.utils.json_to_sheet(flat(rows))
    : XLSX.utils.aoa_to_sheet([["No records"]]);
  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31)); // Excel sheet name max 31 chars
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    organizations,
    users,
    customers,
    orders,
    drivers,
    vehicles,
    dispatchJobs,
    invoices,
    payments,
    fuelRecords,
    maintenanceRecords,
    inventoryItems,
    expenses,
    driverPayRates,
    payrollRuns,
    payrollRunLines,
    auditLogs,
  ] = await Promise.all([
    prisma.organization.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, role: true, phone: true, isActive: true, monthlySalary: true, lastLoginAt: true, createdAt: true, organizationId: true } }),
    prisma.customer.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.driver.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.vehicle.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.dispatchJob.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.invoice.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.payment.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.fuelRecord.findMany({ orderBy: { date: "desc" } }),
    prisma.maintenanceRecord.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.inventoryItem.findMany({ orderBy: { name: "asc" } }),
    prisma.expense.findMany({ orderBy: { date: "desc" } }),
    prisma.driverPayRate.findMany(),
    prisma.payrollRun.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.payrollRunLine.findMany(),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 2000 }),
  ]);

  const wb = XLSX.utils.book_new();

  addSheet(wb, "Organizations", organizations as Record<string, unknown>[]);
  addSheet(wb, "Users", users as Record<string, unknown>[]);
  addSheet(wb, "Customers", customers as Record<string, unknown>[]);
  addSheet(wb, "Orders", orders as Record<string, unknown>[]);
  addSheet(wb, "Drivers", drivers as Record<string, unknown>[]);
  addSheet(wb, "Vehicles", vehicles as Record<string, unknown>[]);
  addSheet(wb, "Dispatch Jobs", dispatchJobs as Record<string, unknown>[]);
  addSheet(wb, "Invoices", invoices as Record<string, unknown>[]);
  addSheet(wb, "Payments", payments as Record<string, unknown>[]);
  addSheet(wb, "Fuel Records", fuelRecords as Record<string, unknown>[]);
  addSheet(wb, "Maintenance", maintenanceRecords as Record<string, unknown>[]);
  addSheet(wb, "Inventory", inventoryItems as Record<string, unknown>[]);
  addSheet(wb, "Expenses", expenses as Record<string, unknown>[]);
  addSheet(wb, "Driver Pay Rates", driverPayRates as Record<string, unknown>[]);
  addSheet(wb, "Payroll Runs", payrollRuns as Record<string, unknown>[]);
  addSheet(wb, "Payroll Lines", payrollRunLines as Record<string, unknown>[]);
  addSheet(wb, "Audit Log", auditLogs as Record<string, unknown>[]);

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const date = new Date().toISOString().slice(0, 10);

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="fleetflow-backup-${date}.xlsx"`,
    },
  });
}
