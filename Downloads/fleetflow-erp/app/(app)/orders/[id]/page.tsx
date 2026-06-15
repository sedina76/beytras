import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Package, User, FileText } from "lucide-react";
import TankerTruckIcon from "@/components/TankerTruckIcon";
import CancelOrderModal from "@/components/CancelOrderModal";
import CreateDispatchJobButton from "@/components/CreateDispatchJobButton";

const STATUS_COLOR: Record<string, string> = {
  pending: "ff-badge-yellow", confirmed: "ff-badge-blue", dispatched: "ff-badge-blue",
  in_progress: "ff-badge-orange", delivered: "ff-badge-green", cancelled: "ff-badge-red",
};
const JOB_STATUS_COLOR: Record<string, string> = {
  unassigned: "ff-badge-gray", assigned: "ff-badge-blue", en_route_source: "ff-badge-orange",
  loading: "ff-badge-yellow", en_route_customer: "ff-badge-blue", arrived: "ff-badge-purple",
  delivered: "ff-badge-green", cancelled: "ff-badge-red",
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.organizationId) return null;

  const order = await prisma.order.findFirst({
    where: { id, organizationId: session.organizationId },
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true } },
      dispatchJob: {
        include: {
          driver: { select: { id: true, name: true, phone: true } },
          vehicle: { select: { plateNumber: true, make: true, model: true } },
          proofOfDelivery: true,
        },
      },
      invoice: { select: { id: true, invoiceNumber: true, totalAmount: true, status: true } },
    },
  });

  if (!order) notFound();
  const job = order.dispatchJob;

  return (
    <div className="slide-in">
      <div style={{ marginBottom: 20 }}>
        <Link href="/orders" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 8 }}>
          <ArrowLeft size={14} /> Back to Sales
        </Link>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "monospace" }}>{order.orderNumber}</h1>
            <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "3px 0 0", textTransform: "capitalize" }}>
              {order.productType} delivery · {order.priority} priority
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={`ff-badge ${STATUS_COLOR[order.status] ?? "ff-badge-gray"}`} style={{ fontSize: 12 }}>Order: {order.status}</span>
            {job && <span className={`ff-badge ${JOB_STATUS_COLOR[job.status] ?? "ff-badge-gray"}`} style={{ fontSize: 12 }}>Job: {job.status.replace(/_/g, " ")}</span>}
            <CancelOrderModal orderId={order.id} orderNumber={order.orderNumber} status={order.status} />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="ff-card">
          <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 12px", color: "var(--text-muted)" }}>SALE DETAILS</h3>
          {[
            { label: "Customer", value: order.customer.name },
            { label: "Product", value: `${order.productType} (${order.type})` },
            { label: "Quantity", value: `${order.quantityOrdered.toLocaleString()} ${order.unit}` },
            { label: "Amount", value: `KES ${order.totalAmount.toLocaleString()}` },
            { label: "Scheduled", value: order.scheduledAt ? new Date(order.scheduledAt).toLocaleString("en-KE") : "ASAP" },
            { label: "Created", value: new Date(order.createdAt).toLocaleString("en-KE") },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>{value}</span>
            </div>
          ))}
          {order.notes && (
            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>NOTES</p>
              <p style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>{order.notes}</p>
            </div>
          )}
        </div>

        <div className="ff-card">
          <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 12px", color: "var(--text-muted)" }}>DELIVERY INFO</h3>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
            <MapPin size={14} color="#2563eb" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{order.deliveryAddress}</p>
              {order.deliveryLat && order.deliveryLng && (
                <a
                  href={`https://maps.google.com/?q=${order.deliveryLat},${order.deliveryLng}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 11.5, color: "#2563eb", textDecoration: "none" }}
                >
                  Open in Google Maps
                </a>
              )}
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", margin: "0 0 8px" }}>CUSTOMER</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={16} color="#2563eb" />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{order.customer.name}</p>
                {order.customer.phone && <a href={`tel:${order.customer.phone}`} style={{ fontSize: 12, color: "#2563eb", textDecoration: "none" }}>{order.customer.phone}</a>}
              </div>
            </div>
          </div>

          {job && (
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", margin: "0 0 8px" }}>DISPATCH</p>
              {job.driver && (
                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  <TankerTruckIcon size={14} color="var(--text-muted)" style={{ marginTop: 2 }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{job.driver.name}</p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>{job.driver.phone}</p>
                  </div>
                </div>
              )}
              {job.vehicle && (
                <div style={{ display: "flex", gap: 6 }}>
                  <Package size={14} color="var(--text-muted)" style={{ marginTop: 2 }} />
                  <p style={{ fontSize: 13, margin: 0 }}>{job.vehicle.plateNumber} — {job.vehicle.make} {job.vehicle.model}</p>
                </div>
              )}
              {job.completedAt && (
                <p style={{ fontSize: 12, color: "#16a34a", marginTop: 8, fontWeight: 600 }}>
                  ✓ Delivered at {new Date(job.completedAt).toLocaleString("en-KE")}
                </p>
              )}
            </div>
          )}
        </div>

        {!job && !["cancelled", "delivered"].includes(order.status) && (
          <div className="ff-card" style={{ gridColumn: "1/-1", borderLeft: "4px solid #d97706", background: "#fffbeb" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#92400e", margin: "0 0 4px" }}>No dispatch job linked</p>
                <p style={{ fontSize: 12, color: "#a16207", margin: 0 }}>
                  This order won't appear in Dispatch until a job is created.
                </p>
              </div>
              <CreateDispatchJobButton orderId={order.id} />
            </div>
          </div>
        )}

        {order.invoice ? (
          <div className="ff-card" style={{ gridColumn: "1/-1", borderLeft: "4px solid #16a34a" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileText size={18} color="#16a34a" />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 2px" }}>INVOICE GENERATED</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 700 }}>{order.invoice.invoiceNumber}</span>
                    <span className={`ff-badge ${order.invoice.status === "paid" ? "ff-badge-green" : order.invoice.status === "overdue" ? "ff-badge-red" : "ff-badge-yellow"}`}>
                      {order.invoice.status}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, margin: "2px 0 0", color: "#16a34a" }}>KES {order.invoice.totalAmount.toLocaleString()}</p>
                </div>
              </div>
              <Link href={`/invoices/${order.invoice.id}`} className="ff-btn ff-btn-primary" style={{ gap: 6 }}>
                <FileText size={13}/> View Invoice
              </Link>
            </div>
          </div>
        ) : order.status === "delivered" ? (
          <div className="ff-card" style={{ gridColumn: "1/-1", background: "#fefce8", borderLeft: "4px solid #d97706" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FileText size={16} color="#d97706" />
              <p style={{ fontSize: 13, color: "#92400e", margin: 0 }}>Invoice generation pending — refresh the page in a moment.</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
