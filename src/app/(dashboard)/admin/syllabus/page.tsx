import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { getSyllabusAction } from "@/actions/syllabus";
import { getBatchesAction } from "@/actions/batches";
import { FacultySyllabusClient } from "@/components/syllabus/syllabus-client";

export default async function AdminSyllabusPage() {
  const user = await requireAuth(["ADMIN", "COORDINATOR"]);

  const [batchResult, syllabusResult] = await Promise.all([
    getBatchesAction(),
    (async () => {
      const batches = await db.batch.findMany({
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (batches.length === 0) return { success: true as const, data: [] };
      return getSyllabusAction(batches[0].id);
    })(),
  ]);

  const batches = batchResult.success ? batchResult.data : [];
  const syllabusData = syllabusResult.success ? syllabusResult.data : [];
  const defaultBatchId = batches[0]?.id ?? "";

  // Get all subjects across batches for the "Add" modal
  const allSubjects = await db.subject.findMany({
    where: defaultBatchId ? { batchId: defaultBatchId } : undefined,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <FacultySyllabusClient
      syllabusData={syllabusData}
      batches={batches}
      subjects={allSubjects}
      batchId={defaultBatchId}
      mode="admin"
    />
  );
}
