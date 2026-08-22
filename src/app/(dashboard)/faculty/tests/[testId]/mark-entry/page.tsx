import { requireAuth } from "@/lib/auth-utils";
import { getTestByIdAction } from "@/actions/tests";
import { MarkEntryGrid } from "@/components/marks/mark-entry-grid";
import { notFound } from "next/navigation";

interface FacultyMarkEntryPageProps {
  params: Promise<{ testId: string }>;
}

export default async function FacultyMarkEntryPage({
  params,
}: FacultyMarkEntryPageProps) {
  await requireAuth(["TEACHER", "ADMIN", "COORDINATOR"]);

  const { testId } = await params;
  const res = await getTestByIdAction(testId);

  if (!res.success || !res.data) {
    notFound();
  }

  return (
    <MarkEntryGrid
      testData={res.data}
      backUrl="/faculty/tests"
    />
  );
}
