import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { ensurePlans, getPlanByName } from "@/lib/plans";

export async function POST(req: NextRequest) {
  try {
    const { companyName, email, password, phone, city } = await req.json();
    if (!companyName || !email || !password) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    await ensurePlans();
    const basicPlan = await getPlanByName("Basic");

    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 30) + "-" + Date.now().toString(36);

    const trialEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const org = await prisma.organization.create({
      data: {
        name: companyName,
        slug,
        email: email.toLowerCase(),
        phone: phone ?? null,
        city: city ?? "Nairobi",
        status: "trial",
        trialEndsAt: trialEnd,
      },
    });

    if (basicPlan) {
      await prisma.subscription.create({
        data: {
          organizationId: org.id,
          planId: basicPlan.id,
          status: "trial",
          trialEnd,
          currentPeriodStart: new Date(),
          currentPeriodEnd: trialEnd,
        },
      });
    }

    await prisma.companySettings.create({ data: { organizationId: org.id } });

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        organizationId: org.id,
        email: email.toLowerCase(),
        passwordHash,
        name: companyName + " Admin",
        role: "company_admin",
      },
    });

    await createSession({
      userId: user.id,
      organizationId: org.id,
      role: user.role,
      name: user.name,
      email: user.email ?? "",
    });

    return NextResponse.json({ ok: true, organizationId: org.id });
  } catch (err) {
    console.error("[POST /api/auth/register]", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
