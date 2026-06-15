import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lat, lng, accuracy, speed, heading } = await req.json();
  if (!lat || !lng) return NextResponse.json({ error: "lat/lng required" }, { status: 400 });

  const driver = await prisma.driver.findFirst({ where: { userId: session.userId } });
  if (!driver) return NextResponse.json({ error: "Driver not found" }, { status: 404 });

  await prisma.driverLocation.create({
    data: { driverId: driver.id, lat: parseFloat(lat), lng: parseFloat(lng), accuracy: accuracy || null, speed: speed || null, heading: heading || null },
  });

  return NextResponse.json({ ok: true });
}
