"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

const data = [
  { month: "Jan", revenue: 420000, deliveries: 38 },
  { month: "Feb", revenue: 380000, deliveries: 32 },
  { month: "Mar", revenue: 510000, deliveries: 45 },
  { month: "Apr", revenue: 490000, deliveries: 41 },
  { month: "May", revenue: 620000, deliveries: 52 },
  { month: "Jun", revenue: 580000, deliveries: 49 },
  { month: "Jul", revenue: 710000, deliveries: 60 },
  { month: "Aug", revenue: 680000, deliveries: 57 },
  { month: "Sep", revenue: 750560, deliveries: 64 },
  { month: "Oct", revenue: 820000, deliveries: 70 },
  { month: "Nov", revenue: 790000, deliveries: 67 },
  { month: "Dec", revenue: 910000, deliveries: 78 },
];

const fmt = (v: number) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${(v/1000).toFixed(0)}K`;

export default function RevenueChart() {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>Revenue Overview</span>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>Jan — Dec 2024</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#059669" }}>
            <TrendingUp size={12} />
            <span style={{ fontWeight: 600 }}>+18.4% YTD</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["1M", "3M", "6M", "1Y"].map((t, i) => (
              <button key={t} style={{ padding: "2px 8px", borderRadius: 5, border: "1px solid var(--border)", background: i === 3 ? "var(--accent)" : "#f8fafc", color: i === 3 ? "#fff" : "var(--text-secondary)", fontSize: 10.5, fontWeight: 600, cursor: "pointer" }}>{t}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: "12px 8px 8px", height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "DM Sans, sans-serif" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "DM Sans, sans-serif" }} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              formatter={(v) => [`KSh ${Number(v).toLocaleString()}`, "Revenue"]}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: "#2563eb" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
