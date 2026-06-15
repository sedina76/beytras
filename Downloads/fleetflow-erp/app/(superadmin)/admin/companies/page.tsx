"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, Plus, Search, CheckCircle2, XCircle, Pause } from "lucide-react";

type Org = {
  id: string; name: string; email: string; phone?: string; city?: string; status: string; createdAt: string; trialEndsAt?: string;
  subscription?: { plan: { name: string; price: number } };
  _count: { users: number; vehicles: number; drivers: number; orders: number };
};

export default function CompaniesPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/companies").then(r => r.json()).then(d => { setOrgs(d); setLoading(false); });
  }, []);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/companies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setOrgs(orgs.map(o => o.id === id ? { ...o, status } : o));
  }

  const filtered = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="slide-in">
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20,fontWeight:700,margin:0 }}>Companies</h1>
          <p style={{ color:"var(--text-muted)",fontSize:12.5,margin:"3px 0 0" }}>{orgs.length} registered companies</p>
        </div>
        <Link href="/register-company" className="ff-btn ff-btn-primary"><Plus size={14}/> New Company</Link>
      </div>

      <div className="ff-card" style={{ padding:0,overflow:"hidden" }}>
        <div style={{ padding:"12px 14px",borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,maxWidth:320 }}>
            <Search size={14} color="var(--text-muted)" style={{ flexShrink:0 }} />
            <input className="ff-input" style={{ border:"none",outline:"none",fontSize:13,padding:"4px 0" }} placeholder="Search companies..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div style={{ padding:"40px 20px",textAlign:"center",color:"var(--text-muted)" }}>Loading...</div>
        ) : (
          <table className="ff-table">
            <thead><tr><th>Company</th><th>Plan</th><th>City</th><th>Users</th><th>Vehicles</th><th>Orders</th><th>Status</th><th>Trial Ends</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(org => (
                <tr key={org.id}>
                  <td>
                    <div>
                      <div style={{ fontWeight:600,fontSize:13 }}>{org.name}</div>
                      <div style={{ fontSize:11,color:"var(--text-muted)" }}>{org.email}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`ff-badge ${org.subscription ? "ff-badge-purple" : "ff-badge-gray"}`}>
                      {org.subscription?.plan.name ?? "No Plan"}
                    </span>
                  </td>
                  <td style={{ color:"var(--text-muted)" }}>{org.city ?? "—"}</td>
                  <td>{org._count.users}</td>
                  <td>{org._count.vehicles}</td>
                  <td style={{ fontWeight:600 }}>{org._count.orders}</td>
                  <td>
                    <span className={`ff-badge ${org.status==="active"?"ff-badge-green":org.status==="trial"?"ff-badge-yellow":"ff-badge-red"}`}>
                      {org.status}
                    </span>
                  </td>
                  <td style={{ fontSize:11.5,color:"var(--text-muted)" }}>
                    {org.trialEndsAt ? new Date(org.trialEndsAt).toLocaleDateString("en-KE") : "—"}
                  </td>
                  <td>
                    <div style={{ display:"flex",gap:4 }}>
                      {org.status !== "active" && (
                        <button onClick={() => updateStatus(org.id,"active")} className="ff-btn ff-btn-success ff-btn-sm" title="Activate">
                          <CheckCircle2 size={12}/>
                        </button>
                      )}
                      {org.status !== "suspended" && (
                        <button onClick={() => updateStatus(org.id,"suspended")} className="ff-btn ff-btn-danger ff-btn-sm" title="Suspend">
                          <Pause size={12}/>
                        </button>
                      )}
                    </div>
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
