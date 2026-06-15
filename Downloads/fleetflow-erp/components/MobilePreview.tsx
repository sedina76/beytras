import { MapPin, CheckCircle, Camera, Navigation, ShoppingCart, Package, ChevronRight, Star } from "lucide-react";

function PhoneFrame({ children, label, gradient }: { children: React.ReactNode; label: string; gradient: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
      <div style={{
        width: 155, background: "#1a1a2e", borderRadius: 28, padding: 3,
        boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)",
      }}>
        {/* Notch */}
        <div style={{ background: "#1a1a2e", height: 22, borderRadius: "22px 22px 0 0", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: 50, height: 10, borderRadius: 8, background: "#000" }} />
        </div>
        {/* Screen */}
        <div style={{ borderRadius: "0 0 24px 24px", overflow: "hidden", background: "#fff", minHeight: 280 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function DriverAppPreview() {
  return (
    <PhoneFrame label="Driver App" gradient="135deg, #1e40af, #7c3aed">
      {/* App header */}
      <div style={{ background: "#07111f", padding: "10px 10px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
          <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>My Trip</span>
        </div>
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontSize: 8 }}>🔔</span>
        </div>
      </div>

      {/* Active delivery card */}
      <div style={{ background: "#eff6ff", margin: 6, borderRadius: 8, padding: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "#2563eb", fontFamily: "'DM Mono', monospace" }}>DEL-00048</span>
          <span style={{ fontSize: 8, background: "#dbeafe", color: "#1d4ed8", padding: "1px 5px", borderRadius: 8, fontWeight: 700 }}>In Progress</span>
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#0f172a" }}>Karen Residence</div>
        <div style={{ fontSize: 9, color: "#64748b" }}>10,000 Liters</div>
      </div>

      {/* Mini map */}
      <div style={{ margin: "0 6px", height: 70, borderRadius: 8, background: "#e8f0e9", position: "relative", overflow: "hidden" }}>
        <svg width="100%" height="100%">
          <line x1="0" y1="35" x2="100%" y2="35" stroke="#fff" strokeWidth="2" />
          <line x1="60%" y1="0" x2="60%" y2="100%" stroke="#fff" strokeWidth="2" />
          <circle cx="30%" cy="35" r="5" fill="#2563eb" />
          <circle cx="80%" cy="35" r="5" fill="#ef4444" />
          <path d="M 30% 35 Q 55% 20 80% 35" stroke="#2563eb" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
        </svg>
        <div style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(255,255,255,0.9)", borderRadius: 4, padding: "2px 5px", fontSize: 8, fontWeight: 600 }}>
          2.4 km away
        </div>
      </div>

      {/* Signature */}
      <div style={{ margin: "5px 6px 3px", padding: 6, background: "#f8fafc", borderRadius: 8, border: "1px dashed #cbd5e1" }}>
        <div style={{ fontSize: 8, color: "#94a3b8", marginBottom: 3, fontWeight: 600 }}>CUSTOMER SIGNATURE</div>
        <div style={{ height: 24, display: "flex", alignItems: "center", paddingLeft: 4 }}>
          <svg width="80" height="20"><path d="M 5 15 Q 15 5 25 12 Q 35 19 50 8 Q 60 2 75 10" stroke="#0f172a" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: "4px 6px 8px", display: "flex", gap: 4 }}>
        <button style={{ flex: 1, background: "#2563eb", color: "#fff", border: "none", borderRadius: 7, padding: "7px 4px", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>
          ✓ Complete
        </button>
        <button style={{ background: "#f1f5f9", border: "none", borderRadius: 7, padding: "7px 8px", fontSize: 9, cursor: "pointer" }}>
          <Camera size={12} color="#64748b" />
        </button>
      </div>
    </PhoneFrame>
  );
}

export function CustomerAppPreview() {
  const orders = [
    { id: "ORD-0023", vol: "10,000 L", date: "20 May", status: "Delivered" },
    { id: "ORD-0022", vol: "20,000 L", date: "18 May", status: "Delivered" },
  ];

  return (
    <PhoneFrame label="Customer App" gradient="135deg, #059669, #0891b2">
      {/* Header */}
      <div style={{ background: "#2563eb", padding: "12px 10px 10px" }}>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", marginBottom: 1 }}>Welcome back,</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>John Kamau</div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: "8px 6px" }}>
        <button style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "8px 4px", fontSize: 9.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <ShoppingCart size={11} /> Order Water
        </button>
        <button style={{ background: "#f8fafc", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 4px", fontSize: 9.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, color: "var(--text-primary)" }}>
          <MapPin size={11} color="#2563eb" /> Track Order
        </button>
      </div>

      {/* Recent orders */}
      <div style={{ padding: "0 6px 6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-primary)" }}>Recent Orders</span>
          <span style={{ fontSize: 9, color: "#2563eb", fontWeight: 600 }}>View all</span>
        </div>
        {orders.map(({ id, vol, date, status }) => (
          <div key={id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Package size={11} color="#059669" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#2563eb", fontFamily: "'DM Mono', monospace" }}>{id}</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{vol} · {date}</div>
            </div>
            <span style={{ fontSize: 8, background: "#ecfdf5", color: "#059669", padding: "1px 5px", borderRadius: 8, fontWeight: 700 }}>{status}</span>
          </div>
        ))}
      </div>
    </PhoneFrame>
  );
}
