import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Plus, Building2, AlertCircle } from "lucide-react";
import TankerTruckIcon from "@/components/TankerTruckIcon";

const STATUS_COLOR: Record<string, string> = {
  available: "ff-badge-green", on_trip: "ff-badge-blue",
  maintenance: "ff-badge-yellow", off_duty: "ff-badge-gray",
};

export default async function VehiclesPage() {
  const session = await getSession();
  if (!session?.organizationId) return null;

  const vehicles = await prisma.vehicle.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { plateNumber: "asc" },
    include: { vehicleType: true, _count: { select: { dispatchJobs: true } } },
  });

  const owned  = vehicles.filter(v => v.ownership !== "leased");
  const leased = vehicles.filter(v => v.ownership === "leased");

  const monthlyLeaseCost = leased.reduce((s, v) => s + (v.leaseMonthlyRate ?? 0), 0);

  const stats = [
    { label: "Total Fleet",      value: vehicles.length,                         color: "#2563eb" },
    { label: "Company Owned",    value: owned.length,                             color: "#16a34a" },
    { label: "Leased",           value: leased.length,                            color: "#d97706" },
    { label: "Monthly Lease Cost", value: `KES ${monthlyLeaseCost.toLocaleString()}`, color: "#dc2626" },
  ];

  const today = new Date();

  function VehicleTable({ rows, showLease }: { rows: typeof vehicles; showLease: boolean }) {
    if (rows.length === 0) return (
      <div style={{ padding: "30px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
        No vehicles in this category
      </div>
    );
    return (
      <table className="ff-table">
        <thead>
          <tr>
            <th>Plate</th>
            <th>Make / Model</th>
            <th>Year</th>
            <th>Capacity</th>
            {showLease && <th>Leasing Company</th>}
            {showLease && <th>Lease Expiry</th>}
            {showLease && <th>Monthly Rate</th>}
            <th>Odometer</th>
            <th>Trips</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(v => {
            const leaseExpiry = v.leaseExpiry ? new Date(v.leaseExpiry) : null;
            const leaseExpiringSoon = leaseExpiry && (leaseExpiry.getTime() - today.getTime()) < 30 * 24 * 60 * 60 * 1000;
            const leaseExpired = leaseExpiry && leaseExpiry < today;

            return (
              <tr key={v.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: showLease ? "#ffedd5" : "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <TankerTruckIcon size={14} color={showLease ? "#c2410c" : "#2563eb"} />
                    </div>
                    <span style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 13 }}>{v.plateNumber}</span>
                  </div>
                </td>
                <td style={{ fontWeight: 500 }}>{v.make} {v.model}</td>
                <td style={{ color: "var(--text-muted)" }}>{v.year}</td>
                <td>{v.capacityLitres > 0 ? `${v.capacityLitres.toLocaleString()} L` : "—"}</td>
                {showLease && (
                  <td style={{ fontSize: 12.5 }}>
                    {v.leaseCompany ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Building2 size={12} color="var(--text-muted)" />
                        {v.leaseCompany}
                      </div>
                    ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                )}
                {showLease && (
                  <td>
                    {leaseExpiry ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        {(leaseExpired || leaseExpiringSoon) && (
                          <AlertCircle size={12} color={leaseExpired ? "#dc2626" : "#d97706"} />
                        )}
                        <span style={{
                          fontSize: 12, fontWeight: leaseExpired || leaseExpiringSoon ? 700 : 400,
                          color: leaseExpired ? "#dc2626" : leaseExpiringSoon ? "#d97706" : "var(--text-muted)",
                        }}>
                          {leaseExpiry.toLocaleDateString("en-KE")}
                          {leaseExpired && <span style={{ marginLeft: 4, fontSize: 10 }}>EXPIRED</span>}
                          {!leaseExpired && leaseExpiringSoon && <span style={{ marginLeft: 4, fontSize: 10 }}>SOON</span>}
                        </span>
                      </div>
                    ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                )}
                {showLease && (
                  <td style={{ fontWeight: 600, color: "#dc2626" }}>
                    {v.leaseMonthlyRate ? `KES ${v.leaseMonthlyRate.toLocaleString()}/mo` : "—"}
                  </td>
                )}
                <td style={{ color: "var(--text-muted)" }}>{v.odometerKm.toLocaleString()} km</td>
                <td style={{ fontWeight: 600, color: "var(--accent)" }}>{v._count.dispatchJobs}</td>
                <td><span className={`ff-badge ${STATUS_COLOR[v.status] ?? "ff-badge-gray"}`}>{v.status.replace(/_/g, " ")}</span></td>
                <td><Link href={`/vehicles/${v.id}`} className="ff-btn ff-btn-ghost ff-btn-sm">View</Link></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <div className="slide-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Fleet Vehicles</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "3px 0 0" }}>{vehicles.length} vehicles in fleet</p>
        </div>
        <Link href="/vehicles/new" className="ff-btn ff-btn-primary"><Plus size={14}/> Add Vehicle</Link>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {stats.map(({ label, value, color }) => (
          <div key={label} className="ff-card" style={{ padding: "12px 14px" }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>{label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Owned Fleet ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#16a34a" }} />
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Company-Owned Fleet</h2>
          <span className="ff-badge ff-badge-green">{owned.length}</span>
        </div>
        <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
          {vehicles.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <TankerTruckIcon size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
              <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 12px" }}>No vehicles yet</p>
              <Link href="/vehicles/new" className="ff-btn ff-btn-primary">Add First Vehicle</Link>
            </div>
          ) : (
            <VehicleTable rows={owned} showLease={false} />
          )}
        </div>
      </div>

      {/* ── Leased Fleet ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#d97706" }} />
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Leased Fleet</h2>
          <span className="ff-badge ff-badge-orange">{leased.length}</span>
          {monthlyLeaseCost > 0 && (
            <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, marginLeft: 4 }}>
              Total: KES {monthlyLeaseCost.toLocaleString()}/mo
            </span>
          )}
        </div>
        <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
          <VehicleTable rows={leased} showLease={true} />
        </div>
      </div>
    </div>
  );
}
