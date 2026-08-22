import { requireAuth } from "@/lib/auth-utils";
import { getMaterialsAction } from "@/actions/materials";
import { getBatchesAction } from "@/actions/batches";
import { getSubjectsAction } from "@/actions/subjects";
import { FacultyMaterialsClient } from "./faculty-materials-client";

export default async function FacultyMaterialsPage() {
  await requireAuth(["TEACHER", "ADMIN", "COORDINATOR"]);

  const [matRes, batchesRes, subjectsRes] = await Promise.all([
    getMaterialsAction(),
    getBatchesAction(),
    getSubjectsAction(),
  ]);

  const materials = matRes.success ? matRes.data : [];
  const batches = batchesRes.success ? batchesRes.data : [];
  const subjects = subjectsRes.success ? subjectsRes.data : [];

  return (
    <FacultyMaterialsClient
      initialMaterials={materials}
      batches={batches}
      subjects={subjects}
    />
  );
}
