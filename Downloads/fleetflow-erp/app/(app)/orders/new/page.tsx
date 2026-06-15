"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

type Customer = { id: string; name: string; phone: string; address: string };
type WaterSource = { id: string; name: string; address: string };

export default function NewOrder() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [waterSources, setWaterSources] = useState<WaterSource[]>([]);
  const [form, setForm] = useState({
    customerId: "", productType: "water", quantityOrdered: "",
    unit: "litres", deliveryAddress: "", priority: "normal",
    notes: "", scheduledAt: "", totalAmount: "", waterSourceId: "",
  });

  useEffect(() => {
    fetch("/api/customers").then(r => r.ok ? r.json() : []).then(d => setCustomers(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/water-sources").then(r => r.ok ? r.json() : []).then(d => setWaterSources(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  function onCustomerChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const c = customers.find(x => x.id === e.target.value);
    setForm(f => ({ ...f, customerId: e.target.value, deliveryAddress: c?.address ?? f.deliveryAddress }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      router.push("/orders");
    } catch { setError("Network error"); } finally { setLoading(false); }
  }

  const UNITS: Record<string, string[]> = {
    water: ["litres", "gallons", "drums"], fuel: ["litres", "gallons"], goods: ["kg", "tonnes", "units", "bags"],
  };

  return (
    <div className="slide-in" style={{ maxWidth: 680 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Link href="/orders" className="ff-btn ff-btn-ghost ff-btn-sm"><ArrowLeft size={14}/></Link>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>New Sale</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: 0 }}>Create a delivery or pickup sale</p>
        </div>
      </div>

      {error && <div style={{ background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:8,padding:"10px 12px",marginBottom:16,color:"#dc2626",fontSize:13 }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="ff-card" style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>Sale Details</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Customer *</label>
              <select className="ff-input" value={form.customerId} onChange={onCustomerChange} required>
                <option value="">Select customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
              </select>
              {customers.length === 0 && <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0" }}>No customers yet. <Link href="/customers/new" style={{ color:"var(--accent)" }}>Add one first →</Link></p>}
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Product Type *</label>
              <select className="ff-input" value={form.productType} onChange={set("productType")}>
                <option value="water">Water</option>
                <option value="fuel">Fuel</option>
                <option value="goods">Goods</option>
              </select>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Water Source (Loading Point)</label>
              <select className="ff-input" value={form.waterSourceId} onChange={set("waterSourceId")}>
                <option value="">— Select water source —</option>
                {waterSources.map(ws => <option key={ws.id} value={ws.id}>{ws.name} — {ws.address}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Priority</label>
              <select className="ff-input" value={form.priority} onChange={set("priority")}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Quantity *</label>
              <input className="ff-input" type="number" value={form.quantityOrdered} onChange={set("quantityOrdered")} placeholder="5000" required min="1" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Unit</label>
              <select className="ff-input" value={form.unit} onChange={set("unit")}>
                {(UNITS[form.productType] ?? ["litres"]).map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Total Amount (KES)</label>
              <input className="ff-input" type="number" value={form.totalAmount} onChange={set("totalAmount")} placeholder="15000" min="0" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Scheduled Date/Time</label>
              <input className="ff-input" type="datetime-local" value={form.scheduledAt} onChange={set("scheduledAt")} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Delivery Address *</label>
              <input className="ff-input" value={form.deliveryAddress} onChange={set("deliveryAddress")} placeholder="Enter full delivery address" required />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Notes</label>
              <textarea className="ff-input" value={form.notes} onChange={set("notes")} placeholder="Special instructions, gate code, contact person on site..." />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={loading} className="ff-btn ff-btn-primary"><Save size={14}/>{loading ? "Creating..." : "Create Sale"}</button>
          <Link href="/orders" className="ff-btn ff-btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
