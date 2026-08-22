import { requireAuth } from "@/lib/auth-utils";
import { getTeachersAction } from "@/actions/teachers";
import { TeachersClient } from "./teachers-client";

export default async function AdminTeachersPage() {
  await requireAuth(["ADMIN", "COORDINATOR"]);

  const teachersRes = await getTeachersAction();
  const teachers = teachersRes.success ? teachersRes.data : [];

  return <TeachersClient initialTeachers={teachers} />;
}
