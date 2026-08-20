/**
 * InstituteOps — Dashboard Layout (Shared Shell)
 * 
 * Wraps all authenticated dashboard routes with a sidebar + header shell.
 * Sidebar navigation is role-aware based on the current user's role.
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-utils";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar user={user} />
        <div className="flex flex-1 flex-col">
          <DashboardHeader user={user} />
          <main className="flex-1 p-4 md:p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-950/50">
            {children}
          </main>
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </SidebarProvider>
  );
}
