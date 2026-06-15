import { NextRequest, NextResponse } from "next/server";
import { getSession, deleteSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = await getSession();
  const role = session?.role;

  await deleteSession();

  // Redirect HTML form submissions to the right login page
  const accept = req.headers.get("accept") ?? "";
  if (accept.includes("text/html")) {
    const dest =
      role === "customer_portal_user" ? "/customer-login" :
      role === "driver"               ? "/driver-login" :
      "/login";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // Fetch-based logout (JS callers) — return JSON so they can navigate
  return NextResponse.json({ ok: true });
}
