import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Mail, MapPin, Star } from "lucide-react";

const JOB_COLOR: Record<string, string> = {
  delivered: "ff-badge-green", en_route_customer: "ff-badge-blue", loading: "ff-badge-yellow",
  cancelled: "ff-badge-red", failed: "ff-badge-red", assigned: "ff-badge-gray",
};

export default async function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.organizationId) return null;

  const driver = await prisma.driver.findFirst({
    where: { id, organizationId: session.organizationId },
    include: {
      dispatchJobs: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { order: { include: { customer: { select: { name: true } } } }, vehicle: { select: { plateNumber: true } } },
      },
      locations: { orderBy: { createdAt: "desc" }, take: 1 },
      user: { select: { email: true, lastLoginAt: true } },
    },
  });

  if (!driver) notFound();

  const lastLocation = driver.locations[0];
  const deliveries = driver.dispatchJobs.filter(j => j.status === "delivered").length;
  const expired = new Date(driver.licenseExpiry) < new Date();

  return (
    <div className="slide-in">
      <Link href="/drivers" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 16 }}>
        <ArrowLeft size={14} /> Back to Drivers
      </Link>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "#fff", fontSize: 24, fontWeight: 700 }}>{driver.name[0]}</span>
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>{driver.name}</h1>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className={`ff-badge ${driver.status === "available" ? "ff-badge-green" : driver.status === "on_trip" ? "ff-badge-blue" : "ff-badge-gray"}`} style={{ textTransform: "capitalize" }}>
              {driver.status.replace(/_/g, " ")}
            </span>
            <span style={{ color: "#d97706", fontWeight: 700, fontSize: 13 }}>
              {"★".repeat(Math.round(driver.rating))} {driver.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="ff-card">
            <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", margin: "0 0 12px" }}>CONTACT</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a href={`tel:${driver.phone}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#2563eb", textDecoration: "none" }}>
                <Phone size={14} /> {driver.phone}
              </a>
              {driver.email && (
                <a href={`mailto:${driver.email}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#2563eb", textDecoration: "none" }}>
                  <Mail size={14} /> {driver.email}
                </a>
              )}
            </div>
          </div>

          <div className="ff-card">
            <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", margin: "0 0 12px" }}>LICENSE</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Number</span>
                <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700 }}>{driver.licenseNumber}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Expiry</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: expired ? "#dc2626" : "#16a34a" }}>
                  {new Date(driver.licenseExpiry).toLocaleDateString("en-KE")}
                  {expired && " ⚠ EXPIRED"}
                </span>
              </div>
            </div>
          </div>

          <div className="ff-card">
            <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", margin: "0 0 12px" }}>STATS</h3>
            {[
              { label: "Total Trips", value: driver.totalTrips },
              { label: "Deliveries", value: deliveries },
              { label: "Rating", value: `${driver.rating.toFixed(1)} / 5.0` },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{value}</span>
              </div>
            ))}
          </div>

          {lastLocation && (
            <div className="ff-card">
              <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", margin: "0 0 10px" }}>LAST LOCATION</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <MapPin size={14} color="#16a34a" />
                <span style={{ fontFamily: "monospace", fontSize: 12 }}>{lastLocation.lat.toFixed(4)}, {lastLocation.lng.toFixed(4)}</span>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{new Date(lastLocation.createdAt).toLocaleString("en-KE")}</p>
              <a
                href={`https://maps.google.com/?q=${lastLocation.lat},${lastLocation.lng}`}
                target="_blank" rel="noreferrer"
                style={{ display: "inline-block", marginTop: 8, fontSize: 12, color: "#2563eb", textDecoration: "none" }}
              >
                View on Google Maps →
              </a>
            </div>
          )}
        </div>

        <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Trip History</h3>
          </div>
          {driver.dispatchJobs.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>No trips yet</div>
          ) : (
            <table className="ff-table">
              <thead><tr><th>Order #</th><th>Customer</th><th>Vehicle</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {driver.dispatchJobs.map(j => (
                  <tr key={j.id}>
                    <td>
                      <Link href={`/orders/${j.orderId}`} style={{ fontFamily: "monospace", fontSize: 12, color: "#2563eb", textDecoration: "none", fontWeight: 700 }}>
                        {j.order.orderNumber}
                      </Link>
                    </td>
                    <td>{j.order.customer.name}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{j.vehicle?.plateNumber ?? "—"}</td>
                    <td><span className={`ff-badge ${JOB_COLOR[j.status] ?? "ff-badge-gray"}`} style={{ textTransform: "capitalize" }}>{j.status.replace(/_/g, " ")}</span></td>
                    <td style={{ fontSize: 11.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{new Date(j.createdAt).toLocaleDateString("en-KE")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
