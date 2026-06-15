import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requireRole("company_admin");
  const { id } = await params;
  const body = await req.json();

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || target.organizationId !== session.organizationId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.email !== undefined) data.email = String(body.email).trim();
  if (body.phone !== undefined) data.phone = String(body.phone).trim();
  if (body.role !== undefined) data.role = body.role;
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
  if (body.monthlySalary !== undefined) data.monthlySalary = body.monthlySalary !== null ? (Number(body.monthlySalary) || null) : null;

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, monthlySalary: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await requireRole("company_admin");
  const { id } = await params;
  const { reason } = await req.json();

  if (!reason?.trim() || reason.trim().length < 5) {
    return NextResponse.json({ error: "A reason of at least 5 characters is required" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || target.organizationId !== session.organizationId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (target.id === session.userId) {
    return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { isActive: false } }),
    prisma.auditLog.create({
      data: {
        organizationId: session.organizationId!,
        userId: session.userId,
        action: "deleted",
        entityType: "user",
        metadata: JSON.stringify({
          reason: reason.trim(),
          targetUserId: target.id,
          targetUserName: target.name,
          targetUserEmail: target.email,
          targetUserRole: target.role,
        }),
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
