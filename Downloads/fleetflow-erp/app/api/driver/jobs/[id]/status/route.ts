import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { generateInvoiceForOrder } from "@/lib/invoice";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status, notes, actualQuantity, cashCollected } = await req.json();

  const driver = await prisma.driver.findFirst({ where: { userId: session.userId } });
  if (!driver) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updateData: Record<string, unknown> = { status, updatedAt: new Date() };
  if (notes) updateData.driverNotes = notes;
  if (actualQuantity) updateData.actualQuantity = parseFloat(actualQuantity);
  if (cashCollected) updateData.cashCollected = parseFloat(cashCollected);

  if (status === "en_route_source") updateData.startedAt = new Date();
  if (status === "arrived") updateData.arrivedAt = new Date();
  if (status === "delivered") {
    updateData.completedAt = new Date();
    const job = await prisma.dispatchJob.findFirst({ where: { id, driverId: driver.id } });
    if (job) {
      await prisma.order.update({ where: { id: job.orderId }, data: { status: "delivered" } });
      await prisma.driver.update({ where: { id: driver.id }, data: { status: "available", totalTrips: { increment: 1 } } });
      if (job.vehicleId) await prisma.vehicle.update({ where: { id: job.vehicleId }, data: { status: "available" } });
      await generateInvoiceForOrder(job.orderId);
    }
  }

  const job = await prisma.dispatchJob.updateMany({
    where: { id, driverId: driver.id },
    data: updateData,
  });

  return NextResponse.json(job);
}
