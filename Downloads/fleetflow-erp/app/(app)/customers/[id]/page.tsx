"use client";
import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Phone, Mail, MapPin, ShoppingCart, FileText,
  Pencil, X, Save, Loader2,
} from "lucide-react";
import CustomerPortalAccessCard from "@/components/CustomerPortalAccessCard";

const STATUS_COLOR: Record<string, string> = {
  pending: "ff-badge-yellow", confirmed: "ff-badge-blue", dispatched: "ff-badge-blue",
  in_progress: "ff-badge-orange", delivered: "ff-badge-green", cancelled: "ff-badge-red",
};
const INV_STATUS: Record<string, string> = {
  paid: "ff-badge-green", overdue: "ff-badge-red", sent: "ff-badge-blue",
  draft: "ff-badge-gray", cancelled: "ff-badge-gray",
};

type Customer = {
  id: string; name: string; email: string | null; phone: string;
  address: string; city: string; type: string; status: string;
  creditLimit: number; balance: number; notes: string | null;
  orders: Order[]; invoices: Invoice[];
};
type Order = {
  id: string; orderNumber: string; productType: string; quantityOrdered: number;
  unit: string; totalAmount: number; status: string; createdAt: string;
  dispatchJob: { status: string; driver: { name: string } | null } | null;
};
type Invoice = {
  id: string; invoiceNumber: string; totalAmount: number; paidAmount: number;
  status: string; dueDate: string;
};

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Customer>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/customers/${id}`);
    if (res.ok) setCustomer(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function startEdit() {
    if (!customer) return;
    setForm({
      name: customer.name, phone: customer.phone, email: customer.email ?? "",
      address: customer.address, city: customer.city, type: customer.type,
      status: customer.status, creditLimit: customer.creditLimit, notes: customer.notes ?? "",
    });
    setError("");
    setEditing(true);
  }

  async function save() {
    if (!form.name?.trim() || !form.phone?.trim()) { setError("Name and phone are required"); return; }
    setSaving(true); setError("");
    const res = await fetch(`/api/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name?.trim(),
        phone: form.phone?.trim(),
        email: form.email?.trim() || null,
        address: form.address?.trim(),
        city: form.city?.trim(),
        type: form.type,
        status: form.status,
        creditLimit: Number(form.creditLimit) || 0,
        notes: (form.notes as string)?.trim() || null,
      }),
    });
    setSaving(false);
    if (!res.ok) { setError("Save failed"); return; }
    setEditing(false);
    await load();
    router.refresh();
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "var(--text-muted)" }}>
      <Loader2 size={24} style={{ animation: "spin 0.8s linear infinite" }} />
    </div>
  );
  if (!customer) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Customer not found.</div>;

  const totalRevenue = customer.invoices.reduce((s, i) => s + i.totalAmount, 0);
  const outstanding = customer.invoices.filter(i => i.status !== "paid").reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0);

  const inp = (field: keyof Customer, type = "text") => (
    <input
      className="ff-input"
      type={type}
      value={String(form[field] ?? "")}
      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
      style={{ width: "100%", boxSizing: "border-box" }}
    />
  );

  return (
    <div className="slide-in">
      <div style={{ marginBottom: 20 }}>
        <Link href="/customers" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 8 }}>
          <ArrowLeft size={14} /> Back to Customers
        </Link>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{customer.name}</h1>
            <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "3px 0 0", textTransform: "capitalize" }}>
              {customer.type} · {customer.city}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={`ff-badge ${customer.status === "active" ? "ff-badge-green" : "ff-badge-red"}`} style={{ fontSize: 12 }}>
              {customer.status}
            </span>
            {!editing && (
              <button onClick={startEdit} className="ff-btn ff-btn-secondary ff-btn-sm">
                <Pencil size={13} /> Edit
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Contact / Edit card */}
          <div className="ff-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: "var(--text-muted)" }}>
                {editing ? "EDIT CUSTOMER" : "CONTACT INFO"}
              </h3>
              {editing && (
                <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                  <X size={15} />
                </button>
              )}
            </div>

            {error && (
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 7, padding: "7px 10px", marginBottom: 12, color: "#dc2626", fontSize: 12 }}>
                {error}
              </div>
            )}

            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Name *</label>
                  {inp("name")}
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Phone *</label>
                  {inp("phone", "tel")}
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Email</label>
                  {inp("email", "email")}
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Address</label>
                  {inp("address")}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>City</label>
                    {inp("city")}
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Type</label>
                    <select className="ff-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ width: "100%", boxSizing: "border-box" }}>
                      <option value="business">Business</option>
                      <option value="residential">Residential</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Status</label>
                    <select className="ff-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ width: "100%", boxSizing: "border-box" }}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Credit Limit (KES)</label>
                    {inp("creditLimit", "number")}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Notes</label>
                  <textarea
                    className="ff-input"
                    rows={3}
                    value={String(form.notes ?? "")}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", resize: "vertical" }}
                  />
                </div>
                <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                  <button onClick={save} disabled={saving} className="ff-btn ff-btn-primary" style={{ flex: 1 }}>
                    {saving ? <><Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> Saving…</> : <><Save size={13} /> Save Changes</>}
                  </button>
                  <button onClick={() => setEditing(false)} className="ff-btn ff-btn-secondary">Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {customer.phone && (
                  <a href={`tel:${customer.phone}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#2563eb", textDecoration: "none" }}>
                    <Phone size={14} /> {customer.phone}
                  </a>
                )}
                {customer.email && (
                  <a href={`mailto:${customer.email}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#2563eb", textDecoration: "none" }}>
                    <Mail size={14} /> {customer.email}
                  </a>
                )}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--text-muted)" }}>
                  <MapPin size={14} style={{ marginTop: 2, flexShrink: 0 }} /> {customer.address}, {customer.city}
                </div>
                {customer.notes && (
                  <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: 0, fontStyle: "italic", lineHeight: 1.5 }}>{customer.notes}</p>
                )}
              </div>
            )}
          </div>

          {/* Financials */}
          <div className="ff-card">
            <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 12px", color: "var(--text-muted)" }}>FINANCIALS</h3>
            {[
              { label: "Total Sales", value: customer.orders.length, color: "#2563eb" },
              { label: "Total Revenue", value: `KES ${totalRevenue.toLocaleString()}`, color: "#16a34a" },
              { label: "Outstanding", value: `KES ${outstanding.toLocaleString()}`, color: outstanding > 0 ? "#dc2626" : undefined },
              { label: "Credit Limit", value: `KES ${customer.creditLimit.toLocaleString()}` },
              { label: "Balance", value: `KES ${customer.balance.toLocaleString()}`, color: customer.balance > 0 ? "#dc2626" : undefined },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
              </div>
            ))}
          </div>

          <CustomerPortalAccessCard customerId={customer.id} customerEmail={customer.email} />
        </div>

        {/* Right: Orders + Invoices */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
              <ShoppingCart size={16} color="#2563eb" />
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Recent Sales</h3>
            </div>
            {customer.orders.length === 0 ? (
              <div style={{ padding: "30px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No sales yet</div>
            ) : (
              <table className="ff-table">
                <thead><tr><th>Order #</th><th>Product</th><th>Qty</th><th>Amount</th><th>Status</th><th>Driver</th><th>Date</th></tr></thead>
                <tbody>
                  {customer.orders.map(o => (
                    <tr key={o.id}>
                      <td>
                        <Link href={`/orders/${o.id}`} style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 12, color: "#2563eb", textDecoration: "none" }}>
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td style={{ textTransform: "capitalize" }}>{o.productType}</td>
                      <td>{o.quantityOrdered.toLocaleString()} {o.unit}</td>
                      <td style={{ fontWeight: 600 }}>KES {o.totalAmount.toLocaleString()}</td>
                      <td><span className={`ff-badge ${STATUS_COLOR[o.status] ?? "ff-badge-gray"}`} style={{ textTransform: "capitalize" }}>{o.status}</span></td>
                      <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{o.dispatchJob?.driver?.name ?? "—"}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: 11.5, whiteSpace: "nowrap" }}>{new Date(o.createdAt).toLocaleDateString("en-KE")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
              <FileText size={16} color="#7c3aed" />
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Recent Invoices</h3>
            </div>
            {customer.invoices.length === 0 ? (
              <div style={{ padding: "30px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No invoices yet</div>
            ) : (
              <table className="ff-table">
                <thead><tr><th>Invoice #</th><th>Amount</th><th>Paid</th><th>Status</th><th>Due</th></tr></thead>
                <tbody>
                  {customer.invoices.map(inv => (
                    <tr key={inv.id}>
                      <td style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>{inv.invoiceNumber}</td>
                      <td style={{ fontWeight: 600 }}>KES {inv.totalAmount.toLocaleString()}</td>
                      <td style={{ color: "#16a34a" }}>KES {inv.paidAmount.toLocaleString()}</td>
                      <td><span className={`ff-badge ${INV_STATUS[inv.status] ?? "ff-badge-gray"}`}>{inv.status}</span></td>
                      <td style={{ color: "var(--text-muted)", fontSize: 11.5 }}>{new Date(inv.dueDate).toLocaleDateString("en-KE")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
