"use client";
import { useState, useEffect, useCallback } from "react";
import { KeyRound, ExternalLink, ShieldCheck, ShieldOff, Trash2, RefreshCw, Eye, EyeOff } from "lucide-react";

type PortalStatus =
  | { exists: false }
  | { exists: true; email: string; isActive: boolean; lastLoginAt: string | null; createdAt: string };

type Props = { customerId: string; customerEmail?: string | null };

export default function CustomerPortalAccessCard({ customerId, customerEmail }: Props) {
  const [status, setStatus] = useState<PortalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const base = `/api/customers/${customerId}/portal-access`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(base);
      if (res.ok) setStatus(await res.json());
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => { load(); }, [load]);

  function openForm(reset = false) {
    setEmail(reset && status?.exists ? status.email : (customerEmail ?? ""));
    setPassword("");
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      setSuccess(data.action === "created" ? "Portal access created successfully." : "Credentials reset successfully.");
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle() {
    setToggling(true);
    setSuccess("");
    try {
      const res = await fetch(base, { method: "PATCH" });
      if (res.ok) { const d = await res.json(); setSuccess(d.isActive ? "Access enabled." : "Access suspended."); await load(); }
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Remove portal access for this customer? They will no longer be able to log in.")) return;
    setDeleting(true);
    setSuccess("");
    try {
      const res = await fetch(base, { method: "DELETE" });
      if (res.ok) { setSuccess("Portal access removed."); await load(); }
    } finally {
      setDeleting(false);
    }
  }

  const portalLoginUrl = typeof window !== "undefined" ? `${window.location.origin}/customer-login` : "/customer-login";

  return (
    <div className="ff-card">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <KeyRound size={15} color="#7c3aed" />
        <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: "var(--text-muted)" }}>PORTAL ACCESS</h3>
      </div>

      {loading ? (
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: 0 }}>Loading…</p>
      ) : (
        <>
          {success && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, color: "#15803d", marginBottom: 12 }}>
              {success}
            </div>
          )}

          {!status?.exists ? (
            <div>
              <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "0 0 12px", lineHeight: 1.5 }}>
                This customer has no portal account. Issue credentials so they can log in and track their orders and invoices.
              </p>
              <button
                onClick={() => openForm()}
                className="ff-btn ff-btn-primary ff-btn-sm"
                style={{ width: "100%" }}
              >
                <KeyRound size={13} /> Issue Portal Access
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Status row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className={`ff-badge ${status.isActive ? "ff-badge-green" : "ff-badge-red"}`}>
                  {status.isActive ? "Active" : "Suspended"}
                </span>
                <a
                  href={portalLoginUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--accent)", textDecoration: "none" }}
                >
                  <ExternalLink size={11} /> Open Portal
                </a>
              </div>

              {/* Credential info */}
              <div style={{ background: "var(--background)", borderRadius: 8, padding: "10px 12px", fontSize: 12.5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "var(--text-muted)" }}>Login email</span>
                  <span style={{ fontWeight: 600 }}>{status.email}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "var(--text-muted)" }}>Created</span>
                  <span>{new Date(status.createdAt).toLocaleDateString("en-KE")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Last login</span>
                  <span>{status.lastLoginAt ? new Date(status.lastLoginAt).toLocaleDateString("en-KE") : "Never"}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <button onClick={() => openForm(true)} className="ff-btn ff-btn-secondary ff-btn-sm">
                  <RefreshCw size={12} /> Reset Password
                </button>
                <button onClick={handleToggle} disabled={toggling} className={`ff-btn ff-btn-sm ${status.isActive ? "ff-btn-secondary" : "ff-btn-success"}`}>
                  {status.isActive ? <><ShieldOff size={12} /> Suspend Access</> : <><ShieldCheck size={12} /> Re-enable Access</>}
                </button>
                <button onClick={handleDelete} disabled={deleting} className="ff-btn ff-btn-danger ff-btn-sm">
                  <Trash2 size={12} /> Remove Access
                </button>
              </div>
            </div>
          )}

          {/* Create / Reset form */}
          {showForm && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 300, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "80px 20px 20px" }}>
              <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                      {status?.exists ? "Reset Portal Credentials" : "Issue Portal Access"}
                    </h2>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>Customer will use these to log in at /customer-login</p>
                  </div>
                  <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 18, lineHeight: 1 }}>×</button>
                </div>

                <form onSubmit={handleSave} style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Login Email *</label>
                    <input
                      className="ff-input"
                      type="email"
                      placeholder="customer@email.com"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(""); }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>
                      {status?.exists ? "New Password *" : "Password *"} <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(min 6 characters)</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        className="ff-input"
                        type={showPw ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(""); }}
                        required
                        minLength={6}
                        style={{ paddingRight: 38 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(v => !v)}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2 }}
                      >
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#92400e" }}>
                    Share these credentials with the customer privately. The portal URL is: <strong>/customer-login</strong>
                  </div>

                  {error && (
                    <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, color: "#dc2626" }}>
                      {error}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button type="button" onClick={() => setShowForm(false)} style={{ padding: "8px 16px", background: "none", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={saving} style={{ padding: "8px 18px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                      {saving ? "Saving…" : status?.exists ? "Reset Credentials" : "Create Access"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
