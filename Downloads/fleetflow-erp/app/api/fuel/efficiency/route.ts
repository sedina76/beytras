import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

const LITRES_PER_TRIP  = 7.5;
const TARGET_TRIPS     = 12;   // per 90L fill-up
const FILL_UP_LITRES   = 90;

export async function GET() {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = session.organizationId;

  // All vehicles in org
  const vehicles = await prisma.vehicle.findMany({
    where: { organizationId: orgId },
    select: { id: true, plateNumber: true, make: true, model: true },
  });

  // All fuel records, most recent first per vehicle
  const fuelRecords = await prisma.fuelRecord.findMany({
    where: { organizationId: orgId },
    orderBy: { date: "desc" },
    select: { vehicleId: true, litres: true, date: true, id: true },
  });

  // All delivered dispatch jobs
  const trips = await prisma.dispatchJob.findMany({
    where: { organizationId: orgId, status: "delivered", completedAt: { not: null } },
    select: { vehicleId: true, completedAt: true },
  });

  const result = vehicles.map(v => {
    // Sort fill-ups oldest → newest for this vehicle
    const fills = fuelRecords
      .filter(r => r.vehicleId === v.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const vehicleTrips = trips
      .filter(t => t.vehicleId === v.id)
      .map(t => new Date(t.completedAt!).getTime())
      .sort((a, b) => a - b);

    if (fills.length === 0) {
      // No fuel records — check if vehicle has any trips at all
      return {
        vehicleId: v.id,
        plateNumber: v.plateNumber,
        make: v.make,
        model: v.model,
        fillUps: [],
        tripsSinceLastFill: vehicleTrips.length,
        lastFillDate: null,
        lastFillLitres: 0,
        targetTrips: 0,
        status: "no_data",
        alert: null,
      };
    }

    // Build per-fill-up intervals
    const fillUps = fills.map((fill, idx) => {
      const fillTime   = new Date(fill.date).getTime();
      const nextFill   = fills[idx + 1];
      const endTime    = nextFill ? new Date(nextFill.date).getTime() : Date.now();

      const tripsInInterval = vehicleTrips.filter(t => t >= fillTime && t < endTime).length;
      const targetForFill   = Math.round((fill.litres / FILL_UP_LITRES) * TARGET_TRIPS);
      const isLast          = idx === fills.length - 1;

      return {
        fillId: fill.id,
        date: fill.date,
        litres: fill.litres,
        targetTrips: targetForFill,
        actualTrips: tripsInInterval,
        isComplete: !isLast,
        shortfall: Math.max(0, targetForFill - tripsInInterval),
      };
    });

    const lastFill         = fills[fills.length - 1];
    const lastFillTime     = new Date(lastFill.date).getTime();
    const tripsSinceLast   = vehicleTrips.filter(t => t >= lastFillTime).length;
    const targetSinceLast  = Math.round((lastFill.litres / FILL_UP_LITRES) * TARGET_TRIPS);

    // Determine alert level
    let status: "ok" | "warning" | "critical" | "no_data" = "ok";
    let alert: string | null = null;

    // Check closed intervals (fill-up already followed by another fill-up)
    const closedUnder = fillUps.filter(f => f.isComplete && f.actualTrips < f.targetTrips);
    if (closedUnder.length > 0) {
      const worst = closedUnder.reduce((a, b) => a.shortfall > b.shortfall ? a : b);
      status = worst.shortfall >= 6 ? "critical" : "warning";
      alert = `Only ${worst.actualTrips} of ${worst.targetTrips} trips completed before refuel on ${new Date(worst.date).toLocaleDateString("en-KE")}`;
    }

    // Check current open interval: if vehicle was fueled again before hitting target
    const secondLastFill = fills[fills.length - 2];
    if (secondLastFill) {
      const prevInterval = fillUps[fills.length - 2];
      if (prevInterval.isComplete && prevInterval.actualTrips < prevInterval.targetTrips) {
        status = prevInterval.shortfall >= 6 ? "critical" : "warning";
        alert = `Refueled after only ${prevInterval.actualTrips}/${prevInterval.targetTrips} trips — ${prevInterval.shortfall} trip(s) short`;
      }
    }

    return {
      vehicleId: v.id,
      plateNumber: v.plateNumber,
      make: v.make,
      model: v.model,
      fillUps,
      tripsSinceLastFill: tripsSinceLast,
      lastFillDate: lastFill.date,
      lastFillLitres: lastFill.litres,
      targetTrips: targetSinceLast,
      status,
      alert,
      litresPerTrip: vehicleTrips.length > 0
        ? parseFloat(((fills.reduce((s, f) => s + f.litres, 0)) / vehicleTrips.length).toFixed(1))
        : null,
    };
  });

  return NextResponse.json(result);
}
