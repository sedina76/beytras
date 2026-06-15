"use client";
import { Package, ChevronRight } from "lucide-react";

const deliveries = [
  { id: "DEL-00048", name: "Karen Residence", vol: "10,000 L", status: "Delivered", time: "Today, 10:45 AM", statusColor: "#059669", statusBg: "#ecfdf5" },
  { id: "DEL-00047", name: "XYZ Construction Ltd", vol: "20,000 L", status: "In Transit", time: "Today, 09:30 AM", statusColor: "#2563eb", statusBg: "#eff6ff" },
  { id: "DEL-00046", name: "Green Park Hotel", vol: "15,000 L", status: "Delivered", time: "Today, 08:15 AM", statusColor: "#059669", statusBg: "#ecfdf5" },
  { id: "DEL-00045", name: "ABC Industries", vol: "30,000 L", status: "Pending", time: "Yesterday, 05:20 PM", statusColor: "#d97706", statusBg: "#fffbeb" },
  { id: "DEL-00044", name: "City Hospital", vol: "10,000 L", status: "Delivered", time: "Yesterday, 04:10 PM", statusColor: "#059669", statusBg: "#ecfdf5" },
  { id: "DEL-00043", name: "Nairobi University", vol: "25,000 L", status: "In Transit", time: "Yesterday, 02:00 PM", statusColor: "#2563eb", statusBg: "#eff6ff" },
];

export default function RecentDeliveries() {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>Recent Deliveries</span>
        <button style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>View all</button>
      </div>

      <div style={{ padding: "4px 0" }}>
        {deliveries.map(({ id, name, vol, status, time, statusColor, statusBg }) => (
          <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderBottom: "1px solid #f8fafc", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#f8fafc"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
          >
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Package size={13} color="var(--text-secondary)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--accent)", fontFamily: "'DM Mono', monospace" }}>{id}</span>
                <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 10, background: statusBg, color: statusColor, fontWeight: 600 }}>{status}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 1 }}>
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{vol}</span>
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
