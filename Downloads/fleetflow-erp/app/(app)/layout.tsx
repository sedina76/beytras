import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import { prisma } from "@/lib/db";
import { computeSubscriptionState } from "@/lib/subscription";
import SubscriptionBanner from "@/components/SubscriptionBanner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "driver") redirect("/driver");

  const heads = await headers();
  const pathname = heads.get("x-pathname") ?? "/";
  const onSubscriptionPage = pathname.startsWith("/subscription");

  let subState = null;
  if (session.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: session.organizationId },
      select: {
        status: true,
        trialEndsAt: true,
        subscription: {
          select: {
            status: true,
            trialEnd: true,
            currentPeriodEnd: true,
            plan: { select: { name: true, price: true } },
          },
        },
      },
    });

    if (org) {
      subState = computeSubscriptionState(org);
      if (!subState.canAccess && !onSubscriptionPage) {
        redirect("/subscription");
      }
    }
  }

  return (
    <div className="app-layout">
      <AppSidebar session={session} />
      <div className="app-main">
        <AppHeader session={session} />
        {subState && <SubscriptionBanner state={subState} />}
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
