import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

type Params = { params: Promise<{ id: string }> };

// GET — return portal account status for this customer
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const customer = await prisma.customer.findFirst({ where: { id, organizationId: session.organizationId } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const account = await prisma.customerPortalAccount.findUnique({ where: { customerId: id } });
  if (!account) return NextResponse.json({ exists: false });

  return NextResponse.json({
    exists: true,
    email: account.email,
    isActive: account.isActive,
    lastLoginAt: account.lastLoginAt,
    createdAt: account.createdAt,
  });
}

// POST — create or reset portal credentials
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const customer = await prisma.customer.findFirst({ where: { id, organizationId: session.organizationId } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { email, password } = await req.json();
  if (!email?.trim() || !password || password.length < 6) {
    return NextResponse.json({ error: "Valid email and password (min 6 chars) required" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Upsert: create if first time, or reset credentials
  const existing = await prisma.customerPortalAccount.findUnique({ where: { customerId: id } });

  if (existing) {
    // Check email uniqueness if changing email
    if (existing.email !== email.toLowerCase().trim()) {
      const conflict = await prisma.customerPortalAccount.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (conflict) return NextResponse.json({ error: "Email already in use by another portal account" }, { status: 409 });
    }
    await prisma.customerPortalAccount.update({
      where: { customerId: id },
      data: { email: email.toLowerCase().trim(), passwordHash, isActive: true },
    });
    return NextResponse.json({ success: true, action: "reset" });
  }

  // New — check email uniqueness globally
  const conflict = await prisma.customerPortalAccount.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (conflict) return NextResponse.json({ error: "Email already in use by another portal account" }, { status: 409 });

  await prisma.customerPortalAccount.create({
    data: {
      organizationId: session.organizationId,
      customerId: id,
      email: email.toLowerCase().trim(),
      passwordHash,
      isActive: true,
    },
  });

  return NextResponse.json({ success: true, action: "created" }, { status: 201 });
}

// PATCH — toggle active/inactive
export async function PATCH(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const account = await prisma.customerPortalAccount.findFirst({
    where: { customerId: id, organizationId: session.organizationId },
  });
  if (!account) return NextResponse.json({ error: "No portal account" }, { status: 404 });

  const updated = await prisma.customerPortalAccount.update({
    where: { id: account.id },
    data: { isActive: !account.isActive },
  });

  return NextResponse.json({ isActive: updated.isActive });
}

// DELETE — remove portal access entirely
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const account = await prisma.customerPortalAccount.findFirst({
    where: { customerId: id, organizationId: session.organizationId },
  });
  if (!account) return NextResponse.json({ error: "No portal account" }, { status: 404 });

  await prisma.customerPortalAccount.delete({ where: { id: account.id } });
  return NextResponse.json({ success: true });
}
