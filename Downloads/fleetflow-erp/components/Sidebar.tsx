"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, ClipboardList, Radio, Truck, UserCheck,
  Droplets, Package, FileText, Receipt, Wrench, Fuel, Archive,
  UserCog, BarChart3, TrendingUp, Settings, ChevronRight, Building2
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Customers", href: "/customers" },
  { icon: ClipboardList, label: "Sales", href: "/orders" },
  { icon: Radio, label: "Dispatch", href: "/dispatch" },
  { icon: Truck, label: "Vehicles", href: "/vehicles" },
  { icon: UserCheck, label: "Drivers", href: "/drivers" },
  { icon: Droplets, label: "Water Sources", href: "/water-sources" },
  { icon: Package, label: "Deliveries", href: "/deliveries" },
  { icon: FileText, label: "Invoices", href: "/invoices" },
  { icon: Receipt, label: "Expenses", href: "/expenses" },
  { icon: Wrench, label: "Maintenance", href: "/maintenance" },
  { icon: Fuel, label: "Fuel", href: "/fuel" },
  { icon: Archive, label: "Inventory", href: "/inventory" },
  { icon: UserCog, label: "HR & Payroll", href: "/hr-payroll" },
  { icon: BarChart3, label: "Reports", href: "/reports" },
  { icon: TrendingUp, label: "P&L Statement", href: "/reports/pnl" },
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: Building2, label: "Subscription", href: "/subscription" },
];

export default function Sidebar() {
  const pathname = usePathname() || "/";

  return (
    <aside
      style={{ width: 220, minWidth: 220, background: "var(--sidebar)", display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0 }}
    >
      {/* Brand */}
      <Link href="/dashboard" style={{ padding: "18px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", textDecoration: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50% 50% 50% 0%", background: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
          }}>
            <Droplets size={18} color="#fff" />
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, lineHeight: 1.2, fontFamily: "'DM Sans', sans-serif" }}>FleetFlow ERP</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 1 }}>Fleet & Dispatch Management</div>
          </div>
        </div>
      </Link>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {navItems.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));
          return (
            <Link
              key={label}
              href={href}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 9,
                padding: "7px 14px", textDecoration: "none", textAlign: "left",
                background: isActive ? "rgba(37,99,235,0.18)" : "transparent",
                color: isActive ? "#60a5fa" : "rgba(255,255,255,0.55)",
                fontSize: 12.5, fontWeight: isActive ? 600 : 400,
                borderLeft: isActive ? "3px solid #2563eb" : "3px solid transparent",
                transition: "all 0.15s",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <Icon size={15} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {!isActive && <ChevronRight size={12} style={{ opacity: 0.3 }} />}
            </Link>
          );
        })}
      </nav>

      {/* Company Card */}
      <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: "rgba(37,99,235,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
          }}>
            <Building2 size={16} color="#60a5fa" />
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ color: "#fff", fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>AquaFlow Solutions Ltd</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>Nairobi, Kenya</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div className="pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
          </div>
        </div>
      </div>
    </aside>
  );
}
