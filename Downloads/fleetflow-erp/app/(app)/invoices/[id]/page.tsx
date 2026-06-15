"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2, Send, AlertCircle, X, DollarSign, Printer, Clock } from "lucide-react";

type Payment = { id: string; amount: number; method: string; reference: string | null; notes: string | null; paidAt: string };
type Invoice = {
  id: string; invoiceNumber: string; status: string;
  subtotal: number; taxRate: number; taxAmount: number; totalAmount: number; paidAmount: number;
  dueDate: string; notes: string | null; createdAt: string;
  customer: { id: string; name: string; email: string; phone: string; address: string };
  order: { orderNumber: string; productType: string; quantityOrdered: number; unit: string; deliveryAddress: string } | null;
  payments: Payment[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft:    { label: "Draft",    color: "#64748b", bg: "#f1f5f9", icon: <FileText size={14}/> },
  sent:     { label: "Sent",     color: "#2563eb", bg: "#dbeafe", icon: <Send size={14}/> },
  paid:     { label: "Paid",     color: "#16a34a", bg: "#dcfce7", icon: <CheckCircle2 size={14}/> },
  overdue:  { label: "Overdue",  color: "#dc2626", bg: "#fef2f2", icon: <AlertCircle size={14}/> },
  cancelled:{ label: "Cancelled",color: "#64748b", bg: "#f1f5f9", icon: <X size={14}/> },
};

const METHODS = ["cash", "mpesa", "bank_transfer", "cheque"];

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: "", method: "mpesa", reference: "", notes: "" });
  const [paying, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/invoices/${id}`);
    if (res.status === 404) { setNotFound(true); setLoading(false); return; }
    if (res.ok) setInvoice(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId: id, amount: Number(payForm.amount), method: payForm.method, reference: payForm.reference, notes: payForm.notes }),
    });
    if (res.ok) { setPayModal(false); setPayForm({ amount: "", method: "mpesa", reference: "", notes: "" }); load(); }
    setSaving(false);
  }

  async function updateStatus(status: string) {
    setUpdatingStatus(true);
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
    setUpdatingStatus(false);
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading invoice…</div>;
  if (notFound) return (
    <div style={{ padding: 60, textAlign: "center" }}>
      <FileText size={48} color="var(--text-muted)" style={{ marginBottom: 12 }} />
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>Invoice not found</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>This invoice may have been deleted or you don't have access.</p>
      <Link href="/invoices" className="ff-btn ff-btn-primary">Back to Invoices</Link>
    </div>
  );
  if (!invoice) return null;

  const balance = invoice.totalAmount - invoice.paidAmount;
  const isOverdue = new Date(invoice.dueDate) < new Date() && !["paid","cancelled"].includes(invoice.status);
  const cfg = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.draft;

  return (
    <div className="slide-in">
      {/* Back */}
      <Link href="/invoices" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 16 }}>
        <ArrowLeft size={14}/> Back to Invoices
      </Link>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, fontFamily: "monospace" }}>{invoice.invoiceNumber}</h1>
            <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 700 }}>
              {cfg.icon}{cfg.label}
            </span>
            {isOverdue && invoice.status !== "overdue" && (
              <span style={{ padding: "4px 10px", borderRadius: 99, background: "#fef2f2", color: "#dc2626", fontSize: 12, fontWeight: 700 }}>OVERDUE</span>
            )}
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: 0 }}>
            Issued {new Date(invoice.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })} · Due {new Date(invoice.dueDate).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {invoice.status === "draft" && (
            <button onClick={() => updateStatus("sent")} disabled={updatingStatus} className="ff-btn ff-btn-secondary ff-btn-sm">
              <Send size={13}/> Mark as Sent
            </button>
          )}
          {["sent","overdue"].includes(invoice.status) && (
            <>
              <button onClick={() => updateStatus("overdue")} disabled={updatingStatus || invoice.status === "overdue"} className="ff-btn ff-btn-secondary ff-btn-sm" style={{ color: "#d97706" }}>
                <Clock size={13}/> Mark Overdue
              </button>
              <button onClick={() => setPayModal(true)} className="ff-btn ff-btn-primary ff-btn-sm">
                <DollarSign size={13}/> Record Payment
              </button>
            </>
          )}
          {invoice.status === "draft" && (
            <button onClick={() => setPayModal(true)} className="ff-btn ff-btn-primary ff-btn-sm">
              <DollarSign size={13}/> Record Payment
            </button>
          )}
          {invoice.status === "paid" && balance <= 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#16a34a", fontWeight: 700, fontSize: 13 }}>
              <CheckCircle2 size={16}/> Fully Paid
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Customer */}
          <div className="ff-card">
            <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Bill To</h3>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{invoice.customer.name}</div>
            {invoice.customer.email && <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 2 }}>{invoice.customer.email}</div>}
            {invoice.customer.phone && <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 2 }}>{invoice.customer.phone}</div>}
            {invoice.customer.address && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{invoice.customer.address}</div>}
            <Link href={`/customers/${invoice.customer.id}`} style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", display: "inline-block", marginTop: 8 }}>
              View customer profile →
            </Link>
          </div>

          {/* Linked order */}
          {invoice.order && (
            <div className="ff-card">
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Linked Order</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginBottom: 2 }}>ORDER #</div>
                  <div style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 13, color: "var(--accent)" }}>{invoice.order.orderNumber}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginBottom: 2 }}>PRODUCT</div>
                  <div style={{ fontWeight: 600, fontSize: 13, textTransform: "capitalize" }}>{invoice.order.productType}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginBottom: 2 }}>QUANTITY</div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{invoice.order.quantityOrdered.toLocaleString()} {invoice.order.unit}</div>
                </div>
              </div>
            </div>
          )}

          {/* Invoice breakdown */}
          <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Invoice Breakdown</h3>
            </div>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ height: 1, background: "var(--border)", margin: "0 0 12px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800 }}>
                <span>Total</span>
                <span>KES {invoice.totalAmount.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 8 }}>
                <span style={{ color: "#16a34a", fontWeight: 500 }}>Paid</span>
                <span style={{ color: "#16a34a", fontWeight: 700 }}>KES {invoice.paidAmount.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 6 }}>
                <span style={{ color: balance > 0 ? "#dc2626" : "var(--text-muted)", fontWeight: 600 }}>Balance Due</span>
                <span style={{ color: balance > 0 ? "#dc2626" : "#16a34a", fontWeight: 800, fontSize: 15 }}>
                  {balance <= 0 ? "KES 0 ✓" : `KES ${balance.toLocaleString()}`}
                </span>
              </div>
            </div>

            {/* Balance progress bar */}
            {invoice.totalAmount > 0 && (
              <div style={{ padding: "0 16px 14px" }}>
                <div style={{ height: 6, background: "#f1f5f9", borderRadius: 99 }}>
                  <div style={{ height: "100%", borderRadius: 99, background: balance <= 0 ? "#16a34a" : "#2563eb", width: `${Math.min(100, (invoice.paidAmount / invoice.totalAmount) * 100)}%`, transition: "width 0.4s ease" }} />
                </div>
                <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 4 }}>
                  {Math.round((invoice.paidAmount / invoice.totalAmount) * 100)}% paid
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="ff-card">
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 8px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Notes</h3>
              <p style={{ fontSize: 13, color: "var(--text-primary)", margin: 0, lineHeight: 1.6 }}>{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Right column — payment history */}
        <div>
          <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Payment History</h3>
              {balance > 0 && invoice.status !== "cancelled" && (
                <button onClick={() => setPayModal(true)} style={{ fontSize: 11.5, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                  + Record
                </button>
              )}
            </div>
            {invoice.payments.length === 0 ? (
              <div style={{ padding: "30px 14px", textAlign: "center" }}>
                <DollarSign size={28} color="var(--text-muted)" />
                <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "8px 0 0" }}>No payments recorded yet</p>
              </div>
            ) : (
              <div>
                {invoice.payments.map((p, i) => (
                  <div key={p.id} style={{ padding: "10px 14px", borderBottom: i < invoice.payments.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#16a34a" }}>KES {p.amount.toLocaleString()}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(p.paidAt).toLocaleDateString("en-KE")}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)", textTransform: "capitalize" }}>
                      {p.method.replace(/_/g, " ")}
                      {p.reference && ` · Ref: ${p.reference}`}
                    </div>
                    {p.notes && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{p.notes}</div>}
                  </div>
                ))}
                <div style={{ padding: "10px 14px", background: "#f8fafc", borderTop: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 700 }}>
                    <span>Total Paid</span>
                    <span style={{ color: "#16a34a" }}>KES {invoice.paidAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {payModal && (
        <div className="ff-modal-overlay" onClick={() => setPayModal(false)}>
          <div className="ff-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Record Payment</h3>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>{invoice.invoiceNumber} · Balance: KES {balance.toLocaleString()}</p>
              </div>
              <button onClick={() => setPayModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18}/></button>
            </div>
            <form onSubmit={recordPayment} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Amount (KES) *</label>
                <input
                  className="ff-input"
                  type="number"
                  placeholder={`Max ${balance.toLocaleString()}`}
                  value={payForm.amount}
                  onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                  max={balance}
                  min={1}
                  required
                />
                {Number(payForm.amount) > 0 && (
                  <p style={{ fontSize: 11, color: Number(payForm.amount) >= balance ? "#16a34a" : "#d97706", margin: "4px 0 0" }}>
                    {Number(payForm.amount) >= balance ? "✓ This will fully settle the invoice" : `KES ${(balance - Number(payForm.amount)).toLocaleString()} will remain outstanding`}
                  </p>
                )}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Payment Method *</label>
                <select className="ff-input" value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))} required>
                  {METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g, " ").toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Reference / Transaction ID</label>
                <input className="ff-input" placeholder="e.g. MPESA code, cheque #" value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Notes</label>
                <input className="ff-input" placeholder="Optional notes" value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" disabled={paying} className="ff-btn ff-btn-primary" style={{ flex: 1 }}>
                  {paying ? "Saving…" : "Record Payment"}
                </button>
                <button type="button" onClick={() => setPayModal(false)} className="ff-btn ff-btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
