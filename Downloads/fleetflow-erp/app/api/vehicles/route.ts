import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";

  const vehicles = await prisma.vehicle.findMany({
    where: { organizationId: session.organizationId, ...(status ? { status } : {}) },
    orderBy: { plateNumber: "asc" },
    include: { vehicleType: true, _count: { select: { dispatchJobs: true } } },
  });

  return NextResponse.json(vehicles);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { plateNumber, make, model, year, capacityLitres, fuelType, color, ownership, leaseCompany, leaseExpiry, leaseMonthlyRate } = body;

  if (!plateNumber || !make || !model) {
    return NextResponse.json({ error: "Plate number, make and model required" }, { status: 400 });
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      organizationId: session.organizationId,
      plateNumber: plateNumber.toUpperCase(),
      make, model,
      year: parseInt(year) || new Date().getFullYear(),
      capacityLitres: parseFloat(capacityLitres) || 0,
      fuelType: fuelType || "diesel",
      color: color || null,
      ownership: ownership || "owned",
      leaseCompany: leaseCompany || null,
      leaseExpiry: leaseExpiry ? new Date(leaseExpiry) : null,
      leaseMonthlyRate: leaseMonthlyRate ? parseFloat(leaseMonthlyRate) : null,
      status: "available",
    },
  });

  return NextResponse.json(vehicle, { status: 201 });
}
