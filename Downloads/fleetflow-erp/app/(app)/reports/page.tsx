import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { BarChart3, TrendingUp, UserCheck, DollarSign, Fuel, Wrench } from "lucide-react";
import Link from "next/link";

export default async function ReportsPage() {
  const session = await getSession();
  if (!session?.organizationId) return null;
  const orgId = session.organizationId;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    monthOrders, prevMonthOrders,
    monthRevenue, prevRevenue,
    monthFuel,
    topDrivers,
    topCustomers,
    vehicleActivity,
    ordersByStatus,
  ] = await Promise.all([
    prisma.order.count({ where: { organizationId: orgId, createdAt: { gte: monthStart } } }),
    prisma.order.count({ where: { organizationId: orgId, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } } }),
    prisma.payment.aggregate({ where: { organizationId: orgId, paidAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { organizationId: orgId, paidAt: { gte: prevMonthStart, lte: prevMonthEnd } }, _sum: { amount: true } }),
    prisma.fuelRecord.aggregate({ where: { organizationId: orgId, date: { gte: monthStart } }, _sum: { totalCost: true, litres: true } }),
    prisma.driver.findMany({
      where: { organizationId: orgId },
      orderBy: { totalTrips: "desc" },
      take: 5,
      select: { name: true, totalTrips: true, rating: true, status: true },
    }),
    prisma.customer.findMany({
      where: { organizationId: orgId },
      orderBy: { balance: "desc" },
      take: 5,
      include: { _count: { select: { orders: true } } },
    }),
    prisma.vehicle.findMany({
      where: { organizationId: orgId },
      include: { _count: { select: { dispatchJobs: true } } },
      orderBy: { odometerKm: "desc" },
      take: 5,
    }),
    prisma.order.groupBy({ by: ["status"], where: { organizationId: orgId }, _count: true }),
  ]);

  const currentRevenue = monthRevenue._sum.amount ?? 0;
  const previousRevenue = prevRevenue._sum.amount ?? 0;
  const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  return (
    <div className="slide-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Reports &amp; Analytics</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "3px 0 0" }}>
            {new Date().toLocaleDateString("en-KE", { month: "long", year: "numeric" })} — Month to Date
          </p>
        </div>
        <Link href="/reports/pnl" className="ff-btn ff-btn-primary">
          <TrendingUp size={14}/> P&amp;L Statement
        </Link>
      </div>

      {/* KPI summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <div className="ff-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <BarChart3 size={16} color="#2563eb" />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Sales This Month</span>
          </div>
          <p style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>{monthOrders}</p>
          <p style={{ fontSize: 11, color: monthOrders >= prevMonthOrders ? "#16a34a" : "#dc2626", margin: 0 }}>
            {monthOrders >= prevMonthOrders ? "+" : ""}{monthOrders - prevMonthOrders} vs last month
          </p>
        </div>
        <div className="ff-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <DollarSign size={16} color="#16a34a" />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Revenue This Month</span>
          </div>
          <p style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>KES {(currentRevenue/1000).toFixed(0)}K</p>
          <p style={{ fontSize: 11, color: revenueGrowth >= 0 ? "#16a34a" : "#dc2626", margin: 0 }}>
            {revenueGrowth >= 0 ? "+" : ""}{revenueGrowth.toFixed(1)}% vs last month
          </p>
        </div>
        <div className="ff-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Fuel size={16} color="#d97706" />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Fuel Cost This Month</span>
          </div>
          <p style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>KES {((monthFuel._sum.totalCost??0)/1000).toFixed(0)}K</p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{(monthFuel._sum.litres??0).toFixed(0)} litres consumed</p>
        </div>
        <div className="ff-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <TrendingUp size={16} color="#7c3aed" />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Delivery Rate</span>
          </div>
          <p style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>
            {monthOrders > 0 ? Math.round(((ordersByStatus.find(s=>s.status==="delivered")?._count??0)/monthOrders)*100) : 0}%
          </p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>of sales delivered</p>
        </div>
      </div>

      {/* Sales by Status */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: 0 }}>Sales by Status</h3>
          </div>
          <div style={{ padding: 14 }}>
            {ordersByStatus.map(s => {
              const pct = monthOrders > 0 ? (s._count / monthOrders) * 100 : 0;
              const colors: Record<string, string> = { delivered:"#16a34a", pending:"#d97706", cancelled:"#dc2626", in_progress:"#7c3aed", dispatched:"#2563eb", confirmed:"#0891b2" };
              return (
                <div key={s.status} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, fontSize: 12.5 }}>
                    <span style={{ textTransform: "capitalize", fontWeight: 500 }}>{s.status.replace(/_/g," ")}</span>
                    <span style={{ fontWeight: 700, color: colors[s.status] ?? "#666" }}>{s._count}</span>
                  </div>
                  <div style={{ height: 6, background: "#f1f5f9", borderRadius: 99 }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: colors[s.status] ?? "#2563eb", borderRadius: 99, transition: "width 0.3s ease" }} />
                  </div>
                </div>
              );
            })}
            {ordersByStatus.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center" }}>No orders yet</p>}
          </div>
        </div>

        {/* Top Drivers */}
        <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: 0 }}>Top Drivers</h3>
            <Link href="/drivers" style={{ fontSize: 11.5, color: "var(--accent)", textDecoration: "none" }}>All →</Link>
          </div>
          <table className="ff-table">
            <thead><tr><th>#</th><th>Driver</th><th>Trips</th><th>Rating</th><th>Status</th></tr></thead>
            <tbody>
              {topDrivers.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign:"center",color:"var(--text-muted)",padding:"30px 0" }}>No drivers yet</td></tr>
              ) : topDrivers.map((d, i) => (
                <tr key={d.name}>
                  <td style={{ fontWeight: 700, color: i < 3 ? "#d97706" : "var(--text-muted)", width: 28 }}>{i+1}</td>
                  <td style={{ fontWeight: 600 }}>{d.name}</td>
                  <td style={{ fontWeight: 700, color: "var(--accent)" }}>{d.totalTrips}</td>
                  <td>⭐ {d.rating.toFixed(1)}</td>
                  <td><span className={`ff-badge ${d.status==="available"?"ff-badge-green":d.status==="on_trip"?"ff-badge-blue":"ff-badge-gray"}`}>{d.status.replace(/_/g," ")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top customers and vehicles */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: 0 }}>Top Customers</h3>
            <Link href="/customers" style={{ fontSize: 11.5, color: "var(--accent)", textDecoration: "none" }}>All →</Link>
          </div>
          <table className="ff-table">
            <thead><tr><th>Customer</th><th>Sales</th><th>Balance</th></tr></thead>
            <tbody>
              {topCustomers.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign:"center",color:"var(--text-muted)",padding:"30px 0" }}>No customers yet</td></tr>
              ) : topCustomers.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ fontWeight: 700, color: "var(--accent)" }}>{c._count.orders}</td>
                  <td style={{ color: c.balance > 0 ? "#dc2626" : "var(--text-muted)", fontWeight: c.balance > 0 ? 700 : 400 }}>
                    {c.balance > 0 ? `KES ${c.balance.toLocaleString()}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: 0 }}>Vehicle Utilization</h3>
            <Link href="/vehicles" style={{ fontSize: 11.5, color: "var(--accent)", textDecoration: "none" }}>All →</Link>
          </div>
          <table className="ff-table">
            <thead><tr><th>Vehicle</th><th>Trips</th><th>Odometer</th><th>Status</th></tr></thead>
            <tbody>
              {vehicleActivity.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign:"center",color:"var(--text-muted)",padding:"30px 0" }}>No vehicles yet</td></tr>
              ) : vehicleActivity.map(v => (
                <tr key={v.id}>
                  <td style={{ fontWeight:700,fontFamily:"monospace",fontSize:12 }}>{v.plateNumber} <span style={{ fontWeight:400,fontSize:11,color:"var(--text-muted)" }}>{v.make}</span></td>
                  <td style={{ fontWeight:700,color:"var(--accent)" }}>{v._count.dispatchJobs}</td>
                  <td style={{ color:"var(--text-muted)" }}>{v.odometerKm.toLocaleString()} km</td>
                  <td><span className={`ff-badge ${v.status==="available"?"ff-badge-green":v.status==="on_trip"?"ff-badge-blue":"ff-badge-yellow"}`}>{v.status.replace(/_/g," ")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
