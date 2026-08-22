import { requireAuth } from "@/lib/auth-utils";
import { getStudentReadinessAction } from "@/actions/analytics";
import { ReadinessGauge } from "@/components/analytics/readiness-gauge";
import { BrainCircuit } from "lucide-react";

export default async function StudentReadinessPage() {
  await requireAuth(["STUDENT", "ADMIN", "COORDINATOR", "TEACHER"]);

  const res = await getStudentReadinessAction();
  if (!res.success || !res.data) {
    return <div>Failed to load readiness diagnostic.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <BrainCircuit className="h-6 w-6" />
          </div>
          AI Exam-Readiness & Subject Diagnostics
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Real-time readiness index computed from your offline test scores, attendance consistency, and score momentum.
        </p>
      </div>

      <ReadinessGauge report={res.data} />
    </div>
  );
}
