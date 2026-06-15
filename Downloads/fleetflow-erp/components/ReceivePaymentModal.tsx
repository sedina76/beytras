"use client";
import { useState, useEffect } from "react";
import { X, DollarSign, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Customer = { id: string; name: string };
type OutstandingInvoice = {
  id: string; invoiceNumber: string; balance: number;
  totalAmount: number; paidAmount: number;
  dueDate: string; status: string;
  order: { orderNumber: string } | null;
};

const METHODS = ["cash", "mpesa", "bank_transfer", "cheque"];

export default function ReceivePaymentModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [method, setMethod] = useState("mpesa");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [invoices, setInvoices] = useState<OutstandingInvoice[]>([]);
  const [allocations, setAllocations] = useState<Record<string, string>>({});
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/customers").then(r => r.ok ? r.json() : []).then(d => setCustomers(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    if (!customerId) { setInvoices([]); setAllocations({}); return; }
    setLoadingInvoices(true);
    fetch(`/api/payments/allocate?customerId=${customerId}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: OutstandingInvoice[]) => {
        setInvoices(data);
        setAllocations({});
        setLoadingInvoices(false);
      });
  }, [customerId]);

  // Auto-distribute total amount FIFO when totalAmount changes
  useEffect(() => {
    const total = parseFloat(totalAmount);
    if (!total || total <= 0 || invoices.length === 0) { setAllocations({}); return; }
    let remaining = total;
    const alloc: Record<string, string> = {};
    for (const inv of invoices) {
      if (remaining <= 0) break;
      const pay = Math.min(remaining, inv.balance);
      alloc[inv.id] = pay.toFixed(2);
      remaining -= pay;
    }
    setAllocations(alloc);
  }, [totalAmount, invoices]);

  const totalAllocated = Object.values(allocations).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const totalEntered = parseFloat(totalAmount) || 0;
  const unallocated = parseFloat((totalEntered - totalAllocated).toFixed(2));

  async function submit() {
    setError("");
    const entries = Object.entries(allocations)
      .map(([invoiceId, amt]) => ({ invoiceId, amount: parseFloat(amt) || 0 }))
      .filter(a => a.amount > 0);
    if (!customerId) { setError("Select a customer"); return; }
    if (entries.length === 0) { setError("Enter at least one amount"); return; }
    setSaving(true);
    const res = await fetch("/api/payments/allocate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, method, reference, notes, allocations: entries }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Failed to record payment"); return; }
    setDone(true);
    router.refresh();
  }

  if (done) return (
    <div className="ff-modal-overlay" onClick={onClose}>
      <div className="ff-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, textAlign: "center" }}>
        <CheckCircle2 size={48} color="#16a34a" style={{ margin: "0 auto 12px", display: "block" }} />
        <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 6px" }}>Payment Recorded</h3>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 20px" }}>
          KES {totalAllocated.toLocaleString()} allocated across {Object.values(allocations).filter(v => parseFloat(v) > 0).length} invoice(s).
        </p>
        <button onClick={onClose} className="ff-btn ff-btn-primary" style={{ width: "100%" }}>Close</button>
      </div>
    </div>
  );

  return (
    <div className="ff-modal-overlay" onClick={onClose}>
      <div className="ff-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Receive Payment</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>Allocate received amount to outstanding invoices</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
        </div>

        {error && (
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "8px 12px", marginBottom: 14, color: "#dc2626", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* Top fields */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Customer *</label>
            <select className="ff-input" value={customerId} onChange={e => setCustomerId(e.target.value)}>
              <option value="">Select customer…</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Total Received (KES) *</label>
            <input
              className="ff-input" type="number" min="0" step="1"
              placeholder="Enter total amount"
              value={totalAmount} onChange={e => setTotalAmount(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Payment Method *</label>
            <select className="ff-input" value={method} onChange={e => setMethod(e.target.value)}>
              {METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g, " ").toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Reference / Transaction ID</label>
            <input className="ff-input" placeholder="e.g. MPESA code" value={reference} onChange={e => setReference(e.target.value)} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Notes</label>
            <input className="ff-input" placeholder="Optional notes" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        {/* Outstanding invoices */}
        {customerId && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Outstanding Invoices
            </div>
            {loadingInvoices ? (
              <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>Loading…</p>
            ) : invoices.length === 0 ? (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "#16a34a", marginBottom: 14 }}>
                No outstanding invoices for this customer.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                {invoices.map(inv => {
                  const alloc = parseFloat(allocations[inv.id] || "0");
                  const afterPay = inv.paidAmount + alloc;
                  const settled = afterPay >= inv.totalAmount;
                  return (
                    <div key={inv.id} style={{
                      display: "grid", gridTemplateColumns: "1fr auto",
                      gap: 10, alignItems: "center",
                      padding: "10px 12px", borderRadius: 8,
                      background: settled ? "#f0fdf4" : "var(--background)",
                      border: `1px solid ${settled ? "#bbf7d0" : "var(--border)"}`,
                    }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, fontFamily: "monospace", color: "var(--accent)" }}>{inv.invoiceNumber}</span>
                          {inv.order && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>· {inv.order.orderNumber}</span>}
                          <span className={`ff-badge ${inv.status === "overdue" ? "ff-badge-red" : "ff-badge-blue"}`} style={{ fontSize: 10 }}>{inv.status}</span>
                          {settled && <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>✓ Will be settled</span>}
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                          Balance: <strong style={{ color: "var(--text-primary)" }}>KES {inv.balance.toLocaleString()}</strong>
                          {" · "}Due {new Date(inv.dueDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </div>
                      <div style={{ width: 130 }}>
                        <label style={{ fontSize: 10, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Allocate (KES)</label>
                        <input
                          className="ff-input"
                          type="number" min="0" step="1"
                          style={{ padding: "5px 8px", fontSize: 12 }}
                          placeholder="0"
                          max={inv.balance}
                          value={allocations[inv.id] ?? ""}
                          onChange={e => setAllocations(a => ({ ...a, [inv.id]: e.target.value }))}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Allocation summary */}
            {totalEntered > 0 && (
              <div style={{ background: "var(--background)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "var(--text-muted)" }}>Total received</span>
                  <span style={{ fontWeight: 700 }}>KES {totalEntered.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "var(--text-muted)" }}>Allocated</span>
                  <span style={{ fontWeight: 700, color: "#16a34a" }}>KES {totalAllocated.toLocaleString()}</span>
                </div>
                {unallocated !== 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 4, marginTop: 4 }}>
                    <span style={{ color: unallocated > 0 ? "#d97706" : "#dc2626", fontWeight: 600 }}>
                      {unallocated > 0 ? "Unallocated" : "Over-allocated"}
                    </span>
                    <span style={{ fontWeight: 700, color: unallocated > 0 ? "#d97706" : "#dc2626" }}>KES {Math.abs(unallocated).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={submit}
            disabled={saving || totalAllocated === 0}
            className="ff-btn ff-btn-primary"
            style={{ flex: 1, opacity: (saving || totalAllocated === 0) ? 0.7 : 1 }}
          >
            <DollarSign size={14} />
            {saving ? "Recording…" : `Record KES ${totalAllocated.toLocaleString()}`}
          </button>
          <button onClick={onClose} className="ff-btn ff-btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}
