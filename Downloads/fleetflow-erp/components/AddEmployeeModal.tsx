"use client";
import { useState, useRef } from "react";
import { UserPlus, X, Camera } from "lucide-react";

const ROLES = [
  { value: "dispatcher", label: "Dispatcher" },
  { value: "accountant", label: "Accountant" },
  { value: "mechanic", label: "Mechanic" },
  { value: "customer_support", label: "Customer Support" },
  { value: "company_admin", label: "Company Admin" },
  { value: "driver", label: "Driver" },
  { value: "conductor", label: "Conductor" },
];

const PAY_TYPES = [
  { value: "per_trip", label: "Per Trip" },
  { value: "per_day", label: "Per Day" },
  { value: "both", label: "Trip + Day" },
];

type Props = { onAdded: () => void };

const EMPTY_FORM = {
  name: "", email: "", phone: "", role: "dispatcher", password: "", monthlySalary: "",
  licenseNumber: "", licenseExpiry: "", payType: "per_trip", perTripRate: "", perDayRate: "",
};

export default function AddEmployeeModal({ onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isDriver = form.role === "driver";
  const isConductor = form.role === "conductor";

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setError("");
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Photo upload failed"); return; }
      setAvatarUrl(data.url);
    } finally {
      setAvatarUploading(false);
    }
  }

  function close() {
    setOpen(false);
    setForm(EMPTY_FORM);
    setAvatarUrl(null);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      let url = "/api/users";
      let body: Record<string, unknown>;

      if (isDriver) {
        if (!form.licenseNumber.trim()) { setError("License number is required for drivers"); setSaving(false); return; }
        if (!form.licenseExpiry) { setError("License expiry is required for drivers"); setSaving(false); return; }
        url = "/api/drivers";
        body = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: form.role,
          licenseNumber: form.licenseNumber,
          licenseExpiry: form.licenseExpiry,
          payType: form.payType,
          perTripRate: form.perTripRate ? Number(form.perTripRate) : 0,
          perDayRate: form.perDayRate ? Number(form.perDayRate) : 0,
          avatarUrl: avatarUrl ?? undefined,
        };
      } else if (isConductor) {
        // No password — API generates a random unusable hash
        const perTrip = form.perTripRate ? Number(form.perTripRate) : null;
        const baseSalary = form.monthlySalary ? Number(form.monthlySalary) : null;
        body = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          // per-trip rate takes precedence; fall back to monthly salary if only that is set
          monthlySalary: perTrip ?? baseSalary,
          avatarUrl: avatarUrl ?? undefined,
        };
      } else {
        body = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          password: form.password,
          monthlySalary: form.monthlySalary ? Number(form.monthlySalary) : null,
          avatarUrl: avatarUrl ?? undefined,
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Failed to create employee"); return; }
      close();
      onAdded();
    } finally {
      setSaving(false);
    }
  }

  const submitLabel = saving ? "Creating…"
    : isConductor ? "Create Conductor"
    : isDriver ? "Create Driver"
    : "Create Employee";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
      >
        <UserPlus size={14} /> Add Employee
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 500, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Add Employee</h2>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>Create a new staff account</p>
              </div>
              <button onClick={close} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, borderRadius: 6 }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "18px 20px" }}>
              <div style={{ display: "grid", gap: 14 }}>

                {/* Avatar */}
                <div style={{ display: "flex", justifyContent: "center", paddingBottom: 4 }}>
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <div
                      onClick={() => !avatarUploading && fileRef.current?.click()}
                      style={{
                        width: 80, height: 80, borderRadius: "50%",
                        background: avatarUrl ? `url(${avatarUrl}) center/cover` : "#e2e8f0",
                        border: "3px solid var(--border)", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        overflow: "hidden", position: "relative",
                      }}
                    >
                      {!avatarUrl && !avatarUploading && <Camera size={24} color="#94a3b8" />}
                      {avatarUploading && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div className="spinner" style={{ width: 20, height: 20, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%" }} />
                        </div>
                      )}
                    </div>
                    <div
                      onClick={() => !avatarUploading && fileRef.current?.click()}
                      style={{ position: "absolute", bottom: 0, right: 0, width: 24, height: 24, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid #fff" }}
                    >
                      <Camera size={11} />
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
                  </div>
                </div>
                <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", marginTop: -10 }}>Click to upload photo (optional)</p>

                {/* Role */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Role *</label>
                  <select className="ff-input" value={form.role} onChange={e => set("role", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>

                {/* Full Name */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Full Name *</label>
                  <input className="ff-input" placeholder="e.g. Jane Wanjiku" value={form.name} onChange={e => set("name", e.target.value)} required style={{ width: "100%", boxSizing: "border-box" }} />
                </div>

                {/* Email + Phone */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Email</label>
                    <input className="ff-input" type="email" placeholder="jane@company.com" value={form.email} onChange={e => set("email", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>
                      Phone {(isDriver || isConductor) ? "*" : ""}
                    </label>
                    <input className="ff-input" type="tel" placeholder="+254 7xx xxx xxx" value={form.phone} onChange={e => set("phone", e.target.value)} required={isDriver || isConductor} style={{ width: "100%", boxSizing: "border-box" }} />
                  </div>
                </div>

                {/* Monthly Salary — conductor only, outside any card */}
                {isConductor && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Monthly Salary (KES)</label>
                    <input
                      className="ff-input"
                      type="number" min={0} placeholder="e.g. 30000"
                      value={form.monthlySalary}
                      onChange={e => set("monthlySalary", e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box" }}
                    />
                  </div>
                )}

                {/* ── DRIVER DETAILS ── */}
                {isDriver && (
                  <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "12px 14px" }}>
                    <p style={{ fontSize: 11.5, fontWeight: 700, color: "#0369a1", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Driver Details</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>License Number *</label>
                        <input className="ff-input" placeholder="e.g. DL-KE-12345" value={form.licenseNumber} onChange={e => set("licenseNumber", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>License Expiry *</label>
                        <input className="ff-input" type="date" value={form.licenseExpiry} onChange={e => set("licenseExpiry", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── PAY RATE — driver and conductor ── */}
                {(isDriver || isConductor) && (
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px 14px" }}>
                    <p style={{ fontSize: 11.5, fontWeight: 700, color: "#15803d", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Pay Rate</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Pay Type</label>
                        {isConductor ? (
                          <div style={{ fontSize: 12, padding: "7px 10px", background: "#f1f5f9", color: "var(--text-muted)", borderRadius: 7, border: "1px solid var(--border)" }}>
                            Per Trip
                          </div>
                        ) : (
                          <select className="ff-input" value={form.payType} onChange={e => set("payType", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                            {PAY_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                          </select>
                        )}
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Per Trip (KES)</label>
                        <input
                          className="ff-input"
                          type="number" min={0} placeholder="0"
                          value={form.perTripRate}
                          onChange={e => set("perTripRate", e.target.value)}
                          disabled={!isConductor && form.payType === "per_day"}
                          style={{ width: "100%", boxSizing: "border-box", opacity: (!isConductor && form.payType === "per_day") ? 0.4 : 1 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Per Day (KES)</label>
                        <input
                          className="ff-input"
                          type="number" min={0} placeholder="0"
                          value={form.perDayRate}
                          onChange={e => set("perDayRate", e.target.value)}
                          disabled={isConductor || form.payType === "per_trip"}
                          style={{ width: "100%", boxSizing: "border-box", opacity: (isConductor || form.payType === "per_trip") ? 0.4 : 1 }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Monthly salary — non-driver, non-conductor staff only */}
                {!isDriver && !isConductor && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Monthly Salary (KES)</label>
                    <input
                      className="ff-input"
                      type="number" min={0} placeholder="e.g. 45000"
                      value={form.monthlySalary}
                      onChange={e => set("monthlySalary", e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box" }}
                    />
                  </div>
                )}

                {/* Password — drivers and other staff only; conductors do not log in */}
                {!isConductor && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Password *</label>
                    <input className="ff-input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => set("password", e.target.value)} required minLength={6} style={{ width: "100%", boxSizing: "border-box" }} />
                  </div>
                )}

                {isConductor && (
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, padding: "4px 0" }}>
                    Conductors are payroll resources only and cannot log into the system.
                  </p>
                )}

                {error && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, color: "#dc2626" }}>
                    {error}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
                  <button type="button" onClick={close} style={{ padding: "8px 16px", background: "none", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} style={{ padding: "8px 18px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                    {submitLabel}
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
