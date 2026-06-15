"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, AlertCircle } from "lucide-react";

export default function CustomerLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/customer-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      router.push("/portal");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-bg">
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: 16, background: "rgba(37,99,235,0.25)", border: "1px solid rgba(37,99,235,0.4)", marginBottom: 14 }}>
            <Package size={26} color="#60a5fa" />
          </div>
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Customer Portal</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Track your orders and invoices</p>
        </div>

        <div className="auth-card">
          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}>
              <AlertCircle size={14} color="#f87171" />
              <span style={{ color: "#f87171", fontSize: 12.5 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6 }}>Email Address</label>
              <input className="ff-input" type="email" placeholder="customer@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6 }}>Password</label>
              <input className="ff-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} className="ff-btn ff-btn-primary ff-btn-lg" style={{ width: "100%" }}>
              {loading ? "Signing in..." : "Access My Portal"}
            </button>
          </form>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: 0 }}>
              Are you a driver?{" "}
              <Link href="/driver-login" style={{ color: "var(--accent-light)", textDecoration: "none" }}>Driver login →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
