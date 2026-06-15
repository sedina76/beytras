"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function NewInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [orders, setOrders] = useState<{ id: string; orderNumber: string; totalAmount: number; customerId: string }[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [subtotal, setSubtotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/customers").then(r => r.ok ? r.json() : {}).then((d: Record<string, unknown[]>) => setCustomers((d.customers ?? []) as never[])).catch(() => {});
    fetch("/api/orders?status=delivered").then(r => r.ok ? r.json() : {}).then((d: Record<string, unknown[]>) => setOrders((d.orders ?? []) as never[])).catch(() => {});
  }, []);

  const filteredOrders = selectedCustomer ? orders.filter(o => o.customerId === selectedCustomer) : orders;
  function handleOrderChange(orderId: string) {
    const o = orders.find(x => x.id === orderId);
    if (o) {
      setSubtotal(o.totalAmount);
      setSelectedCustomer(o.customerId);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = {
      customerId: fd.get("customerId"),
      orderId: fd.get("orderId") || null,
      subtotal,
      dueDate: fd.get("dueDate"),
      notes: fd.get("notes") || null,
    };

    const res = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      router.push("/invoices");
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to create invoice");
      setSubmitting(false);
    }
  }

  const dueDefault = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return (
    <div className="slide-in" style={{ maxWidth: 600 }}>
      <Link href="/invoices" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 16 }}>
        <ArrowLeft size={14} /> Back to Invoices
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FileText size={20} color="#7c3aed" />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>New Invoice</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: 0 }}>Generate an invoice for a customer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="ff-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 5 }}>Customer *</label>
          <select
            name="customerId"
            required
            className="ff-input"
            value={selectedCustomer}
            onChange={e => setSelectedCustomer(e.target.value)}
          >
            <option value="">Select customer</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 5 }}>Linked Order (optional)</label>
          <select name="orderId" className="ff-input" onChange={e => handleOrderChange(e.target.value)}>
            <option value="">No linked order</option>
            {filteredOrders.map(o => (
              <option key={o.id} value={o.id}>{o.orderNumber} — KES {o.totalAmount.toLocaleString()}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 5 }}>Amount (KES) *</label>
            <input
              type="number"
              step="0.01"
              required
              className="ff-input"
              value={subtotal}
              onChange={e => setSubtotal(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 5 }}>Total (KES)</label>
            <input type="text" readOnly className="ff-input" value={subtotal.toFixed(2)} style={{ background: "var(--background)", fontWeight: 700 }} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 5 }}>Due Date *</label>
          <input name="dueDate" type="date" required className="ff-input" defaultValue={dueDefault} />
        </div>

        <div>
          <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 5 }}>Notes</label>
          <textarea name="notes" className="ff-input" rows={2} placeholder="Payment terms, bank details…" />
        </div>

        <div style={{ background: "var(--background)", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 3px" }}>Total</p>
          <p style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#7c3aed" }}>KES {subtotal.toLocaleString()}</p>
        </div>

        {error && <p style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>{error}</p>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Link href="/invoices" className="ff-btn ff-btn-secondary">Cancel</Link>
          <button type="submit" disabled={submitting} className="ff-btn ff-btn-primary">
            {submitting ? "Creating…" : "Create Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}
