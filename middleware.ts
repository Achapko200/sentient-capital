import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/admin",
];

// Routes that should redirect to app if already authenticated
const AUTH_ROUTES = [
  "/login",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect admin route — check for admin cookie or just restrict to known wallets
  if (PROTECTED_ROUTES.some(r => pathname.startsWith(r))) {
    const adminKey = req.cookies.get("admin_key")?.value;
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};