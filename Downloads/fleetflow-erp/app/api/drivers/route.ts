import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const drivers = await prisma.driver.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { name: "asc" },
    include: {
      locations: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { dispatchJobs: true } },
    },
  });

  return NextResponse.json(drivers);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, phone, email, licenseNumber, licenseExpiry, password, role, payType, perTripRate, perDayRate, avatarUrl } = body;

  if (!name || !phone || !licenseNumber) {
    return NextResponse.json({ error: "Name, phone, and license required" }, { status: 400 });
  }

  let userId: string | undefined;

  if (email && password) {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        organizationId: session.organizationId,
        email: email.toLowerCase(),
        passwordHash,
        name,
        phone,
        role: role ?? "driver",
        avatarUrl: avatarUrl || null,
      },
    });
    userId = user.id;
  }

  const driver = await prisma.driver.create({
    data: {
      organizationId: session.organizationId,
      name, phone,
      email: email || null,
      licenseNumber,
      licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      userId: userId || null,
      status: "available",
      avatarUrl: avatarUrl || null,
    },
  });

  if (payType) {
    await prisma.driverPayRate.create({
      data: {
        organizationId: session.organizationId,
        driverId: driver.id,
        payType: payType ?? "per_trip",
        perTripRate: Number(perTripRate) || 0,
        perDayRate: Number(perDayRate) || 0,
      },
    });
  }

  return NextResponse.json(driver, { status: 201 });
}
