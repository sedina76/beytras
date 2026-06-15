export type SubStatus = "trial" | "active" | "expired" | "suspended" | "cancelled";

export type SubscriptionState = {
  status: SubStatus;
  planName: string;
  planPrice: number;
  isTrial: boolean;
  isExpired: boolean;
  isSuspended: boolean;
  canAccess: boolean;
  daysRemaining: number | null;
  warnDays: 14 | 7 | 3 | null;
  periodEnd: Date | null;
  trialEnd: Date | null;
};

type SubWithPlan = {
  status: string;
  trialEnd: Date | null;
  currentPeriodEnd: Date;
  plan: { name: string; price: number };
};

type OrgForSub = {
  status: string;
  trialEndsAt: Date | null;
  subscription: SubWithPlan | null;
};

function warnBucket(days: number): 14 | 7 | 3 | null {
  if (days <= 3) return 3;
  if (days <= 7) return 7;
  if (days <= 14) return 14;
  return null;
}

export function computeSubscriptionState(org: OrgForSub): SubscriptionState {
  const now = new Date();
  const sub = org.subscription;

  // Org suspended at the org level (admin action)
  if (org.status === "suspended") {
    return {
      status: "suspended",
      planName: sub?.plan.name ?? "None",
      planPrice: sub?.plan.price ?? 0,
      isTrial: false, isExpired: false, isSuspended: true, canAccess: false,
      daysRemaining: null, warnDays: null,
      periodEnd: sub?.currentPeriodEnd ?? null,
      trialEnd: sub?.trialEnd ?? null,
    };
  }

  // No subscription record — fall back to org-level trial
  if (!sub) {
    const trialEnd = org.trialEndsAt;
    if (trialEnd && trialEnd > now) {
      const days = Math.ceil((trialEnd.getTime() - now.getTime()) / 86_400_000);
      return {
        status: "trial", planName: "Free Trial", planPrice: 0,
        isTrial: true, isExpired: false, isSuspended: false, canAccess: true,
        daysRemaining: days, warnDays: warnBucket(days),
        periodEnd: trialEnd, trialEnd,
      };
    }
    return {
      status: "expired", planName: "None", planPrice: 0,
      isTrial: false, isExpired: true, isSuspended: false, canAccess: false,
      daysRemaining: null, warnDays: null, periodEnd: null, trialEnd: null,
    };
  }

  // Subscription-level suspended
  if (sub.status === "suspended") {
    return {
      status: "suspended", planName: sub.plan.name, planPrice: sub.plan.price,
      isTrial: false, isExpired: false, isSuspended: true, canAccess: false,
      daysRemaining: null, warnDays: null,
      periodEnd: sub.currentPeriodEnd, trialEnd: sub.trialEnd,
    };
  }

  // Cancelled
  if (sub.status === "cancelled") {
    return {
      status: "cancelled", planName: sub.plan.name, planPrice: sub.plan.price,
      isTrial: false, isExpired: true, isSuspended: false, canAccess: false,
      daysRemaining: null, warnDays: null,
      periodEnd: sub.currentPeriodEnd, trialEnd: null,
    };
  }

  // Trial subscription
  if (sub.status === "trial") {
    const end = sub.trialEnd ?? org.trialEndsAt;
    if (end && end > now) {
      const days = Math.ceil((end.getTime() - now.getTime()) / 86_400_000);
      return {
        status: "trial", planName: sub.plan.name, planPrice: sub.plan.price,
        isTrial: true, isExpired: false, isSuspended: false, canAccess: true,
        daysRemaining: days, warnDays: warnBucket(days),
        periodEnd: end, trialEnd: end,
      };
    }
    // Trial ended
    return {
      status: "expired", planName: sub.plan.name, planPrice: sub.plan.price,
      isTrial: true, isExpired: true, isSuspended: false, canAccess: false,
      daysRemaining: null, warnDays: null,
      periodEnd: sub.currentPeriodEnd, trialEnd: sub.trialEnd,
    };
  }

  // Active — check if billing period lapsed
  if (sub.currentPeriodEnd < now) {
    return {
      status: "expired", planName: sub.plan.name, planPrice: sub.plan.price,
      isTrial: false, isExpired: true, isSuspended: false, canAccess: false,
      daysRemaining: null, warnDays: null,
      periodEnd: sub.currentPeriodEnd, trialEnd: null,
    };
  }

  const days = Math.ceil((sub.currentPeriodEnd.getTime() - now.getTime()) / 86_400_000);
  return {
    status: "active", planName: sub.plan.name, planPrice: sub.plan.price,
    isTrial: false, isExpired: false, isSuspended: false, canAccess: true,
    daysRemaining: days, warnDays: warnBucket(days),
    periodEnd: sub.currentPeriodEnd, trialEnd: null,
  };
}
