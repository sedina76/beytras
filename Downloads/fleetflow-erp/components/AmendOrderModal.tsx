"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, AlertTriangle } from "lucide-react";

const STATUSES = ["pending", "confirmed", "dispatched", "in_progress", "delivered", "cancelled"];
const PRIORITIES = ["low", "normal", "high", "urgent"];
const PRODUCT_TYPES = ["water", "fuel", "goods"];
const TYPES = ["delivery", "pickup", "transfer"];
const UNITS = ["litres", "kg", "units", "bags", "cartons"];

type OrderSnapshot = {
  id: string;
  status: string;
  priority: string;
  productType: string;
  type: string;
  quantityOrdered: number;
  unit: string;
  totalAmount: number;
  deliveryAddress: string;
  scheduledAt: string | null;
  notes: string | null;
};

export default function AmendOrderModal({ order }: { order: OrderSnapshot }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    status: order.status,
    priority: order.priority,
    productType: order.productType,
    type: order.type,
    quantityOrdered: String(order.quantityOrdered),
    unit: order.unit,
    totalAmount: String(order.totalAmount),
    deliveryAddress: order.deliveryAddress,
    scheduledAt: order.scheduledAt ? order.scheduledAt.slice(0, 16) : "",
    notes: order.notes ?? "",
  });

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setError("");
  }

  function close() {
    setOpen(false);
    setError("");
    // reset to last-saved values
    setForm({
      status: order.status,
      priority: order.priority,
      productType: order.productType,
      type: order.type,
      quantityOrdered: String(order.quantityOrdered),
      unit: order.unit,
      totalAmount: String(order.totalAmount),
      deliveryAddress: order.deliveryAddress,
      scheduledAt: order.scheduledAt ? order.scheduledAt.slice(0, 16) : "",
      notes: order.notes ?? "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.deliveryAddress.trim()) { setError("Delivery address is required"); return; }
    if (!form.quantityOrdered || Number(form.quantityOrdered) <= 0) { setError("Quantity must be greater than 0"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: form.status,
          priority: form.priority,
          productType: form.productType,
          type: form.type,
          quantityOrdered: Number(form.quantityOrdered),
          unit: form.unit,
          totalAmount: Number(form.totalAmount) || 0,
          deliveryAddress: form.deliveryAddress.trim(),
          scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
          notes: form.notes.trim() || null,
        }),
      });
      if (!res.ok) {
        try {
          const d = await res.json();
          setError(d.error ?? "Failed to save changes");
        } catch {
          setError(`Failed to save changes (${res.status})`);
        }
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const isDelivered = order.status === "delivered";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
      >
        <Pencil size={13} /> Amend Order
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 560, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "92vh", overflowY: "auto" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Amend Order</h2>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>Edit any field — all statuses allowed</p>
              </div>
              <button onClick={close} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, borderRadius: 6 }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "18px 20px" }}>
              <div style={{ display: "grid", gap: 14 }}>

                {/* Warning if delivered */}
                {isDelivered && (
                  <div style={{ display: "flex", gap: 10, background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 14px", alignItems: "flex-start" }}>
                    <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 12.5, color: "#92400e", margin: 0, lineHeight: 1.5 }}>
                      This order is marked <strong>delivered</strong>. Amending will update the record — use this to correct errors or revert status.
                    </p>
                  </div>
                )}

                {/* Status + Priority */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Status</label>
                    <select className="ff-input" value={form.status} onChange={e => set("status", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Priority</label>
                    <select className="ff-input" value={form.priority} onChange={e => set("priority", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                      {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                {/* Product Type + Order Type */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Product Type</label>
                    <select className="ff-input" value={form.productType} onChange={e => set("productType", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                      {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Order Type</label>
                    <select className="ff-input" value={form.type} onChange={e => set("type", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                      {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Quantity + Unit + Amount */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Quantity *</label>
                    <input className="ff-input" type="number" min={0} step="any" value={form.quantityOrdered} onChange={e => set("quantityOrdered", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Unit</label>
                    <select className="ff-input" value={form.unit} onChange={e => set("unit", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Amount (KES)</label>
                    <input className="ff-input" type="number" min={0} step="any" value={form.totalAmount} onChange={e => set("totalAmount", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Delivery Address *</label>
                  <textarea
                    className="ff-input"
                    rows={2}
                    value={form.deliveryAddress}
                    onChange={e => set("deliveryAddress", e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }}
                  />
                </div>

                {/* Scheduled At */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Scheduled At</label>
                  <input className="ff-input" type="datetime-local" value={form.scheduledAt} onChange={e => set("scheduledAt", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
                </div>

                {/* Notes */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Notes</label>
                  <textarea
                    className="ff-input"
                    rows={3}
                    placeholder="Internal notes about this order or correction..."
                    value={form.notes}
                    onChange={e => set("notes", e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }}
                  />
                </div>

                {error && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, color: "#dc2626" }}>
                    {error}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
                  <button type="button" onClick={close} style={{ padding: "8px 16px", background: "none", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} style={{ padding: "8px 20px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
