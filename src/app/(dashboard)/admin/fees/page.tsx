import { requireAuth } from "@/lib/auth-utils";
import { getFeeRecordsAction } from "@/actions/fees";
import { getBatchesAction } from "@/actions/batches";
import { getStudentsAction } from "@/actions/students";
import { AdminFeesClient } from "./admin-fees-client";

export default async function AdminFeesPage() {
  await requireAuth(["ADMIN", "COORDINATOR"]);

  const [feeRes, batchesRes, studentsRes] = await Promise.all([
    getFeeRecordsAction(),
    getBatchesAction(),
    getStudentsAction(),
  ]);

  const records = feeRes.success ? feeRes.data : [];
  const batches = batchesRes.success ? batchesRes.data : [];
  const students = studentsRes.success ? studentsRes.data : [];

  return (
    <AdminFeesClient
      records={records}
      batches={batches}
      students={students}
    />
  );
}
