import { requireAuth } from "@/lib/auth-utils";
import { getStudentPerformanceAction } from "@/actions/performance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreProgressionChart } from "@/components/charts/score-progression-chart";
import { SubjectBarChart } from "@/components/charts/subject-bar-chart";
import { StudentTestHistoryTable } from "@/components/student/student-test-history-table";
import {
  TrendingUp,
  Award,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Trophy,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function StudentPerformancePage() {
  await requireAuth(["STUDENT", "ADMIN", "COORDINATOR", "TEACHER"]);

  const res = await getStudentPerformanceAction();
  const perf = res.success && res.data ? res.data : null;

  const student = perf?.student;
  const overall = perf?.overallStats;
  const att = perf?.attendance;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/student">
            <Button variant="outline" size="icon-sm" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              Student Performance Analytics
            </h1>
            <p className="text-muted-foreground text-xs mt-0.5">
              Comprehensive test trajectory, subject proficiencies, and competitive rank metrics.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card className="shadow-xs p-4">
          <span className="text-xs font-medium text-muted-foreground">Class Standing</span>
          <div className="text-2xl font-bold text-amber-600 mt-1 font-mono">
            {overall?.latestRank ? `#${overall.latestRank}` : "—"}
          </div>
          <span className="text-[11px] text-muted-foreground">
            Out of {overall?.totalStudentsInBatch ?? 0} students
          </span>
        </Card>

        <Card className="shadow-xs p-4">
          <span className="text-xs font-medium text-muted-foreground">Overall Average</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {overall?.overallAveragePercentage !== null && overall?.overallAveragePercentage !== undefined
              ? `${overall.overallAveragePercentage}%`
              : "—"}
          </div>
          <span className="text-[11px] text-muted-foreground">
            Across {overall?.totalTestsAttempted ?? 0} tests
          </span>
        </Card>

        <Card className="shadow-xs p-4">
          <span className="text-xs font-medium text-muted-foreground">Tests Attempted</span>
          <div className="text-2xl font-bold text-foreground mt-1">
            {overall?.totalTestsAttempted ?? 0}
          </div>
          <span className="text-[11px] text-muted-foreground">Offline paper exams</span>
        </Card>

        <Card className="shadow-xs p-4">
          <span className="text-xs font-medium text-muted-foreground">Class Attendance</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {att ? `${att.attendancePercentage}%` : "100%"}
          </div>
          <span className="text-[11px] text-muted-foreground">
            {att?.presentDays ?? 0} days attended
          </span>
        </Card>
      </div>

      {/* Visual Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        <ScoreProgressionChart
          testHistory={perf?.testHistory ?? []}
          title="Classroom Test Progression"
          description="Your score percentage compared to class benchmarks over time"
        />

        <SubjectBarChart
          subjectBreakdown={perf?.subjectBreakdown ?? []}
        />
      </div>

      {/* Test Records */}
      <div className="space-y-3">
        <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
          <Award className="h-4 w-4 text-indigo-600" />
          Complete Exam Score History & Answer Keys
        </h2>
        <StudentTestHistoryTable testHistory={perf?.testHistory ?? []} />
      </div>
    </div>
  );
}
