/**
 * InstituteOps — Student Dashboard
 * 
 * Landing page for STUDENT role.
 * Shows latest test performance, attendance %, and score trajectory.
 */

import { requireAuth } from "@/lib/auth-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  CalendarCheck,
  Trophy,
  BookOpen,
} from "lucide-react";

export default async function StudentDashboardPage() {
  const user = await requireAuth(["STUDENT"]);

  const statCards = [
    {
      title: "Latest Score",
      value: "—",
      description: "Most recent test",
      icon: Trophy,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50",
    },
    {
      title: "Batch Rank",
      value: "—",
      description: "Current standing",
      icon: TrendingUp,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/50",
    },
    {
      title: "Attendance",
      value: "—",
      description: "This month",
      icon: CalendarCheck,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/50",
    },
    {
      title: "Study Materials",
      value: "—",
      description: "Available downloads",
      icon: BookOpen,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900/50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Hi, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your offline test performance and attendance.
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Score Trajectory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              <Badge variant="outline">Recharts graph — Phase 4</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Test History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              <Badge variant="outline">Coming in Phase 4</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
