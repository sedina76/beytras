"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, CheckCircle2, AlertCircle } from "lucide-react";

export default function RegisterCompany() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ companyName: "", email: "", password: "", phone: "", city: "Nairobi" });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); return; }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  const FEATURES = ["14-day free trial", "Unlimited orders", "GPS driver tracking", "Customer portal", "Invoicing & billing"];

  return (
    <div className="auth-bg">
      <div style={{ width: "100%", maxWidth: 860, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
        {/* Left panel */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={22} color="#fff" />
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>FleetFlow ERP</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Multi-tenant SaaS Platform</div>
            </div>
          </div>
          <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 700, lineHeight: 1.3, margin: "0 0 14px" }}>
            Launch your fleet<br />operations today
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: "0 0 28px", lineHeight: 1.7 }}>
            Join fleet companies across Kenya managing water tankers, fuel trucks, and logistics fleets with FleetFlow.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FEATURES.map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle2 size={16} color="#22c55e" />
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="auth-card">
          <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>Create Company Account</h3>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12.5, margin: "0 0 22px" }}>14-day free trial • No credit card</p>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}>
              <AlertCircle size={14} color="#f87171" />
              <span style={{ color: "#f87171", fontSize: 12.5 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Company Name", key: "companyName", type: "text", placeholder: "AquaFlow Solutions Ltd" },
              { label: "Work Email", key: "email", type: "email", placeholder: "admin@company.co.ke" },
              { label: "Password", key: "password", type: "password", placeholder: "Min 8 characters" },
              { label: "Phone Number", key: "phone", type: "tel", placeholder: "+254 700 000 000" },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 5 }}>{label}</label>
                <input className="ff-input" type={type} placeholder={placeholder} value={form[key as keyof typeof form]} onChange={set(key)} required={key !== "phone"} />
              </div>
            ))}
            <div>
              <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 5 }}>City</label>
              <select className="ff-input" value={form.city} onChange={set("city")}>
                {["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Other"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button type="submit" disabled={loading} className="ff-btn ff-btn-primary ff-btn-lg" style={{ width: "100%", marginTop: 6 }}>
              {loading ? "Creating account..." : "Start Free Trial →"}
            </button>
          </form>

          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11.5, textAlign: "center", marginTop: 16 }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--accent-light)", textDecoration: "none" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
