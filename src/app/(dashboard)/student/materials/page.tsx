import { requireAuth } from "@/lib/auth-utils";
import { getMaterialsAction } from "@/actions/materials";
import { MaterialGrid } from "@/components/materials/material-grid";
import { BookOpen } from "lucide-react";

export default async function StudentMaterialsPage() {
  await requireAuth(["STUDENT", "PARENT", "ADMIN", "COORDINATOR", "TEACHER"]);

  const matRes = await getMaterialsAction();
  const materials = matRes.success ? matRes.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <BookOpen className="h-6 w-6" />
          </div>
          Study Materials, Notes & PYQs
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Download lecture notes, subject reference books, and previous year exam papers for your target exams.
        </p>
      </div>

      <MaterialGrid materials={materials} canDelete={false} />
    </div>
  );
}
