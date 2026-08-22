/**
 * InstituteOps — Auth & RBAC Type Definitions
 * 
 * Defines user roles, session payloads, navigation structures,
 * and permission-checking utilities for the entire application.
 */

export type UserRole = "ADMIN" | "COORDINATOR" | "TEACHER" | "STUDENT" | "PARENT";
export const UserRole = {
  ADMIN: "ADMIN",
  COORDINATOR: "COORDINATOR",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  PARENT: "PARENT",
} as const;

// Type alias for cleaner usage across the codebase
export type Role = UserRole;

// ─── Extended Session & User Types ───────────────────────

export interface SessionUser {
  id: string;
  email: string | null;
  name: string;
  role: Role;
  phone?: string | null;
  isActive: boolean;
}

export interface AuthenticatedSession {
  user: SessionUser;
  expires: string;
}

// ─── Role Hierarchy & Access Levels ──────────────────────

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

// ─── Permission Definitions ─────────────────────────────

export type Permission =
  | "manage:batches"
  | "manage:teachers"
  | "manage:students"
  | "manage:tests"
  | "enter:marks"
  | "publish:marks"
  | "view:reports"
  | "view:all_students"
  | "view:child_data"
  | "view:own_data";

export const permissions: Record<Permission, Role[]> = {
  "manage:batches": ["ADMIN", "COORDINATOR"],
  "manage:teachers": ["ADMIN"],
  "manage:students": ["ADMIN", "COORDINATOR"],
  "manage:tests": ["ADMIN", "COORDINATOR", "TEACHER"],
  "enter:marks": ["ADMIN", "COORDINATOR", "TEACHER"],
  "publish:marks": ["ADMIN", "COORDINATOR"],
  "view:reports": ["ADMIN", "COORDINATOR", "TEACHER"],
  "view:all_students": ["ADMIN", "COORDINATOR", "TEACHER"],
  "view:child_data": ["PARENT"],
  "view:own_data": ["STUDENT"],
};

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
        { title: "AI Analytics", href: "/admin/analytics", icon: "BrainCircuit" },
        { title: "Notice Board", href: "/admin/notices", icon: "Megaphone" },
        { title: "SMS & WhatsApp", href: "/admin/alerts", icon: "MessageSquare" },
      ],
    },
    {
      label: "Management",
      items: [
        { title: "Branches", href: "/admin/branches", icon: "Building2" },
        { title: "Batches", href: "/admin/batches", icon: "Users" },
        { title: "Teachers", href: "/admin/teachers", icon: "GraduationCap" },
        { title: "Students", href: "/admin/students", icon: "UserPlus" },
        { title: "Fee Ledger", href: "/admin/fees", icon: "Receipt" },
      ],
    },
    {
      label: "Academics & Physical",
      items: [
        { title: "Attendance", href: "/admin/attendance", icon: "CalendarCheck" },
        { title: "Offline Tests", href: "/admin/tests", icon: "ClipboardList" },
        { title: "Ground Fitness", href: "/admin/physical", icon: "Activity" },
        { title: "Syllabus Tracker", href: "/admin/syllabus", icon: "ListChecks" },
        { title: "Study Materials", href: "/admin/materials", icon: "BookOpen" },
      ],
    },
  ],
  COORDINATOR: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
        { title: "AI Analytics", href: "/admin/analytics", icon: "BrainCircuit" },
        { title: "Notice Board", href: "/admin/notices", icon: "Megaphone" },
        { title: "SMS & WhatsApp", href: "/admin/alerts", icon: "MessageSquare" },
      ],
    },
    {
      label: "Management",
      items: [
        { title: "Batches", href: "/admin/batches", icon: "Users" },
        { title: "Teachers", href: "/admin/teachers", icon: "GraduationCap" },
        { title: "Fee Ledger", href: "/admin/fees", icon: "Receipt" },
      ],
    },
    {
      label: "Academics & Physical",
      items: [
        { title: "Attendance", href: "/admin/attendance", icon: "CalendarCheck" },
        { title: "Offline Tests", href: "/admin/tests", icon: "ClipboardList" },
        { title: "Ground Fitness", href: "/admin/physical", icon: "Activity" },
        { title: "Syllabus Tracker", href: "/admin/syllabus", icon: "ListChecks" },
        { title: "Study Materials", href: "/admin/materials", icon: "BookOpen" },
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
      label: "Academics & Ground",
      items: [
        { title: "Attendance Register", href: "/faculty/attendance", icon: "CalendarCheck" },
        { title: "Tests & Marks", href: "/faculty/tests", icon: "ClipboardList" },
        { title: "Ground Fitness", href: "/faculty/physical", icon: "Activity" },
        { title: "Syllabus Tracker", href: "/faculty/syllabus", icon: "ListChecks" },
        { title: "Study Materials", href: "/faculty/materials", icon: "BookOpen" },
      ],
    },
  ],
  STUDENT: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", href: "/student", icon: "LayoutDashboard" },
        { title: "AI Exam Readiness", href: "/student/readiness", icon: "BrainCircuit" },
        { title: "Notice Board", href: "/student/notices", icon: "Megaphone" },
      ],
    },
    {
      label: "Academics & Fitness",
      items: [
        { title: "My Performance", href: "/student/performance", icon: "TrendingUp" },
        { title: "Ground Fitness", href: "/student/physical", icon: "Activity" },
        { title: "Syllabus Tracker", href: "/student/syllabus", icon: "ListChecks" },
        { title: "Study Materials", href: "/student/materials", icon: "BookOpen" },
        { title: "Fee Receipts", href: "/student/fees", icon: "Receipt" },
      ],
    },
  ],
  PARENT: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", href: "/parent", icon: "LayoutDashboard" },
        { title: "SMS & Alerts", href: "/parent/alerts", icon: "MessageSquare" },
        { title: "Notice Board", href: "/parent/notices", icon: "Megaphone" },
      ],
    },
    {
      label: "Child Progress",
      items: [
        { title: "Performance", href: "/parent/dashboard", icon: "TrendingUp" },
        { title: "Tuition Fees", href: "/parent/fees", icon: "Receipt" },
      ],
    },
  ],
} as const;
