import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Plus, ClipboardList, ArrowUpRight, Droplets, Fuel, Package } from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  pending: "ff-badge-yellow", confirmed: "ff-badge-blue", dispatched: "ff-badge-blue",
  in_progress: "ff-badge-purple", delivered: "ff-badge-green", cancelled: "ff-badge-red",
};
const PRIORITY_COLOR: Record<string, string> = {
  low: "ff-badge-gray", normal: "ff-badge-blue", high: "ff-badge-orange", urgent: "ff-badge-red",
};
const PRODUCT_ICON: Record<string, React.ReactNode> = {
  water: <Droplets size={13} color="#2563eb" />,
  fuel: <Fuel size={13} color="#d97706" />,
  goods: <Package size={13} color="#7c3aed" />,
};

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; search?: string }> }) {
  const session = await getSession();
  if (!session?.organizationId) return null;
  const { status = "", search = "" } = await searchParams;

  const orders = await prisma.order.findMany({
    where: {
      organizationId: session.organizationId,
      ...(status ? { status } : {}),
      ...(search ? { orderNumber: { contains: search } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true, phone: true } },
      dispatchJob: { include: { driver: { select: { name: true } }, vehicle: { select: { plateNumber: true } } } },
    },
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    active: orders.filter(o => ["dispatched","in_progress"].includes(o.status)).length,
    delivered: orders.filter(o => o.status === "delivered").length,
  };

  const STATUSES = ["","pending","confirmed","dispatched","in_progress","delivered","cancelled"];

  return (
    <div className="slide-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Sales</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "3px 0 0" }}>{orders.length} sales</p>
        </div>
        <Link href="/orders/new" className="ff-btn ff-btn-primary"><Plus size={14}/> New Sale</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Total", value: stats.total, color: "#2563eb" },
          { label: "Pending", value: stats.pending, color: "#d97706" },
          { label: "Active / In-Progress", value: stats.active, color: "#7c3aed" },
          { label: "Delivered Today", value: stats.delivered, color: "#16a34a" },
        ].map(({ label, value, color }) => (
          <div key={label} className="ff-card" style={{ padding: "12px 14px" }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>{label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <form style={{ display: "flex", gap: 8 }}>
            <input className="ff-input" name="search" defaultValue={search} placeholder="Search by order #..." style={{ width: 200 }} />
            <select className="ff-input" name="status" defaultValue={status} style={{ width: 160 }}>
              {STATUSES.map(s => <option key={s} value={s}>{s ? s.replace(/_/g," ") : "All Statuses"}</option>)}
            </select>
            <button type="submit" className="ff-btn ff-btn-secondary ff-btn-sm">Filter</button>
          </form>
        </div>

        {orders.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <ClipboardList size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
            <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 12px" }}>No sales found</p>
            <Link href="/orders/new" className="ff-btn ff-btn-primary">Create First Sale</Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="ff-table">
              <thead><tr><th>Sale #</th><th>Customer</th><th>Product</th><th>Quantity</th><th>Priority</th><th>Driver</th><th>Vehicle</th><th>Status</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td><Link href={`/orders/${o.id}`} style={{ color:"var(--accent)",fontWeight:700,textDecoration:"none" }}>{o.orderNumber}</Link></td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{o.customer.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{o.customer.phone}</div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        {PRODUCT_ICON[o.productType] ?? null}
                        <span style={{ textTransform: "capitalize" }}>{o.productType}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{o.quantityOrdered.toLocaleString()} {o.unit}</td>
                    <td><span className={`ff-badge ${PRIORITY_COLOR[o.priority] ?? "ff-badge-gray"}`}>{o.priority}</span></td>
                    <td style={{ color: "var(--text-secondary)" }}>{o.dispatchJob?.driver?.name ?? "—"}</td>
                    <td style={{ color: "var(--text-muted)" }}>{o.dispatchJob?.vehicle?.plateNumber ?? "—"}</td>
                    <td><span className={`ff-badge ${STATUS_COLOR[o.status] ?? "ff-badge-gray"}`}>{o.status.replace(/_/g," ")}</span></td>
                    <td style={{ fontSize: 11.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{new Date(o.createdAt).toLocaleDateString("en-KE")}</td>
                    <td><Link href={`/orders/${o.id}`} className="ff-btn ff-btn-ghost ff-btn-sm"><ArrowUpRight size={13}/></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
