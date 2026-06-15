import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ensurePlans, PLAN_FEATURES } from "@/lib/plans";
import { computeSubscriptionState } from "@/lib/subscription";
import {
  CheckCircle2, XCircle, AlertCircle, Zap, Shield, Building2,
  CreditCard, Phone, Mail, Calendar, TrendingUp,
} from "lucide-react";

const PLAN_META: Record<string, { icon: typeof Zap; color: string; badge: string }> = {
  Basic:        { icon: Zap,       color: "#2563eb", badge: "ff-badge-blue" },
  Professional: { icon: Shield,    color: "#7c3aed", badge: "ff-badge-purple" },
  Enterprise:   { icon: Building2, color: "#d97706", badge: "ff-badge-orange" },
};

const STATUS_LABEL: Record<string, { label: string; badge: string }> = {
  trial:     { label: "Free Trial",  badge: "ff-badge-blue" },
  active:    { label: "Active",      badge: "ff-badge-green" },
  expired:   { label: "Expired",     badge: "ff-badge-red" },
  suspended: { label: "Suspended",   badge: "ff-badge-red" },
  cancelled: { label: "Cancelled",   badge: "ff-badge-gray" },
};

const METHOD_LABEL: Record<string, string> = {
  mpesa: "M-Pesa", stripe: "Stripe", bank_transfer: "Bank Transfer",
};

export default async function SubscriptionPage() {
  const session = await getSession();
  if (!session?.organizationId) return null;

  await ensurePlans();

  const [org, plans, payments] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: session.organizationId },
      select: {
        name: true, status: true, trialEndsAt: true,
        subscription: {
          select: {
            id: true, status: true, trialEnd: true,
            currentPeriodStart: true, currentPeriodEnd: true,
            plan: { select: { id: true, name: true, price: true, currency: true } },
          },
        },
      },
    }),
    prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { price: "asc" } }),
    prisma.subscriptionPayment.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  if (!org) return null;

  const state = computeSubscriptionState(org);
  const currentPlanName = state.planName;
  const statusMeta = STATUS_LABEL[state.status] ?? { label: state.status, badge: "ff-badge-gray" };

  const statusBg: Record<string, string> = {
    trial:     "linear-gradient(135deg,#1e3a5f,#2563eb)",
    active:    "linear-gradient(135deg,#07111f,#0d2d1e)",
    expired:   "linear-gradient(135deg,#3f1010,#7f1d1d)",
    suspended: "linear-gradient(135deg,#3f1010,#7f1d1d)",
    cancelled: "linear-gradient(135deg,#1a1a1a,#374151)",
  };

  return (
    <div className="slide-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Subscription & Billing</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "3px 0 0" }}>
          Manage your FleetFlow ERP subscription
        </p>
      </div>

      {/* Current plan hero */}
      <div className="ff-card" style={{
        marginBottom: 24, background: statusBg[state.status] ?? statusBg.active,
        border: "none", padding: "24px 28px",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11.5, margin: "0 0 6px", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Current Plan
            </p>
            <p style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: "0 0 10px", letterSpacing: "-0.5px" }}>
              {currentPlanName}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span className={`ff-badge ${statusMeta.badge}`} style={{ fontSize: 11 }}>
                {statusMeta.label}
              </span>
              {state.daysRemaining !== null && (
                <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 12.5, display: "flex", alignItems: "center", gap: 5 }}>
                  <Calendar size={13} />
                  {state.isTrial
                    ? `Trial ends in ${state.daysRemaining} day${state.daysRemaining !== 1 ? "s" : ""}`
                    : `Renews in ${state.daysRemaining} day${state.daysRemaining !== 1 ? "s" : ""}`}
                </span>
              )}
              {state.periodEnd && (
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                  {state.isTrial ? "Trial expires" : "Period ends"}: {new Date(state.periodEnd).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            {state.planPrice > 0 ? (
              <>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: "0 0 2px" }}>Monthly</p>
                <p style={{ color: "#fff", fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
                  KES {state.planPrice.toLocaleString()}
                </p>
              </>
            ) : (
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>Free Trial</p>
            )}
          </div>
        </div>

        {/* Expired / suspended CTA */}
        {(state.isExpired || state.isSuspended) && (
          <div style={{ marginTop: 18, padding: "14px 18px", background: "rgba(255,255,255,0.08)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)" }}>
            <p style={{ color: "#fca5a5", fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>
              {state.isSuspended ? "Account suspended" : "Subscription expired"}
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12.5, margin: "0 0 12px" }}>
              {state.isSuspended
                ? "Your account has been suspended by an administrator. Please contact support."
                : "Your access has been paused. Pay your subscription to restore full access immediately."}
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href="tel:+254700000000" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", color: "#07111f", padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}>
                <Phone size={13} /> Call Support
              </a>
              <a href="mailto:billing@fleetflow.io" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, textDecoration: "none" }}>
                <Mail size={13} /> billing@fleetflow.io
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Available plans */}
      <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>Available Plans</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
        {plans.map((plan) => {
          const meta = PLAN_META[plan.name] ?? PLAN_META.Basic;
          const Icon = meta.icon;
          const color = meta.color;
          const isCurrent = currentPlanName === plan.name && state.canAccess;
          let features: string[] = [];
          try { features = JSON.parse(plan.features); } catch { features = PLAN_FEATURES[plan.name as keyof typeof PLAN_FEATURES] ?? []; }

          return (
            <div key={plan.id} className="ff-card" style={{
              border: isCurrent ? `2px solid ${color}` : "1px solid var(--border)",
              position: "relative", padding: "20px",
            }}>
              {isCurrent && (
                <div style={{ position: "absolute", top: -1, right: 16, background: color, color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: "0 0 8px 8px", letterSpacing: "0.05em" }}>
                  YOUR PLAN
                </div>
              )}
              {plan.name === "Professional" && !isCurrent && (
                <div style={{ position: "absolute", top: -1, right: 16, background: "#7c3aed", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: "0 0 8px 8px", letterSpacing: "0.05em" }}>
                  POPULAR
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={22} color={color} />
                </div>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 700, margin: 0, color }}>{plan.name}</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, fontWeight: 500 }}>
                    KES {plan.price.toLocaleString()}/month
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                {[
                  { label: "Vehicles", value: plan.maxVehicles >= 9999 ? "Unlimited" : `Up to ${plan.maxVehicles}` },
                  { label: "Users", value: plan.maxUsers >= 9999 ? "Unlimited" : `Up to ${plan.maxUsers}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: "var(--background)", borderRadius: 8, padding: "7px 10px" }}>
                    <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color }}>{value}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
                {features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12.5 }}>
                    <CheckCircle2 size={13} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ color: "var(--text-secondary)" }}>{f}</span>
                  </div>
                ))}
              </div>

              {isCurrent ? (
                <div className="ff-btn ff-btn-secondary" style={{ width: "100%", textAlign: "center", cursor: "default", opacity: 0.7, pointerEvents: "none" }}>
                  Current Plan
                </div>
              ) : (
                <a href="mailto:billing@fleetflow.io?subject=Subscription%20Upgrade%20Request"
                  style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "10px 16px", background: color, color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none", gap: 6 }}>
                  <TrendingUp size={14} />
                  {plan.price > (state.planPrice || 0) ? "Upgrade" : "Downgrade"}
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment history */}
      <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>Payment History</h2>
      <div className="ff-card" style={{ padding: 0, overflow: "hidden", marginBottom: 28 }}>
        {payments.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <CreditCard size={36} color="var(--text-muted)" style={{ marginBottom: 10 }} />
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No payment records yet.</p>
          </div>
        ) : (
          <table className="ff-table">
            <thead>
              <tr><th>Invoice #</th><th>Plan</th><th>Amount</th><th>Method</th><th>Reference</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>{p.invoiceNumber}</td>
                  <td><span className="ff-badge ff-badge-purple">{p.plan}</span></td>
                  <td style={{ fontWeight: 700 }}>KES {p.amount.toLocaleString()}</td>
                  <td style={{ color: "var(--text-muted)" }}>{METHOD_LABEL[p.method] ?? p.method}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 11.5, color: "var(--text-muted)" }}>{p.reference ?? "—"}</td>
                  <td>
                    <span className={`ff-badge ${p.status === "paid" ? "ff-badge-green" : p.status === "pending" ? "ff-badge-yellow" : "ff-badge-red"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {new Date(p.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Contact & payment instructions */}
      <div className="ff-card" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>How to Pay</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {[
            { icon: "📱", title: "M-Pesa", detail: "Paybill: 123456\nAccount: Your company name", color: "#16a34a" },
            { icon: "🏦", title: "Bank Transfer", detail: "Bank: Equity Bank\nAcc: 0100000000000\nRef: Your company name", color: "#2563eb" },
            { icon: "💳", title: "Stripe", detail: "Online card payment\nContact us for a secure payment link", color: "#7c3aed" },
          ].map(({ icon, title, detail, color }) => (
            <div key={title} style={{ background: "#fff", borderRadius: 10, padding: "14px 16px", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <span style={{ fontWeight: 700, fontSize: 13, color }}>{title}</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, whiteSpace: "pre-line", lineHeight: 1.6 }}>{detail}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: "12px 16px", background: "#fff", borderRadius: 10, border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <AlertCircle size={16} color="#2563eb" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, color: "var(--text-secondary)", flex: 1 }}>
            After payment, send your proof of payment to <strong>billing@fleetflow.io</strong> or WhatsApp <strong>+254 700 000 000</strong>. Your account will be activated within 2 hours.
          </span>
          <a href="mailto:billing@fleetflow.io" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--accent)", color: "#fff", padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>
            <Mail size={13} /> Email Billing
          </a>
        </div>
      </div>
    </div>
  );
}
