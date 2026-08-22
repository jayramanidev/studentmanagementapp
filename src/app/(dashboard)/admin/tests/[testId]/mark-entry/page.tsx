import { requireAuth } from "@/lib/auth-utils";
import { getTestByIdAction } from "@/actions/tests";
import { MarkEntryGrid } from "@/components/marks/mark-entry-grid";
import { notFound } from "next/navigation";

interface AdminMarkEntryPageProps {
  params: Promise<{ testId: string }>;
}

export default async function AdminMarkEntryPage({
  params,
}: AdminMarkEntryPageProps) {
  await requireAuth(["ADMIN", "COORDINATOR"]);

  const { testId } = await params;
  const res = await getTestByIdAction(testId);

  if (!res.success || !res.data) {
    notFound();
  }

  return (
    <MarkEntryGrid
      testData={res.data}
      backUrl="/admin/tests"
    />
  );
}
