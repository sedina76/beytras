"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NewVehicle() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    plateNumber: "", make: "", model: "", year: new Date().getFullYear().toString(),
    capacityLitres: "", fuelType: "diesel", color: "",
    ownership: "owned", leaseCompany: "", leaseExpiry: "", leaseMonthlyRate: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      router.push("/vehicles");
    } catch { setError("Network error"); } finally { setLoading(false); }
  }

  return (
    <div className="slide-in" style={{ maxWidth: 600 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Link href="/vehicles" className="ff-btn ff-btn-ghost ff-btn-sm"><ArrowLeft size={14}/></Link>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Add Vehicle</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: 0 }}>Register a new fleet vehicle</p>
        </div>
      </div>

      {error && <div style={{ background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:8,padding:"10px 12px",marginBottom:16,color:"#dc2626",fontSize:13 }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="ff-card" style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>Vehicle Information</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Plate Number *</label>
              <input className="ff-input" value={form.plateNumber} onChange={set("plateNumber")} placeholder="KCA 123A" required style={{ textTransform: "uppercase" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Make (Brand) *</label>
              <input className="ff-input" value={form.make} onChange={set("make")} placeholder="Isuzu" required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Model *</label>
              <input className="ff-input" value={form.model} onChange={set("model")} placeholder="FVR 34P" required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Year</label>
              <input className="ff-input" type="number" value={form.year} onChange={set("year")} min="2000" max={new Date().getFullYear()} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Fuel Type</label>
              <select className="ff-input" value={form.fuelType} onChange={set("fuelType")}>
                <option value="diesel">Diesel</option>
                <option value="petrol">Petrol</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Tank Capacity (Litres)</label>
              <input className="ff-input" type="number" value={form.capacityLitres} onChange={set("capacityLitres")} placeholder="10000" min="0" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Color</label>
              <input className="ff-input" value={form.color} onChange={set("color")} placeholder="White" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Ownership</label>
              <select className="ff-input" value={form.ownership} onChange={set("ownership")}>
                <option value="owned">Owned</option>
                <option value="leased">Leased</option>
              </select>
            </div>
            {form.ownership === "leased" && (
              <>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Leasing Company</label>
                  <input className="ff-input" value={form.leaseCompany} onChange={set("leaseCompany")} placeholder="e.g. Toyota Kenya Leasing" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Lease Expiry</label>
                  <input className="ff-input" type="date" value={form.leaseExpiry} onChange={set("leaseExpiry")} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Monthly Lease Rate (KES)</label>
                  <input className="ff-input" type="number" value={form.leaseMonthlyRate} onChange={set("leaseMonthlyRate")} placeholder="85000" min="0" />
                </div>
              </>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={loading} className="ff-btn ff-btn-primary"><Save size={14}/>{loading ? "Saving..." : "Add Vehicle"}</button>
          <Link href="/vehicles" className="ff-btn ff-btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
