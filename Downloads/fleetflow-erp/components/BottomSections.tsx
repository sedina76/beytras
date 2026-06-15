"use client";
import { MapPin, Zap, CheckSquare, FileText, Wrench, BarChart3 } from "lucide-react";

const features = [
  { icon: MapPin, color: "#2563eb", bg: "#eff6ff", title: "Live Tracking", desc: "Real-time GPS tracking of all tankers with live route updates and ETA." },
  { icon: Zap, color: "#7c3aed", bg: "#f5f3ff", title: "Efficient Dispatch", desc: "Smart assignment & route optimization using AI-powered algorithms." },
  { icon: CheckSquare, color: "#059669", bg: "#ecfdf5", title: "Proof of Delivery", desc: "ePOD with customer signature, photos & GPS-stamped confirmation." },
  { icon: FileText, color: "#d97706", bg: "#fffbeb", title: "Billing & Invoicing", desc: "Automated invoices, payment tracking & financial statements." },
  { icon: Wrench, color: "#dc2626", bg: "#fef2f2", title: "Maintenance", desc: "Schedule service, track repairs & manage fleet maintenance costs." },
  { icon: BarChart3, color: "#0891b2", bg: "#ecfeff", title: "Powerful Reports", desc: "Real-time insights, analytics dashboards & exportable reports." },
];

const industries = [
  { emoji: "🚛", label: "Water Tankers", color: "#eff6ff" },
  { emoji: "⛽", label: "Fuel Distribution", color: "#fffbeb" },
  { emoji: "🗑️", label: "Waste Management", color: "#ecfdf5" },
  { emoji: "🏗️", label: "Construction", color: "#fef2f2" },
  { emoji: "📦", label: "Logistics & Transport", color: "#f5f3ff" },
  { emoji: "➕", label: "And More...", color: "#f1f5f9" },
];

export default function BottomSections() {
  return (
    <>
      {/* Features */}
      <div style={{ marginTop: 14, background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Why FleetFlow ERP?</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Everything you need to run a modern fleet operation</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
          {features.map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "12px 8px", borderRadius: 10, border: "1px solid var(--border)", gap: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={20} color={color} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{title}</div>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)", lineHeight: 1.4 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Industries */}
      <div style={{ marginTop: 10, background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>Industries We Serve</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
          {industries.map(({ emoji, label, color }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "12px 8px", borderRadius: 10, background: color, border: "1px solid var(--border)", cursor: "pointer", transition: "transform 0.15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "none"}
            >
              <div style={{ fontSize: 28 }}>{emoji}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", textAlign: "center" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
