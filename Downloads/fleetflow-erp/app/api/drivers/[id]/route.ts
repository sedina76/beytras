import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requireRole("company_admin");
  const { id } = await params;
  const body = await req.json();

  const target = await prisma.driver.findUnique({ where: { id } });
  if (!target || target.organizationId !== session.organizationId) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.phone !== undefined) data.phone = String(body.phone).trim();
  if (body.email !== undefined) data.email = String(body.email).trim() || null;
  if (body.licenseNumber !== undefined) data.licenseNumber = String(body.licenseNumber).trim();
  if (body.licenseExpiry !== undefined) data.licenseExpiry = body.licenseExpiry ? new Date(body.licenseExpiry) : null;
  if (body.status !== undefined) data.status = body.status;

  const updated = await prisma.driver.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await requireRole("company_admin");
  const { id } = await params;

  const target = await prisma.driver.findUnique({ where: { id } });
  if (!target || target.organizationId !== session.organizationId) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  // Unlink user account if present, then delete driver record
  if (target.userId) {
    await prisma.user.update({ where: { id: target.userId }, data: { isActive: false } });
  }
  await prisma.driver.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
