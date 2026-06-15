import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const session = await requireAuth();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: {
      organizationId: session.organizationId,
      OR: [{ userId: null }, { userId: session.userId }],
    },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: {
      id: true,
      title: true,
      body: true,
      type: true,
      isRead: true,
      createdAt: true,
    },
  });

  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const session = await requireAuth();
  if (!session?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.all) {
    await prisma.notification.updateMany({
      where: {
        organizationId: session.organizationId,
        isRead: false,
        OR: [{ userId: null }, { userId: session.userId }],
      },
      data: { isRead: true },
    });
  } else if (body.id) {
    await prisma.notification.update({ where: { id: body.id }, data: { isRead: true } });
  }

  return NextResponse.json({ ok: true });
}
