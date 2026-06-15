"use client";
import { useState, useEffect, useCallback } from "react";
import { Zap, Shield, Building2, CheckCircle2, XCircle, Pause, Play, Plus, ChevronDown, RefreshCw, TrendingUp } from "lucide-react";

type Plan = { id: string; name: string; price: number; maxVehicles: number; maxDrivers: number; maxUsers: number };

type OrgRow = {
  id: string; name: string; email: string; phone?: string; status: string; trialEndsAt?: string;
  subscription?: {
    id: string; status: string; trialEnd?: string;
    currentPeriodStart: string; currentPeriodEnd: string;
    plan: { id: string; name: string; price: number };
  };
};

type PayForm = { amount: string; method: string; reference: string; notes: string; months: string; planName: string };

const PLAN_COLORS: Record<string, string> = {
  Basic: "#2563eb", Professional: "#7c3aed", Enterprise: "#d97706",
};

const PLAN_ICONS: Record<string, typeof Zap> = {
  Basic: Zap, Professional: Shield, Enterprise: Building2,
};

const STATUS_BADGE: Record<string, string> = {
  trial: "ff-badge-blue", active: "ff-badge-green",
  expired: "ff-badge-red", suspended: "ff-badge-red", cancelled: "ff-badge-gray", none: "ff-badge-gray",
};

const METHOD_LABELS: Record<string, string> = {
  mpesa: "M-Pesa", stripe: "Stripe", bank_transfer: "Bank Transfer",
};

const STATIC_PLANS = [
  { name: "Basic", price: 6000, vehicles: 5, users: 3, color: "#2563eb" },
  { name: "Professional", price: 12500, vehicles: 25, users: 15, color: "#7c3aed" },
  { name: "Enterprise", price: 18000, vehicles: 9999, users: 9999, color: "#d97706" },
];

export default function AdminSubscriptionsPage() {
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState<"payment" | "plan" | "trial" | null>(null);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [payForm, setPayForm] = useState<PayForm>({ amount: "", method: "mpesa", reference: "", notes: "", months: "1", planName: "" });
  const [trialDays, setTrialDays] = useState("30");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [orgsRes, plansRes] = await Promise.all([
        fetch("/api/admin/companies").then(r => r.json()),
        fetch("/api/admin/plans").then(r => r.json()),
      ]);
      setOrgs(Array.isArray(orgsRes) ? orgsRes : []);
      setPlans(Array.isArray(plansRes) ? plansRes : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function patchSub(orgId: string, body: Record<string, unknown>) {
    setSaving(true);
    try {
      await fetch(`/api/admin/subscriptions/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } finally {
      setSaving(false);
      setModal(null);
      setActiveOrgId(null);
      load();
    }
  }

  const activeOrg = orgs.find(o => o.id === activeOrgId);
  const subStatus = (o: OrgRow) => o.subscription?.status ?? "none";

  const filtered = orgs.filter(o => {
    const s = subStatus(o);
    if (filter === "active") return s === "active";
    if (filter === "trial") return s === "trial";
    if (filter === "expired") return s === "expired" || s === "none";
    if (filter === "suspended") return s === "suspended";
    return true;
  });

  const counts = {
    active: orgs.filter(o => subStatus(o) === "active").length,
    trial: orgs.filter(o => subStatus(o) === "trial").length,
    expired: orgs.filter(o => subStatus(o) === "expired" || subStatus(o) === "none").length,
    suspended: orgs.filter(o => subStatus(o) === "suspended").length,
  };
  const mrr = orgs.filter(o => subStatus(o) === "active").reduce((s, o) => s + (o.subscription?.plan.price ?? 0), 0);

  return (
    <div className="slide-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Subscription Management</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "3px 0 0" }}>Manage plans, payments, and tenant access</p>
        </div>
        <button onClick={load} className="ff-btn ff-btn-secondary"><RefreshCw size={14} /> Refresh</button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, marginBottom: 24 }}>
        {[
          { label: "MRR", value: `KES ${mrr.toLocaleString()}`, color: "#7c3aed" },
          { label: "ARR (est.)", value: `KES ${(mrr * 12).toLocaleString()}`, color: "#d97706" },
          { label: "Active", value: counts.active, color: "#16a34a" },
          { label: "On Trial", value: counts.trial, color: "#2563eb" },
          { label: "Expired", value: counts.expired, color: "#dc2626" },
          { label: "Suspended", value: counts.suspended, color: "#9f1239" },
        ].map(({ label, value, color }) => (
          <div key={label} className="ff-card" style={{ padding: "12px 14px" }}>
            <p style={{ fontSize: 10.5, color: "var(--text-muted)", margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
            <p style={{ fontSize: 18, fontWeight: 700, margin: 0, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Plan cards */}
      <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>Subscription Plans</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 28 }}>
        {STATIC_PLANS.map(({ name, price, vehicles, users, color }) => {
          const Icon = PLAN_ICONS[name] ?? Zap;
          const planSubs = orgs.filter(o => o.subscription?.plan.name === name);
          const planMrr = planSubs.filter(o => subStatus(o) === "active").reduce((s) => s + price, 0);
          return (
            <div key={name} className="ff-card" style={{ borderTop: `3px solid ${color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={20} color={color} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, margin: 0, color }}>{name}</p>
                  <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: 0 }}>KES {price.toLocaleString()}/month</p>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { label: "Tenants", value: planSubs.length },
                  { label: "MRR", value: `KES ${(planMrr / 1000).toFixed(0)}K` },
                  { label: "Vehicles", value: vehicles >= 9999 ? "∞" : `≤${vehicles}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: "var(--background)", borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                    <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase" }}>{label}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscriptions table */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>All Tenants ({orgs.length})</h2>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { key: "all", label: "All" },
            { key: "active", label: `Active (${counts.active})` },
            { key: "trial", label: `Trial (${counts.trial})` },
            { key: "expired", label: `Expired (${counts.expired})` },
            { key: "suspended", label: `Suspended (${counts.suspended})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`ff-btn ff-btn-sm ${filter === key ? "ff-btn-primary" : "ff-btn-secondary"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>
        ) : (
          <table className="ff-table">
            <thead>
              <tr><th>Company</th><th>Plan</th><th>MRR</th><th>Sub Status</th><th>Period End</th><th>Trial End</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>No records</td></tr>
              ) : filtered.map(o => {
                const s = subStatus(o);
                return (
                  <tr key={o.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{o.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{o.email}</div>
                    </td>
                    <td>
                      {o.subscription?.plan
                        ? <span className="ff-badge ff-badge-purple">{o.subscription.plan.name}</span>
                        : <span className="ff-badge ff-badge-gray">No Plan</span>}
                    </td>
                    <td style={{ fontWeight: 700, color: "#7c3aed" }}>
                      {s === "active" ? `KES ${(o.subscription?.plan.price ?? 0).toLocaleString()}` : "—"}
                    </td>
                    <td><span className={`ff-badge ${STATUS_BADGE[s] ?? "ff-badge-gray"}`}>{s}</span></td>
                    <td style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                      {o.subscription?.currentPeriodEnd ? new Date(o.subscription.currentPeriodEnd).toLocaleDateString("en-KE") : "—"}
                    </td>
                    <td style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                      {o.subscription?.trialEnd ? new Date(o.subscription.trialEnd).toLocaleDateString("en-KE") : o.trialEndsAt ? new Date(o.trialEndsAt).toLocaleDateString("en-KE") : "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button title="Record Payment"
                          onClick={() => { setActiveOrgId(o.id); setPayForm(f => ({ ...f, planName: o.subscription?.plan.name ?? "Professional", amount: String(o.subscription?.plan.price ?? 12500) })); setModal("payment"); }}
                          className="ff-btn ff-btn-success ff-btn-sm">
                          <Plus size={11} /> Pay
                        </button>
                        <button title="Change Plan"
                          onClick={() => { setActiveOrgId(o.id); setSelectedPlan(o.subscription?.plan.name ?? ""); setModal("plan"); }}
                          className="ff-btn ff-btn-secondary ff-btn-sm">
                          <ChevronDown size={11} /> Plan
                        </button>
                        <button title="Extend Trial"
                          onClick={() => { setActiveOrgId(o.id); setModal("trial"); }}
                          className="ff-btn ff-btn-secondary ff-btn-sm">
                          <RefreshCw size={11} />
                        </button>
                        {s !== "suspended" ? (
                          <button title="Suspend" onClick={() => patchSub(o.id, { action: "suspend" })}
                            className="ff-btn ff-btn-danger ff-btn-sm"><Pause size={11} /></button>
                        ) : (
                          <button title="Activate" onClick={() => patchSub(o.id, { action: "activate" })}
                            className="ff-btn ff-btn-success ff-btn-sm"><Play size={11} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Record Payment Modal ── */}
      {modal === "payment" && activeOrg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div className="ff-card" style={{ width: "100%", maxWidth: 500, maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 2px" }}>Record Payment</h3>
              <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: 0 }}>{activeOrg.name} — activates subscription on save</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Amount (KES) *</label>
                  <input className="ff-input" type="number" placeholder="12500" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Months *</label>
                  <select className="ff-input" value={payForm.months} onChange={e => setPayForm(f => ({ ...f, months: e.target.value }))}>
                    {[1, 3, 6, 12].map(m => <option key={m} value={m}>{m} month{m > 1 ? "s" : ""}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Payment Method *</label>
                  <select className="ff-input" value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}>
                    {Object.entries(METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Plan</label>
                  <select className="ff-input" value={payForm.planName} onChange={e => setPayForm(f => ({ ...f, planName: e.target.value }))}>
                    {STATIC_PLANS.map(p => (
                      <option key={p.name} value={p.name}>{p.name} — KES {p.price.toLocaleString()}/mo</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Reference / Transaction ID</label>
                <input className="ff-input" placeholder="e.g. NGA8KX9B3F (M-Pesa code)" value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Notes</label>
                <textarea className="ff-input" rows={2} placeholder="Optional notes…" value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className="ff-btn ff-btn-primary" style={{ flex: 1 }} disabled={!payForm.amount || saving}
                onClick={() => patchSub(activeOrg.id, {
                  action: "record_payment",
                  amount: Number(payForm.amount),
                  method: payForm.method,
                  reference: payForm.reference || null,
                  notes: payForm.notes || null,
                  months: Number(payForm.months),
                  planId: payForm.planName || undefined,
                })}>
                {saving ? "Saving…" : "Record Payment & Activate"}
              </button>
              <button className="ff-btn ff-btn-secondary" onClick={() => { setModal(null); setActiveOrgId(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Plan Modal ── */}
      {modal === "plan" && activeOrg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div className="ff-card" style={{ width: "100%", maxWidth: 380 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>Change Plan</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "0 0 16px" }}>{activeOrg.name}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {STATIC_PLANS.map(p => {
                const isSel = selectedPlan === p.name;
                return (
                  <button key={p.name} onClick={() => setSelectedPlan(p.name)}
                    style={{ padding: "11px 14px", borderRadius: 8, border: isSel ? `2px solid ${p.color}` : "1px solid var(--border)", background: isSel ? p.color + "10" : "#fff", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700, color: p.color }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>KES {p.price.toLocaleString()}/mo</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="ff-btn ff-btn-primary" style={{ flex: 1 }} disabled={!selectedPlan || saving}
                onClick={() => patchSub(activeOrg.id, { action: "change_plan", planName: selectedPlan })}>
                {saving ? "Saving…" : "Update Plan"}
              </button>
              <button className="ff-btn ff-btn-secondary" onClick={() => { setModal(null); setActiveOrgId(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Extend Trial Modal ── */}
      {modal === "trial" && activeOrg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div className="ff-card" style={{ width: "100%", maxWidth: 360 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>Extend Trial</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "0 0 16px" }}>{activeOrg.name}</p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Additional Trial Days</label>
              <select className="ff-input" value={trialDays} onChange={e => setTrialDays(e.target.value)}>
                {[7, 14, 30, 60, 90].map(d => <option key={d} value={d}>{d} days</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="ff-btn ff-btn-primary" style={{ flex: 1 }} disabled={saving}
                onClick={() => patchSub(activeOrg.id, { action: "extend_trial", days: Number(trialDays) })}>
                {saving ? "Saving…" : `Grant ${trialDays}-Day Trial`}
              </button>
              <button className="ff-btn ff-btn-secondary" onClick={() => { setModal(null); setActiveOrgId(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
