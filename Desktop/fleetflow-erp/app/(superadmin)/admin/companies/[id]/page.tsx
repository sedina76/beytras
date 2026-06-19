"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2, Users, Truck, UserCheck, ClipboardList,
  CheckCircle2, Pause, Play, Plus, ChevronLeft,
  CreditCard, RefreshCw, ChevronDown, Mail, Phone, MapPin, Calendar,
} from "lucide-react";

type Plan = { id: string; name: string; price: number };
type Payment = { id: string; invoiceNumber: string; amount: number; plan: string; method: string; status: string; paidAt: string | null; reference: string | null; notes: string | null };
type Org = {
  id: string; name: string; email: string; phone?: string; city?: string; status: string;
  createdAt: string; trialEndsAt?: string;
  subscription?: {
    id: string; status: string; trialEnd?: string;
    currentPeriodStart: string; currentPeriodEnd: string;
    plan: Plan;
    payments: Payment[];
  };
  _count: { users: number; vehicles: number; drivers: number; orders: number };
};

type PayForm = { amount: string; method: string; reference: string; notes: string; months: string; planName: string };

const STATUS_BADGE: Record<string, string> = {
  trial: "ff-badge-blue", active: "ff-badge-green",
  expired: "ff-badge-red", suspended: "ff-badge-red", cancelled: "ff-badge-gray", none: "ff-badge-gray",
};

const STATIC_PLANS = [
  { name: "Basic", price: 6000, color: "#2563eb" },
  { name: "Professional", price: 12500, color: "#7c3aed" },
  { name: "Enterprise", price: 18000, color: "#d97706" },
];

const METHOD_LABELS: Record<string, string> = {
  mpesa: "M-Pesa", stripe: "Stripe", bank_transfer: "Bank Transfer",
};

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<"payment" | "plan" | "trial" | null>(null);
  const [payForm, setPayForm] = useState<PayForm>({ amount: "", method: "mpesa", reference: "", notes: "", months: "1", planName: "Professional" });
  const [trialDays, setTrialDays] = useState("30");
  const [selectedPlan, setSelectedPlan] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetch(`/api/admin/companies/${id}`).then(r => r.json());
      setOrg(data);
      if (data.subscription?.plan) {
        setSelectedPlan(data.subscription.plan.name);
        setPayForm(f => ({ ...f, planName: data.subscription.plan.name, amount: String(data.subscription.plan.price) }));
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function patchSub(body: Record<string, unknown>) {
    setSaving(true);
    try {
      await fetch(`/api/admin/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } finally {
      setSaving(false);
      setModal(null);
      load();
    }
  }

  async function updateOrgStatus(status: string) {
    setSaving(true);
    try {
      await fetch(`/api/admin/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } finally {
      setSaving(false);
      load();
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading…</div>
      </div>
    );
  }

  if (!org) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Company not found.</p>
        <Link href="/admin/companies" className="ff-btn ff-btn-secondary" style={{ marginTop: 12 }}>← Back to Companies</Link>
      </div>
    );
  }

  const subStatus = org.subscription?.status ?? "none";
  const payments = org.subscription?.payments ?? [];

  return (
    <div className="slide-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.back()} className="ff-btn ff-btn-ghost ff-btn-sm">
          <ChevronLeft size={14} /> Back
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{org.name}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "2px 0 0" }}>Company Management</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} className="ff-btn ff-btn-ghost ff-btn-sm" title="Refresh"><RefreshCw size={13} /></button>
          {org.status !== "active" ? (
            <button onClick={() => updateOrgStatus("active")} disabled={saving} className="ff-btn ff-btn-success ff-btn-sm">
              <Play size={13} /> Activate
            </button>
          ) : (
            <button onClick={() => updateOrgStatus("suspended")} disabled={saving} className="ff-btn ff-btn-danger ff-btn-sm">
              <Pause size={13} /> Suspend
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        {/* Company Info */}
        <div className="ff-card">
          <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <Building2 size={15} /> Company Info
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: Mail, label: "Email", value: org.email },
              { icon: Phone, label: "Phone", value: org.phone ?? "—" },
              { icon: MapPin, label: "City", value: org.city ?? "—" },
              { icon: Calendar, label: "Joined", value: new Date(org.createdAt).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" }) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--text-muted)", width: 48, flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 12.5, fontWeight: 500 }}>{value}</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCircle2 size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "var(--text-muted)", width: 48, flexShrink: 0 }}>Status</span>
              <span className={`ff-badge ${org.status === "active" ? "ff-badge-green" : org.status === "trial" ? "ff-badge-yellow" : "ff-badge-red"}`}>
                {org.status}
              </span>
            </div>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="ff-card">
          <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: "0 0 14px" }}>Usage</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { icon: Users, label: "Users", value: org._count.users, color: "#7c3aed" },
              { icon: Truck, label: "Vehicles", value: org._count.vehicles, color: "#2563eb" },
              { icon: UserCheck, label: "Drivers", value: org._count.drivers, color: "#059669" },
              { icon: ClipboardList, label: "Orders", value: org._count.orders, color: "#d97706" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} style={{ background: "var(--background)", borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={16} color={color} />
                </div>
                <div>
                  <p style={{ fontSize: 10.5, color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase", fontWeight: 600 }}>{label}</p>
                  <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="ff-card" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <CreditCard size={15} /> Subscription
          </h3>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => { setPayForm(f => ({ ...f, planName: org.subscription?.plan.name ?? "Professional", amount: String(org.subscription?.plan.price ?? 12500) })); setModal("payment"); }}
              className="ff-btn ff-btn-success ff-btn-sm"><Plus size={12} /> Record Payment</button>
            <button onClick={() => { setSelectedPlan(org.subscription?.plan.name ?? ""); setModal("plan"); }}
              className="ff-btn ff-btn-secondary ff-btn-sm"><ChevronDown size={12} /> Change Plan</button>
            <button onClick={() => setModal("trial")} className="ff-btn ff-btn-secondary ff-btn-sm">
              <RefreshCw size={12} /> Extend Trial
            </button>
          </div>
        </div>

        {org.subscription ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {[
              { label: "Plan", value: org.subscription.plan.name },
              { label: "Sub Status", value: <span className={`ff-badge ${STATUS_BADGE[subStatus] ?? "ff-badge-gray"}`}>{subStatus}</span> },
              { label: "Period End", value: new Date(org.subscription.currentPeriodEnd).toLocaleDateString("en-KE") },
              { label: "Trial End", value: org.subscription.trialEnd ? new Date(org.subscription.trialEnd).toLocaleDateString("en-KE") : org.trialEndsAt ? new Date(org.trialEndsAt).toLocaleDateString("en-KE") : "—" },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "var(--background)", borderRadius: 8, padding: "10px 12px" }}>
                <p style={{ fontSize: 10.5, color: "var(--text-muted)", margin: "0 0 4px", textTransform: "uppercase", fontWeight: 600 }}>{label}</p>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: 13, background: "var(--background)", borderRadius: 8 }}>
            No subscription found. Record a payment to activate.
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: 0 }}>Payment History ({payments.length})</h3>
        </div>
        {payments.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No payments recorded yet.</div>
        ) : (
          <table className="ff-table">
            <thead>
              <tr><th>Invoice #</th><th>Plan</th><th>Amount</th><th>Method</th><th>Reference</th><th>Paid At</th><th>Status</th></tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, fontSize: 12 }}>{p.invoiceNumber}</td>
                  <td><span className="ff-badge ff-badge-purple">{p.plan}</span></td>
                  <td style={{ fontWeight: 700 }}>KES {p.amount.toLocaleString()}</td>
                  <td>{METHOD_LABELS[p.method] ?? p.method}</td>
                  <td style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{p.reference ?? "—"}</td>
                  <td style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-KE") : "—"}</td>
                  <td><span className={`ff-badge ${p.status === "paid" ? "ff-badge-green" : "ff-badge-gray"}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Record Payment Modal ── */}
      {modal === "payment" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div className="ff-card" style={{ width: "100%", maxWidth: 500, maxHeight: "92vh", overflowY: "auto" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>Record Payment</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "0 0 16px" }}>{org.name} — activates subscription on save</p>
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
                onClick={() => patchSub({ action: "record_payment", amount: Number(payForm.amount), method: payForm.method, reference: payForm.reference || null, notes: payForm.notes || null, months: Number(payForm.months), planId: payForm.planName || undefined })}>
                {saving ? "Saving…" : "Record Payment & Activate"}
              </button>
              <button className="ff-btn ff-btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Plan Modal ── */}
      {modal === "plan" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div className="ff-card" style={{ width: "100%", maxWidth: 380 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>Change Plan</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "0 0 16px" }}>{org.name}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {STATIC_PLANS.map(p => {
                const isSel = selectedPlan === p.name;
                return (
                  <button key={p.name} onClick={() => setSelectedPlan(p.name)}
                    style={{ padding: "11px 14px", borderRadius: 8, border: isSel ? `2px solid ${p.color}` : "1px solid var(--border)", background: isSel ? p.color + "10" : "var(--background)", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700, color: p.color }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>KES {p.price.toLocaleString()}/mo</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="ff-btn ff-btn-primary" style={{ flex: 1 }} disabled={!selectedPlan || saving}
                onClick={() => patchSub({ action: "change_plan", planName: selectedPlan })}>
                {saving ? "Saving…" : "Update Plan"}
              </button>
              <button className="ff-btn ff-btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Extend Trial Modal ── */}
      {modal === "trial" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div className="ff-card" style={{ width: "100%", maxWidth: 360 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>Extend Trial</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "0 0 16px" }}>{org.name}</p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Additional Trial Days</label>
              <select className="ff-input" value={trialDays} onChange={e => setTrialDays(e.target.value)}>
                {[7, 14, 30, 60, 90].map(d => <option key={d} value={d}>{d} days</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="ff-btn ff-btn-primary" style={{ flex: 1 }} disabled={saving}
                onClick={() => patchSub({ action: "extend_trial", days: Number(trialDays) })}>
                {saving ? "Saving…" : `Grant ${trialDays}-Day Trial`}
              </button>
              <button className="ff-btn ff-btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
