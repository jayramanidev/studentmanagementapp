/**
 * InstituteOps — Auth Types, RBAC Permissions & Action Response
 * 
 * Core type definitions for role-based access control.
 * NO ONLINE TEST RUNNER — this system manages offline test scheduling,
 * mark entry, rank calculation, attendance, and dashboards only.
 */

// ─── Roles ──────────────────────────────────────────────

export type Role = "ADMIN" | "COORDINATOR" | "TEACHER" | "STUDENT" | "PARENT";

export const ROLES: readonly Role[] = [
  "ADMIN",
  "COORDINATOR",
  "TEACHER",
  "STUDENT",
  "PARENT",
] as const;

// ─── RBAC Permissions (from Architecture.md) ────────────

export type Permission =
  | "CAN_CREATE_TEST"
  | "CAN_ENTER_MARKS"
  | "CAN_PUBLISH_TEST"
  | "CAN_VIEW_ALL_STUDENT_MARKS"
  | "CAN_VIEW_OWN_MARKS"
  | "CAN_MARK_ATTENDANCE"
  | "CAN_MANAGE_BATCHES"
  | "CAN_MANAGE_USERS";

export const permissions: Record<Permission, readonly Role[]> = {
  CAN_CREATE_TEST: ["ADMIN", "COORDINATOR", "TEACHER"],
  CAN_ENTER_MARKS: ["ADMIN", "COORDINATOR", "TEACHER"],
  CAN_PUBLISH_TEST: ["ADMIN", "COORDINATOR"],
  CAN_VIEW_ALL_STUDENT_MARKS: ["ADMIN", "COORDINATOR", "TEACHER"],
  CAN_VIEW_OWN_MARKS: ["STUDENT", "PARENT"],
  CAN_MARK_ATTENDANCE: ["ADMIN", "COORDINATOR", "TEACHER"],
  CAN_MANAGE_BATCHES: ["ADMIN", "COORDINATOR"],
  CAN_MANAGE_USERS: ["ADMIN"],
} as const;

export function hasPermission(role: Role, permission: Permission): boolean {
  return permissions[permission].includes(role);
}

// ─── Role → Dashboard Route Mapping ────────────────────

export const ROLE_DASHBOARD_MAP: Record<Role, string> = {
  ADMIN: "/admin",
  COORDINATOR: "/admin",
  TEACHER: "/faculty",
  STUDENT: "/student",
  PARENT: "/parent",
} as const;

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  COORDINATOR: "Exam Coordinator",
  TEACHER: "Faculty",
  STUDENT: "Student",
  PARENT: "Parent / Guardian",
} as const;

export const ROLE_COLORS: Record<Role, string> = {
  ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  COORDINATOR: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  TEACHER: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  STUDENT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  PARENT: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
} as const;

// ─── Server Action Response Pattern (from rules.md) ────

export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── Sidebar Navigation Definition ─────────────────────

export interface NavItem {
  title: string;
  href: string;
  icon: string; // Lucide icon name
  badge?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const ROLE_NAV_CONFIG: Record<string, NavSection[]> = {
  ADMIN: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
      ],
    },
    {
      label: "Management",
      items: [
        { title: "Batches", href: "/admin/batches", icon: "Users" },
        { title: "Teachers", href: "/admin/teachers", icon: "GraduationCap" },
        { title: "Students", href: "/admin/students", icon: "UserPlus" },
      ],
    },
    {
      label: "Academics",
      items: [
        { title: "Tests", href: "/admin/tests", icon: "ClipboardList" },
        { title: "Reports", href: "/admin/reports", icon: "BarChart3" },
      ],
    },
  ],
  COORDINATOR: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
      ],
    },
    {
      label: "Management",
      items: [
        { title: "Batches", href: "/admin/batches", icon: "Users" },
        { title: "Teachers", href: "/admin/teachers", icon: "GraduationCap" },
      ],
    },
    {
      label: "Academics",
      items: [
        { title: "Tests", href: "/admin/tests", icon: "ClipboardList" },
        { title: "Reports", href: "/admin/reports", icon: "BarChart3" },
      ],
    },
  ],
  TEACHER: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", href: "/faculty", icon: "LayoutDashboard" },
      ],
    },
    {
      label: "Academics",
      items: [
        { title: "Attendance", href: "/faculty/attendance", icon: "CalendarCheck" },
        { title: "Tests", href: "/faculty/tests", icon: "ClipboardList" },
      ],
    },
  ],
  STUDENT: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", href: "/student", icon: "LayoutDashboard" },
      ],
    },
    {
      label: "Academics",
      items: [
        { title: "Performance", href: "/student/performance", icon: "TrendingUp" },
        { title: "Attendance", href: "/student/attendance", icon: "CalendarCheck" },
        { title: "Materials", href: "/student/materials", icon: "BookOpen" },
      ],
    },
  ],
  PARENT: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", href: "/parent", icon: "LayoutDashboard" },
      ],
    },
    {
      label: "Child Progress",
      items: [
        { title: "Performance", href: "/parent/dashboard", icon: "TrendingUp" },
      ],
    },
  ],
} as const;
