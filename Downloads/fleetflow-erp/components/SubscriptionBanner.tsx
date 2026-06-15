import Link from "next/link";
import { AlertTriangle, AlertCircle, XCircle, Clock } from "lucide-react";
import type { SubscriptionState } from "@/lib/subscription";

export default function SubscriptionBanner({ state }: { state: SubscriptionState }) {
  if (!state.warnDays && !state.isExpired && !state.isSuspended) return null;

  if (state.isSuspended) {
    return (
      <div style={{
        background: "#fef2f2", borderBottom: "1px solid #fecaca",
        padding: "10px 24px", display: "flex", alignItems: "center", gap: 10,
      }}>
        <XCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>
          Your account has been suspended.
        </span>
        <span style={{ fontSize: 13, color: "#b91c1c" }}>
          Please contact support to restore access.
        </span>
        <Link href="/subscription" style={{ marginLeft: "auto", fontSize: 12, color: "#dc2626", fontWeight: 700, textDecoration: "underline" }}>
          View Details
        </Link>
      </div>
    );
  }

  if (state.isExpired) {
    return (
      <div style={{
        background: "#fef2f2", borderBottom: "1px solid #fecaca",
        padding: "10px 24px", display: "flex", alignItems: "center", gap: 10,
      }}>
        <XCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>
          {state.isTrial ? "Your free trial has ended." : "Your subscription has expired."}
        </span>
        <span style={{ fontSize: 13, color: "#b91c1c" }}>
          Renew your plan to restore full access.
        </span>
        <Link href="/subscription" style={{ marginLeft: "auto", background: "#dc2626", color: "#fff", fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 6, textDecoration: "none" }}>
          Renew Now
        </Link>
      </div>
    );
  }

  const days = state.daysRemaining ?? 0;
  const isTrial = state.isTrial;

  if (state.warnDays === 3) {
    return (
      <div style={{
        background: "#fef2f2", borderBottom: "1px solid #fecaca",
        padding: "10px 24px", display: "flex", alignItems: "center", gap: 10,
      }}>
        <XCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 700 }}>
          {isTrial ? `Trial ends in ${days} day${days !== 1 ? "s" : ""}!` : `Subscription expires in ${days} day${days !== 1 ? "s" : ""}!`}
        </span>
        <span style={{ fontSize: 13, color: "#b91c1c" }}>
          {isTrial ? "Upgrade now to avoid losing access." : "Renew your plan to avoid interruption."}
        </span>
        <Link href="/subscription" style={{ marginLeft: "auto", background: "#dc2626", color: "#fff", fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 6, textDecoration: "none" }}>
          {isTrial ? "Upgrade Plan" : "Renew Now"}
        </Link>
      </div>
    );
  }

  if (state.warnDays === 7) {
    return (
      <div style={{
        background: "#fff7ed", borderBottom: "1px solid #fed7aa",
        padding: "10px 24px", display: "flex", alignItems: "center", gap: 10,
      }}>
        <AlertCircle size={16} color="#ea580c" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: "#ea580c", fontWeight: 600 }}>
          {isTrial ? `Free trial ends in ${days} days.` : `Subscription renews in ${days} days.`}
        </span>
        <span style={{ fontSize: 13, color: "#c2410c" }}>
          {isTrial ? "Upgrade to a paid plan to continue using FleetFlow." : "Contact us to ensure uninterrupted access."}
        </span>
        <Link href="/subscription" style={{ marginLeft: "auto", fontSize: 12, color: "#ea580c", fontWeight: 700, textDecoration: "underline" }}>
          View Plans
        </Link>
      </div>
    );
  }

  // 14 days
  return (
    <div style={{
      background: "#fefce8", borderBottom: "1px solid #fde68a",
      padding: "10px 24px", display: "flex", alignItems: "center", gap: 10,
    }}>
      <AlertTriangle size={16} color="#ca8a04" style={{ flexShrink: 0 }} />
      <Clock size={14} color="#ca8a04" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: "#a16207", fontWeight: 500 }}>
        {isTrial
          ? `Your 30-day free trial ends in ${days} days.`
          : `Your ${state.planName} subscription renews in ${days} days.`}
      </span>
      <Link href="/subscription" style={{ marginLeft: "auto", fontSize: 12, color: "#ca8a04", fontWeight: 700, textDecoration: "underline" }}>
        {isTrial ? "Upgrade Plan" : "Manage Billing"}
      </Link>
    </div>
  );
}
