import { requireAuth } from "@/lib/auth-utils";
import { getBatchesAction } from "@/actions/batches";
import { FacultyAttendanceClient } from "./attendance-client";

export default async function FacultyAttendancePage() {
  await requireAuth(["TEACHER", "ADMIN", "COORDINATOR"]);

  const batchesRes = await getBatchesAction();
  const batches = batchesRes.success ? batchesRes.data : [];

  return <FacultyAttendanceClient batches={batches} />;
}
