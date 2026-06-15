import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Package, FileText, CheckCircle2, Clock } from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  pending: "ff-badge-yellow", confirmed: "ff-badge-blue", dispatched: "ff-badge-blue",
  in_progress: "ff-badge-orange", delivered: "ff-badge-green", cancelled: "ff-badge-red",
};
const JOB_STATUS_LABEL: Record<string, string> = {
  unassigned: "Awaiting dispatch", assigned: "Driver assigned", en_route_source: "Heading to source",
  loading: "Loading cargo", en_route_customer: "On the way to you", arrived: "Driver arrived",
  delivered: "Delivered", cancelled: "Cancelled",
};

export default async function PortalDashboardPage() {
  const session = await getSession();
  if (!session?.organizationId) return null;

  // Find customer by portal account
  const portalAccount = await prisma.customerPortalAccount.findFirst({
    where: { email: session.email, organizationId: session.organizationId },
    include: {
      customer: {
        include: {
          orders: {
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { dispatchJob: { select: { status: true, driver: { select: { name: true, phone: true } } } } },
          },
          invoices: { where: { status: { not: "paid" } }, take: 3 },
        },
      },
    },
  });

  const customer = portalAccount?.customer;
  if (!customer) return <div style={{ padding: 40, textAlign: "center" }}>Account not found. Contact support.</div>;

  const activeOrder = customer.orders.find(o => !["delivered", "cancelled"].includes(o.status));
  const totalOrders = customer.orders.length;
  const unpaidInvoices = customer.invoices.length;

  return (
    <div className="slide-in">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Welcome back, {customer.name}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "4px 0 0" }}>{customer.address}, {customer.city}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Recent Orders", value: totalOrders, color: "#2563eb", icon: Package },
          { label: "Unpaid Invoices", value: unpaidInvoices, color: unpaidInvoices > 0 ? "#dc2626" : "#16a34a", icon: FileText },
          { label: "Balance", value: `KES ${customer.balance.toLocaleString()}`, color: customer.balance > 0 ? "#dc2626" : "#16a34a", icon: CheckCircle2 },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="ff-card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 3px" }}>{label}</p>
              <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {activeOrder && (
        <div className="ff-card" style={{ marginBottom: 20, background: "linear-gradient(135deg,#eff6ff,#f5f3ff)", border: "1px solid #c7d2fe" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div className="pulse-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb" }} />
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#2563eb" }}>Active Order</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 3px" }}>Order Number</p>
              <p style={{ fontSize: 14, fontWeight: 700, margin: 0, fontFamily: "monospace" }}>{activeOrder.orderNumber}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 3px" }}>Product</p>
              <p style={{ fontSize: 14, fontWeight: 700, margin: 0, textTransform: "capitalize" }}>{activeOrder.productType}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 3px" }}>Quantity</p>
              <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{activeOrder.quantityOrdered.toLocaleString()} {activeOrder.unit}</p>
            </div>
          </div>
          {activeOrder.dispatchJob && (
            <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(37,99,235,0.07)", borderRadius: 8 }}>
              <p style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, margin: "0 0 3px" }}>
                Status: {JOB_STATUS_LABEL[activeOrder.dispatchJob.status] ?? activeOrder.dispatchJob.status}
              </p>
              {activeOrder.dispatchJob.driver && (
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                  Driver: {activeOrder.dispatchJob.driver.name}
                  {activeOrder.dispatchJob.driver.phone && (
                    <a href={`tel:${activeOrder.dispatchJob.driver.phone}`} style={{ marginLeft: 8, color: "#2563eb" }}>
                      {activeOrder.dispatchJob.driver.phone}
                    </a>
                  )}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Recent Orders</h2>
          <Link href="/portal/orders" style={{ fontSize: 12.5, color: "#2563eb", textDecoration: "none" }}>View all →</Link>
        </div>
        {customer.orders.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <Clock size={32} color="var(--text-muted)" style={{ marginBottom: 8 }} />
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No orders yet</p>
          </div>
        ) : (
          <table className="ff-table">
            <thead><tr><th>Order #</th><th>Product</th><th>Quantity</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {customer.orders.map(o => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 12 }}>{o.orderNumber}</td>
                  <td style={{ textTransform: "capitalize" }}>{o.productType}</td>
                  <td>{o.quantityOrdered.toLocaleString()} {o.unit}</td>
                  <td style={{ fontWeight: 600 }}>KES {o.totalAmount.toLocaleString()}</td>
                  <td><span className={`ff-badge ${STATUS_COLOR[o.status] ?? "ff-badge-gray"}`} style={{ textTransform: "capitalize" }}>{o.status}</span></td>
                  <td style={{ fontSize: 11.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{new Date(o.createdAt).toLocaleDateString("en-KE")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
