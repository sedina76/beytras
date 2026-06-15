"use client";
import { useState, useEffect, useCallback } from "react";
import { Package, AlertTriangle, TrendingDown, Plus, Pencil, Trash2, X, Check, Loader2 } from "lucide-react";

type Item = {
  id: string;
  name: string;
  category: string;
  sku: string | null;
  quantity: number;
  reorderLevel: number;
  unitCost: number;
  supplier: string | null;
  location: string | null;
};

type Form = {
  name: string; category: string; sku: string; quantity: string;
  reorderLevel: string; unitCost: string; supplier: string; location: string;
};

const CATEGORIES = ["tire", "hose", "pump", "filter", "oil", "spare_part", "other"];

const CAT_COLOR: Record<string, string> = {
  tire: "ff-badge-blue", hose: "ff-badge-green", pump: "ff-badge-purple",
  filter: "ff-badge-yellow", oil: "ff-badge-orange", spare_part: "ff-badge-gray", other: "ff-badge-gray",
};

function emptyForm(): Form {
  return { name: "", category: "other", sku: "", quantity: "0", reorderLevel: "5", unitCost: "0", supplier: "", location: "" };
}

function itemToForm(i: Item): Form {
  return {
    name: i.name, category: i.category, sku: i.sku ?? "", quantity: String(i.quantity),
    reorderLevel: String(i.reorderLevel), unitCost: String(i.unitCost),
    supplier: i.supplier ?? "", location: i.location ?? "",
  };
}

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [form, setForm] = useState<Form>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetch("/api/inventory").then(r => r.ok ? r.json() : []).catch(() => []);
    setItems(Array.isArray(d) ? d : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditItem(null); setForm(emptyForm()); setError(""); setShowModal(true); }
  function openEdit(item: Item) { setEditItem(item); setForm(itemToForm(item)); setError(""); setShowModal(true); }
  function closeModal() { setShowModal(false); setEditItem(null); setError(""); }

  async function save() {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");

    const body = {
      name: form.name, category: form.category, sku: form.sku || null,
      quantity: parseInt(form.quantity) || 0, reorderLevel: parseInt(form.reorderLevel) || 0,
      unitCost: parseFloat(form.unitCost) || 0, supplier: form.supplier || null, location: form.location || null,
    };

    const url = editItem ? `/api/inventory/${editItem.id}` : "/api/inventory";
    const method = editItem ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? "Save failed"); return; }
    closeModal();
    await load();
  }

  async function doDelete(id: string) {
    if (!confirm("Delete this inventory item?")) return;
    setDeletingId(id);
    await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    setDeletingId(null);
    await load();
  }

  const lowStock = items.filter(i => i.quantity <= i.reorderLevel);
  const outOfStock = items.filter(i => i.quantity === 0);
  const totalValue = items.reduce((s, i) => s + i.quantity * i.unitCost, 0);

  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4, color: "var(--text-muted)" };

  return (
    <div className="slide-in">
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Inventory</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "3px 0 0" }}>{items.length} items tracked</p>
        </div>
        <button onClick={openAdd} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
          <Plus size={15} /> Add Item
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Total Items", value: items.length, color: "#2563eb" },
          { label: "Total Value", value: `KES ${(totalValue / 1000).toFixed(0)}K`, color: "#7c3aed" },
          { label: "Low Stock", value: lowStock.length, color: "#d97706" },
          { label: "Out of Stock", value: outOfStock.length, color: "#dc2626" },
        ].map(({ label, value, color }) => (
          <div key={label} className="ff-card" style={{ padding: "12px 14px" }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>{label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color }}>{value}</p>
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="ff-card" style={{ marginBottom: 16, background: "#fffbeb", border: "1px solid #fde68a", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={16} color="#d97706" />
          <span style={{ fontSize: 13, color: "#92400e", fontWeight: 500 }}>
            {lowStock.length} item{lowStock.length > 1 ? "s" : ""} at or below reorder level — review stock.
          </span>
        </div>
      )}

      <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
            <Loader2 size={24} style={{ animation: "spin 0.8s linear infinite", display: "block", margin: "0 auto 8px" }} />
            Loading…
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <Package size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
            <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 16px" }}>No inventory items yet</p>
            <button onClick={openAdd} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
              <Plus size={14} /> Add First Item
            </button>
          </div>
        ) : (
          <table className="ff-table">
            <thead>
              <tr>
                <th>Name</th><th>SKU</th><th>Category</th><th>Qty</th><th>Reorder At</th>
                <th>Unit Cost</th><th>Total Value</th><th>Location</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const isLow = item.quantity <= item.reorderLevel;
                const isOut = item.quantity === 0;
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)" }}>{item.sku ?? "—"}</td>
                    <td>
                      <span className={`ff-badge ${CAT_COLOR[item.category] ?? "ff-badge-gray"}`} style={{ textTransform: "capitalize" }}>
                        {item.category.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: isOut ? "#dc2626" : isLow ? "#d97706" : undefined }}>
                      {isLow && <TrendingDown size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />}
                      {item.quantity}
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>{item.reorderLevel}</td>
                    <td>KES {item.unitCost.toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>KES {(item.quantity * item.unitCost).toLocaleString()}</td>
                    <td style={{ color: "var(--text-muted)" }}>{item.location ?? "—"}</td>
                    <td>
                      <span className={`ff-badge ${isOut ? "ff-badge-red" : isLow ? "ff-badge-yellow" : "ff-badge-green"}`}>
                        {isOut ? "Out of Stock" : isLow ? "Low Stock" : "OK"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => openEdit(item)} style={{ padding: "3px 7px", background: "none", border: "1px solid var(--border)", borderRadius: 5, cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center" }} title="Edit">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => doDelete(item.id)} disabled={deletingId === item.id} style={{ padding: "3px 7px", background: "none", border: "1px solid #fca5a5", borderRadius: 5, cursor: "pointer", color: "#dc2626", display: "flex", alignItems: "center" }} title="Delete">
                          {deletingId === item.id ? <Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} /> : <Trash2 size={12} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "80px 20px 20px", overflowY: "auto" }}>
          <div style={{ background: "var(--surface)", borderRadius: 14, width: "100%", maxWidth: 560, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{editItem ? "Edit Item" : "Add Inventory Item"}</h2>
              <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2 }}><X size={18} /></button>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={lbl}>Name *</label>
                  <input className="ff-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. 11R22.5 Steer Tyre" autoFocus />
                </div>
                <div>
                  <label style={lbl}>Category *</label>
                  <select className="ff-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>SKU / Part No.</label>
                  <input className="ff-input" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="e.g. TY-1122-ST" />
                </div>
                <div>
                  <label style={lbl}>Quantity</label>
                  <input className="ff-input" type="number" min="0" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                </div>
                <div>
                  <label style={lbl}>Reorder Level</label>
                  <input className="ff-input" type="number" min="0" value={form.reorderLevel} onChange={e => setForm(f => ({ ...f, reorderLevel: e.target.value }))} />
                </div>
                <div>
                  <label style={lbl}>Unit Cost (KES)</label>
                  <input className="ff-input" type="number" min="0" step="1" value={form.unitCost} onChange={e => setForm(f => ({ ...f, unitCost: e.target.value }))} />
                </div>
                <div>
                  <label style={lbl}>Supplier</label>
                  <input className="ff-input" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} placeholder="e.g. Tyre King Ltd" />
                </div>
                <div>
                  <label style={lbl}>Storage Location</label>
                  <input className="ff-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Store A, Shelf 3" />
                </div>
              </div>
              {error && <p style={{ color: "#dc2626", fontSize: 12.5, margin: 0 }}>{error}</p>}
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", background: "var(--background)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={closeModal} className="ff-btn ff-btn-secondary">Cancel</button>
              <button onClick={save} disabled={saving} className="ff-btn ff-btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {saving ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : <Check size={13} />}
                {editItem ? "Save Changes" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
