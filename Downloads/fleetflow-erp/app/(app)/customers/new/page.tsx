"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NewCustomer() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "", city: "Nairobi",
    type: "business", creditLimit: "", notes: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      router.push("/customers");
    } catch { setError("Network error"); } finally { setLoading(false); }
  }

  return (
    <div className="slide-in" style={{ maxWidth: 640 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Link href="/customers" className="ff-btn ff-btn-ghost ff-btn-sm"><ArrowLeft size={14}/></Link>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Add Customer</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: 0 }}>Create a new customer account</p>
        </div>
      </div>

      {error && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 12px", marginBottom: 16, color: "#dc2626", fontSize: 13 }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="ff-card" style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>Customer Details</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Company / Customer Name *</label>
              <input className="ff-input" value={form.name} onChange={set("name")} placeholder="AquaCity Hotels Ltd" required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Customer Type</label>
              <select className="ff-input" value={form.type} onChange={set("type")}>
                <option value="business">Business</option>
                <option value="residential">Residential</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Phone Number *</label>
              <input className="ff-input" value={form.phone} onChange={set("phone")} placeholder="+254 700 123 456" required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Email Address</label>
              <input className="ff-input" type="email" value={form.email} onChange={set("email")} placeholder="accounts@company.com" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>City</label>
              <select className="ff-input" value={form.city} onChange={set("city")}>
                {["Nairobi","Mombasa","Kisumu","Nakuru","Eldoret","Thika","Karen","Westlands","Kilimani","Lavington","Other"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Credit Limit (KES)</label>
              <input className="ff-input" type="number" value={form.creditLimit} onChange={set("creditLimit")} placeholder="50000" min="0" />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Delivery Address *</label>
              <input className="ff-input" value={form.address} onChange={set("address")} placeholder="123 Mombasa Road, Industrial Area" required />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Notes</label>
              <textarea className="ff-input" value={form.notes} onChange={set("notes")} placeholder="Special delivery instructions, access codes, contact person..." />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={loading} className="ff-btn ff-btn-primary"><Save size={14}/>{loading ? "Saving..." : "Save Customer"}</button>
          <Link href="/customers" className="ff-btn ff-btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
