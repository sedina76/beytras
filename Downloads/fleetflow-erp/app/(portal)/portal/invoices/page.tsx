import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { FileText, AlertCircle } from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  draft: "ff-badge-gray", sent: "ff-badge-blue", paid: "ff-badge-green",
  overdue: "ff-badge-red", cancelled: "ff-badge-gray",
};

export default async function PortalInvoicesPage() {
  const session = await getSession();
  if (!session?.organizationId) return null;

  const portalAccount = await prisma.customerPortalAccount.findFirst({
    where: { email: session.email, organizationId: session.organizationId },
    select: { customerId: true },
  });

  if (!portalAccount) return null;

  const invoices = await prisma.invoice.findMany({
    where: { customerId: portalAccount.customerId, organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { order: { select: { orderNumber: true } }, payments: { select: { amount: true, method: true, paidAt: true } } },
  });

  const totalOwed = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0);
  const overdue = invoices.filter(i => i.status === "overdue").length;

  return (
    <div className="slide-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>My Invoices</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "3px 0 0" }}>{invoices.length} invoices</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Total Invoices", value: invoices.length, color: "#2563eb" },
          { label: "Amount Owed", value: `KES ${totalOwed.toLocaleString()}`, color: totalOwed > 0 ? "#dc2626" : "#16a34a" },
          { label: "Overdue", value: overdue, color: overdue > 0 ? "#dc2626" : "#16a34a" },
        ].map(({ label, value, color }) => (
          <div key={label} className="ff-card" style={{ padding: "12px 14px" }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>{label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color }}>{value}</p>
          </div>
        ))}
      </div>

      {overdue > 0 && (
        <div className="ff-card" style={{ marginBottom: 16, background: "#fef2f2", border: "1px solid #fecaca", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={16} color="#dc2626" />
          <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 500 }}>
            You have {overdue} overdue invoice{overdue > 1 ? "s" : ""}. Please settle your outstanding balance.
          </span>
        </div>
      )}

      <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
        {invoices.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <FileText size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
            <p style={{ color: "var(--text-muted)" }}>No invoices found</p>
          </div>
        ) : (
          <table className="ff-table">
            <thead>
              <tr><th>Invoice #</th><th>Order</th><th>Total</th><th>Paid</th><th>Balance</th><th>Due Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {invoices.map(inv => {
                const balance = inv.totalAmount - inv.paidAmount;
                return (
                  <tr key={inv.id}>
                    <td style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>{inv.invoiceNumber}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 11.5, color: "var(--text-muted)" }}>{inv.order?.orderNumber ?? "—"}</td>
                    <td style={{ fontWeight: 700 }}>KES {inv.totalAmount.toLocaleString()}</td>
                    <td style={{ color: "#16a34a", fontWeight: 600 }}>KES {inv.paidAmount.toLocaleString()}</td>
                    <td style={{ fontWeight: 700, color: balance > 0 ? "#dc2626" : "#16a34a" }}>KES {balance.toLocaleString()}</td>
                    <td style={{ fontSize: 11.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{new Date(inv.dueDate).toLocaleDateString("en-KE")}</td>
                    <td><span className={`ff-badge ${STATUS_COLOR[inv.status] ?? "ff-badge-gray"}`}>{inv.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
