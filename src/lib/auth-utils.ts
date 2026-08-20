/**
 * InstituteOps — Auth Utilities
 * 
 * Server-side helpers for session retrieval and RBAC guards.
 * Check session and user role at the top of every Server Action (Security rule).
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { type Role, type Permission, permissions, ROLE_DASHBOARD_MAP } from "@/types/auth";

// ─── Session User Type ─────────────────────────────────

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

// ─── Get Current User (returns null if unauthenticated) ─

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    role: session.user.role,
  };
}

// ─── Require Auth (redirects unauthenticated users) ────

export async function requireAuth(
  allowedRoles?: Role[]
): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's correct dashboard if they access wrong portal
    redirect(ROLE_DASHBOARD_MAP[user.role]);
  }

  return user;
}

// ─── Permission Check ──────────────────────────────────

export function checkPermission(role: Role, permission: Permission): boolean {
  return permissions[permission].includes(role);
}

// ─── Get Dashboard Path for Role ───────────────────────

export function getDashboardForRole(role: Role): string {
  return ROLE_DASHBOARD_MAP[role];
}
