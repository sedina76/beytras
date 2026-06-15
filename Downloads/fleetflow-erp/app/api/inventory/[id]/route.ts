import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.inventoryItem.findFirst({ where: { id, organizationId: session.organizationId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.category !== undefined) data.category = body.category;
  if (body.sku !== undefined) data.sku = body.sku?.trim() || null;
  if (body.quantity !== undefined) data.quantity = parseInt(body.quantity);
  if (body.reorderLevel !== undefined) data.reorderLevel = parseInt(body.reorderLevel);
  if (body.unitCost !== undefined) data.unitCost = parseFloat(body.unitCost);
  if (body.supplier !== undefined) data.supplier = body.supplier?.trim() || null;
  if (body.location !== undefined) data.location = body.location?.trim() || null;

  const item = await prisma.inventoryItem.update({ where: { id }, data });
  return NextResponse.json(item);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.inventoryItem.findFirst({ where: { id, organizationId: session.organizationId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.inventoryItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
