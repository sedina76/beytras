import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { computeSubscriptionState } from "@/lib/subscription";

export async function GET() {
  const session = await requireAuth();
  if (!session.organizationId) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: {
      status: true, trialEndsAt: true,
      subscription: {
        select: {
          id: true, status: true, trialEnd: true,
          currentPeriodStart: true, currentPeriodEnd: true,
          plan: { select: { id: true, name: true, price: true, currency: true, maxVehicles: true, maxUsers: true } },
        },
      },
    },
  });

  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  return NextResponse.json({ subscription: org.subscription, state: computeSubscriptionState(org) });
}
