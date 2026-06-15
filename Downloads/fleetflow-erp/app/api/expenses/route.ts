import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const expenses = await prisma.expense.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { date: "desc" },
    take: 500,
  });
  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { category, description, amount, vendor, date, approvedBy } = await req.json();
  if (!category || !description || !amount || !date) {
    return NextResponse.json({ error: "Category, description, amount and date are required" }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      organizationId: session.organizationId,
      category,
      description,
      amount: parseFloat(amount),
      vendor: vendor || null,
      date: new Date(date),
      approvedBy: approvedBy || null,
    },
  });
  return NextResponse.json(expense, { status: 201 });
}
