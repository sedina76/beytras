"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Utilized", value: 65, color: "#2563eb" },
  { name: "Idle", value: 23, color: "#93c5fd" },
  { name: "Maintenance", value: 12, color: "#dbeafe" },
];

export default function TankerUtilization() {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>Tanker Utilization</span>
      </div>
      <div style={{ padding: "14px" }}>
        <div style={{ position: "relative", height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={2} dataKey="value" startAngle={90} endAngle={450}>
                {data.map((entry, i) => <Cell key={i} fill={entry.color} strokeWidth={0} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`, ""]} contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid var(--border)" }} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>65%</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Utilized</div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {data.map(({ name, value, color }) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 12, color: "var(--text-secondary)" }}>{name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 60, height: 4, borderRadius: 2, background: "#f1f5f9", overflow: "hidden" }}>
                  <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", minWidth: 28, textAlign: "right" }}>{value}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
          {[{ label: "On Road", val: "23", color: "#2563eb" }, { label: "In Depot", val: "12", color: "#94a3b8" }].map(({ label, val, color }) => (
            <div key={label} style={{ textAlign: "center", background: "#f8fafc", borderRadius: 8, padding: "8px 4px" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: "'DM Mono', monospace" }}>{val}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
