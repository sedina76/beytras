"use client";
import { Maximize2, RefreshCw, Navigation } from "lucide-react";

const tankers = [
  { id: "KCB 567B", vol: "20,000L", x: 38, y: 42, status: "En Route", color: "#2563eb" },
  { id: "KDA 123A", vol: "10,000L", x: 22, y: 28, status: "Delivering", color: "#059669" },
  { id: "KCE 234D", vol: "30,000L", x: 60, y: 58, status: "Loading", color: "#d97706" },
];

const roads = [
  { x1: 0, y1: 40, x2: 100, y2: 40 },
  { x1: 30, y1: 0, x2: 30, y2: 100 },
  { x1: 0, y1: 65, x2: 100, y2: 65 },
  { x1: 55, y1: 0, x2: 55, y2: 100 },
  { x1: 15, y1: 20, x2: 85, y2: 75 },
  { x1: 10, y1: 55, x2: 60, y2: 30 },
];

const areaLabels = [
  { label: "Westlands", x: 8, y: 30 },
  { label: "Nairobi CBD", x: 38, y: 52 },
  { label: "Dandora", x: 65, y: 25 },
  { label: "Embakasi", x: 62, y: 72 },
  { label: "Karen", x: 18, y: 72 },
  { label: "Kasarani", x: 55, y: 12 },
];

const animClass = ["tanker-animate", "tanker-animate-2", "tanker-animate-3"];

export default function TankerMap() {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      {/* Header */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} className="pulse-dot" />
          <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>Live Tanker Tracking</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", background: "#f1f5f9", padding: "1px 7px", borderRadius: 10 }}>3 Active</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={{ border: "1px solid var(--border)", background: "#f8fafc", borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
            <RefreshCw size={11} /> Refresh
          </button>
          <button style={{ border: "1px solid var(--border)", background: "#f8fafc", borderRadius: 6, padding: "4px 6px", cursor: "pointer", color: "var(--text-secondary)", display: "flex" }}>
            <Maximize2 size={12} />
          </button>
        </div>
      </div>

      {/* Map */}
      <div style={{ position: "relative", height: 280, background: "#e8f0e9", overflow: "hidden" }}>
        {/* Map grid texture */}
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Green areas */}
          <rect x="0" y="60%" width="25%" height="40%" fill="#d4e6c3" opacity="0.6" />
          <rect x="70%" y="0" width="30%" height="35%" fill="#d4e6c3" opacity="0.5" />
          <ellipse cx="50%" cy="48%" rx="8%" ry="6%" fill="#c8d9c0" opacity="0.5" />

          {/* Water feature */}
          <path d="M 25% 55% Q 35% 58% 45% 54% Q 55% 50% 65% 55%" stroke="#93c5fd" strokeWidth="3" fill="none" strokeLinecap="round" />

          {/* Roads */}
          {roads.map((r, i) => (
            <line
              key={i}
              x1={`${r.x1}%`} y1={`${r.y1}%`}
              x2={`${r.x2}%`} y2={`${r.y2}%`}
              stroke="#fff" strokeWidth={i < 4 ? 3 : 1.5}
              opacity={i < 4 ? 0.9 : 0.7}
            />
          ))}

          {/* Route paths between tankers */}
          <path d={`M ${tankers[0].x}% ${tankers[0].y}% Q 50% 35% ${tankers[1].x}% ${tankers[1].y}%`} stroke="#2563eb" strokeWidth="1.5" fill="none" strokeDasharray="4 3" opacity="0.5" />
          <path d={`M ${tankers[0].x}% ${tankers[0].y}% Q 55% 52% ${tankers[2].x}% ${tankers[2].y}%`} stroke="#059669" strokeWidth="1.5" fill="none" strokeDasharray="4 3" opacity="0.5" />

          {/* Area labels */}
          {areaLabels.map(({ label, x, y }) => (
            <text key={label} x={`${x}%`} y={`${y}%`} fontSize="9" fill="rgba(0,0,0,0.35)" fontFamily="DM Sans, sans-serif" fontWeight="600">{label}</text>
          ))}

          {/* Tanker pins */}
          {tankers.map(({ id, vol, x, y, color }, i) => (
            <g key={id} transform={`translate(${x / 100 * 600 - 38}, ${y / 100 * 280 - 28})`} className={animClass[i]}>
              {/* Shadow */}
              <ellipse cx="38" cy="34" rx="14" ry="4" fill="rgba(0,0,0,0.12)" />
              {/* Pin body */}
              <rect x="0" y="0" width="76" height="24" rx="5" fill={color} />
              {/* Pin tail */}
              <path d="M 30 24 L 38 34 L 46 24" fill={color} />
              {/* Truck icon area */}
              <rect x="2" y="2" width="20" height="20" rx="4" fill="rgba(255,255,255,0.18)" />
              <text x="12" y="15.5" fontSize="10" fill="#fff" textAnchor="middle" fontFamily="DM Sans">🚛</text>
              {/* Text */}
              <text x="38" y="10" fontSize="8.5" fill="#fff" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontWeight="700">{id}</text>
              <text x="38" y="20" fontSize="8" fill="rgba(255,255,255,0.85)" textAnchor="middle" fontFamily="DM Sans, sans-serif">{vol}</text>
              {/* GPS dot */}
              <circle cx="73" cy="12" r="3" fill="#fff" opacity="0.5" />
              <circle cx="73" cy="12" r="1.5" fill="#fff" />
            </g>
          ))}
        </svg>

        {/* Map controls */}
        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", flexDirection: "column", gap: 2 }}>
          {["+", "−"].map(s => (
            <button key={s} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid var(--border)", background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14, color: "var(--text-secondary)" }}>{s}</button>
          ))}
        </div>

        {/* Compass */}
        <div style={{ position: "absolute", top: 10, left: 10, width: 28, height: 28, borderRadius: "50%", background: "#fff", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Navigation size={14} color="#2563eb" />
        </div>

        {/* Legend */}
        <div style={{ position: "absolute", bottom: 10, left: 10, display: "flex", gap: 8 }}>
          {tankers.map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.9)", padding: "3px 7px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.color }} />
              <span style={{ fontWeight: 600 }}>{t.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
