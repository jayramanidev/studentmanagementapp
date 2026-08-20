/**
 * InstituteOps — Edge Middleware for Route-Level RBAC
 * 
 * Inspects JWT token, checks user role, and enforces route boundaries:
 *  - ADMIN / COORDINATOR → /admin
 *  - TEACHER → /faculty
 *  - STUDENT → /student
 *  - PARENT → /parent
 * 
 * Unauthenticated users are redirected to /login.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Routes that require authentication
const protectedPrefixes = ["/admin", "/faculty", "/student", "/parent"];

// Role → allowed route prefix mapping
const roleRouteMap: Record<string, string[]> = {
  ADMIN: ["/admin"],
  COORDINATOR: ["/admin"],
  TEACHER: ["/faculty"],
  STUDENT: ["/student"],
  PARENT: ["/parent"],
};

// Role → default dashboard
const roleDashboard: Record<string, string> = {
  ADMIN: "/admin",
  COORDINATOR: "/admin",
  TEACHER: "/faculty",
  STUDENT: "/student",
  PARENT: "/parent",
};

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Check if this is a protected route
  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  const session = req.auth;
  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = session.user.role as string;
  const allowedPrefixes = roleRouteMap[userRole] ?? [];

  // Check if user has access to this route prefix
  const hasAccess = allowedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!hasAccess) {
    // Redirect to user's correct dashboard
    const dashboard = roleDashboard[userRole] ?? "/login";
    return NextResponse.redirect(new URL(dashboard, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static files and api
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
