import { prisma } from "@/lib/db";
import { ensurePlans } from "@/lib/plans";
import { Building2, Users, CreditCard, DollarSign, TrendingUp, AlertCircle, Zap, Shield, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default async function SuperAdminDashboard() {
  await ensurePlans();

  const [
    totalOrgs, activeOrgs, trialOrgs, suspendedOrgs,
    totalUsers, totalOrders, recentOrgs, subscriptions,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { status: "active" } }),
    prisma.organization.count({ where: { status: "trial" } }),
    prisma.organization.count({ where: { status: "suspended" } }),
    prisma.user.count({ where: { organizationId: { not: null } } }),
    prisma.order.count(),
    prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        subscription: { include: { plan: true } },
        _count: { select: { users: true, vehicles: true, drivers: true, orders: true } },
      },
    }),
    prisma.subscription.findMany({
      where: { status: "active" },
      include: { plan: { select: { price: true, name: true } } },
    }),
  ]);

  const mrr = subscriptions.reduce((sum, s) => sum + s.plan.price, 0);
  const arr = mrr * 12;

  // Breakdown by plan
  const planBreakdown: Record<string, number> = {};
  subscriptions.forEach(s => {
    planBreakdown[s.plan.name] = (planBreakdown[s.plan.name] ?? 0) + 1;
  });

  const kpis = [
    { icon: Building2, label: "Total Companies", value: totalOrgs, color: "#2563eb" },
    { icon: TrendingUp, label: "Active", value: activeOrgs, color: "#16a34a" },
    { icon: Zap, label: "On Trial", value: trialOrgs, color: "#d97706" },
    { icon: AlertCircle, label: "Suspended", value: suspendedOrgs, color: "#dc2626" },
    { icon: Users, label: "Total Users", value: totalUsers, color: "#7c3aed" },
    { icon: DollarSign, label: "Total Orders", value: totalOrders, color: "#0891b2" },
  ];

  return (
    <div className="slide-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>SaaS Overview</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: 0 }}>FleetFlow ERP — All tenant companies</p>
      </div>

      {/* Tenant KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        {kpis.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="ff-card" style={{ padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={20} color={color} />
              </div>
              <div>
                <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: "0 0 4px" }}>{label}</p>
                <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color }}>{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue card */}
      <div className="ff-card" style={{ marginBottom: 16, background: "linear-gradient(135deg,#07111f,#0d1d30)", border: "none", padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11.5, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>Monthly Recurring Revenue</p>
            <p style={{ color: "#fff", fontSize: 32, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
              KES {mrr.toLocaleString()}
            </p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
              ARR estimate: <span style={{ color: "#22c55e", fontWeight: 600 }}>KES {arr.toLocaleString()}</span>
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11.5, margin: "0 0 10px" }}>Plan Breakdown</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {[
                { name: "Enterprise", color: "#d97706" },
                { name: "Professional", color: "#7c3aed" },
                { name: "Basic", color: "#2563eb" },
              ].map(({ name, color }) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                  <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)" }}>{name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 20, textAlign: "right" }}>
                    {planBreakdown[name] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subscription status summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Active Subscriptions", value: subscriptions.length, color: "#16a34a", icon: TrendingUp },
          { label: "Trial Accounts", value: trialOrgs, color: "#2563eb", icon: Zap },
          { label: "Expired / No Sub", value: totalOrgs - activeOrgs - trialOrgs - suspendedOrgs, color: "#dc2626", icon: AlertCircle },
          { label: "Suspended", value: suspendedOrgs, color: "#9f1239", icon: Shield },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="ff-card" style={{ padding: "12px 14px", borderLeft: `3px solid ${color}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <Icon size={12} color={color} />
              <span style={{ fontSize: 10.5, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>{label}</span>
            </div>
            <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Recent companies table */}
      <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Recent Companies</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/admin/subscriptions" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#7c3aed", textDecoration: "none", fontWeight: 600 }}>
              <CreditCard size={12} /> Billing <ArrowUpRight size={11} />
            </Link>
            <Link href="/admin/companies" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>
              View All <ArrowUpRight size={11} />
            </Link>
          </div>
        </div>
        <table className="ff-table">
          <thead>
            <tr><th>Company</th><th>Plan</th><th>Users</th><th>Vehicles</th><th>Orders</th><th>Status</th><th>Joined</th><th></th></tr>
          </thead>
          <tbody>
            {recentOrgs.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 20px" }}>No companies yet. Share your signup link.</td></tr>
            ) : recentOrgs.map(org => (
              <tr key={org.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{org.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{org.email}</div>
                </td>
                <td>
                  {org.subscription?.plan
                    ? <span className="ff-badge ff-badge-purple">{org.subscription.plan.name}</span>
                    : <span className="ff-badge ff-badge-gray">No Plan</span>}
                </td>
                <td>{org._count.users}</td>
                <td>{org._count.vehicles}</td>
                <td style={{ fontWeight: 600 }}>{org._count.orders}</td>
                <td>
                  <span className={`ff-badge ${org.status === "active" ? "ff-badge-green" : org.status === "trial" ? "ff-badge-yellow" : "ff-badge-red"}`}>
                    {org.status}
                  </span>
                </td>
                <td style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                  {new Date(org.createdAt).toLocaleDateString("en-KE")}
                </td>
                <td>
                  <Link href={`/admin/companies/${org.id}`} className="ff-btn ff-btn-ghost ff-btn-sm">Manage</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
