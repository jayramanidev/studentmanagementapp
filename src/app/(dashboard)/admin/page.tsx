/**
 * InstituteOps — Admin Dashboard
 * 
 * Landing page for ADMIN and COORDINATOR roles.
 * Shows overview stats and quick actions.
 */

import { requireAuth } from "@/lib/auth-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  GraduationCap,
  ClipboardList,
  CalendarCheck,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const user = await requireAuth(["ADMIN", "COORDINATOR"]);

  const statCards = [
    {
      title: "Total Students",
      value: "—",
      description: "Across all batches",
      icon: Users,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/50",
    },
    {
      title: "Active Batches",
      value: "—",
      description: "Currently running",
      icon: GraduationCap,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900/50",
    },
    {
      title: "Tests This Month",
      value: "—",
      description: "Offline tests conducted",
      icon: ClipboardList,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50",
    },
    {
      title: "Avg Attendance",
      value: "—",
      description: "Institute-wide",
      icon: CalendarCheck,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user.name.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your institute&apos;s operations.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder sections */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              <Badge variant="outline">Coming in Phase 3</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Attendance Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              <Badge variant="outline">Coming in Phase 5</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
