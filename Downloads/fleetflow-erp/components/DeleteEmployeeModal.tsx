"use client";
import { useState } from "react";
import { Trash2, X, AlertTriangle } from "lucide-react";

type Props = {
  type: "user" | "driver";
  id: string;
  name: string;
  role: string;
  onDeleted: () => void;
};

export default function DeleteEmployeeModal({ type, id, name, role, onDeleted }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isDriver = type === "driver";
  const label = isDriver ? "Driver" : role === "conductor" ? "Conductor" : "Employee";

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 5) { setError("Please provide a reason (min. 5 characters)"); return; }
    setSaving(true);
    setError("");
    try {
      const url = isDriver ? `/api/drivers/${id}` : `/api/users/${id}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? `Failed to remove ${label.toLowerCase()}`); return; }
      setOpen(false);
      setReason("");
      onDeleted();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setError(""); setReason(""); }}
        title={`Remove ${label}`}
        style={{ padding: "4px 6px", background: "none", border: "1px solid #fca5a5", borderRadius: 6, cursor: "pointer", color: "#dc2626", display: "flex", alignItems: "center" }}
      >
        <Trash2 size={13} />
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AlertTriangle size={18} color="#dc2626" />
                </div>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#dc2626" }}>Remove {label}</h2>
                  <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: "1px 0 0" }}>
                    {isDriver ? "This will permanently remove the driver record" : "This will remove the staff record"}
                  </p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, borderRadius: 6 }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDelete} style={{ padding: "18px 20px" }}>
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "capitalize" }}>{role.replace(/_/g, " ")}</div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Reason *
                </label>
                <textarea
                  className="ff-input"
                  placeholder="e.g. Resigned, contract ended, disciplinary action…"
                  value={reason}
                  onChange={e => { setReason(e.target.value); setError(""); }}
                  rows={3}
                  required
                  style={{ width: "100%", boxSizing: "border-box", resize: "vertical", minHeight: 80 }}
                />
                <div style={{ fontSize: 11, color: reason.trim().length < 5 ? "var(--text-muted)" : "#16a34a", marginTop: 4 }}>
                  {reason.trim().length}/200 characters {reason.trim().length >= 5 && "✓"}
                </div>
              </div>

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, color: "#dc2626", marginBottom: 14 }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{ padding: "8px 16px", background: "none", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || reason.trim().length < 5}
                  style={{ padding: "8px 18px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, cursor: saving || reason.trim().length < 5 ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, opacity: saving || reason.trim().length < 5 ? 0.6 : 1, display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Trash2 size={13} />
                  {saving ? "Removing…" : `Remove ${label}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
