import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Wrench, AlertCircle, CheckCircle2, Clock } from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  completed: "ff-badge-green", in_progress: "ff-badge-blue", scheduled: "ff-badge-yellow",
};

export default async function MaintenancePage() {
  const session = await getSession();
  if (!session?.organizationId) return null;

  const records = await prisma.maintenanceRecord.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { date: "desc" },
    include: { vehicle: { select: { plateNumber: true, make: true, model: true } } },
  });

  const totalCost = records.reduce((s, r) => s + r.cost, 0);
  const scheduled = records.filter(r => r.status === "scheduled").length;

  return (
    <div className="slide-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Fleet Maintenance</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "3px 0 0" }}>{records.length} maintenance records</p>
        </div>
        <Link href="/maintenance/new" className="ff-btn ff-btn-primary"><Wrench size={14}/> Log Maintenance</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { label:"Total Records", value: records.length, color:"#2563eb" },
          { label:"Total Cost", value:`KES ${totalCost.toLocaleString()}`, color:"#dc2626" },
          { label:"Scheduled", value: scheduled, color:"#d97706" },
          { label:"Completed", value: records.filter(r=>r.status==="completed").length, color:"#16a34a" },
        ].map(({ label, value, color }) => (
          <div key={label} className="ff-card" style={{ padding: "12px 14px" }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>{label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
        {records.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <Wrench size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
            <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 12px" }}>No maintenance records</p>
            <Link href="/maintenance/new" className="ff-btn ff-btn-primary">Log First Record</Link>
          </div>
        ) : (
          <table className="ff-table">
            <thead><tr><th>Date</th><th>Vehicle</th><th>Type</th><th>Description</th><th>Cost</th><th>Vendor</th><th>Next Service</th><th>Status</th></tr></thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td style={{ fontSize: 11.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{new Date(r.date).toLocaleDateString("en-KE")}</td>
                  <td style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 12 }}>{r.vehicle.plateNumber}</td>
                  <td><span style={{ textTransform: "capitalize" }} className={`ff-badge ${r.type==="service"?"ff-badge-blue":r.type==="repair"?"ff-badge-orange":"ff-badge-gray"}`}>{r.type}</span></td>
                  <td style={{ maxWidth: 200 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</div>
                  </td>
                  <td style={{ fontWeight: 700, color: "#dc2626" }}>KES {r.cost.toLocaleString()}</td>
                  <td style={{ color: "var(--text-muted)" }}>{r.vendor ?? "—"}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: 11.5 }}>
                    {r.nextServiceDate ? new Date(r.nextServiceDate).toLocaleDateString("en-KE") : r.nextServiceKm ? `${r.nextServiceKm.toLocaleString()} km` : "—"}
                  </td>
                  <td><span className={`ff-badge ${STATUS_COLOR[r.status] ?? "ff-badge-gray"}`}>{r.status.replace(/_/g," ")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
