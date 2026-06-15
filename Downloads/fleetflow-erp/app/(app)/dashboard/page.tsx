import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import {
  Users, UserCheck, ClipboardList, DollarSign,
  Radio, Package, AlertCircle, ArrowUpRight, TrendingUp, TrendingDown, Minus
} from "lucide-react";
import TankerTruckIcon from "@/components/TankerTruckIcon";
import Link from "next/link";

async function getDashboardData(orgId: string) {
  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    customers, vehicles, drivers,
    activeOrders, todayOrders, recentOrders, activeJobs,
    monthPayments, todayPayments,
    pendingInvoices,
    monthFuel, monthExpenses,
    leasedVehiclesAgg,
  ] = await Promise.all([
    prisma.customer.count({ where: { organizationId: orgId, status: "active" } }),
    prisma.vehicle.count({ where: { organizationId: orgId } }),
    prisma.driver.count({ where: { organizationId: orgId } }),
    prisma.order.count({ where: { organizationId: orgId, status: { in: ["pending","confirmed","dispatched","in_progress"] } } }),
    prisma.order.count({ where: { organizationId: orgId, createdAt: { gte: today } } }),
    prisma.order.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { customer: { select: { name: true } }, dispatchJob: { select: { status: true, driver: { select: { name: true } } } } },
    }),
    prisma.dispatchJob.findMany({
      where: { organizationId: orgId, status: { in: ["assigned","en_route_source","loading","en_route_customer"] } },
      take: 5,
      include: { driver: { select: { name: true } }, vehicle: { select: { plateNumber: true } }, order: { include: { customer: { select: { name: true } } } } },
    }),
    prisma.invoice.aggregate({ where: { organizationId: orgId, status: "paid", updatedAt: { gte: monthStart } }, _sum: { paidAmount: true } }),
    prisma.invoice.aggregate({ where: { organizationId: orgId, status: "paid", updatedAt: { gte: today } }, _sum: { paidAmount: true } }),
    prisma.invoice.aggregate({ where: { organizationId: orgId, status: { in: ["sent","overdue"] } }, _sum: { totalAmount: true } }),
    prisma.fuelRecord.aggregate({ where: { organizationId: orgId, date: { gte: monthStart } }, _sum: { totalCost: true } }),
    prisma.expense.aggregate({ where: { organizationId: orgId, date: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.vehicle.aggregate({ where: { organizationId: orgId, ownership: "leased" }, _sum: { leaseMonthlyRate: true } }),
  ]);

  const monthRevenue = monthPayments._sum.paidAmount ?? 0;
  const dailyRevenue = todayPayments._sum.paidAmount ?? 0;
  const fuelCost = monthFuel._sum.totalCost ?? 0;
  const otherExpenses = monthExpenses._sum.amount ?? 0;
  const leaseCost = leasedVehiclesAgg._sum.leaseMonthlyRate ?? 0;
  const netProfit = monthRevenue - fuelCost - otherExpenses - leaseCost;

  return {
    customers, vehicles, drivers, activeOrders, todayOrders, recentOrders, activeJobs,
    monthRevenue, dailyRevenue,
    pendingInvoices: pendingInvoices._sum.totalAmount ?? 0,
    fuelCost, otherExpenses, leaseCost, netProfit,
  };
}

const STATUS_COLOR: Record<string, string> = {
  pending: "ff-badge-yellow", confirmed: "ff-badge-blue", dispatched: "ff-badge-blue",
  in_progress: "ff-badge-purple", delivered: "ff-badge-green", cancelled: "ff-badge-red",
  assigned: "ff-badge-blue", en_route_source: "ff-badge-purple", loading: "ff-badge-orange",
  en_route_customer: "ff-badge-purple",
};

export default async function Dashboard() {
  const session = await getSession();
  if (!session?.organizationId) return null;

  const d = await getDashboardData(session.organizationId);
  const fmt = (n: number) => n >= 1000 ? `KES ${(n/1000).toFixed(0)}K` : `KES ${n.toFixed(0)}`;
  const kpis = [
    { icon: Users,        label: "Active Customers", value: d.customers,                color: "#2563eb", sub: "registered accounts" },
    { icon: TankerTruckIcon, label: "Fleet Vehicles",   value: d.vehicles,                 color: "#7c3aed", sub: "in fleet" },
    { icon: UserCheck,    label: "Total Drivers",    value: d.drivers,                  color: "#059669", sub: "registered" },
    { icon: ClipboardList,label: "Active Sales",     value: d.activeOrders,             color: "#d97706", sub: "need action" },
    { icon: Package,      label: "Today's Sales",    value: d.todayOrders,              color: "#0891b2", sub: "placed today" },
    { icon: TrendingUp,   label: "Daily Revenue",    value: fmt(d.dailyRevenue),        color: "#059669", sub: "collected today" },
    { icon: DollarSign,   label: "Month Revenue",    value: fmt(d.monthRevenue),        color: "#16a34a", sub: "paid invoices" },
    { icon: AlertCircle,  label: "Pending Invoices", value: fmt(d.pendingInvoices),     color: "#dc2626", sub: "outstanding" },
  ];

  return (
    <div className="slide-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Dashboard</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "3px 0 0" }}>
            Welcome back, {session.name} · {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/orders/new" className="ff-btn ff-btn-primary">+ New Sale</Link>
          <Link href="/dispatch" className="ff-btn ff-btn-secondary">Dispatch Center</Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {kpis.map(({ icon: Icon, label, value, color, sub }) => (
          <div key={label} className="ff-card" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: "0 0 6px", fontWeight: 500 }}>{label}</p>
                <p style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{value}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "3px 0 0" }}>{sub}</p>
              </div>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={18} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 14 }}>
        <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Recent Sales</h3>
              <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: 0 }}>Latest activity</p>
            </div>
            <Link href="/orders" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {d.recentOrders.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              No sales yet. <Link href="/orders/new" style={{ color: "var(--accent)" }}>Create your first sale →</Link>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="ff-table">
                <thead><tr><th>Sale #</th><th>Customer</th><th>Product</th><th>Qty</th><th>Status</th><th>Driver</th><th>Date</th></tr></thead>
                <tbody>
                  {d.recentOrders.map(o => (
                    <tr key={o.id}>
                      <td><Link href={`/orders/${o.id}`} style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>{o.orderNumber}</Link></td>
                      <td style={{ fontWeight: 500 }}>{o.customer.name}</td>
                      <td style={{ textTransform: "capitalize" }}>{o.productType}</td>
                      <td>{o.quantityOrdered.toLocaleString()} {o.unit}</td>
                      <td><span className={`ff-badge ${STATUS_COLOR[o.status] ?? "ff-badge-gray"}`}>{o.status.replace(/_/g," ")}</span></td>
                      <td style={{ color: "var(--text-muted)" }}>{o.dispatchJob?.driver?.name ?? "—"}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: 11.5 }}>{new Date(o.createdAt).toLocaleDateString("en-KE")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: 0 }}>Active Trips</h3>
              <Link href="/dispatch" style={{ fontSize: 11.5, color: "var(--accent)", textDecoration: "none" }}>Dispatch →</Link>
            </div>
            {d.activeJobs.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: 12.5 }}>No active trips</div>
            ) : d.activeJobs.map(job => (
              <div key={job.id} style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{job.order.customer.name}</span>
                  <span className={`ff-badge ${STATUS_COLOR[job.status] ?? "ff-badge-gray"}`} style={{ fontSize: 10 }}>{job.status.replace(/_/g," ")}</span>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{job.driver?.name ?? "Unassigned"} · {job.vehicle?.plateNumber ?? "—"}</div>
              </div>
            ))}
          </div>

          {/* P&L Breakdown */}
          <div className="ff-card">
            <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: "0 0 12px" }}>This Month — P&amp;L</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { label: "Gross Revenue", value: d.monthRevenue, icon: TrendingUp, color: "#16a34a", sign: "+" },
                { label: "Fuel Costs", value: d.fuelCost, icon: Minus, color: "#d97706", sign: "−" },
                { label: "Lease Costs", value: d.leaseCost, icon: Minus, color: "#7c3aed", sign: "−" },
                { label: "Other Expenses", value: d.otherExpenses, icon: Minus, color: "#dc2626", sign: "−" },
              ].map(({ label, value, icon: Icon, color, sign }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Icon size={13} color={color} />
                    <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color }}>{sign} {fmt(value)}</span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <TrendingDown size={13} color={d.netProfit >= 0 ? "#16a34a" : "#dc2626"} />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Net Profit</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: d.netProfit >= 0 ? "#16a34a" : "#dc2626" }}>
                  {d.netProfit >= 0 ? "+" : ""}{fmt(d.netProfit)}
                </span>
              </div>
            </div>
          </div>

          <div className="ff-card">
            <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: "0 0 12px" }}>Quick Actions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { label: "New Sale", href: "/orders/new", color: "var(--accent)" },
                { label: "Add Customer", href: "/customers/new", color: "#059669" },
                { label: "Add Vehicle", href: "/vehicles/new", color: "#7c3aed" },
                { label: "Add Driver", href: "/drivers/new", color: "#d97706" },
                { label: "View Reports", href: "/reports", color: "#0891b2" },
              ].map(({ label, href, color }) => (
                <Link key={label} href={href} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: "var(--background)", textDecoration: "none", fontSize: 12.5, fontWeight: 500, color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  {label}
                  <ArrowUpRight size={12} style={{ marginLeft: "auto", color: "var(--text-muted)" }} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
