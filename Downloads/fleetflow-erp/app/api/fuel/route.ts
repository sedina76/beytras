import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const records = await prisma.fuelRecord.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { date: "desc" },
    take: 500,
    include: { vehicle: { select: { id: true, plateNumber: true, make: true, model: true } } },
  });

  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { vehicleId, litres, costPerLitre, odometerKm, station, date, attendant, receiptNumber, notes } = body;

  if (!vehicleId || !litres || !costPerLitre) return NextResponse.json({ error: "Vehicle, litres and cost required" }, { status: 400 });

  const totalCost = parseFloat(litres) * parseFloat(costPerLitre);

  const record = await prisma.fuelRecord.create({
    data: {
      organizationId: session.organizationId,
      vehicleId, litres: parseFloat(litres),
      costPerLitre: parseFloat(costPerLitre),
      totalCost, odometerKm: parseFloat(odometerKm) || 0,
      station: station || null,
      date: date ? new Date(date) : new Date(),
      attendant: attendant || null,
      receiptNumber: receiptNumber || null,
      notes: notes || null,
    },
  });

  return NextResponse.json(record, { status: 201 });
}
