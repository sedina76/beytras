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
  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = session.organizationId;

    const [
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
      users,
    ] = await Promise.all([
      prisma.customer.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: "desc" } }),
      prisma.order.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: "desc" } }),
      prisma.driver.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: "desc" } }),
      prisma.vehicle.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: "desc" } }),
      prisma.dispatchJob.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: "desc" } }),
      prisma.invoice.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: "desc" } }),
      prisma.payment.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: "desc" } }),
      prisma.fuelRecord.findMany({ where: { organizationId: orgId }, orderBy: { date: "desc" } }),
      prisma.maintenanceRecord.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: "desc" } }),
      prisma.inventoryItem.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
      prisma.expense.findMany({ where: { organizationId: orgId }, orderBy: { date: "desc" } }),
      prisma.driverPayRate.findMany({ where: { organizationId: orgId } }),
      prisma.payrollRun.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: "desc" } }),
      prisma.payrollRunLine.findMany({ where: { payrollRun: { organizationId: orgId } } }),
      prisma.user.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true, role: true, phone: true, isActive: true, monthlySalary: true, lastLoginAt: true, createdAt: true } }),
    ]);

    const wb = XLSX.utils.book_new();

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
    addSheet(wb, "Staff", users as Record<string, unknown>[]);

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const date = new Date().toISOString().slice(0, 10);

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="fleetflow-export-${date}.xlsx"`,
      },
    });
  } catch (err) {
    console.error("[export/excel]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
