/**
 * InstituteOps — Faculty Dashboard
 * 
 * Landing page for TEACHER role.
 * Shows assigned classes, today's attendance status, and upcoming tests.
 */

import { requireAuth } from "@/lib/auth-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarCheck,
  ClipboardList,
  Users,
  BookOpen,
} from "lucide-react";

export default async function FacultyDashboardPage() {
  const user = await requireAuth(["TEACHER"]);

  const statCards = [
    {
      title: "My Batches",
      value: "—",
      description: "Assigned classes",
      icon: Users,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/50",
    },
    {
      title: "Today's Attendance",
      value: "—",
      description: "Pending / Completed",
      icon: CalendarCheck,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50",
    },
    {
      title: "Upcoming Tests",
      value: "—",
      description: "Scheduled this week",
      icon: ClipboardList,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900/50",
    },
    {
      title: "Study Materials",
      value: "—",
      description: "Uploaded resources",
      icon: BookOpen,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Good day, {user.name.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage attendance and offline test scores for your classes.
        </p>
      </div>

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

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              <Badge variant="outline">Mark entry & attendance — Phase 3</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Score Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              <Badge variant="outline">Coming in Phase 3</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
