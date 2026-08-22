import { requireAuth } from "@/lib/auth-utils";
import { getPhysicalRecordsAction } from "@/actions/physical";
import { PhysicalScorecardCard } from "@/components/physical/physical-scorecard-card";
import { Activity } from "lucide-react";

export default async function StudentPhysicalPage() {
  await requireAuth(["STUDENT", "PARENT", "ADMIN", "COORDINATOR", "TEACHER"]);

  const res = await getPhysicalRecordsAction();
  const records = res.success ? res.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Activity className="h-6 w-6" />
          </div>
          My Ground Fitness & PET Scorecard
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review your 5000m running times, personal bests, and marks according to official Gujarat Police criteria.
        </p>
      </div>

      <PhysicalScorecardCard records={records} />
    </div>
  );
}
