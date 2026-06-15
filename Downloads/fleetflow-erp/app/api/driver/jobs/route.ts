import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const driver = await prisma.driver.findFirst({ where: { userId: session.userId } });
  if (!driver) return NextResponse.json({ error: "Driver not found" }, { status: 404 });

  const jobs = await prisma.dispatchJob.findMany({
    where: {
      driverId: driver.id,
      status: { notIn: ["cancelled", "failed"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      order: { include: { customer: { select: { name: true, phone: true, address: true } } } },
      vehicle: { select: { plateNumber: true, make: true, model: true, capacityLitres: true } },
      proofOfDelivery: true,
    },
  });

  return NextResponse.json({ driver, jobs });
}
