import { requireAuth } from "@/lib/auth-utils";
import { getBatchesAction } from "@/actions/batches";
import { AdminAttendanceClient } from "./admin-attendance-client";

export default async function AdminAttendancePage() {
  await requireAuth(["ADMIN", "COORDINATOR"]);

  const batchesRes = await getBatchesAction();
  const batches = batchesRes.success ? batchesRes.data : [];

  return <AdminAttendanceClient batches={batches} />;
}
