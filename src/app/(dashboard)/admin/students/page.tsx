import { requireAuth } from "@/lib/auth-utils";
import { getStudentsAction } from "@/actions/students";
import { getBatchesAction } from "@/actions/batches";
import { StudentsClient } from "./students-client";

export default async function AdminStudentsPage() {
  await requireAuth(["ADMIN", "COORDINATOR"]);

  const [studentsRes, batchesRes] = await Promise.all([
    getStudentsAction(),
    getBatchesAction(),
  ]);

  const students = studentsRes.success ? studentsRes.data : [];
  const batches = batchesRes.success ? batchesRes.data : [];

  return (
    <StudentsClient
      initialStudents={students}
      batches={batches}
    />
  );
}
