"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Receipt, Pencil, Trash2, X, Save, Droplets, Wrench, DollarSign, Shield, FileText, Building2, Tag, Car, GlassWater } from "lucide-react";

const CATEGORIES = ["fuel", "maintenance", "salary", "insurance", "license", "office", "vehicle_lease", "cost_of_water", "other"];
const CAT_COLOR: Record<string, string> = {
  fuel: "ff-badge-orange", maintenance: "ff-badge-blue", salary: "ff-badge-purple",
  insurance: "ff-badge-green", license: "ff-badge-gray", office: "ff-badge-yellow",
  vehicle_lease: "ff-badge-teal", cost_of_water: "ff-badge-blue", other: "ff-badge-gray",
};
const CAT_CONFIG = [
  { key: "fuel",        label: "Fuel",        Icon: Droplets,   color: "#f97316", iconBg: "rgba(249,115,22,0.12)"  },
  { key: "maintenance", label: "Maintenance", Icon: Wrench,     color: "#3b82f6", iconBg: "rgba(59,130,246,0.12)"  },
  { key: "salary",      label: "Salary",      Icon: DollarSign, color: "#8b5cf6", iconBg: "rgba(139,92,246,0.12)"  },
  { key: "insurance",   label: "Insurance",   Icon: Shield,     color: "#22c55e", iconBg: "rgba(34,197,94,0.12)"   },
  { key: "license",     label: "License",     Icon: FileText,   color: "#eab308", iconBg: "rgba(234,179,8,0.12)"   },
  { key: "office",      label: "Office",      Icon: Building2,  color: "#14b8a6", iconBg: "rgba(20,184,166,0.12)"  },
  { key: "vehicle_lease", label: "Vehicle Lease", Icon: Car,        color: "#0891b2", iconBg: "rgba(8,145,178,0.12)"   },
  { key: "cost_of_water", label: "Cost of Water", Icon: GlassWater, color: "#2563eb", iconBg: "rgba(37,99,235,0.12)"   },
  { key: "other",         label: "Other",         Icon: Tag,      color: "#6b7280", iconBg: "rgba(107,114,128,0.12)" },
];

type Expense = {
  id: string; category: string; description: string; amount: number;
  vendor: string | null; date: string; approvedBy: string | null;
};

const BLANK = { category: "other", description: "", amount: "", vendor: "", date: new Date().toISOString().slice(0, 10), approvedBy: "" };

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/expenses");
    if (res.ok) setExpenses(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm(BLANK);
    setError("");
    setShowModal(true);
  }

  function openEdit(e: Expense) {
    setEditing(e);
    setForm({ category: e.category, description: e.description, amount: String(e.amount), vendor: e.vendor ?? "", date: e.date.slice(0, 10), approvedBy: e.approvedBy ?? "" });
    setError("");
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.description || !form.amount || !form.date) { setError("Description, amount and date are required"); return; }
    setSaving(true); setError("");
    try {
      const url = editing ? `/api/expenses/${editing.id}` : "/api/expenses";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      setShowModal(false);
      await load();
    } catch { setError("Network error"); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    setDeleting(id);
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    setDeleting(null);
    await load();
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount; return acc;
  }, {});

  const filtered = filterCat === "all" ? expenses : expenses.filter(e => e.category === filterCat);

  return (
    <div className="slide-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Expenses</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "3px 0 0" }}>{expenses.length} expense records</p>
        </div>
        <button className="ff-btn ff-btn-primary" onClick={openAdd}><Plus size={14}/> Add Expense</button>
      </div>

      {/* KPI row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {/* Total card */}
        <div className="ff-card" style={{ flex: "2 1 160px", padding: "10px 16px", background: "linear-gradient(135deg,#dc2626,#b91c1c)", border: "none", minWidth: 160 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Receipt size={16} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: 10, color: "#fca5a5", margin: "0 0 2px", fontWeight: 500, whiteSpace: "nowrap" }}>Total Expenses</p>
              <p style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#fff", whiteSpace: "nowrap" }}>KES {total.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Per-category cards */}
        {CAT_CONFIG.map(({ key, label, Icon, color, iconBg }) => {
          const amt = byCategory[key] ?? 0;
          if (amt === 0 && key !== "vehicle_lease" && key !== "cost_of_water") return null;
          return (
            <div key={key} className="ff-card"
              onClick={() => setFilterCat(filterCat === key ? "all" : key)}
              style={{
                flex: "1 1 130px", padding: "9px 12px", cursor: "pointer", minWidth: 130,
                borderLeft: `3px solid ${color}`,
                outline: filterCat === key ? `2px solid ${color}` : undefined,
                outlineOffset: -1,
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={13} color={color} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 9.5, color: "var(--text-muted)", margin: "0 0 1px", textTransform: "capitalize", fontWeight: 500, whiteSpace: "nowrap" }}>{label}</p>
                  <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color, whiteSpace: "nowrap" }}>KES {amt.toLocaleString()}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <Receipt size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
            <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 12px" }}>No expense records{filterCat !== "all" ? ` in "${filterCat}"` : ""}</p>
            <button className="ff-btn ff-btn-primary" onClick={openAdd}><Plus size={13}/> Add First Expense</button>
          </div>
        ) : (
          <table className="ff-table">
            <thead>
              <tr><th>Date</th><th>Category</th><th>Description</th><th>Vendor</th><th>Amount</th><th>Approved By</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td style={{ fontSize: 11.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {new Date(e.date).toLocaleDateString("en-KE")}
                  </td>
                  <td>
                    <span className={`ff-badge ${CAT_COLOR[e.category] ?? "ff-badge-gray"}`} style={{ textTransform: "capitalize" }}>
                      {e.category}
                    </span>
                  </td>
                  <td style={{ maxWidth: 240 }}>
                    <span style={{ fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                      {e.description}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: 12.5 }}>{e.vendor ?? "—"}</td>
                  <td style={{ fontWeight: 700, color: "#dc2626", whiteSpace: "nowrap" }}>KES {e.amount.toLocaleString()}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: 12.5 }}>{e.approvedBy ?? "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="ff-btn ff-btn-ghost ff-btn-sm" onClick={() => openEdit(e)} title="Edit">
                        <Pencil size={12} />
                      </button>
                      <button className="ff-btn ff-btn-ghost ff-btn-sm" onClick={() => handleDelete(e.id)}
                        disabled={deleting === e.id}
                        style={{ color: "#dc2626" }} title="Delete">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div className="ff-card" style={{ width: 480, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{editing ? "Edit Expense" : "Add Expense"}</h2>
              <button className="ff-btn ff-btn-ghost ff-btn-sm" onClick={() => setShowModal(false)}><X size={14}/></button>
            </div>

            {error && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "8px 12px", marginBottom: 14, color: "#dc2626", fontSize: 13 }}>{error}</div>}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Category *</label>
                  <select className="ff-input" value={form.category} onChange={set("category")}>
                    {CATEGORIES.map(c => {
                      const cfg = CAT_CONFIG.find(x => x.key === c);
                      return <option key={c} value={c}>{cfg ? cfg.label : c.charAt(0).toUpperCase() + c.slice(1)}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Date *</label>
                  <input className="ff-input" type="date" value={form.date} onChange={set("date")} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Description *</label>
                <input className="ff-input" value={form.description} onChange={set("description")} placeholder="e.g. Monthly insurance premium" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Amount (KES) *</label>
                  <input className="ff-input" type="number" value={form.amount} onChange={set("amount")} placeholder="0" min="0" step="0.01" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Vendor / Supplier</label>
                  <input className="ff-input" value={form.vendor} onChange={set("vendor")} placeholder="e.g. Jubilee Insurance" />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Approved By</label>
                <input className="ff-input" value={form.approvedBy} onChange={set("approvedBy")} placeholder="Manager name" />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button className="ff-btn ff-btn-primary" onClick={handleSave} disabled={saving}>
                <Save size={13}/>{saving ? "Saving…" : editing ? "Save Changes" : "Add Expense"}
              </button>
              <button className="ff-btn ff-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
