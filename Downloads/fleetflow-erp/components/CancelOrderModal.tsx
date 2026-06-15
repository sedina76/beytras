"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle, X, AlertTriangle } from "lucide-react";

type Props = { orderId: string; orderNumber: string; status: string };

export default function CancelOrderModal({ orderId, orderNumber, status }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (status === "cancelled" || status === "delivered") return null;

  function close() {
    setOpen(false);
    setReason("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 5) { setError("Please provide a reason of at least 5 characters"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        try {
          const d = await res.json();
          setError(d.error ?? "Failed to cancel order");
        } catch {
          setError(`Failed to cancel order (${res.status})`);
        }
        return;
      }
      close();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const valid = reason.trim().length >= 5;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "none", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
      >
        <XCircle size={13} /> Cancel Order
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#dc2626" }}>Cancel Order</h2>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
                  {orderNumber} — this cannot be automatically undone
                </p>
              </div>
              <button onClick={close} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, borderRadius: 6 }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", gap: 10, background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 16, alignItems: "flex-start" }}>
                <AlertTriangle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12.5, color: "#991b1b", margin: 0, lineHeight: 1.5 }}>
                  The order status will be set to <strong>cancelled</strong> and the reason will be saved to the order notes and audit log.
                </p>
              </div>

              <div style={{ marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>
                  Reason for cancellation *
                </label>
                <span style={{ fontSize: 11, color: valid ? "#16a34a" : "var(--text-muted)" }}>
                  {reason.trim().length} / min 5
                </span>
              </div>
              <textarea
                className="ff-input"
                rows={4}
                placeholder="e.g. Customer requested cancellation, duplicate order, delivery address error…"
                value={reason}
                onChange={e => { setReason(e.target.value); setError(""); }}
                autoFocus
                style={{ width: "100%", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", marginBottom: 4 }}
              />

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, color: "#dc2626", marginTop: 8 }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
                <button type="button" onClick={close} style={{ padding: "8px 16px", background: "none", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={saving || !valid}
                  style={{ padding: "8px 18px", background: valid ? "#dc2626" : "#f1f5f9", color: valid ? "#fff" : "var(--text-muted)", border: "none", borderRadius: 8, cursor: valid ? "pointer" : "default", fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? "Cancelling…" : "Confirm Cancel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
