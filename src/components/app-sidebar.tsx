/**
 * InstituteOps — App Sidebar Component
 * 
 * Role-aware sidebar navigation using Shadcn Sidebar primitives.
 * Uses `render` prop (base-ui pattern) instead of `asChild`.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  UserPlus,
  ClipboardList,
  BarChart3,
  CalendarCheck,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import { ROLE_NAV_CONFIG, ROLE_LABELS, ROLE_COLORS } from "@/types/auth";
import type { SessionUser } from "@/lib/auth-utils";

// Icon mapping for dynamic icon rendering
const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserPlus,
  ClipboardList,
  BarChart3,
  CalendarCheck,
  TrendingUp,
  BookOpen,
};

interface AppSidebarProps {
  user: SessionUser;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const navSections = ROLE_NAV_CONFIG[user.role] ?? [];

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight">
              InstituteOps
            </span>
            <span className="text-[10px] text-muted-foreground leading-none">
              Academy Management
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-2">
        {navSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground px-2">
              {section.label}
            </SidebarGroupLabel>
            <SidebarMenu>
              {section.items.map((item) => {
                const IconComponent = iconMap[item.icon] ?? LayoutDashboard;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" &&
                    pathname.startsWith(item.href) &&
                    item.href.split("/").length > 2);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      className="transition-colors duration-150"
                      render={<Link href={item.href} />}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className="ml-auto text-[10px] h-5 px-1.5"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-xs font-bold">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">{user.name}</span>
            <Badge
              variant="outline"
              className={`text-[10px] w-fit px-1.5 py-0 ${ROLE_COLORS[user.role]}`}
            >
              {ROLE_LABELS[user.role]}
            </Badge>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
