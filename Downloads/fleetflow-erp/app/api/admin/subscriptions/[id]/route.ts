import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// [id] is the organizationId
export async function GET(_req: NextRequest, { params }: Params) {
  await requireSuperAdmin();
  const { id: orgId } = await params;

  const sub = await prisma.subscription.findUnique({
    where: { organizationId: orgId },
    include: {
      plan: true,
      payments: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  return NextResponse.json(sub);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  await requireSuperAdmin();
  const { id: orgId } = await params;
  const body = await req.json();
  const { action } = body;

  const sub = await prisma.subscription.findUnique({ where: { organizationId: orgId }, include: { plan: true } });
  if (!sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });

  if (action === "activate") {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);
    await prisma.$transaction([
      prisma.subscription.update({
        where: { organizationId: orgId },
        data: {
          status: "active",
          suspendedAt: null,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      }),
      prisma.organization.update({ where: { id: orgId }, data: { status: "active" } }),
    ]);
    return NextResponse.json({ ok: true, action: "activated" });
  }

  if (action === "suspend") {
    await prisma.$transaction([
      prisma.subscription.update({
        where: { organizationId: orgId },
        data: { status: "suspended", suspendedAt: new Date() },
      }),
      prisma.organization.update({ where: { id: orgId }, data: { status: "suspended" } }),
    ]);
    return NextResponse.json({ ok: true, action: "suspended" });
  }

  if (action === "cancel") {
    await prisma.subscription.update({
      where: { organizationId: orgId },
      data: { status: "cancelled", cancelledAt: new Date() },
    });
    return NextResponse.json({ ok: true, action: "cancelled" });
  }

  if (action === "change_plan") {
    const { planId, planName } = body;
    if (!planId && !planName) return NextResponse.json({ error: "planId or planName required" }, { status: 400 });
    const plan = planId
      ? await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
      : await prisma.subscriptionPlan.findFirst({ where: { name: planName, isActive: true } });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    await prisma.subscription.update({ where: { organizationId: orgId }, data: { planId: plan.id } });
    return NextResponse.json({ ok: true, action: "plan_changed", planName: plan.name });
  }

  if (action === "extend_trial") {
    const days = Number(body.days) || 30;
    const trialEnd = new Date(Date.now() + days * 86_400_000);
    await prisma.$transaction([
      prisma.subscription.update({
        where: { organizationId: orgId },
        data: { status: "trial", trialEnd, suspendedAt: null, cancelledAt: null },
      }),
      prisma.organization.update({
        where: { id: orgId },
        data: { status: "trial", trialEndsAt: trialEnd },
      }),
    ]);
    return NextResponse.json({ ok: true, action: "trial_extended", trialEnd });
  }

  if (action === "record_payment") {
    const { amount, method, reference, notes, months, planId } = body;
    if (!amount || !method) return NextResponse.json({ error: "amount and method required" }, { status: 400 });

    const now = new Date();
    const targetPlanId = planId ?? sub.planId;
    const targetPlan = planId
      ? (await prisma.subscriptionPlan.findUnique({ where: { id: planId } }) ?? await prisma.subscriptionPlan.findFirst({ where: { name: planId, isActive: true } }))
      : sub.plan;
    if (!targetPlan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    // Extend subscription period
    const periodStart = now;
    const m = Number(months) || 1;
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + m * 30);

    // Generate invoice number
    const count = await prisma.subscriptionPayment.count({ where: { organizationId: orgId } });
    const invoiceNumber = `FFSP-${now.getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const [payment] = await prisma.$transaction([
      prisma.subscriptionPayment.create({
        data: {
          organizationId: orgId,
          subscriptionId: sub.id,
          invoiceNumber,
          amount: Number(amount),
          currency: "KES",
          plan: targetPlan.name,
          method,
          status: "paid",
          reference: reference || null,
          notes: notes || null,
          paidAt: now,
        },
      }),
      prisma.subscription.update({
        where: { organizationId: orgId },
        data: {
          status: "active",
          planId: targetPlanId,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          suspendedAt: null,
          cancelledAt: null,
        },
      }),
      prisma.organization.update({ where: { id: orgId }, data: { status: "active" } }),
    ]);

    return NextResponse.json({ ok: true, action: "payment_recorded", invoiceNumber, payment });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
