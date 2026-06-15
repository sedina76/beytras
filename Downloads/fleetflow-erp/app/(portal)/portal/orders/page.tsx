import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Package, Clock, Phone } from "lucide-react";
import TankerTruckIcon from "@/components/TankerTruckIcon";

const STATUS_COLOR: Record<string, string> = {
  pending: "ff-badge-yellow", confirmed: "ff-badge-blue", dispatched: "ff-badge-blue",
  in_progress: "ff-badge-orange", delivered: "ff-badge-green", cancelled: "ff-badge-red",
};
const JOB_LABEL: Record<string, string> = {
  unassigned: "Awaiting dispatch", assigned: "Driver assigned", en_route_source: "Heading to source",
  loading: "Loading", en_route_customer: "On the way", arrived: "Driver arrived",
  delivered: "Delivered", cancelled: "Cancelled",
};
const PRIORITY_COLOR: Record<string, string> = {
  low: "ff-badge-gray", normal: "ff-badge-blue", high: "ff-badge-orange", urgent: "ff-badge-red",
};

export default async function PortalOrdersPage() {
  const session = await getSession();
  if (!session?.organizationId) return null;

  const portalAccount = await prisma.customerPortalAccount.findFirst({
    where: { email: session.email, organizationId: session.organizationId },
    select: { customerId: true },
  });

  if (!portalAccount) return null;

  const orders = await prisma.order.findMany({
    where: { customerId: portalAccount.customerId, organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      dispatchJob: {
        select: {
          status: true,
          driver: { select: { name: true, phone: true } },
          vehicle: { select: { plateNumber: true } },
          completedAt: true,
        },
      },
    },
  });

  return (
    <div className="slide-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>My Orders</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "3px 0 0" }}>
          {orders.length} order{orders.length !== 1 ? "s" : ""} total
        </p>
      </div>

      {/* Contact notice */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
        <Phone size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ margin: 0, fontSize: 13, color: "#1e40af", lineHeight: 1.5 }}>
          Please contact our office to create a new transport order.
        </p>
      </div>

      <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
        {orders.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <Package size={44} color="var(--text-muted)" style={{ marginBottom: 12 }} />
            <p style={{ color: "var(--text-muted)", fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>No orders yet</p>
            <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
              Contact our office to place your first transport order.
            </p>
          </div>
        ) : (
          <div>
            {orders.map(o => (
              <div key={o.id} style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 13 }}>{o.orderNumber}</span>
                      <span className={`ff-badge ${STATUS_COLOR[o.status] ?? "ff-badge-gray"}`} style={{ textTransform: "capitalize" }}>{o.status}</span>
                      <span className={`ff-badge ${PRIORITY_COLOR[o.priority] ?? "ff-badge-gray"}`} style={{ textTransform: "capitalize" }}>{o.priority}</span>
                      {o.dispatchJob && (
                        <span className="ff-badge ff-badge-blue" style={{ fontSize: 10.5 }}>
                          {JOB_LABEL[o.dispatchJob.status] ?? o.dispatchJob.status}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px", fontSize: 13, color: "var(--text-secondary)" }}>
                      <span style={{ textTransform: "capitalize" }}><strong>{o.productType}</strong></span>
                      <span>{o.quantityOrdered.toLocaleString()} {o.unit}</span>
                      {o.totalAmount > 0 && (
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>KES {o.totalAmount.toLocaleString()}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>📍 {o.deliveryAddress}</div>
                    {o.dispatchJob?.driver && (
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
                        <TankerTruckIcon size={11} />
                        {o.dispatchJob.driver.name}
                        {o.dispatchJob.driver.phone && (
                          <a href={`tel:${o.dispatchJob.driver.phone}`} style={{ color: "#2563eb", textDecoration: "none" }}>
                            {o.dispatchJob.driver.phone}
                          </a>
                        )}
                        {o.dispatchJob.vehicle && <span>· {o.dispatchJob.vehicle.plateNumber}</span>}
                      </div>
                    )}
                    {o.notes && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>📝 {o.notes}</div>}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                      <Clock size={10} style={{ marginRight: 3, verticalAlign: "middle" }} />
                      {new Date(o.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    {o.scheduledAt && (
                      <div style={{ fontSize: 11, color: "#7c3aed", marginTop: 2 }}>
                        📅 {new Date(o.scheduledAt).toLocaleDateString("en-KE")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
