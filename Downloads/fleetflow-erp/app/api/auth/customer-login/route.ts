import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const account = await prisma.customerPortalAccount.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { customer: { select: { id: true, name: true, organizationId: true } } },
    });

    if (!account || !account.isActive) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, account.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await prisma.customerPortalAccount.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    });

    await createSession({
      userId: account.id,
      organizationId: account.customer.organizationId,
      role: "customer_portal_user",
      name: account.customer.name,
      email: account.email,
    });

    return NextResponse.json({ success: true, customerId: account.customerId });
  } catch (err) {
    console.error("Customer login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
