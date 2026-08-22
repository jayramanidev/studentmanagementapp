import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { getSyllabusAction } from "@/actions/syllabus";
import { getBatchesAction } from "@/actions/batches";
import { FacultySyllabusClient } from "@/components/syllabus/syllabus-client";

export default async function FacultySyllabusPage() {
  const user = await requireAuth(["TEACHER", "COORDINATOR"]);

  // Determine the teacher's assigned batches via their subjects
  const teacherSubjects = await db.subject.findMany({
    where: { teacherId: user.id },
    select: { id: true, name: true, batchId: true },
  });

  const batchIds = [...new Set(teacherSubjects.map((s) => s.batchId))];
  const defaultBatchId = batchIds[0] ?? "";

  const [batchResult, syllabusResult] = await Promise.all([
    getBatchesAction(),
    defaultBatchId
      ? getSyllabusAction(defaultBatchId)
      : Promise.resolve({ success: true as const, data: [] }),
  ]);

  const batches = batchResult.success
    ? batchResult.data.filter((b) => batchIds.includes(b.id))
    : [];
  const syllabusData = syllabusResult.success ? syllabusResult.data : [];

  // Subjects from teacher's batches for the Add modal
  const subjectsForModal = teacherSubjects.map((s) => ({
    id: s.id,
    name: s.name,
  }));

  return (
    <FacultySyllabusClient
      syllabusData={syllabusData}
      batches={batches}
      subjects={subjectsForModal}
      batchId={defaultBatchId}
      mode="faculty"
    />
  );
}
