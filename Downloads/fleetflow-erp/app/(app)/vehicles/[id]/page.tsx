import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Fuel, Wrench } from "lucide-react";
import TankerTruckIcon from "@/components/TankerTruckIcon";

const STATUS_COLOR: Record<string, string> = {
  available: "ff-badge-green", on_trip: "ff-badge-blue", maintenance: "ff-badge-yellow", off_duty: "ff-badge-gray",
};

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.organizationId) return null;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id, organizationId: session.organizationId },
    include: {
      vehicleType: true,
      fuelRecords: { orderBy: { date: "desc" }, take: 8 },
      maintenanceRecords: { orderBy: { date: "desc" }, take: 5 },
      dispatchJobs: {
        orderBy: { createdAt: "desc" }, take: 10,
        include: { order: { include: { customer: { select: { name: true } } } }, driver: { select: { name: true } } },
      },
    },
  });

  if (!vehicle) notFound();

  const totalFuelCost = vehicle.fuelRecords.reduce((s, r) => s + r.totalCost, 0);
  const totalMaintenanceCost = vehicle.maintenanceRecords.reduce((s, r) => s + r.cost, 0);
  const totalTrips = vehicle.dispatchJobs.filter(j => j.status === "delivered").length;
  const insuranceExpired = vehicle.insuranceExpiry && new Date(vehicle.insuranceExpiry) < new Date();

  return (
    <div className="slide-in">
      <Link href="/vehicles" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 16 }}>
        <ArrowLeft size={14} /> Back to Vehicles
      </Link>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "monospace" }}>{vehicle.plateNumber}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "4px 0 0" }}>
            {vehicle.year} {vehicle.make} {vehicle.model} · {vehicle.fuelType} · {vehicle.capacityLitres.toLocaleString()}L
          </p>
        </div>
        <span className={`ff-badge ${STATUS_COLOR[vehicle.status] ?? "ff-badge-gray"}`} style={{ fontSize: 12 }}>
          {vehicle.status.replace(/_/g, " ")}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Total Trips", value: totalTrips, color: "#2563eb" },
          { label: "Odometer", value: `${vehicle.odometerKm.toLocaleString()} km`, color: "#7c3aed" },
          { label: "Fuel Cost", value: `KES ${(totalFuelCost / 1000).toFixed(0)}K`, color: "#d97706" },
          { label: "Maintenance", value: `KES ${(totalMaintenanceCost / 1000).toFixed(0)}K`, color: "#dc2626" },
        ].map(({ label, value, color }) => (
          <div key={label} className="ff-card" style={{ padding: "12px 14px" }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>{label}</p>
            <p style={{ fontSize: 18, fontWeight: 700, margin: 0, color }}>{value}</p>
          </div>
        ))}
      </div>

      {insuranceExpired && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#dc2626", fontWeight: 600 }}>
          ⚠ Insurance expired on {new Date(vehicle.insuranceExpiry!).toLocaleDateString("en-KE")} — renew immediately.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="ff-card">
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", margin: "0 0 12px" }}>VEHICLE DETAILS</h3>
          {[
            { label: "Make / Model", value: `${vehicle.make} ${vehicle.model}` },
            { label: "Year", value: vehicle.year },
            { label: "Type", value: vehicle.vehicleType?.name ?? "General" },
            { label: "Fuel Type", value: vehicle.fuelType },
            { label: "Capacity", value: `${vehicle.capacityLitres.toLocaleString()} litres` },
            { label: "Colour", value: vehicle.color ?? "—" },
            { label: "Insurance Expiry", value: vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry).toLocaleDateString("en-KE") : "—" },
            { label: "Next Service at", value: vehicle.nextServiceKm ? `${vehicle.nextServiceKm.toLocaleString()} km` : "—" },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>{String(value)}</span>
            </div>
          ))}
        </div>

        <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
            <Wrench size={14} color="#d97706" />
            <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Maintenance</h3>
          </div>
          {vehicle.maintenanceRecords.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No records</div>
          ) : (
            <table className="ff-table">
              <thead><tr><th>Date</th><th>Type</th><th>Cost</th><th>Status</th></tr></thead>
              <tbody>
                {vehicle.maintenanceRecords.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontSize: 11.5, whiteSpace: "nowrap" }}>{new Date(r.date).toLocaleDateString("en-KE")}</td>
                    <td style={{ textTransform: "capitalize" }}>{r.type}</td>
                    <td style={{ fontWeight: 700 }}>KES {r.cost.toLocaleString()}</td>
                    <td><span className={`ff-badge ${r.status === "completed" ? "ff-badge-green" : "ff-badge-yellow"}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="ff-card" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
          <Fuel size={14} color="#2563eb" />
          <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Fuel Records</h3>
        </div>
        {vehicle.fuelRecords.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No fuel records</div>
        ) : (
          <table className="ff-table">
            <thead><tr><th>Date</th><th>Litres</th><th>Cost/L</th><th>Total</th><th>Odometer</th><th>Station</th></tr></thead>
            <tbody>
              {vehicle.fuelRecords.map(r => (
                <tr key={r.id}>
                  <td style={{ fontSize: 11.5, whiteSpace: "nowrap" }}>{new Date(r.date).toLocaleDateString("en-KE")}</td>
                  <td>{r.litres.toFixed(0)}L</td>
                  <td>KES {r.costPerLitre.toFixed(2)}</td>
                  <td style={{ fontWeight: 700 }}>KES {r.totalCost.toLocaleString()}</td>
                  <td style={{ color: "var(--text-muted)" }}>{r.odometerKm.toLocaleString()} km</td>
                  <td style={{ color: "var(--text-muted)" }}>{r.station ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
          <TankerTruckIcon size={14} color="#7c3aed" />
          <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Trip History</h3>
        </div>
        {vehicle.dispatchJobs.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No trips</div>
        ) : (
          <table className="ff-table">
            <thead><tr><th>Order</th><th>Customer</th><th>Driver</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {vehicle.dispatchJobs.map(j => (
                <tr key={j.id}>
                  <td><Link href={`/orders/${j.orderId}`} style={{ fontFamily: "monospace", fontSize: 12, color: "#2563eb", textDecoration: "none", fontWeight: 700 }}>{j.order.orderNumber}</Link></td>
                  <td>{j.order.customer.name}</td>
                  <td style={{ color: "var(--text-muted)" }}>{j.driver?.name ?? "—"}</td>
                  <td><span className="ff-badge ff-badge-gray" style={{ textTransform: "capitalize" }}>{j.status.replace(/_/g, " ")}</span></td>
                  <td style={{ fontSize: 11.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{new Date(j.createdAt).toLocaleDateString("en-KE")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
