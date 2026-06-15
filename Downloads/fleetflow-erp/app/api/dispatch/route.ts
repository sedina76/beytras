import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { generateInvoiceForOrder } from "@/lib/invoice";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");

  const jobs = await prisma.dispatchJob.findMany({
    where: {
      organizationId: session.organizationId,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      order: { include: { customer: { select: { name: true, phone: true, address: true } } } },
      driver: { select: { id: true, name: true, phone: true, status: true, locations: { orderBy: { createdAt: "desc" }, take: 1 } } },
      vehicle: { select: { id: true, plateNumber: true, make: true, model: true, capacityLitres: true, status: true } },
      conductor: { select: { id: true, name: true, phone: true } },
      waterSource: { select: { id: true, name: true, address: true } },
    },
  });

  // Query unassigned dispatch jobs directly — avoids nested-relation include issues with Prisma on SQLite
  const unassignedJobs = await prisma.dispatchJob.findMany({
    where: { organizationId: session.organizationId, status: "unassigned" },
    include: {
      order: { include: { customer: { select: { name: true, phone: true } } } },
      waterSource: { select: { id: true, name: true, address: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Shape to the Order type the frontend expects, filtering to live pending/confirmed orders only
  const unassignedOrders = unassignedJobs
    .filter(job => ["pending", "confirmed"].includes(job.order.status))
    .map(job => ({
      ...job.order,
      dispatchJob: { id: job.id, status: job.status, waterSource: job.waterSource },
    }));

  // Backfill: find pending orders with no dispatch job using plain JS (avoids Prisma relation filter)
  const pendingOrderIds = (await prisma.order.findMany({
    where: { organizationId: session.organizationId, status: { in: ["pending", "confirmed"] } },
    select: { id: true },
  })).map(o => o.id);

  const coveredIds = new Set((await prisma.dispatchJob.findMany({
    where: { orderId: { in: pendingOrderIds } },
    select: { orderId: true },
  })).map(j => j.orderId));

  const missingIds = pendingOrderIds.filter(id => !coveredIds.has(id));
  if (missingIds.length > 0) {
    await prisma.$transaction(
      missingIds.map(id => prisma.dispatchJob.create({
        data: { organizationId: session.organizationId!, orderId: id, status: "unassigned" },
      }))
    );
  }

  const availableDrivers = await prisma.driver.findMany({
    where: { organizationId: session.organizationId, status: "available" },
    include: { locations: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const availableVehicles = await prisma.vehicle.findMany({
    where: { organizationId: session.organizationId, status: "available" },
  });

  const availableConductors = await prisma.user.findMany({
    where: { organizationId: session.organizationId, role: "conductor", isActive: true },
    select: { id: true, name: true, phone: true },
  });

  const waterSources = await prisma.waterSource.findMany({
    where: { organizationId: session.organizationId, isActive: true },
    select: { id: true, name: true, address: true },
  });

  return NextResponse.json({ jobs, unassignedOrders, availableDrivers, availableVehicles, availableConductors, waterSources });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId, driverId, vehicleId, conductorId, waterSourceId, pickupAddress } = await req.json();
  if (!jobId || !driverId || !vehicleId) {
    return NextResponse.json({ error: "Job, driver and vehicle required" }, { status: 400 });
  }

  const job = await prisma.dispatchJob.update({
    where: { id: jobId },
    data: {
      driverId,
      vehicleId,
      conductorId: conductorId || null,
      waterSourceId: waterSourceId || null,
      status: "assigned",
      pickupAddress: pickupAddress || null,
      assignedAt: new Date(),
    },
  });

  await prisma.order.updateMany({ where: { id: job.orderId }, data: { status: "dispatched" } });
  await prisma.driver.updateMany({ where: { id: driverId }, data: { status: "on_trip" } });
  await prisma.vehicle.updateMany({ where: { id: vehicleId }, data: { status: "on_trip" } });

  // Auto-create cost_of_water expense based on vehicle load size tier
  if (waterSourceId) {
    const [waterSource, order, vehicle] = await Promise.all([
      prisma.waterSource.findUnique({ where: { id: waterSourceId } }),
      prisma.order.findUnique({ where: { id: job.orderId }, select: { orderNumber: true } }),
      prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { capacityLitres: true, plateNumber: true } }),
    ]);
    if (waterSource && order && vehicle) {
      const cap = vehicle.capacityLitres;
      const tierPrice =
        cap <= 5000  ? waterSource.price5000  :
        cap <= 10000 ? waterSource.price10000 :
                       waterSource.price20000;
      if (tierPrice > 0) {
        await prisma.expense.create({
          data: {
            organizationId: session.organizationId!,
            category: "cost_of_water",
            description: `Water — ${cap.toLocaleString()} L from ${waterSource.name} (${vehicle.plateNumber}) for ${order.orderNumber}`,
            amount: tierPrice,
            vendor: waterSource.name,
            date: new Date(),
            approvedBy: null,
          },
        });
      }
    }
  }

  return NextResponse.json(job);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId, status, ...rest } = await req.json();
  if (!jobId || !status) return NextResponse.json({ error: "jobId and status required" }, { status: 400 });

  const updateData: Record<string, unknown> = { status, ...rest, updatedAt: new Date() };

  if (status === "delivered") {
    updateData.completedAt = new Date();
    const job = await prisma.dispatchJob.findUnique({ where: { id: jobId } });
    if (job) {
      await prisma.order.updateMany({ where: { id: job.orderId }, data: { status: "delivered" } });
      if (job.driverId) await prisma.driver.updateMany({ where: { id: job.driverId }, data: { status: "available", totalTrips: { increment: 1 } } });
      if (job.vehicleId) await prisma.vehicle.updateMany({ where: { id: job.vehicleId }, data: { status: "available" } });
      await generateInvoiceForOrder(job.orderId);
    }
  }

  if (status === "cancelled") {
    updateData.cancelledAt = new Date();
    const job = await prisma.dispatchJob.findUnique({ where: { id: jobId } });
    if (job) {
      await prisma.order.updateMany({ where: { id: job.orderId }, data: { status: "cancelled" } });
      if (job.driverId) await prisma.driver.updateMany({ where: { id: job.driverId }, data: { status: "available" } });
      if (job.vehicleId) await prisma.vehicle.updateMany({ where: { id: job.vehicleId }, data: { status: "available" } });
    }
  }

  const updated = await prisma.dispatchJob.update({ where: { id: jobId }, data: updateData });
  return NextResponse.json(updated);
}
