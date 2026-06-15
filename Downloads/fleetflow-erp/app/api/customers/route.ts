import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") ?? 100)));

  const where = {
    organizationId: session.organizationId,
    ...(search ? { name: { contains: search } } : {}),
    ...(status ? { status } : {}),
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      take: limit,
      skip: (page - 1) * limit,
      include: { _count: { select: { orders: true, invoices: true } } },
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json(customers, {
    headers: { "X-Total-Count": String(total) },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, email, phone, address, city, type, creditLimit, notes } = body;

  if (!name || !phone || !address) {
    return NextResponse.json({ error: "Name, phone, and address required" }, { status: 400 });
  }

  const customer = await prisma.customer.create({
    data: {
      organizationId: session.organizationId,
      name, email: email || null, phone, address,
      city: city || "Nairobi",
      type: type || "business",
      creditLimit: parseFloat(creditLimit) || 0,
      notes: notes || null,
    },
  });

  return NextResponse.json(customer, { status: 201 });
}
