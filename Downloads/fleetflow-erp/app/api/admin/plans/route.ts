import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ensurePlans } from "@/lib/plans";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "super_admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensurePlans();
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });

  return NextResponse.json(plans);
}
