import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sources = await prisma.waterSource.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(sources);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, address, lat, lng, notes, isActive, price5000, price10000, price20000 } = body;

  if (!name?.trim() || !address?.trim()) {
    return NextResponse.json({ error: "Name and address are required" }, { status: 400 });
  }

  const source = await prisma.waterSource.create({
    data: {
      organizationId: session.organizationId,
      name: name.trim(),
      address: address.trim(),
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
      price5000: price5000 ? Number(price5000) : 0,
      price10000: price10000 ? Number(price10000) : 0,
      price20000: price20000 ? Number(price20000) : 0,
      notes: notes?.trim() || null,
      isActive: isActive !== false,
    },
  });
  return NextResponse.json(source, { status: 201 });
}
