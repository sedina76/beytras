import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { periodStart, periodEnd } = await req.json();
  if (!periodStart || !periodEnd) return NextResponse.json({ error: "Period start and end required" }, { status: 400 });

  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  end.setHours(23, 59, 59, 999);

  // ── Drivers ──────────────────────────────────────────────────────────────
  const drivers = await prisma.driver.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { name: "asc" },
    include: { payRate: true },
  });

  const driverJobs = await prisma.dispatchJob.findMany({
    where: {
      organizationId: session.organizationId,
      status: "delivered",
      completedAt: { gte: start, lte: end },
      driverId: { not: null },
    },
    select: { driverId: true, completedAt: true },
  });

  const jobsByDriver = new Map<string, Date[]>();
  for (const job of driverJobs) {
    if (!job.driverId) continue;
    if (!jobsByDriver.has(job.driverId)) jobsByDriver.set(job.driverId, []);
    jobsByDriver.get(job.driverId)!.push(new Date(job.completedAt!));
  }

  const driverLines = drivers.map(driver => {
    const djobs = jobsByDriver.get(driver.id) ?? [];
    const tripsCount = djobs.length;
    const daySet = new Set(djobs.map(d => d.toISOString().slice(0, 10)));
    const daysWorked = daySet.size;

    const payType = driver.payRate?.payType ?? "per_trip";
    const perTripRate = driver.payRate?.perTripRate ?? 0;
    const perDayRate = driver.payRate?.perDayRate ?? 0;
    const tripEarnings = (payType === "per_trip" || payType === "both") ? tripsCount * perTripRate : 0;
    const dayEarnings  = (payType === "per_day"  || payType === "both") ? daysWorked * perDayRate  : 0;

    return {
      personType: "driver" as const,
      driverId: driver.id,
      conductorId: null as string | null,
      driverName: driver.name,
      payType,
      tripsCount,
      daysWorked,
      perTripRate,
      perDayRate,
      tripEarnings,
      dayEarnings,
      totalEarnings: tripEarnings + dayEarnings,
    };
  });

  // ── Conductors ────────────────────────────────────────────────────────────
  const conductors = await prisma.user.findMany({
    where: { organizationId: session.organizationId, role: "conductor", isActive: true },
    select: { id: true, name: true, monthlySalary: true },
    orderBy: { name: "asc" },
  });

  const conductorJobs = await prisma.dispatchJob.findMany({
    where: {
      organizationId: session.organizationId,
      status: "delivered",
      completedAt: { gte: start, lte: end },
      conductorId: { not: null },
    },
    select: { conductorId: true, completedAt: true },
  });

  const jobsByConductor = new Map<string, Date[]>();
  for (const job of conductorJobs) {
    if (!job.conductorId) continue;
    if (!jobsByConductor.has(job.conductorId)) jobsByConductor.set(job.conductorId, []);
    jobsByConductor.get(job.conductorId)!.push(new Date(job.completedAt!));
  }

  const conductorLines = conductors.map(conductor => {
    const cjobs = jobsByConductor.get(conductor.id) ?? [];
    const tripsCount = cjobs.length;
    const perTripRate = conductor.monthlySalary ?? 0;
    const tripEarnings = tripsCount * perTripRate;

    return {
      personType: "conductor" as const,
      driverId: null as string | null,
      conductorId: conductor.id,
      driverName: conductor.name,
      payType: "per_trip",
      tripsCount,
      daysWorked: 0,
      perTripRate,
      perDayRate: 0,
      tripEarnings,
      dayEarnings: 0,
      totalEarnings: tripEarnings,
    };
  });

  const lines = [...driverLines, ...conductorLines];
  const totalAmount = lines.reduce((s, l) => s + l.totalEarnings, 0);

  return NextResponse.json({ lines, totalAmount, periodStart: start.toISOString(), periodEnd: end.toISOString() });
}
