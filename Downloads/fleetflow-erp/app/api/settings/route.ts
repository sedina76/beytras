import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const allowed = ["emailEnabled", "smsEnabled", "whatsappEnabled", "currency", "timezone", "vatNumber", "invoicePrefix", "orderPrefix", "smsSender", "emailFrom"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const settings = await prisma.companySettings.upsert({
    where: { organizationId: session.organizationId },
    create: { organizationId: session.organizationId, ...data },
    update: data,
  });
  return NextResponse.json(settings);
}
