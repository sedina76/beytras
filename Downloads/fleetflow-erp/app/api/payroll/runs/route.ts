import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

type PayrollLineInput = {
  personType?: string; driverId?: string | null; conductorId?: string | null;
  driverName: string; payType: string;
  tripsCount: number; daysWorked: number;
  perTripRate: number; perDayRate: number;
  tripEarnings: number; dayEarnings: number; totalEarnings: number;
};

export async function GET() {
  const session = await requireAuth();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const runs = await prisma.payrollRun.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      lines: { orderBy: { totalEarnings: "desc" } },
    },
  });

  return NextResponse.json(runs);
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session?.organizationId || session.role !== "company_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { periodStart, periodEnd, lines, totalAmount, notes } = await req.json();
  if (!periodStart || !periodEnd || !lines?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const run = await prisma.payrollRun.create({
    data: {
      organizationId: session.organizationId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      totalAmount: Number(totalAmount) || 0,
      notes: notes || null,
      status: "approved",
      approvedBy: session.name,
      approvedAt: new Date(),
      lines: {
        create: lines.map((l: PayrollLineInput) => ({
          personType: l.personType ?? "driver",
          driverId: l.driverId ?? null,
          conductorId: l.conductorId ?? null,
          driverName: l.driverName,
          payType: l.payType,
          tripsCount: l.tripsCount,
          daysWorked: l.daysWorked,
          perTripRate: l.perTripRate,
          perDayRate: l.perDayRate,
          tripEarnings: l.tripEarnings,
          dayEarnings: l.dayEarnings,
          totalEarnings: l.totalEarnings,
        })),
      },
    },
    include: { lines: true },
  });

  return NextResponse.json(run, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAuth();
  if (!session?.organizationId || session.role !== "company_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await req.json();
  const run = await prisma.payrollRun.update({
    where: { id },
    data: { status: "paid", paidAt: new Date() },
  });

  return NextResponse.json(run);
}
