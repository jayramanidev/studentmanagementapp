import { requireAuth } from "@/lib/auth-utils";
import { getPhysicalRecordsAction } from "@/actions/physical";
import { getBatchesAction } from "@/actions/batches";
import { getStudentsAction } from "@/actions/students";
import { FacultyPhysicalClient } from "./faculty-physical-client";

export default async function FacultyPhysicalPage() {
  await requireAuth(["TEACHER", "ADMIN", "COORDINATOR"]);

  const [recRes, batchesRes, studentsRes] = await Promise.all([
    getPhysicalRecordsAction(),
    getBatchesAction(),
    getStudentsAction(),
  ]);

  const records = recRes.success ? recRes.data : [];
  const batches = batchesRes.success ? batchesRes.data : [];
  const students = studentsRes.success ? studentsRes.data : [];

  return (
    <FacultyPhysicalClient
      records={records}
      batches={batches}
      students={students}
    />
  );
}
