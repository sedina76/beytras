import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const session = await requireAuth();
  if (!session.organizationId) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const payments = await prisma.subscriptionPayment.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(payments);
}
