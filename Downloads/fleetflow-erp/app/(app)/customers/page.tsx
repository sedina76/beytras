import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Users, Plus, Phone, MapPin, ArrowUpRight, Building2, User } from "lucide-react";

async function getCustomers(orgId: string, search: string) {
  return prisma.customer.findMany({
    where: { organizationId: orgId, ...(search ? { name: { contains: search } } : {}) },
    orderBy: { name: "asc" },
    include: { _count: { select: { orders: true } } },
  });
}

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const session = await getSession();
  if (!session?.organizationId) return null;
  const { search = "" } = await searchParams;
  const customers = await getCustomers(session.organizationId, search);

  return (
    <div className="slide-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Customers</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "3px 0 0" }}>{customers.length} total customers</p>
        </div>
        <Link href="/customers/new" className="ff-btn ff-btn-primary"><Plus size={14} /> Add Customer</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Total", value: customers.length, color: "#2563eb" },
          { label: "Active", value: customers.filter(c => c.status === "active").length, color: "#16a34a" },
          { label: "Outstanding Balance", value: `KES ${customers.reduce((s,c)=>s+c.balance,0).toLocaleString()}`, color: "#dc2626" },
          { label: "Credit Limit Pool", value: `KES ${customers.reduce((s,c)=>s+c.creditLimit,0).toLocaleString()}`, color: "#7c3aed" },
        ].map(({ label, value, color }) => (
          <div key={label} className="ff-card" style={{ padding: "12px 14px" }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>{label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
          <form>
            <input className="ff-input" name="search" defaultValue={search} placeholder="Search by name..." style={{ maxWidth: 300 }} />
          </form>
        </div>
        {customers.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <Users size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
            <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 12px" }}>No customers yet</p>
            <Link href="/customers/new" className="ff-btn ff-btn-primary">Add First Customer</Link>
          </div>
        ) : (
          <table className="ff-table">
            <thead><tr><th>Customer</th><th>Type</th><th>Phone</th><th>City</th><th>Sales</th><th>Balance</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: c.type === "business" ? "#dbeafe" : "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {c.type === "business" ? <Building2 size={14} color="#2563eb" /> : <User size={14} color="#16a34a" />}
                      </div>
                      <div>
                        <Link href={`/customers/${c.id}`} style={{ fontWeight: 600, color: "var(--text-primary)", textDecoration: "none" }}>{c.name}</Link>
                        {c.email && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td><span className={`ff-badge ${c.type === "business" ? "ff-badge-blue" : "ff-badge-green"}`}>{c.type}</span></td>
                  <td style={{ color: "var(--text-secondary)" }}><div style={{ display:"flex",alignItems:"center",gap:4 }}><Phone size={11}/>{c.phone}</div></td>
                  <td style={{ color: "var(--text-muted)" }}><div style={{ display:"flex",alignItems:"center",gap:4 }}><MapPin size={11}/>{c.city}</div></td>
                  <td style={{ fontWeight: 600 }}>{c._count.orders}</td>
                  <td style={{ color: c.balance > 0 ? "var(--danger)" : "var(--text-muted)", fontWeight: c.balance > 0 ? 600 : 400 }}>
                    {c.balance > 0 ? `KES ${c.balance.toLocaleString()}` : "—"}
                  </td>
                  <td><span className={`ff-badge ${c.status === "active" ? "ff-badge-green" : "ff-badge-gray"}`}>{c.status}</span></td>
                  <td>
                    <Link href={`/customers/${c.id}`} className="ff-btn ff-btn-ghost ff-btn-sm"><ArrowUpRight size={13}/> View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
