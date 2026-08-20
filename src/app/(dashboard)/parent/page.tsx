/**
 * InstituteOps — Parent Dashboard
 * 
 * Landing page for PARENT role.
 * Simplified scorecard view showing linked child's attendance and test performance.
 * Mobile-first design per UX guidelines.
 */

import { requireAuth } from "@/lib/auth-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarCheck,
  TrendingUp,
  AlertTriangle,
  GraduationCap,
} from "lucide-react";

export default async function ParentDashboardPage() {
  const user = await requireAuth(["PARENT"]);

  const statCards = [
    {
      title: "Child's Attendance",
      value: "—",
      description: "This month",
      icon: CalendarCheck,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50",
    },
    {
      title: "Latest Test Score",
      value: "—",
      description: "Most recent result",
      icon: TrendingUp,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/50",
    },
    {
      title: "Batch Rank",
      value: "—",
      description: "Current standing",
      icon: GraduationCap,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900/50",
    },
    {
      title: "Alerts",
      value: "—",
      description: "Requires attention",
      icon: AlertTriangle,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Hello, {user.name.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor your child&apos;s academic progress and attendance.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-1.5 sm:p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Recent Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            <Badge variant="outline">Child scorecard — Phase 4</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
