"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, AlertCircle } from "lucide-react";
import TankerTruckIcon from "@/components/TankerTruckIcon";

export default function DriverLogin() {
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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      router.push("/driver");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-bg" style={{ background: "linear-gradient(135deg, #07111f 0%, #0a1628 60%, #0f1e35 100%)" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", marginBottom: 14 }}>
            <TankerTruckIcon size={30} color="#fff" />
          </div>
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Driver Portal</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>FleetFlow ERP — Driver App</p>
        </div>

        <div className="auth-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <MapPin size={14} color="#22c55e" />
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12.5 }}>GPS tracking will be enabled on login</span>
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}>
              <AlertCircle size={14} color="#f87171" />
              <span style={{ color: "#f87171", fontSize: 12.5 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6 }}>Email / Phone</label>
              <input className="ff-input" type="text" placeholder="driver@company.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" />
            </div>
            <div>
              <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6 }}>Password</label>
              <input className="ff-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            <button type="submit" disabled={loading} className="ff-btn ff-btn-success ff-btn-lg" style={{ width: "100%" }}>
              {loading ? "Signing in..." : "Sign In & Start Shift"}
            </button>
          </form>

          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11.5, textAlign: "center", marginTop: 20 }}>
            Company login: <Link href="/login" style={{ color: "var(--accent-light)", textDecoration: "none" }}>Click here</Link>
          </p>
        </div>

        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, textAlign: "center", marginTop: 16 }}>
          Demo: driver@aquaflow.co.ke / Driver@123
        </p>
      </div>
    </div>
  );
}
