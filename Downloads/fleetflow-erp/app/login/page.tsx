"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import TankerTruckIcon from "@/components/TankerTruckIcon";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-bg">
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: 16, background: "var(--accent)", marginBottom: 16 }}>
            <TankerTruckIcon size={28} color="#fff" />
          </div>
          <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: 0 }}>FleetFlow ERP</h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 4 }}>Fleet & Dispatch Management Platform</p>
        </div>

        <div className="auth-card">
          <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>Company Login</h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12.5, margin: "0 0 24px" }}>Sign in to your company account</p>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 12px", marginBottom: 16 }}>
              <AlertCircle size={14} color="#f87171" />
              <span style={{ color: "#f87171", fontSize: 12.5 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6 }}>Email Address</label>
              <input
                className="ff-input"
                type="email"
                placeholder="admin@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  className="ff-input"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 0 }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="ff-btn ff-btn-primary ff-btn-lg"
              style={{ width: "100%", marginTop: 4 }}
            >
              {loading ? <span className="spinner" style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block" }} /> : null}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/register-company" style={{ color: "rgba(255,255,255,0.55)", fontSize: 12.5, textAlign: "center", textDecoration: "none" }}>
              New company? <span style={{ color: "var(--accent-light)", fontWeight: 600 }}>Register here →</span>
            </Link>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <Link href="/driver-login" style={{ color: "rgba(255,255,255,0.4)", fontSize: 11.5, textDecoration: "none" }}>Driver Login</Link>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
              <Link href="/customer-login" style={{ color: "rgba(255,255,255,0.4)", fontSize: 11.5, textDecoration: "none" }}>Customer Portal</Link>
            </div>
          </div>
        </div>

        {/* Demo credentials hint */}
        <div style={{ marginTop: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 16px", textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11.5, margin: 0 }}>
            Demo: <span style={{ color: "rgba(255,255,255,0.7)" }}>admin@aquaflow.co.ke</span> / <span style={{ color: "rgba(255,255,255,0.7)" }}>Admin@123</span>
          </p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: "4px 0 0" }}>
            Super Admin: <span style={{ color: "rgba(255,255,255,0.5)" }}>superadmin@fleetflow.io</span> / <span style={{ color: "rgba(255,255,255,0.5)" }}>Super@123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
