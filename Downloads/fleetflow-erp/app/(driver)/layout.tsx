import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/driver-login");
  if (session.role !== "driver" && session.role !== "super_admin") redirect("/dashboard");
  return <>{children}</>;
}
