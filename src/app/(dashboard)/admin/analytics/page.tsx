import { requireAuth } from "@/lib/auth-utils";
import { getAcademyAnalyticsAction } from "@/actions/analytics";
import { CohortComparisonChart } from "@/components/analytics/cohort-comparison-chart";
import { InterventionWatchlist } from "@/components/analytics/intervention-watchlist";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, Users, Award, AlertTriangle, TrendingUp } from "lucide-react";

export default async function AdminAnalyticsPage() {
  await requireAuth(["ADMIN", "COORDINATOR"]);

  const res = await getAcademyAnalyticsAction();
  if (!res.success || !res.data) {
    return <div>Failed to load academy analytics.</div>;
  }

  const { overallAcademyReadiness, cohorts, topBottomInterventionList, totalStudents } =
    res.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <BrainCircuit className="h-6 w-6" />
          </div>
          AI Exam-Readiness & Cohort Diagnostics
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Predictive performance analytics, cohort score trajectories, and bottom 20% risk intervention tracking.
        </p>
      </div>

      {/* KPI Header Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Card className="shadow-xs p-4 bg-gradient-to-br from-indigo-950 to-slate-900 text-white border-0">
          <span className="text-[11px] font-semibold text-indigo-200 uppercase">
            Academy Readiness Index
          </span>
          <div className="text-3xl font-black mt-1 text-white">
            {overallAcademyReadiness}%
          </div>
          <span className="text-[10px] text-indigo-300">Composite exam readiness</span>
        </Card>

        <Card className="shadow-xs p-4">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase">
            Total Enrolled Candidates
          </span>
          <div className="text-3xl font-bold mt-1 text-foreground">
            {totalStudents}
          </div>
          <span className="text-[10px] text-muted-foreground">Across {cohorts.length} active batches</span>
        </Card>

        <Card className="shadow-xs p-4">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
            Exam Ready Candidates
          </span>
          <div className="text-3xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
            {cohorts.reduce((s, c) => s + c.examReadyCount, 0)}
          </div>
          <span className="text-[10px] text-muted-foreground">&ge; 80% Readiness index</span>
        </Card>

        <Card className="shadow-xs p-4">
          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase">
            Intervention Required
          </span>
          <div className="text-3xl font-bold mt-1 text-rose-600 dark:text-rose-400">
            {topBottomInterventionList.length}
          </div>
          <span className="text-[10px] text-muted-foreground">Bottom 20% cohort candidates</span>
        </Card>
      </div>

      {/* Cohort Multi-Metric Comparison Chart */}
      <CohortComparisonChart cohorts={cohorts} />

      {/* Bottom 20% Risk Intervention Watchlist */}
      <InterventionWatchlist students={topBottomInterventionList} />
    </div>
  );
}
