"use client";
import { useState, useEffect, useCallback } from "react";
import { Droplets, MapPin, Plus, Pencil, Trash2, X, Check, Loader2 } from "lucide-react";

type WaterSource = {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  price5000: number;
  price10000: number;
  price20000: number;
  notes: string | null;
  isActive: boolean;
};

const EMPTY: Omit<WaterSource, "id" | "isActive"> & { isActive: boolean } = {
  name: "", address: "", lat: null, lng: null, price5000: 0, price10000: 0, price20000: 0, notes: null, isActive: true,
};

type FormData = { name: string; address: string; lat: string; lng: string; price5000: string; price10000: string; price20000: string; notes: string; isActive: boolean };

function toForm(s: WaterSource): FormData {
  return {
    name: s.name, address: s.address,
    lat: s.lat != null ? String(s.lat) : "", lng: s.lng != null ? String(s.lng) : "",
    price5000: String(s.price5000 ?? 0), price10000: String(s.price10000 ?? 0), price20000: String(s.price20000 ?? 0),
    notes: s.notes ?? "", isActive: s.isActive,
  };
}

function emptyForm(): FormData {
  return { name: "", address: "", lat: "", lng: "", price5000: "", price10000: "", price20000: "", notes: "", isActive: true };
}

export default function WaterSourcesPage() {
  const [sources, setSources] = useState<WaterSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormData>(emptyForm());
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<FormData>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetch("/api/water-sources").then(r => r.ok ? r.json() : []).catch(() => []);
    setSources(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (s: WaterSource) => { setEditingId(s.id); setEditForm(toForm(s)); setError(""); };
  const cancelEdit = () => { setEditingId(null); setError(""); };

  async function saveEdit(id: string) {
    if (!editForm.name.trim() || !editForm.address.trim()) { setError("Name and address required"); return; }
    setSaving(true); setError("");
    const res = await fetch(`/api/water-sources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, lat: editForm.lat || null, lng: editForm.lng || null, price5000: editForm.price5000 || 0, price10000: editForm.price10000 || 0, price20000: editForm.price20000 || 0 }),
    });
    setSaving(false);
    if (!res.ok) { setError("Save failed"); return; }
    setEditingId(null);
    await load();
  }

  async function doDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/water-sources/${id}`, { method: "DELETE" });
    setDeletingId(null);
    await load();
  }

  async function saveAdd() {
    if (!addForm.name.trim() || !addForm.address.trim()) { setError("Name and address required"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/water-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...addForm, lat: addForm.lat || null, lng: addForm.lng || null, price5000: addForm.price5000 || 0, price10000: addForm.price10000 || 0, price20000: addForm.price20000 || 0 }),
    });
    setSaving(false);
    if (!res.ok) { setError("Add failed"); return; }
    setShowAdd(false);
    setAddForm(emptyForm());
    await load();
  }

  const active = sources.filter(s => s.isActive);
  const totalPickups = 0;

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "5px 8px", border: "1px solid var(--border)", borderRadius: 6,
    background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 12.5, boxSizing: "border-box",
  };

  function SourceForm({ form, setForm, onSave, onCancel, title }: {
    form: FormData; setForm: (f: FormData) => void;
    onSave: () => void; onCancel: () => void; title: string;
  }) {
    return (
      <div className="ff-card" style={{ border: "2px solid #2563eb", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}>{title}</span>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2 }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <div>
            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Name *</label>
            <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Nairobi Water Treatment Plant" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Address *</label>
            <input style={inputStyle} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="e.g. Kikuyu Road, Nairobi" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Latitude</label>
            <input style={inputStyle} type="number" step="any" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} placeholder="-1.2841" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Longitude</label>
            <input style={inputStyle} type="number" step="any" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} placeholder="36.7516" />
          </div>
          <div style={{ gridColumn: "1/-1", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Price — 5,000 L load (KES)</label>
              <input style={inputStyle} type="number" step="1" min="0" value={form.price5000} onChange={e => setForm({ ...form, price5000: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Price — 10,000 L load (KES)</label>
              <input style={inputStyle} type="number" step="1" min="0" value={form.price10000} onChange={e => setForm({ ...form, price10000: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Price — 20,000 L load (KES)</label>
              <input style={inputStyle} type="number" step="1" min="0" value={form.price20000} onChange={e => setForm({ ...form, price20000: e.target.value })} placeholder="0" />
            </div>
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Notes</label>
            <input style={inputStyle} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
            <label htmlFor="isActive" style={{ fontSize: 12, cursor: "pointer" }}>Active</label>
          </div>
        </div>
        {error && <p style={{ fontSize: 11.5, color: "#dc2626", margin: "0 0 8px" }}>{error}</p>}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onSave}
            disabled={saving}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 12.5, fontWeight: 700 }}
          >
            {saving ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : <Check size={13} />}
            Save
          </button>
          <button onClick={onCancel} style={{ padding: "7px 14px", background: "none", border: "1px solid var(--border)", borderRadius: 7, cursor: "pointer", fontSize: 12.5, color: "var(--text-muted)" }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="slide-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Water Sources</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "3px 0 0" }}>Registered water collection points</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setAddForm(emptyForm()); setError(""); }}
          style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}
        >
          <Plus size={15} /> Add Source
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Total Sources", value: sources.length, color: "#2563eb" },
          { label: "Active Sources", value: active.length, color: "#16a34a" },
          { label: "Inactive", value: sources.length - active.length, color: "#6b7280" },
        ].map(({ label, value, color }) => (
          <div key={label} className="ff-card" style={{ padding: "12px 14px" }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>{label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color }}>{value}</p>
          </div>
        ))}
      </div>

      {showAdd && (
        <SourceForm
          form={addForm}
          setForm={setAddForm}
          onSave={saveAdd}
          onCancel={() => { setShowAdd(false); setError(""); }}
          title="Add New Water Source"
        />
      )}

      {loading ? (
        <div className="ff-card" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
          <Loader2 size={24} style={{ animation: "spin 0.8s linear infinite", margin: "0 auto 8px", display: "block" }} />
          Loading...
        </div>
      ) : sources.length === 0 ? (
        <div className="ff-card" style={{ textAlign: "center", padding: 40 }}>
          <Droplets size={36} color="var(--text-muted)" style={{ margin: "0 auto 12px", display: "block" }} />
          <p style={{ color: "var(--text-muted)", margin: 0 }}>No water sources yet. Click "Add Source" to get started.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
          {sources.map(src => (
            editingId === src.id ? (
              <div key={src.id} style={{ gridColumn: "1/-1" }}>
                <SourceForm
                  form={editForm}
                  setForm={setEditForm}
                  onSave={() => saveEdit(src.id)}
                  onCancel={cancelEdit}
                  title={`Editing: ${src.name}`}
                />
              </div>
            ) : (
              <div key={src.id} className="ff-card" style={{ display: "flex", gap: 12, opacity: src.isActive ? 1 : 0.6 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: src.isActive ? "#eff6ff" : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Droplets size={20} color={src.isActive ? "#2563eb" : "#9ca3af"} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {src.name}
                    </p>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button
                        onClick={() => startEdit(src)}
                        style={{ padding: "3px 6px", background: "none", border: "1px solid var(--border)", borderRadius: 5, cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center" }}
                        title="Edit"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => doDelete(src.id)}
                        disabled={deletingId === src.id}
                        style={{ padding: "3px 6px", background: "none", border: "1px solid #fca5a5", borderRadius: 5, cursor: "pointer", color: "#dc2626", display: "flex", alignItems: "center" }}
                        title="Delete"
                      >
                        {deletingId === src.id ? <Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} /> : <Trash2 size={12} />}
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {src.address}
                  </p>
                  {src.lat != null && src.lng != null && (
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 3 }}>
                      <MapPin size={10} /> {src.lat.toFixed(4)}, {src.lng.toFixed(4)}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                    {[
                      { label: "5,000 L", price: src.price5000 ?? 0 },
                      { label: "10,000 L", price: src.price10000 ?? 0 },
                      { label: "20,000 L", price: src.price20000 ?? 0 },
                    ].map(({ label, price }) => (
                      <div key={label} style={{ background: "#eff6ff", borderRadius: 6, padding: "3px 8px", fontSize: 11.5 }}>
                        <span style={{ color: "var(--text-muted)" }}>{label}: </span>
                        <span style={{ fontWeight: 700, color: "#0891b2" }}>KES {price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  {src.notes && (
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 6px", fontStyle: "italic" }}>{src.notes}</p>
                  )}
                  <span className={`ff-badge ${src.isActive ? "ff-badge-green" : "ff-badge-gray"}`}>
                    {src.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
