import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Settings, Building2, Bell, CreditCard, HardDriveDownload } from "lucide-react";
import ExportButtons from "@/components/ExportButtons";
import NotificationToggles from "@/components/NotificationToggles";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.organizationId) return null;

  const [org, settings] = await Promise.all([
    prisma.organization.findUnique({ where: { id: session.organizationId } }),
    prisma.companySettings.findUnique({ where: { organizationId: session.organizationId } }),
  ]);

  return (
    <div className="slide-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Settings</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "3px 0 0" }}>Manage your company configuration</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Company Profile */}
        <div className="ff-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Building2 size={18} color="#2563eb" />
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Company Profile</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Company Name", value: org?.name },
              { label: "Email", value: org?.email },
              { label: "Phone", value: org?.phone ?? "Not set" },
              { label: "Address", value: org?.address ?? "Not set" },
              { label: "City", value: org?.city ?? "Nairobi" },
              { label: "Country", value: org?.country ?? "Kenya" },
              { label: "Account Status", value: org?.status ?? "active" },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Billing / Invoice Settings */}
        <div className="ff-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <CreditCard size={18} color="#7c3aed" />
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Billing & Invoice</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Currency", value: settings?.currency ?? "KES" },
              { label: "Timezone", value: settings?.timezone ?? "Africa/Nairobi" },
              { label: "VAT Number", value: settings?.vatNumber ?? "Not set" },
              { label: "Invoice Prefix", value: settings?.invoicePrefix ?? "INV" },
              { label: "Order Prefix", value: settings?.orderPrefix ?? "ORD" },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="ff-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Bell size={18} color="#d97706" />
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Notifications</h2>
          </div>
          <NotificationToggles
            emailEnabled={settings?.emailEnabled ?? true}
            smsEnabled={settings?.smsEnabled ?? false}
            whatsappEnabled={settings?.whatsappEnabled ?? false}
          />
        </div>

        {/* Account info */}
        <div className="ff-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Settings size={18} color="#16a34a" />
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Your Account</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Name", value: session.name },
              { label: "Email", value: session.email },
              { label: "Role", value: session.role.replace(/_/g, " ") },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>{value}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 14 }}>
            To change your password or update profile, contact your system administrator.
          </p>
        </div>
      </div>

      {/* Data Export */}
      <div className="ff-card" style={{ marginTop: 16, gridColumn: "1/-1" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <HardDriveDownload size={18} color="#2563eb" />
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Data Export &amp; Backup</h2>
        </div>
        <ExportButtons />
      </div>
    </div>
  );
}
