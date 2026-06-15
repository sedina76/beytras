import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const session = await requireAuth();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get latest GPS location for each active driver
  const activeJobs = await prisma.dispatchJob.findMany({
    where: {
      organizationId: session.organizationId,
      status: { in: ["assigned", "en_route_source", "loading", "en_route_customer", "arrived"] },
    },
    include: {
      driver: {
        include: {
          locations: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
      order: {
        select: {
          orderNumber: true,
          deliveryAddress: true,
          deliveryLat: true,
          deliveryLng: true,
          productType: true,
          quantityOrdered: true,
          unit: true,
          customer: { select: { name: true } },
        },
      },
      vehicle: { select: { plateNumber: true } },
    },
  });

  // Build driver markers (from latest GPS ping)
  const driverMarkers = activeJobs
    .filter(j => j.driver && j.driver.locations.length > 0)
    .map(j => {
      const loc = j.driver!.locations[0];
      const age = Date.now() - new Date(loc.createdAt).getTime();
      const ageMin = Math.floor(age / 60000);
      return {
        lat: loc.lat,
        lng: loc.lng,
        type: "driver" as const,
        label: j.driver!.name,
        sublabel: `${j.vehicle?.plateNumber ?? "—"} · ${j.status.replace(/_/g, " ")} · ${ageMin < 1 ? "just now" : ageMin + "m ago"}`,
        jobStatus: j.status,
        orderId: j.orderId,
        orderNumber: j.order.orderNumber,
        updatedAt: loc.createdAt,
      };
    });

  // Build delivery destination markers (orders with coordinates)
  const orderMarkers = activeJobs
    .filter(j => j.order.deliveryLat && j.order.deliveryLng)
    .map(j => ({
      lat: j.order.deliveryLat!,
      lng: j.order.deliveryLng!,
      type: "order" as const,
      label: j.order.customer.name,
      sublabel: `${j.order.orderNumber} · ${j.order.quantityOrdered.toLocaleString()} ${j.order.unit} ${j.order.productType}`,
    }));

  // Also get pickup locations for jobs in loading/en_route_customer states
  const pickupMarkers = activeJobs
    .filter(j => j.pickupLat && j.pickupLng && ["en_route_source", "loading"].includes(j.status))
    .map(j => ({
      lat: j.pickupLat!,
      lng: j.pickupLng!,
      type: "pickup" as const,
      label: j.pickupAddress ?? "Pickup Point",
      sublabel: j.order.orderNumber,
    }));

  // Summary stats
  const stats = {
    activeDrivers: driverMarkers.length,
    totalActiveJobs: activeJobs.length,
    driversWithGPS: driverMarkers.length,
    driversWithoutGPS: activeJobs.filter(j => !j.driver?.locations?.length).length,
  };

  return NextResponse.json({ driverMarkers, orderMarkers, pickupMarkers, stats });
}
