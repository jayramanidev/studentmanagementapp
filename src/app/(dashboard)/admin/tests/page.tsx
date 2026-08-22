import { requireAuth } from "@/lib/auth-utils";
import { getTestsAction } from "@/actions/tests";
import { getBatchesAction } from "@/actions/batches";
import { getSubjectsAction } from "@/actions/subjects";
import { TestsClient } from "./tests-client";

export default async function AdminTestsPage() {
  await requireAuth(["ADMIN", "COORDINATOR"]);

  const [testsRes, batchesRes, subjectsRes] = await Promise.all([
    getTestsAction(),
    getBatchesAction(),
    getSubjectsAction(),
  ]);

  const tests = testsRes.success ? testsRes.data : [];
  const batches = batchesRes.success ? batchesRes.data : [];
  const subjects = subjectsRes.success ? subjectsRes.data : [];

  return (
    <TestsClient
      initialTests={tests}
      batches={batches}
      subjects={subjects}
    />
  );
}
