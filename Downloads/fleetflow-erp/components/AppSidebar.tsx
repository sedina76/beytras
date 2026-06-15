"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionPayload } from "@/lib/session";
import {
  LayoutDashboard, Users, ClipboardList, Radio, UserCheck,
  Droplets, Package, FileText, Receipt, Wrench, Fuel, Archive,
  BarChart3, Settings, ChevronRight, Building2, ShieldCheck,
  Bell, LogOut, UserCog
} from "lucide-react";
import TankerTruckIcon from "@/components/TankerTruckIcon";

type Props = { session: SessionPayload };

const ALL_NAV = [
  { icon: LayoutDashboard, label: "Dashboard",    href: "/dashboard",     roles: ["company_admin","dispatcher","accountant","mechanic","customer_support"] },
  { icon: Users,           label: "Customers",    href: "/customers",     roles: ["company_admin","dispatcher","accountant","customer_support"] },
  { icon: ClipboardList,   label: "Sales",        href: "/orders",        roles: ["company_admin","dispatcher","accountant","customer_support"] },
  { icon: Radio,           label: "Dispatch",     href: "/dispatch",      roles: ["company_admin","dispatcher"] },
  { icon: TankerTruckIcon, label: "Vehicles",     href: "/vehicles",      roles: ["company_admin","mechanic"] },
  { icon: UserCheck,       label: "Drivers",      href: "/drivers",       roles: ["company_admin","dispatcher"] },
  { icon: Droplets,        label: "Water Sources",href: "/water-sources", roles: ["company_admin","dispatcher"] },
  { icon: Package,         label: "Deliveries",   href: "/deliveries",    roles: ["company_admin","dispatcher","accountant"] },
  { icon: FileText,        label: "Invoices",     href: "/invoices",      roles: ["company_admin","accountant"] },
  { icon: Receipt,         label: "Expenses",     href: "/expenses",      roles: ["company_admin","accountant"] },
  { icon: Wrench,          label: "Maintenance",  href: "/maintenance",   roles: ["company_admin","mechanic"] },
  { icon: Fuel,            label: "Fuel",         href: "/fuel",          roles: ["company_admin","mechanic"] },
  { icon: Archive,         label: "Inventory",    href: "/inventory",     roles: ["company_admin","mechanic"] },
  { icon: UserCog,         label: "HR & Payroll", href: "/hr-payroll",    roles: ["company_admin","accountant"] },
  { icon: BarChart3,       label: "Reports",      href: "/reports",       roles: ["company_admin","accountant"] },
  { icon: Settings,        label: "Settings",     href: "/settings",      roles: ["company_admin"] },
  { icon: Building2,       label: "Subscription", href: "/subscription",  roles: ["company_admin"] },
];

const ROLE_LABELS: Record<string, string> = {
  company_admin: "Company Admin",
  dispatcher: "Dispatcher",
  accountant: "Accountant",
  mechanic: "Mechanic",
  customer_support: "Support",
  super_admin: "Super Admin",
};

export default function AppSidebar({ session }: Props) {
  const pathname = usePathname() || "/";

  const navItems = ALL_NAV.filter(n => n.roles.includes(session.role));
  const isSuperAdmin = session.role === "super_admin";

  return (
    <aside style={{ width: 220, minWidth: 220, background: "var(--sidebar)", display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0, zIndex: 50 }}>
      {/* Brand */}
      <Link href="/dashboard" style={{ padding: "18px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", textDecoration: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50% 50% 50% 0%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <TankerTruckIcon size={18} color="#fff" />
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>FleetFlow ERP</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 1 }}>Fleet & Dispatch Platform</div>
          </div>
        </div>
      </Link>

      {/* Super Admin quick link */}
      {isSuperAdmin && (
        <Link href="/admin/dashboard" style={{ margin: "8px 10px 0", padding: "7px 10px", background: "rgba(37,99,235,0.2)", borderRadius: 8, border: "1px solid rgba(37,99,235,0.3)", textDecoration: "none", display: "flex", alignItems: "center", gap: 7 }}>
          <ShieldCheck size={13} color="#60a5fa" />
          <span style={{ color: "#60a5fa", fontSize: 11.5, fontWeight: 600 }}>Super Admin Panel</span>
        </Link>
      )}

      {/* Section label */}
      <div style={{ padding: "12px 14px 4px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Navigation
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "2px 0" }}>
        {navItems.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));
          return (
            <Link
              key={label}
              href={href}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 9,
                padding: "7px 14px", textDecoration: "none",
                background: isActive ? "rgba(37,99,235,0.2)" : "transparent",
                color: isActive ? "#60a5fa" : "rgba(255,255,255,0.55)",
                fontSize: 12.5, fontWeight: isActive ? 600 : 400,
                borderLeft: isActive ? "3px solid #2563eb" : "3px solid transparent",
                transition: "all 0.15s",
              }}
            >
              <Icon size={15} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {!isActive && <ChevronRight size={11} style={{ opacity: 0.25 }} />}
            </Link>
          );
        })}
      </nav>

      {/* Notification bell */}
      <div style={{ padding: "6px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/settings" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8, textDecoration: "none", color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
          <Bell size={14} />
          <span>Notifications</span>
        </Link>
      </div>

      {/* Company Card */}
      <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(37,99,235,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Building2 size={15} color="#60a5fa" />
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ color: "#fff", fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{session.name}</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>{ROLE_LABELS[session.role] ?? session.role}</div>
          </div>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} className="pulse-dot" />
        </div>
      </div>
    </aside>
  );
}
