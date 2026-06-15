"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NewDriver() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", phone: "", email: "", licenseNumber: "", licenseExpiry: "", password: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      router.push("/drivers");
    } catch { setError("Network error"); } finally { setLoading(false); }
  }

  return (
    <div className="slide-in" style={{ maxWidth: 600 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Link href="/drivers" className="ff-btn ff-btn-ghost ff-btn-sm"><ArrowLeft size={14}/></Link>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Add Driver</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: 0 }}>Register a new driver and create their login</p>
        </div>
      </div>

      {error && <div style={{ background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:8,padding:"10px 12px",marginBottom:16,color:"#dc2626",fontSize:13 }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="ff-card" style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>Driver Information</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Full Name *</label>
              <input className="ff-input" value={form.name} onChange={set("name")} placeholder="John Kamau Mwangi" required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Phone Number *</label>
              <input className="ff-input" value={form.phone} onChange={set("phone")} placeholder="+254 712 345 678" required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>License Number *</label>
              <input className="ff-input" value={form.licenseNumber} onChange={set("licenseNumber")} placeholder="DL12345678" required />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>License Expiry Date</label>
              <input className="ff-input" type="date" value={form.licenseExpiry} onChange={set("licenseExpiry")} />
            </div>
          </div>
        </div>

        <div className="ff-card" style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Driver App Login</h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 16px" }}>Create credentials so the driver can log in to the driver portal</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Email (for login)</label>
              <input className="ff-input" type="email" value={form.email} onChange={set("email")} placeholder="driver@company.com" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Password</label>
              <input className="ff-input" type="password" value={form.password} onChange={set("password")} placeholder="Min 8 characters" />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={loading} className="ff-btn ff-btn-primary"><Save size={14}/>{loading ? "Saving..." : "Add Driver"}</button>
          <Link href="/drivers" className="ff-btn ff-btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
