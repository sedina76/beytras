import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole("company_admin");

    const { name, email, password, role, phone, monthlySalary, avatarUrl } = await req.json();

    if (!name?.trim() || !role) {
      return NextResponse.json({ error: "Name and role are required" }, { status: 400 });
    }

    const ALLOWED_ROLES = ["company_admin", "dispatcher", "accountant", "mechanic", "customer_support", "driver", "conductor"];
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const isConductor = role === "conductor";

    // Conductors are payroll-only — they do not log in
    if (!isConductor) {
      if (!password) return NextResponse.json({ error: "Password is required" }, { status: 400 });
      if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const normalizedEmail = email?.trim() ? email.toLowerCase().trim() : undefined;
    if (normalizedEmail) {
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Conductors get an unusable hash — login will always fail
    const rawPass = isConductor
      ? `NO_LOGIN_${Date.now()}_${Math.random().toString(36)}_${Math.random().toString(36)}`
      : password;
    const passwordHash = await bcrypt.hash(rawPass, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        ...(normalizedEmail ? { email: normalizedEmail } : {}),
        passwordHash,
        role,
        phone: phone?.trim() || null,
        monthlySalary: monthlySalary ? Number(monthlySalary) : null,
        organizationId: session.organizationId!,
        isActive: true,
        avatarUrl: avatarUrl || null,
      },
      select: { id: true, name: true, email: true, role: true, phone: true, monthlySalary: true, avatarUrl: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create employee";
    console.error("[POST /api/users]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
