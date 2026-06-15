"use client";
import { useState } from "react";
import { X, Save, Loader2 } from "lucide-react";

const ROLES = [
  { value: "dispatcher", label: "Dispatcher" },
  { value: "accountant", label: "Accountant" },
  { value: "mechanic", label: "Mechanic" },
  { value: "customer_support", label: "Customer Support" },
  { value: "company_admin", label: "Company Admin" },
  { value: "conductor", label: "Conductor" },
];

const DRIVER_STATUSES = [
  { value: "available", label: "Available" },
  { value: "on_trip", label: "On Trip" },
  { value: "off_duty", label: "Off Duty" },
];

type UserRow = { id: string; name: string; email: string; role: string; isActive: boolean; monthlySalary: number | null; avatarUrl: string | null };
type DriverRow = { id: string; name: string; phone: string; licenseNumber: string; licenseExpiry: string; status: string; avatarUrl?: string | null };

type Props =
  | { type: "user"; employee: UserRow; onSaved: () => void; onClose: () => void }
  | { type: "driver"; employee: DriverRow; onSaved: () => void; onClose: () => void };

export default function EditEmployeeModal(props: Props) {
  const { type, employee, onSaved, onClose } = props;

  const [form, setForm] = useState(() => {
    if (type === "user") {
      const u = employee as UserRow;
      return {
        name: u.name, email: u.email ?? "", phone: "", role: u.role,
        isActive: u.isActive, monthlySalary: u.monthlySalary !== null ? String(u.monthlySalary) : "",
        licenseNumber: "", licenseExpiry: "", status: "",
      };
    } else {
      const d = employee as DriverRow;
      return {
        name: d.name, email: "", phone: d.phone, role: "",
        isActive: true, monthlySalary: "",
        licenseNumber: d.licenseNumber,
        licenseExpiry: d.licenseExpiry ? new Date(d.licenseExpiry).toISOString().slice(0, 10) : "",
        status: d.status,
      };
    }
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }));
    setError("");
  }

  async function save() {
    if (!form.name.trim()) { setError("Name is required"); return; }

    setSaving(true); setError("");
    try {
      let body: Record<string, unknown>;
      let url: string;

      if (type === "user") {
        url = `/api/users/${employee.id}`;
        body = {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          isActive: form.isActive,
          monthlySalary: form.monthlySalary !== "" ? Number(form.monthlySalary) : null,
        };
      } else {
        if (!form.licenseNumber.trim()) { setError("License number is required"); setSaving(false); return; }
        url = `/api/drivers/${employee.id}`;
        body = {
          name: form.name.trim(),
          phone: form.phone.trim(),
          licenseNumber: form.licenseNumber.trim(),
          licenseExpiry: form.licenseExpiry || null,
          status: form.status,
        };
      }

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Save failed");
        return;
      }

      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const isUser = type === "user";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Edit {isUser ? "Employee" : "Driver"}</h2>
            <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: "2px 0 0" }}>{employee.name}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, borderRadius: 6 }}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 13 }}>
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, color: "#dc2626" }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Full Name *</label>
            <input className="ff-input" value={form.name} onChange={e => set("name", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
          </div>

          {isUser ? (
            <>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Email</label>
                <input className="ff-input" type="email" value={form.email} onChange={e => set("email", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Role</label>
                  <select className="ff-input" value={form.role} onChange={e => set("role", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Monthly Salary (KES)</label>
                  <input className="ff-input" type="number" min={0} placeholder="e.g. 45000" value={form.monthlySalary} onChange={e => set("monthlySalary", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Status</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{ v: true, label: "Active" }, { v: false, label: "Inactive" }].map(({ v, label }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => set("isActive", v)}
                      style={{
                        padding: "6px 16px", borderRadius: 8, border: `1.5px solid ${form.isActive === v ? (v ? "#16a34a" : "#dc2626") : "var(--border)"}`,
                        background: form.isActive === v ? (v ? "#f0fdf4" : "#fef2f2") : "transparent",
                        color: form.isActive === v ? (v ? "#16a34a" : "#dc2626") : "var(--text-muted)",
                        cursor: "pointer", fontSize: 12.5, fontWeight: 600,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Phone</label>
                <input className="ff-input" type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>License Number *</label>
                  <input className="ff-input" value={form.licenseNumber} onChange={e => set("licenseNumber", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>License Expiry</label>
                  <input className="ff-input" type="date" value={form.licenseExpiry} onChange={e => set("licenseExpiry", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Status</label>
                <select className="ff-input" value={form.status} onChange={e => set("status", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                  {DRIVER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
            <button onClick={save} disabled={saving} className="ff-btn ff-btn-primary" style={{ flex: 1 }}>
              {saving ? <><Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> Saving…</> : <><Save size={13} /> Save Changes</>}
            </button>
            <button onClick={onClose} className="ff-btn ff-btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
