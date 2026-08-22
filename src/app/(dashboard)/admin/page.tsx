import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Layers,
  GraduationCap,
  BookOpen,
  ClipboardList,
  CalendarCheck,
  Plus,
  ArrowRight,
  FileSpreadsheet,
  BrainCircuit,
  MessageSquare,
  Activity,
  ListChecks,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { UserRole } from "@prisma/client";

export default async function AdminDashboardPage() {
  const user = await requireAuth(["ADMIN", "COORDINATOR"]);

  // Fetch real-time operational metrics with graceful error handling
  let studentCount = 0;
  let batchCount = 0;
  let teacherCount = 0;
  let subjectCount = 0;
  let alertCount = 0;
  let fitnessQualifiedPct = 0;
  let syllabusCompletionPct = 0;
  let recentBatches: Array<{
    id: string;
    name: string;
    targetExam: string;
    _count: { studentProfiles: number; subjects: number };
  }> = [];
  let recentActivity: Array<{
    type: string;
    title: string;
    description: string;
    time: Date;
    icon: string;
    color: string;
  }> = [];

  try {
    const [students, batches, teachers, subjects, recent, alerts, fitnessTotal, fitnessPassed, syllabusTotal, syllabusCompleted] = await Promise.all([
      db.user.count({ where: { role: UserRole.STUDENT } }),
      db.batch.count(),
      db.user.count({
        where: { role: { in: [UserRole.TEACHER, UserRole.COORDINATOR] } },
      }),
      db.subject.count(),
      db.batch.findMany({
        take: 4,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { studentProfiles: true, subjects: true },
          },
        },
      }),
      // Alerts count
      db.alertNotification.count(),
      // Physical Fitness stats
      db.physicalFitnessRecord.count(),
      db.physicalFitnessRecord.count({ where: { isQualified: true } }),
      // Syllabus stats
      db.syllabusTopic.count(),
      db.topicProgress.count({ where: { status: "COMPLETED" } }),
    ]);

    studentCount = students;
    batchCount = batches;
    teacherCount = teachers;
    subjectCount = subjects;
    recentBatches = recent;
    alertCount = alerts;
    fitnessQualifiedPct = fitnessTotal > 0 ? Math.round((fitnessPassed / fitnessTotal) * 100) : 0;
    syllabusCompletionPct = syllabusTotal > 0 ? Math.round((syllabusCompleted / syllabusTotal) * 100) : 0;

    // Build recent activity feed
    const [recentTests, recentAttendance, recentAlerts] = await Promise.all([
      db.offlineTest.findMany({
        take: 3,
        where: { isPublished: true },
        orderBy: { testDate: "desc" },
        select: { title: true, testDate: true, subject: { select: { name: true } } },
      }),
      db.attendance.findMany({
        take: 2,
        orderBy: { date: "desc" },
        distinct: ["date"],
        select: { date: true },
      }),
      db.alertNotification.findMany({
        take: 2,
        orderBy: { createdAt: "desc" },
        select: { alertType: true, createdAt: true, channel: true },
      }),
    ]);

    for (const t of recentTests) {
      recentActivity.push({
        type: "test",
        title: "Marks Published",
        description: `${t.title} (${t.subject?.name ?? "General"})`,
        time: t.testDate,
        icon: "ClipboardList",
        color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/50",
      });
    }

    for (const a of recentAttendance) {
      recentActivity.push({
        type: "attendance",
        title: "Attendance Recorded",
        description: `Daily attendance logged for ${new Date(a.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`,
        time: a.date,
        icon: "CalendarCheck",
        color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50",
      });
    }

    for (const al of recentAlerts) {
      recentActivity.push({
        type: "alert",
        title: `${al.channel} Alert Sent`,
        description: `${al.alertType.replace("_", " ")} notification dispatched`,
        time: al.createdAt,
        icon: "MessageSquare",
        color: "text-purple-600 bg-purple-100 dark:bg-purple-900/50",
      });
    }

    recentActivity.sort((a, b) => b.time.getTime() - a.time.getTime());
    recentActivity = recentActivity.slice(0, 5);
  } catch (error) {
    console.error("[AdminDashboard Metrics Error]:", error);
  }

  const statCards = [
    {
      title: "Total Students",
      value: studentCount.toString(),
      description: "Enrolled in active batches",
      icon: Users,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/50",
      href: "/admin/students",
    },
    {
      title: "Active Batches",
      value: batchCount.toString(),
      description: "Exam cohorts running",
      icon: Layers,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900/50",
      href: "/admin/batches",
    },
    {
      title: "Faculty Staff",
      value: teacherCount.toString(),
      description: "Teachers & Coordinators",
      icon: GraduationCap,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50",
      href: "/admin/teachers",
    },
    {
      title: "Active Subjects",
      value: subjectCount.toString(),
      description: "Across all active batches",
      icon: BookOpen,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/50",
      href: "/admin/batches",
    },
  ];

  const operationalKPIs = [
    {
      title: "Alerts Dispatched",
      value: alertCount.toString(),
      description: "WhatsApp & SMS sent",
      icon: MessageSquare,
      color: "text-violet-600 bg-violet-100 dark:bg-violet-900/50",
      href: "/admin/alerts",
    },
    {
      title: "Ground Fitness Qualified",
      value: `${fitnessQualifiedPct}%`,
      description: "Students passing physical",
      icon: Activity,
      color: "text-rose-600 bg-rose-100 dark:bg-rose-900/50",
      href: "/admin/physical",
    },
    {
      title: "Syllabus Covered",
      value: `${syllabusCompletionPct}%`,
      description: "Topics marked completed",
      icon: ListChecks,
      color: "text-teal-600 bg-teal-100 dark:bg-teal-900/50",
      href: "/admin/syllabus",
    },
  ];

  const activityIconMap: Record<string, React.ElementType> = {
    ClipboardList,
    CalendarCheck,
    MessageSquare,
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Quick CTA Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white shadow-md">
        <div className="space-y-1">
          <Badge className="bg-white/10 hover:bg-white/20 text-indigo-100 text-[11px] mb-1">
            InstituteOps Management Portal
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="text-indigo-200 text-sm max-w-xl">
            Offline test scheduling, rapid mark entry, batch management, and parent-student performance tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link href="/admin/students">
            <Button
              size="sm"
              className="bg-white text-indigo-900 hover:bg-indigo-50 font-semibold shadow-xs gap-1.5 text-xs"
            >
              <Users className="h-4 w-4" /> Manage Students
            </Button>
          </Link>
          <Link href="/admin/batches">
            <Button
              size="sm"
              variant="outline"
              className="bg-transparent border-white/30 text-white hover:bg-white/10 text-xs gap-1.5"
            >
              <Plus className="h-4 w-4" /> New Batch
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href} className="group">
            <Card className="shadow-xs transition group-hover:border-indigo-500/50 group-hover:shadow-md cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.color} transition group-hover:scale-105`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                  <span>{stat.description}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition -translate-x-1 group-hover:translate-x-0" />
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Operational KPI Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {operationalKPIs.map((kpi) => (
          <Link key={kpi.title} href={kpi.href} className="group">
            <Card className="shadow-xs transition group-hover:border-indigo-500/50 group-hover:shadow-md cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${kpi.color} transition group-hover:scale-105 shrink-0`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xl font-extrabold">{kpi.value}</div>
                  <div className="text-xs font-semibold text-foreground">{kpi.title}</div>
                  <div className="text-[11px] text-muted-foreground">{kpi.description}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-indigo-500 transition shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Content: Activity Feed + Recent Batches + Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Quick Operations Hub */}
        <Card className="shadow-xs md:col-span-1 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                <Layers className="h-4 w-4" />
              </div>
              Today's Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Link href="/admin/attendance" className="block">
              <div className="p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:border-indigo-200 dark:hover:border-indigo-800 transition flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600">
                    <CalendarCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      Mark Today's Attendance
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Daily roll call for all batches
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
              </div>
            </Link>

            <Link href="/admin/physical" className="block">
              <div className="p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:border-indigo-200 dark:hover:border-indigo-800 transition flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      Record Ground Trial
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Log physical fitness results
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
              </div>
            </Link>

            <Link href="/admin/alerts" className="block">
              <div className="p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:border-indigo-200 dark:hover:border-indigo-800 transition flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/50 text-violet-600">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      Send Parent Alert
                    </div>
                    <div className="text-xs text-muted-foreground">
                      WhatsApp / SMS notification
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
              </div>
            </Link>

            <Link href="/admin/syllabus" className="block">
              <div className="p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:border-indigo-200 dark:hover:border-indigo-800 transition flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/50 text-teal-600">
                    <ListChecks className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      Syllabus Progress
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Track batch topic coverage
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="shadow-xs md:col-span-1 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {recentActivity.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No recent activity to display.
              </div>
            ) : (
              recentActivity.map((act, idx) => {
                const Icon = activityIconMap[act.icon] ?? ClipboardList;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-2.5 rounded-lg border bg-card hover:bg-muted/20 transition"
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${act.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold">{act.title}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {act.description}
                      </div>
                      <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {act.time.toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Active Batches Overview */}
        <Card className="shadow-xs md:col-span-1 flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-600">
                <Layers className="h-4 w-4" />
              </div>
              Active Batches
            </CardTitle>
            <Link href="/admin/batches">
              <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-700">
                View All →
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {recentBatches.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No active batches found. Create your first batch to begin.
              </div>
            ) : (
              recentBatches.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-xl border bg-card text-card-foreground shadow-2xs space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="font-semibold text-sm leading-tight">{b.name}</div>
                    <Badge variant="secondary" className="text-[10px] font-bold shrink-0">
                      {b.targetExam}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {b._count.studentProfiles} students
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {b._count.subjects} subjects
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
