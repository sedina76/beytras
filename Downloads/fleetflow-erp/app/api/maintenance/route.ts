import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const records = await prisma.maintenanceRecord.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { date: "desc" },
    take: 500,
    include: { vehicle: { select: { plateNumber: true, make: true, model: true } } },
  });

  return NextResponse.json({ records });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { vehicleId, type, description, odometerKm, cost, vendor, mechanicNotes, nextServiceKm, nextServiceDate, status, date } = body;

    if (!vehicleId || !type || !description || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const record = await prisma.maintenanceRecord.create({
      data: {
        organizationId: session.organizationId,
        vehicleId,
        type,
        description,
        odometerKm: odometerKm ?? 0,
        cost: cost ?? 0,
        vendor: vendor ?? null,
        mechanicNotes: mechanicNotes ?? null,
        nextServiceKm: nextServiceKm ?? null,
        nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : null,
        status: status ?? "completed",
        date: new Date(date),
      },
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (err) {
    console.error("Maintenance POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
