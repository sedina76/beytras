import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const session = await requireAuth();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const drivers = await prisma.driver.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      phone: true,
      status: true,
      payRate: true,
    },
  });

  return NextResponse.json(drivers);
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session?.organizationId || session.role !== "company_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { driverId, payType, perTripRate, perDayRate } = await req.json();
  if (!driverId || !payType) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver || driver.organizationId !== session.organizationId) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  const rate = await prisma.driverPayRate.upsert({
    where: { driverId },
    create: {
      organizationId: session.organizationId,
      driverId,
      payType,
      perTripRate: Number(perTripRate) || 0,
      perDayRate: Number(perDayRate) || 0,
    },
    update: {
      payType,
      perTripRate: Number(perTripRate) || 0,
      perDayRate: Number(perDayRate) || 0,
    },
  });

  return NextResponse.json(rate);
}
