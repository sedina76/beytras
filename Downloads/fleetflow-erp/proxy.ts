import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

const PUBLIC_ROUTES = [
  "/login",
  "/register-company",
  "/driver-login",
  "/customer-login",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/customer-login",
];

const SUPER_ADMIN_ROUTES = ["/admin"];
const DRIVER_ROUTES = ["/driver"];
const PORTAL_ROUTES = ["/portal"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes, static files
  if (
    PUBLIC_ROUTES.some((r) => pathname.startsWith(r)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/"
  ) {
    // Redirect root to login
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const res = NextResponse.next();
    res.headers.set("x-pathname", pathname);
    return res;
  }

  const token = req.cookies.get("ff-session")?.value;
  const session = await decrypt(token);

  // Not authenticated — send to appropriate login
  if (!session) {
    if (pathname.startsWith("/driver")) {
      return NextResponse.redirect(new URL("/driver-login", req.url));
    }
    if (pathname.startsWith("/portal")) {
      return NextResponse.redirect(new URL("/customer-login", req.url));
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Super admin routes
  if (pathname.startsWith("/admin") && session.role !== "super_admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Driver portal routes (/driver, /driver/...) — only drivers can access
  // Note: /drivers/* is the staff management page, not the portal — don't block it here
  if ((pathname === "/driver" || pathname.startsWith("/driver/")) && session.role !== "driver" && session.role !== "super_admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Customer portal — only portal users; staff going to /portal -> redirect to dashboard
  if (pathname.startsWith("/portal") && session.role !== "customer_portal_user") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Customer portal users should NOT access the main app
  if (session.role === "customer_portal_user" && !pathname.startsWith("/portal") && !pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/portal", req.url));
  }

  const res = NextResponse.next();
  res.headers.set("x-pathname", pathname);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
