import { requireAuth } from "@/lib/auth-utils";
import { getBatchesAction, getBranchesAction } from "@/actions/batches";
import { getTeachersAction } from "@/actions/teachers";
import { BatchesClient } from "./batches-client";

export default async function AdminBatchesPage() {
  await requireAuth(["ADMIN", "COORDINATOR"]);

  const [batchesRes, branchesRes, teachersRes] = await Promise.all([
    getBatchesAction(),
    getBranchesAction(),
    getTeachersAction(),
  ]);

  const batches = batchesRes.success ? batchesRes.data : [];
  const branches = branchesRes.success ? branchesRes.data : [];
  const teachers = teachersRes.success ? teachersRes.data : [];

  return (
    <BatchesClient
      initialBatches={batches}
      branches={branches}
      teachers={teachers}
    />
  );
}
