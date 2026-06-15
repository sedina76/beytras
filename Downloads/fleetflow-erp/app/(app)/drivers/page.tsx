import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Plus, UserCheck, Phone, Star, MapPin } from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  available: "ff-badge-green", on_trip: "ff-badge-blue",
  off_duty: "ff-badge-gray", suspended: "ff-badge-red",
};

export default async function DriversPage() {
  const session = await getSession();
  if (!session?.organizationId) return null;

  const drivers = await prisma.driver.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { name: "asc" },
    include: {
      locations: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { dispatchJobs: true } },
    },
  });

  const stats = {
    total: drivers.length,
    available: drivers.filter(d => d.status === "available").length,
    onTrip: drivers.filter(d => d.status === "on_trip").length,
    suspended: drivers.filter(d => d.status === "suspended").length,
  };

  return (
    <div className="slide-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Drivers</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "3px 0 0" }}>{drivers.length} registered drivers</p>
        </div>
        <Link href="/drivers/new" className="ff-btn ff-btn-primary"><Plus size={14}/> Add Driver</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Total Drivers", value: stats.total, color: "#2563eb" },
          { label: "Available", value: stats.available, color: "#16a34a" },
          { label: "On Trip", value: stats.onTrip, color: "#7c3aed" },
          { label: "Suspended", value: stats.suspended, color: "#dc2626" },
        ].map(({ label, value, color }) => (
          <div key={label} className="ff-card" style={{ padding: "12px 14px" }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>{label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
        {drivers.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <UserCheck size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
            <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 12px" }}>No drivers registered</p>
            <Link href="/drivers/new" className="ff-btn ff-btn-primary">Add First Driver</Link>
          </div>
        ) : (
          <table className="ff-table">
            <thead><tr><th>Driver</th><th>Phone</th><th>License</th><th>Rating</th><th>Trips</th><th>Last Seen</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {drivers.map(d => (
                <tr key={d.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                        {d.name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <Link href={`/drivers/${d.id}`} style={{ fontWeight: 600, color: "var(--text-primary)", textDecoration: "none" }}>{d.name}</Link>
                        {d.email && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{d.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td><div style={{ display:"flex",alignItems:"center",gap:4,color:"var(--text-secondary)" }}><Phone size={11}/>{d.phone}</div></td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{d.licenseNumber}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Star size={11} color="#f59e0b" fill="#f59e0b" />
                      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{d.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: "var(--accent)" }}>{d.totalTrips}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: 11.5 }}>
                    {d.locations[0] ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={10} color="#22c55e" />
                        {new Date(d.locations[0].createdAt).toLocaleString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    ) : "Never"}
                  </td>
                  <td><span className={`ff-badge ${STATUS_COLOR[d.status] ?? "ff-badge-gray"}`}>{d.status.replace(/_/g," ")}</span></td>
                  <td><Link href={`/drivers/${d.id}`} className="ff-btn ff-btn-ghost ff-btn-sm">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
