import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, address, lat, lng, notes, isActive, price5000, price10000, price20000 } = body;

  const existing = await prisma.waterSource.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name.trim();
  if (address !== undefined) update.address = address.trim();
  if (lat !== undefined) update.lat = lat !== "" && lat !== null ? Number(lat) : null;
  if (lng !== undefined) update.lng = lng !== "" && lng !== null ? Number(lng) : null;
  if (notes !== undefined) update.notes = notes?.trim() || null;
  if (isActive !== undefined) update.isActive = isActive;
  if (price5000 !== undefined) update.price5000 = price5000 !== "" ? Number(price5000) : 0;
  if (price10000 !== undefined) update.price10000 = price10000 !== "" ? Number(price10000) : 0;
  if (price20000 !== undefined) update.price20000 = price20000 !== "" ? Number(price20000) : 0;

  const source = await prisma.waterSource.update({ where: { id }, data: update });
  return NextResponse.json(source);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.waterSource.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.waterSource.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
