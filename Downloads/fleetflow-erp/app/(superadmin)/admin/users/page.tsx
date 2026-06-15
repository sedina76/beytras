import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Users, ShieldCheck } from "lucide-react";

const ROLE_COLOR: Record<string, string> = {
  super_admin: "ff-badge-purple", company_admin: "ff-badge-blue", dispatcher: "ff-badge-blue",
  driver: "ff-badge-green", accountant: "ff-badge-yellow", mechanic: "ff-badge-orange",
  customer_support: "ff-badge-gray",
};

export default async function AdminUsersPage() {
  const session = await getSession();
  if (session?.role !== "super_admin") return null;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { organization: { select: { name: true } } },
  });

  const superAdmins = users.filter(u => u.role === "super_admin");
  const companyUsers = users.filter(u => u.role !== "super_admin");
  const activeToday = users.filter(u => u.lastLoginAt && new Date(u.lastLoginAt) > new Date(Date.now() - 24 * 60 * 60 * 1000));

  return (
    <div className="slide-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>All Users</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "3px 0 0" }}>{users.length} users across all tenants</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Users", value: users.length, color: "#2563eb", icon: Users },
          { label: "Super Admins", value: superAdmins.length, color: "#7c3aed", icon: ShieldCheck },
          { label: "Company Users", value: companyUsers.length, color: "#16a34a", icon: Users },
          { label: "Active Today", value: activeToday.length, color: "#d97706", icon: Users },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="ff-card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 2px" }}>{label}</p>
              <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="ff-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Company</th><th>Last Login</th><th>Status</th><th>Since</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td style={{ color: "var(--text-muted)", fontSize: 12.5 }}>{u.email}</td>
                <td>
                  <span className={`ff-badge ${ROLE_COLOR[u.role] ?? "ff-badge-gray"}`} style={{ textTransform: "capitalize" }}>
                    {u.role.replace(/_/g, " ")}
                  </span>
                </td>
                <td style={{ color: "var(--text-muted)", fontSize: 12.5 }}>{u.organization?.name ?? <span style={{ color: "#7c3aed", fontWeight: 700 }}>FleetFlow SaaS</span>}</td>
                <td style={{ fontSize: 11.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("en-KE") : "Never"}
                </td>
                <td><span className={`ff-badge ${u.isActive ? "ff-badge-green" : "ff-badge-red"}`}>{u.isActive ? "Active" : "Inactive"}</span></td>
                <td style={{ fontSize: 11.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{new Date(u.createdAt).toLocaleDateString("en-KE")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
