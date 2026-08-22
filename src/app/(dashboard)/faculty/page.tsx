import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  ClipboardList,
  CalendarCheck,
  BookOpen,
  ArrowRight,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
} from "lucide-react";
import Link from "next/link";

export default async function FacultyDashboardPage() {
  const user = await requireAuth(["TEACHER", "ADMIN", "COORDINATOR"]);

  // Fetch faculty-specific data
  let myBatchesCount = 0;
  let mySubjectsCount = 0;
  let myTestsCount = 0;
  let recentTests: Array<{
    id: string;
    title: string;
    type: string;
    totalMarks: any;
    isPublished: boolean;
    testDate: Date;
    batch: { name: string; targetExam: string };
    subject: { name: string };
    _count: { testMarks: number };
  }> = [];

  try {
    const subjects = await db.subject.findMany({
      where: { teacherId: user.id },
      select: { batchId: true },
    });

    const uniqueBatchIds = Array.from(new Set(subjects.map((s) => s.batchId)));
    myBatchesCount = uniqueBatchIds.length;
    mySubjectsCount = subjects.length;

    const tests = await db.offlineTest.findMany({
      where: {
        OR: [
          { subject: { teacherId: user.id } },
          { createdBy: user.id },
        ],
      },
      take: 4,
      orderBy: { testDate: "desc" },
      include: {
        batch: { select: { name: true, targetExam: true } },
        subject: { select: { name: true } },
        _count: { select: { testMarks: true } },
      },
    });

    myTestsCount = tests.length;
    recentTests = tests;
  } catch (err) {
    console.error("[FacultyDashboard Error]:", err);
  }

  const statCards = [
    {
      title: "My Batches",
      value: myBatchesCount.toString(),
      description: "Assigned class cohorts",
      icon: Users,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/50",
      href: "/faculty/tests",
    },
    {
      title: "Taught Subjects",
      value: mySubjectsCount.toString(),
      description: "Active syllabus subjects",
      icon: BookOpen,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900/50",
      href: "/faculty/tests",
    },
    {
      title: "Offline Tests",
      value: myTestsCount.toString(),
      description: "Conducted this term",
      icon: ClipboardList,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50",
      href: "/faculty/tests",
    },
    {
      title: "Daily Attendance",
      value: "Ready",
      description: "Class register",
      icon: CalendarCheck,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/50",
      href: "/faculty/attendance",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md">
        <div className="space-y-1">
          <Badge className="bg-white/10 hover:bg-white/20 text-blue-100 text-[11px] mb-1">
            Faculty Teaching Portal
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">
            Good day, {user.name.split(" ")[0]}
          </h1>
          <p className="text-blue-200 text-sm max-w-xl">
            Log classroom attendance, schedule physical tests, enter student marks, and publish competitive rank lists.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/faculty/tests">
            <Button
              size="sm"
              className="bg-white text-blue-950 hover:bg-blue-50 font-semibold text-xs gap-1.5 shadow-xs"
            >
              <Plus className="h-4 w-4" /> Schedule New Test
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href} className="group">
            <Card className="shadow-xs transition group-hover:border-blue-500/50 group-hover:shadow-md cursor-pointer">
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
                  <ArrowRight className="h-3 w-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition" />
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Operations & Recent Tests */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Quick Actions Hub */}
        <Card className="shadow-xs md:col-span-1 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600">
                <ClipboardList className="h-4 w-4" />
              </div>
              Academics & Tests Hub
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Link href="/faculty/tests" className="block">
              <div className="p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 hover:border-blue-200 dark:hover:border-blue-800 transition flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold group-hover:text-blue-600">
                      Rapid Mark Entry Grid
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Keyboard-driven score entry
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
              </div>
            </Link>

            <Link href="/faculty/tests" className="block">
              <div className="p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 hover:border-blue-200 dark:hover:border-blue-800 transition flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold group-hover:text-blue-600">
                      Schedule Physical Test
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Set total marks & pass cutoff
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
              </div>
            </Link>
          </CardContent>
          <CardFooter className="pt-0">
            <div className="w-full text-xs text-muted-foreground p-2 rounded-lg bg-muted/40 text-center">
              Offline Marks & Competition Rank Engine
            </div>
          </CardFooter>
        </Card>

        {/* Recent Tests Schedule */}
        <Card className="shadow-xs md:col-span-2 flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-600">
                <BookOpen className="h-4 w-4" />
              </div>
              My Recent Tests & Mark Sheets
            </CardTitle>
            <Link href="/faculty/tests">
              <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700">
                View All Tests →
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No offline tests created yet. Use Schedule New Test to create one.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recentTests.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl border bg-card text-card-foreground shadow-2xs space-y-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-sm leading-snug">{t.title}</div>
                        {t.isPublished ? (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] shrink-0">
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-[10px] shrink-0">
                            Draft
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {t.subject.name} • {t.batch.name}
                      </div>
                    </div>

                    <div className="pt-2 border-t flex items-center justify-between">
                      <span className="text-xs font-semibold">
                        Max: {Number(t.totalMarks)} Marks
                      </span>
                      <Link href={`/faculty/tests/${t.id}/mark-entry`}>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-600 gap-1 p-1">
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                          {t.isPublished ? "Edit Marks" : "Enter Marks"}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0 flex items-center justify-between text-xs text-muted-foreground border-t p-4">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Standard Competition Ranking (1224 scheme) active
            </span>
            <Link href="/faculty/tests" className="text-blue-600 hover:underline font-medium">
              Manage Tests
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
