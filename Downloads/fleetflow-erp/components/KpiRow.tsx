import { Droplets, DollarSign, Activity, ClipboardList, Fuel, TrendingUp } from "lucide-react";
import TankerTruckIcon from "@/components/TankerTruckIcon";

const kpis = [
  { icon: TankerTruckIcon, label: "Total Deliveries", value: "48", trend: "+16%", sub: "vs yesterday", color: "#2563eb", bg: "#eff6ff" },
  { icon: Droplets, label: "Liters Delivered", value: "480,000 L", trend: "+12%", sub: "vs yesterday", color: "#0891b2", bg: "#ecfeff" },
  { icon: DollarSign, label: "Revenue (KSh)", value: "750,560", trend: "+18%", sub: "vs yesterday", color: "#059669", bg: "#ecfdf5" },
  { icon: Activity, label: "Active Tankers", value: "23 / 35", trend: "65%", sub: "utilization", color: "#7c3aed", bg: "#f5f3ff" },
  { icon: ClipboardList, label: "Pending Orders", value: "12", trend: "Need", sub: "assignment", color: "#d97706", bg: "#fffbeb" },
  { icon: Fuel, label: "Fuel Usage", value: "6,850 L", trend: "-3%", sub: "vs yesterday", color: "#dc2626", bg: "#fef2f2" },
];

export default function KpiRow() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 14 }}>
      {kpis.map(({ icon: Icon, label, value, trend, sub, color, bg }) => (
        <div key={label} style={{
          background: "#fff", border: "1px solid var(--border)", borderRadius: 10,
          padding: "11px 13px", display: "flex", flexDirection: "column", gap: 6,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={15} color={color} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 2, color: trend.startsWith("-") ? "#ef4444" : "#22c55e", fontSize: 11, fontWeight: 600 }}>
              <TrendingUp size={11} />
              {trend}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.1, fontFamily: "'DM Mono', monospace" }}>{value}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", borderTop: "1px solid #f1f5f9", paddingTop: 5 }}>{sub}</div>
        </div>
      ))}
    </div>
  );
}
