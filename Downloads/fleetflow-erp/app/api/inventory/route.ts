import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.inventoryItem.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, category, sku, quantity, reorderLevel, unitCost, supplier, location } = body;

  if (!name?.trim() || !category) {
    return NextResponse.json({ error: "Name and category are required" }, { status: 400 });
  }

  const item = await prisma.inventoryItem.create({
    data: {
      organizationId: session.organizationId,
      name: name.trim(),
      category,
      sku: sku?.trim() || null,
      quantity: parseInt(quantity) || 0,
      reorderLevel: parseInt(reorderLevel) || 5,
      unitCost: parseFloat(unitCost) || 0,
      supplier: supplier?.trim() || null,
      location: location?.trim() || null,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
