import { requireAuth } from "@/lib/auth-utils";
import { getStudentPerformanceAction } from "@/actions/performance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreProgressionChart } from "@/components/charts/score-progression-chart";
import { SubjectBarChart } from "@/components/charts/subject-bar-chart";
import { StudentTestHistoryTable } from "@/components/student/student-test-history-table";
import {
  TrendingUp,
  CalendarCheck,
  Trophy,
  BookOpen,
  Award,
  Layers,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export default async function StudentDashboardPage() {
  const user = await requireAuth(["STUDENT"]);

  const res = await getStudentPerformanceAction();
  const perf = res.success && res.data ? res.data : null;

  const student = perf?.student;
  const overall = perf?.overallStats;
  const att = perf?.attendance;

  const statCards = [
    {
      title: "Latest Score",
      value: overall?.latestScore && overall.latestScore.obtained !== null
        ? `${overall.latestScore.obtained} / ${overall.latestScore.total}`
        : "—",
      description: overall?.latestScore?.testTitle ?? "No tests recorded yet",
      icon: Trophy,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50",
    },
    {
      title: "Class Standing",
      value: overall?.latestRank ? `#${overall.latestRank}` : "—",
      description: overall?.latestRank
        ? `Out of ${overall.totalStudentsInBatch} students`
        : "Standard Competition Rank",
      icon: Award,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/50",
    },
    {
      title: "Overall Average",
      value: overall?.overallAveragePercentage !== null && overall?.overallAveragePercentage !== undefined
        ? `${overall.overallAveragePercentage}%`
        : "—",
      description: `Across ${overall?.totalTestsAttempted ?? 0} tests`,
      icon: TrendingUp,
      color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/50",
    },
    {
      title: "Classroom Attendance",
      value: att ? `${att.attendancePercentage}%` : "100%",
      description: att ? `${att.presentDays} / ${att.totalClasses} classes` : "Daily attendance",
      icon: CalendarCheck,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Badge className="bg-indigo-500/20 text-indigo-200 border-indigo-400/30 text-[11px] mb-1">
            {student?.targetExam ?? "Competitive Exams"} Cohort
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user.name.split(" ")[0]}!
          </h1>
          <p className="text-indigo-200 text-xs sm:text-sm max-w-xl">
            {student?.batchName ?? "Main Batch"} • Roll No:{" "}
            <span className="font-mono font-bold text-white">{student?.rollNumber ?? "N/A"}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {student && (
            <a
              href={`/api/export/report-card/${student.userId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="sm"
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs gap-1.5"
              >
                <FileSpreadsheet className="h-4 w-4" /> Download Scorecard (PDF)
              </Button>
            </a>
          )}
          <Link href="/student/performance">
            <Button
              size="sm"
              className="bg-white text-indigo-950 hover:bg-slate-100 font-semibold text-xs gap-1.5 shadow-xs"
            >
              <TrendingUp className="h-4 w-4 text-indigo-600" /> Full Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="shadow-xs p-4 flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between p-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Score Progression & Subject Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        <ScoreProgressionChart
          testHistory={perf?.testHistory ?? []}
          title="Performance Progression"
          description="Score percentage compared to class benchmarks over time"
        />

        <SubjectBarChart
          subjectBreakdown={perf?.subjectBreakdown ?? []}
        />
      </div>

      {/* Offline Test History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
              Recent Offline Tests & Scorecards
            </h2>
            <p className="text-xs text-muted-foreground">
              Review your scores, competition ranks, teacher remarks, and download answer keys.
            </p>
          </div>
        </div>

        <StudentTestHistoryTable testHistory={perf?.testHistory ?? []} />
      </div>
    </div>
  );
}
