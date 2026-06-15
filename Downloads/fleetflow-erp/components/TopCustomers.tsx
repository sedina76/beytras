"use client";
import { Building2, TrendingUp, ExternalLink } from "lucide-react";

const customers = [
  { name: "XYZ Construction Ltd", deliveries: 42, revenue: 250000, change: 12 },
  { name: "Green Park Hotel", deliveries: 28, revenue: 180000, change: 8 },
  { name: "ABC Industries Ltd", deliveries: 19, revenue: 120000, change: -3 },
  { name: "Karen Residence", deliveries: 15, revenue: 85000, change: 22 },
  { name: "City Hospital", deliveries: 11, revenue: 60000, change: 5 },
];

const max = 250000;

export default function TopCustomers() {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>Top Customers <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(This Month)</span></span>
        <button style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>View all</button>
      </div>
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 60px 70px 50px", gap: 0, padding: "6px 14px", borderBottom: "1px solid #f1f5f9" }}>
          {["#", "Customer", "Sales", "Revenue", "+/-"].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</div>
          ))}
        </div>
        {customers.map(({ name, deliveries, revenue, change }, i) => (
          <div key={name} style={{ display: "grid", gridTemplateColumns: "28px 1fr 60px 70px 50px", gap: 0, padding: "9px 14px", borderBottom: i < customers.length - 1 ? "1px solid #f8fafc" : "none", alignItems: "center", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#f8fafc"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>{i + 1}</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: `hsl(${i * 47}, 60%, 92%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Building2 size={11} color={`hsl(${i * 47}, 60%, 40%)`} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>{name}</span>
              </div>
              <div style={{ marginTop: 4, width: "90%", height: 3, borderRadius: 2, background: "#f1f5f9", overflow: "hidden" }}>
                <div style={{ width: `${(revenue / max) * 100}%`, height: "100%", background: "var(--accent)", borderRadius: 2 }} />
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{deliveries} trips</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", fontFamily: "'DM Mono', monospace" }}>
              {(revenue / 1000).toFixed(0)}K
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 11, fontWeight: 600, color: change > 0 ? "#059669" : "#ef4444" }}>
              <TrendingUp size={10} style={{ transform: change < 0 ? "rotate(180deg)" : "none" }} />
              {Math.abs(change)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
