import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { MapPin, CheckCircle2 } from "lucide-react";
import TankerTruckIcon from "@/components/TankerTruckIcon";

const STATUS_COLOR: Record<string, string> = {
  delivered: "ff-badge-green", en_route_customer: "ff-badge-blue", loading: "ff-badge-yellow",
  en_route_source: "ff-badge-orange", arrived: "ff-badge-purple", assigned: "ff-badge-gray",
};

export default async function DeliveriesPage() {
  const session = await getSession();
  if (!session?.organizationId) return null;

  const jobs = await prisma.dispatchJob.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      order: {
        include: { customer: { select: { name: true } } },
      },
      driver: { select: { name: true } },
      vehicle: { select: { plateNumber: true } },
    },
  });

  const delivered = jobs.filter(j => j.status === "delivered");
  const active = jobs.filter(j => !["delivered", "cancelled", "failed", "unassigned"].includes(j.status));

  return (
    <div className="slide-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Deliveries</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "3px 0 0" }}>{jobs.length} total delivery jobs</p>
        </div>
        <Link href="/dispatch" className="ff-btn ff-btn-primary"><TankerTruckIcon size={14} /> Go to Dispatch</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Total Jobs", value: jobs.length, color: "#2563eb" },
          { label: "Active", value: active.length, color: "#d97706" },
          { label: "Delivered", value: delivered.length, color: "#16a34a" },
          { label: "Cancelled", value: jobs.filter(j => j.status === "cancelled").length, color: "#dc2626" },
        ].map(({ label, value, color }) => (
          <div key={label} className="ff-card" style={{ padding: "12px 14px" }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>{label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
        {jobs.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <TankerTruckIcon size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No delivery jobs yet</p>
          </div>
        ) : (
          <table className="ff-table">
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Driver</th><th>Vehicle</th><th>Address</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {jobs.map(j => (
                <tr key={j.id}>
                  <td>
                    <Link href={`/orders/${j.orderId}`} style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 12, color: "#2563eb", textDecoration: "none" }}>
                      {j.order.orderNumber}
                    </Link>
                  </td>
                  <td style={{ fontWeight: 500 }}>{j.order.customer.name}</td>
                  <td style={{ color: "var(--text-muted)" }}>{j.driver?.name ?? "Unassigned"}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{j.vehicle?.plateNumber ?? "—"}</td>
                  <td style={{ maxWidth: 160 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, color: "var(--text-muted)" }}>
                      <MapPin size={10} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.order.deliveryAddress}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`ff-badge ${STATUS_COLOR[j.status] ?? "ff-badge-gray"}`} style={{ textTransform: "capitalize", whiteSpace: "nowrap" }}>
                      {j.status === "delivered" && <CheckCircle2 size={10} style={{ marginRight: 3, verticalAlign: "middle" }} />}
                      {j.status.replace(/_/g, " ")}
                    </span>
                  </td>
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
