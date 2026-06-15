"use client";
import Link from "next/link";
import { Bell, Globe, Menu, Search, Plus, CalendarDays, ChevronDown } from "lucide-react";

export default function Header() {
  return (
    <header style={{
      height: 52, background: "#fff", borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center", padding: "0 20px", gap: 12,
      position: "sticky", top: 0, zIndex: 50,
    }}>
      {/* Left */}
      <Link href="/dashboard" style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", padding: 4, textDecoration: "none" }}>
        <Menu size={18} />
      </Link>
      <div style={{ position: "relative", flex: "0 0 260px" }}>
        <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input
          placeholder="Search anything..."
          style={{
            width: "100%", paddingLeft: 30, paddingRight: 12, height: 32,
            border: "1px solid var(--border)", borderRadius: 8, background: "#f8fafc",
            fontSize: 12.5, color: "var(--text-primary)", outline: "none",
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
      </div>

      {/* Right */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
        {/* Date */}
        <Link href="/calendar" style={{
          display: "flex", alignItems: "center", gap: 6, padding: "5px 10px",
          border: "1px solid var(--border)", borderRadius: 8, background: "#f8fafc",
          fontSize: 12, color: "var(--text-secondary)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textDecoration: "none"
        }}>
          <CalendarDays size={13} />
          20 May, 2024
        </Link>

        {/* Icons */}
        {[
          { icon: Bell, badge: 5, href: "/notifications" },
          { icon: Globe, badge: 0, href: "/settings" },
        ].map(({ icon: Icon, badge, href }, i) => (
          <Link key={i} href={href} style={{ position: "relative", border: "none", background: "none", cursor: "pointer", color: "var(--text-secondary)", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, textDecoration: "none" }}>
            <Icon size={16} />
            {badge > 0 && (
              <span style={{ position: "absolute", top: 3, right: 3, width: 15, height: 15, borderRadius: "50%", background: "#ef4444", color: "#fff", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{badge}</span>
            )}
          </Link>
        ))}

        {/* User */}
        <Link href="/settings" style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", borderRadius: 8, border: "1px solid var(--border)", cursor: "pointer", textDecoration: "none", color: "inherit" }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700 }}>AU</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.2 }}>Admin User</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Administrator</div>
          </div>
          <ChevronDown size={12} color="var(--text-muted)" />
        </Link>

        {/* New Order */}
        <Link href="/orders/new" style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", textDecoration: "none" }}>
          <div style={{
            background: "var(--accent)", color: "#fff", borderRadius: 8,
            fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            boxShadow: "0 1px 3px rgba(37,99,235,0.4)", display: "flex", alignItems: "center", gap: 6, padding: "7px 14px"
          }}>
            <Plus size={14} />
            New Order
          </div>
        </Link>
      </div>
    </header>
  );
}
