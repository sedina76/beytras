import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, Package, FileText, LayoutDashboard } from "lucide-react";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session || session.role !== "customer_portal_user") {
    redirect("/customer-login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid var(--border)", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>F</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15 }}>FleetFlow</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 2 }}>Customer Portal</span>
          </div>
          <nav style={{ display: "flex", gap: 4 }}>
            {[
              { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
              { href: "/portal/orders", label: "My Orders", icon: Package },
              { href: "/portal/invoices", label: "Invoices", icon: FileText },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}
              >
                <Icon size={14} /> {label}
              </Link>
            ))}
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Hello, {session.name}</span>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
              <LogOut size={14} /> Sign out
            </button>
          </form>
        </div>
      </header>
      <main style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>
        {children}
      </main>
    </div>
  );
}
