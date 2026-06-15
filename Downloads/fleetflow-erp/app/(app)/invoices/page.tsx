import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { FileText, Plus, DollarSign, AlertCircle, CheckCircle2 } from "lucide-react";
import ReceivePaymentButton from "@/components/ReceivePaymentButton";

const STATUS_COLOR: Record<string, string> = {
  draft: "ff-badge-gray", sent: "ff-badge-blue", paid: "ff-badge-green",
  overdue: "ff-badge-red", cancelled: "ff-badge-gray",
};

export default async function InvoicesPage() {
  const session = await getSession();
  if (!session?.organizationId) return null;

  const invoices = await prisma.invoice.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { name: true } }, payments: { select: { amount: true } } },
  });

  const totalRevenue = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const outstanding = invoices.filter(i => ["sent","overdue"].includes(i.status)).reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0);
  const overdue = invoices.filter(i => i.status === "overdue").length;

  return (
    <div className="slide-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Invoices</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "3px 0 0" }}>{invoices.length} invoices</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <ReceivePaymentButton />
          <Link href="/invoices/new" className="ff-btn ff-btn-primary"><Plus size={14}/> New Invoice</Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { icon: FileText, label: "Total", value: invoices.length, color: "#2563eb" },
          { icon: DollarSign, label: "Revenue Collected", value: `KES ${totalRevenue.toLocaleString()}`, color: "#16a34a" },
          { icon: AlertCircle, label: "Outstanding", value: `KES ${outstanding.toLocaleString()}`, color: "#d97706" },
          { icon: CheckCircle2, label: "Overdue", value: overdue, color: "#dc2626" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="ff-card" style={{ padding: "12px 14px" }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>{label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
        {invoices.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <FileText size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
            <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 12px" }}>No invoices yet</p>
            <Link href="/invoices/new" className="ff-btn ff-btn-primary">Create First Invoice</Link>
          </div>
        ) : (
          <table className="ff-table">
            <thead><tr><th>Invoice #</th><th>Customer</th><th>Total</th><th>Paid</th><th>Status</th><th>Due Date</th><th></th></tr></thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 700, color: "var(--accent)", fontFamily: "monospace" }}>{inv.invoiceNumber}</td>
                  <td style={{ fontWeight: 500 }}>{inv.customer.name}</td>
                  <td style={{ fontWeight: 700 }}>KES {inv.totalAmount.toLocaleString()}</td>
                  <td style={{ color: inv.paidAmount >= inv.totalAmount ? "#16a34a" : "var(--text-muted)" }}>
                    KES {inv.paidAmount.toLocaleString()}
                  </td>
                  <td><span className={`ff-badge ${STATUS_COLOR[inv.status] ?? "ff-badge-gray"}`}>{inv.status}</span></td>
                  <td style={{ fontSize: 11.5, color: inv.status === "overdue" ? "#dc2626" : "var(--text-muted)" }}>
                    {new Date(inv.dueDate).toLocaleDateString("en-KE")}
                  </td>
                  <td><Link href={`/invoices/${inv.id}`} className="ff-btn ff-btn-ghost ff-btn-sm">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
