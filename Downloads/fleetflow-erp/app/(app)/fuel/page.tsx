"use client";
import { useState, useEffect, useCallback } from "react";
import { Fuel, Plus, X, Save, TrendingDown, BarChart2, Filter, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

type Vehicle = { id: string; plateNumber: string; make: string; model: string };
type FuelRecord = {
  id: string; litres: number; costPerLitre: number; totalCost: number;
  odometerKm: number; station: string | null; date: string;
  vehicle: { id: string; plateNumber: string; make: string; model: string };
};
type VehicleSummary = {
  vehicleId: string; plateNumber: string; make: string; model: string;
  records: number; totalLitres: number; totalCost: number; avgCostPerLitre: number;
};
type EfficiencyRow = {
  vehicleId: string; plateNumber: string; make: string; model: string;
  tripsSinceLastFill: number; lastFillDate: string | null; lastFillLitres: number;
  targetTrips: number; status: "ok" | "warning" | "critical" | "no_data";
  alert: string | null; litresPerTrip: number | null;
};

const fmt = (n: number) => `KES ${n.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;

export default function FuelPage() {
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [efficiency, setEfficiency] = useState<EfficiencyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"records" | "summary">("summary");
  const [filterVehicle, setFilterVehicle] = useState("all");
  const [form, setForm] = useState({
    vehicleId: "", litres: "", costPerLitre: "", odometerKm: "", station: "", date: new Date().toISOString().split("T")[0]
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const load = useCallback(async () => {
    const [f, v, eff] = await Promise.all([
      fetch("/api/fuel").then(r => r.ok ? r.json() : []).catch(() => []),
      fetch("/api/vehicles").then(r => r.ok ? r.json() : []).catch(() => []),
      fetch("/api/fuel/efficiency").then(r => r.ok ? r.json() : []).catch(() => []),
    ]);
    setRecords(Array.isArray(f) ? f : []);
    setVehicles(Array.isArray(v) ? v : []);
    setEfficiency(Array.isArray(eff) ? eff : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/fuel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowModal(false);
      setForm({ vehicleId: "", litres: "", costPerLitre: "", odometerKm: "", station: "", date: new Date().toISOString().split("T")[0] });
      load();
    }
    setSaving(false);
  }

  const filtered = filterVehicle === "all" ? records : records.filter(r => r.vehicle.id === filterVehicle);
  const totalLitres = filtered.reduce((s, r) => s + r.litres, 0);
  const totalCost = filtered.reduce((s, r) => s + r.totalCost, 0);
  const avgCostPerLitre = totalLitres > 0 ? totalCost / totalLitres : 0;

  // Per-vehicle summary
  const byVehicle = new Map<string, VehicleSummary>();
  for (const r of records) {
    const key = r.vehicle.id;
    if (!byVehicle.has(key)) {
      byVehicle.set(key, { vehicleId: key, plateNumber: r.vehicle.plateNumber, make: r.vehicle.make, model: r.vehicle.model, records: 0, totalLitres: 0, totalCost: 0, avgCostPerLitre: 0 });
    }
    const s = byVehicle.get(key)!;
    s.records++;
    s.totalLitres += r.litres;
    s.totalCost += r.totalCost;
    s.avgCostPerLitre = s.totalCost / s.totalLitres;
  }
  const vehicleSummaries = Array.from(byVehicle.values()).sort((a, b) => b.totalCost - a.totalCost);
  const maxCost = vehicleSummaries[0]?.totalCost ?? 1;

  return (
    <div className="slide-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Fuel Management</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "3px 0 0" }}>Track fuel consumption and costs across all vehicles</p>
        </div>
        <button onClick={() => setShowModal(true)} className="ff-btn ff-btn-primary"><Plus size={14}/> Log Fuel</button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Total Records", value: records.length.toString(), color: "#2563eb" },
          { label: "Total Litres", value: `${totalLitres.toLocaleString()} L`, color: "#7c3aed" },
          { label: "Total Cost", value: fmt(totalCost), color: "#dc2626" },
          { label: "Avg Cost/Litre", value: `KES ${avgCostPerLitre.toFixed(2)}`, color: "#059669" },
        ].map(({ label, value, color }) => (
          <div key={label} className="ff-card" style={{ padding: "12px 14px" }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>{label}</p>
            <p style={{ fontSize: 18, fontWeight: 700, margin: 0, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Fuel Efficiency Alerts */}
      {efficiency.filter(e => e.status === "critical" || e.status === "warning").length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <AlertTriangle size={14} color="#d97706" />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#92400e" }}>
              Fuel Efficiency Alerts — {efficiency.filter(e => e.status === "critical" || e.status === "warning").length} vehicle(s) below 12-trip target
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {efficiency.filter(e => e.status === "critical" || e.status === "warning").map(e => (
              <div key={e.vehicleId} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                background: e.status === "critical" ? "#fef2f2" : "#fffbeb",
                border: `1px solid ${e.status === "critical" ? "#fca5a5" : "#fcd34d"}`,
                borderLeft: `4px solid ${e.status === "critical" ? "#dc2626" : "#d97706"}`,
                borderRadius: 8,
              }}>
                {e.status === "critical"
                  ? <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
                  : <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0 }} />}
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 13 }}>{e.plateNumber}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: 12, marginLeft: 6 }}>{e.make} {e.model}</span>
                  {e.alert && <p style={{ fontSize: 12, color: e.status === "critical" ? "#dc2626" : "#92400e", margin: "2px 0 0", fontWeight: 500 }}>{e.alert}</p>}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Trips since last fill</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: e.status === "critical" ? "#dc2626" : "#d97706" }}>
                    {e.tripsSinceLastFill} / {e.targetTrips}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs + filter */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", marginBottom: 16, paddingBottom: 0 }}>
        <div style={{ display: "flex", gap: 0 }}>
          {[{ key: "summary", label: "Per-Vehicle Summary", icon: <BarChart2 size={13}/> }, { key: "records", label: "All Records", icon: <Fuel size={13}/> }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 16px", background: "none", border: "none", borderBottom: `2px solid ${tab === t.key ? "var(--accent)" : "transparent"}`, cursor: "pointer", fontSize: 13, fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? "var(--accent)" : "var(--text-muted)", marginBottom: -1 }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
        {tab === "records" && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 1 }}>
            <Filter size={12} color="var(--text-muted)" />
            <select className="ff-input" value={filterVehicle} onChange={e => setFilterVehicle(e.target.value)} style={{ fontSize: 12, padding: "4px 8px" }}>
              <option value="all">All vehicles</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Per-Vehicle Summary Tab */}
      {tab === "summary" && (
        loading ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>
        ) : vehicleSummaries.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <Fuel size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
            <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 12px" }}>No fuel records yet</p>
            <button onClick={() => setShowModal(true)} className="ff-btn ff-btn-primary">Log First Fuel Record</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {vehicleSummaries.map(s => {
              const pct = maxCost > 0 ? (s.totalCost / maxCost) * 100 : 0;
              const costPerLitre = s.totalLitres > 0 ? (s.totalCost / s.totalLitres) : 0;
              const eff = efficiency.find(e => e.vehicleId === s.vehicleId);
              const statusColor = eff?.status === "critical" ? "#dc2626" : eff?.status === "warning" ? "#d97706" : "#16a34a";
              const borderColor = eff?.status === "critical" ? "#dc2626" : eff?.status === "warning" ? "#d97706" : "transparent";
              return (
                <div key={s.vehicleId} className="ff-card" style={{ borderLeft: `4px solid ${borderColor}` }}>
                  <div style={{ display: "grid", gridTemplateColumns: "180px 1fr auto", gap: 16, alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, fontFamily: "monospace" }}>{s.plateNumber}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{s.make} {s.model}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.records} fill-up{s.records !== 1 ? "s" : ""}</div>
                      {eff && eff.status !== "no_data" && (
                        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                          {eff.status === "ok"
                            ? <CheckCircle size={12} color="#16a34a" />
                            : eff.status === "critical"
                            ? <AlertCircle size={12} color="#dc2626" />
                            : <AlertTriangle size={12} color="#d97706" />}
                          <span style={{ fontSize: 10, fontWeight: 600, color: statusColor }}>
                            {eff.status === "ok" ? "On target" : eff.status === "critical" ? "Critical" : "Below target"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11.5, color: "var(--text-muted)", marginBottom: 2 }}>
                        <span>Cost share</span>
                        <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{fmt(s.totalCost)}</span>
                      </div>
                      <div style={{ height: 8, background: "#f1f5f9", borderRadius: 99 }}>
                        <div style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg, #2563eb, #7c3aed)", width: `${pct}%`, transition: "width 0.4s ease" }} />
                      </div>
                      <div style={{ display: "flex", gap: 16, fontSize: 11.5, flexWrap: "wrap" }}>
                        <span><span style={{ color: "var(--text-muted)" }}>Litres: </span><strong>{s.totalLitres.toLocaleString()} L</strong></span>
                        <span><span style={{ color: "var(--text-muted)" }}>Cost/L: </span><strong>KES {costPerLitre.toFixed(2)}</strong></span>
                        {eff && eff.status !== "no_data" && (
                          <span title="Trips completed since last fill-up vs 12-trip target">
                            <span style={{ color: "var(--text-muted)" }}>Trips this fill: </span>
                            <strong style={{ color: statusColor }}>{eff.tripsSinceLastFill}/{eff.targetTrips}</strong>
                          </span>
                        )}
                        {eff?.litresPerTrip && (
                          <span title="Average litres consumed per trip">
                            <span style={{ color: "var(--text-muted)" }}>L/trip: </span>
                            <strong style={{ color: eff.litresPerTrip > 7.5 ? "#dc2626" : "#16a34a" }}>{eff.litresPerTrip}</strong>
                            <span style={{ color: "var(--text-muted)", fontSize: 10, marginLeft: 2 }}>(target 7.5)</span>
                          </span>
                        )}
                      </div>
                      {/* Trip progress bar */}
                      {eff && eff.targetTrips > 0 && (
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)", marginBottom: 3 }}>
                            <span>Trips since last fill-up</span>
                            <span style={{ fontWeight: 600, color: statusColor }}>{eff.tripsSinceLastFill} / {eff.targetTrips} trips</span>
                          </div>
                          <div style={{ height: 5, background: "#f1f5f9", borderRadius: 99 }}>
                            <div style={{
                              height: "100%", borderRadius: 99,
                              background: statusColor,
                              width: `${Math.min(100, (eff.tripsSinceLastFill / eff.targetTrips) * 100)}%`,
                              transition: "width 0.4s ease",
                            }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>
                        <TrendingDown size={11} style={{ verticalAlign: "middle", marginRight: 2 }} />
                        {((s.totalCost / (records.reduce((a, b) => a + b.totalCost, 0) || 1)) * 100).toFixed(0)}% of total
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Cost/Litre</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: costPerLitre > avgCostPerLitre * 1.1 ? "#dc2626" : "#16a34a" }}>
                        KES {costPerLitre.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* All Records Tab */}
      {tab === "records" && (
        <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <Fuel size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
              <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 12px" }}>{records.length === 0 ? "No fuel records yet" : "No records for this vehicle"}</p>
              {records.length === 0 && <button onClick={() => setShowModal(true)} className="ff-btn ff-btn-primary">Log First Record</button>}
            </div>
          ) : (
            <table className="ff-table">
              <thead><tr><th>Date</th><th>Vehicle</th><th>Litres</th><th>Cost/L</th><th>Total Cost</th><th>Odometer</th><th>Station</th></tr></thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontSize: 11.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{new Date(r.date).toLocaleDateString("en-KE")}</td>
                    <td style={{ fontWeight: 600, fontFamily: "monospace", fontSize: 12 }}>{r.vehicle.plateNumber} <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>— {r.vehicle.make}</span></td>
                    <td style={{ fontWeight: 600 }}>{r.litres.toLocaleString()} L</td>
                    <td>KES {r.costPerLitre.toFixed(2)}</td>
                    <td style={{ fontWeight: 700, color: "#dc2626" }}>KES {r.totalCost.toLocaleString()}</td>
                    <td style={{ color: "var(--text-muted)" }}>{r.odometerKm.toLocaleString()} km</td>
                    <td style={{ color: "var(--text-muted)" }}>{r.station ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f8fafc" }}>
                  <td colSpan={2} style={{ fontWeight: 700, padding: "10px 12px", fontSize: 12.5 }}>Totals ({filtered.length} records)</td>
                  <td style={{ fontWeight: 700 }}>{totalLitres.toLocaleString()} L</td>
                  <td style={{ color: "var(--text-muted)", fontSize: 12 }}>avg KES {avgCostPerLitre.toFixed(2)}</td>
                  <td style={{ fontWeight: 800, color: "#dc2626" }}>KES {totalCost.toLocaleString()}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {/* Add fuel modal */}
      {showModal && (
        <div className="ff-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ff-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Log Fuel Record</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18}/></button>
            </div>
            <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Vehicle *</label>
                <select className="ff-input" value={form.vehicleId} onChange={set("vehicleId")} required>
                  <option value="">Select vehicle…</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber} — {v.make} {v.model}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Litres *</label>
                  <input className="ff-input" type="number" value={form.litres} onChange={set("litres")} placeholder="50" required min="1" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Cost per Litre (KES) *</label>
                  <input className="ff-input" type="number" value={form.costPerLitre} onChange={set("costPerLitre")} placeholder="155" required min="1" step="0.01" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Odometer (km)</label>
                  <input className="ff-input" type="number" value={form.odometerKm} onChange={set("odometerKm")} placeholder="45000" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Date</label>
                  <input className="ff-input" type="date" value={form.date} onChange={set("date")} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Station Name</label>
                <input className="ff-input" value={form.station} onChange={set("station")} placeholder="Total, Shell, Rubis…" />
              </div>
              {form.litres && form.costPerLitre && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 12px" }}>
                  <span style={{ fontSize: 12.5, color: "#15803d", fontWeight: 600 }}>
                    Total Cost: KES {(parseFloat(form.litres || "0") * parseFloat(form.costPerLitre || "0")).toLocaleString()}
                  </span>
                </div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="submit" disabled={saving} className="ff-btn ff-btn-primary" style={{ flex: 1 }}>
                  <Save size={14}/>{saving ? " Saving…" : " Save Record"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="ff-btn ff-btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
