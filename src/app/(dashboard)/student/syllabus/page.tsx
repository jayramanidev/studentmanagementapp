import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { getSyllabusAction } from "@/actions/syllabus";
import { SyllabusChapterAccordion } from "@/components/syllabus/syllabus-chapter-accordion";
import { ListChecks } from "lucide-react";

export default async function StudentSyllabusPage() {
  const user = await requireAuth(["STUDENT"]);

  // Get the student's batch
  const profile = await db.studentProfile.findFirst({
    where: { userId: user.id },
    select: { batchId: true, batch: { select: { name: true, targetExam: true } } },
  });

  if (!profile || !profile.batchId || !profile.batch) {
    return (
      <div className="text-center py-16 space-y-3">
        <ListChecks className="h-12 w-12 mx-auto text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">
          You are not enrolled in any batch. Contact your institute for enrollment.
        </p>
      </div>
    );
  }

  const syllabusResult = await getSyllabusAction(profile.batchId, undefined, user.id);
  const syllabusData = syllabusResult.success ? syllabusResult.data : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <ListChecks className="h-6 w-6" />
          </div>
          My Syllabus Self-Study Checklist
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track your topic-by-topic study progress for{" "}
          <span className="font-semibold text-foreground">
            {profile.batch.name} ({profile.batch.targetExam})
          </span>
        </p>
      </div>

      <SyllabusChapterAccordion
        subjects={syllabusData}
        mode="student"
        batchId={profile.batchId}
      />
    </div>
  );
}
