import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { getStudentFeeLedgerAction, type StudentFeeSummary } from "@/actions/fees";
import { StudentFeeCard } from "@/components/fees/student-fee-card";
import { Receipt, User } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default async function ParentFeesPage() {
  const user = await requireAuth(["PARENT", "ADMIN", "COORDINATOR"]);

  const links = await db.parentStudentLink.findMany({
    where: { parentUserId: user.id },
    include: {
      student: true,
    },
  });

  if (links.length === 0) {
    return (
      <div className="p-8 text-center bg-card rounded-2xl border shadow-xs space-y-2">
        <Receipt className="h-10 w-10 text-muted-foreground/40 mx-auto" />
        <h2 className="text-base font-bold">No Linked Student Found</h2>
        <p className="text-xs text-muted-foreground">
          Your parent account is not linked to any student.
        </p>
      </div>
    );
  }

  const feeSummaries: Array<{ studentId: string; studentName: string; summary: StudentFeeSummary }> = [];

  for (const l of links) {
    const res = await getStudentFeeLedgerAction(l.studentUserId);
    if (res.success && res.data) {
      feeSummaries.push({
        studentId: l.studentUserId,
        studentName: l.student.fullName,
        summary: res.data,
      });
    }
  }

  if (feeSummaries.length === 0) {
    return (
      <div className="p-8 text-center bg-card rounded-2xl border shadow-xs space-y-2">
        <Receipt className="h-10 w-10 text-muted-foreground/40 mx-auto" />
        <h2 className="text-base font-bold">No Fee Data Available</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Receipt className="h-6 w-6" />
          </div>
          Student Tuition Fees & Receipts
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor your ward's course fee payments, settled installments, and print official fee vouchers.
        </p>
      </div>

      {feeSummaries.length === 1 ? (
        <StudentFeeCard feeSummary={feeSummaries[0].summary} />
      ) : (
        <Tabs defaultValue={feeSummaries[0].studentId} className="space-y-4">
          <TabsList className="bg-muted/60 p-1">
            {feeSummaries.map((f) => (
              <TabsTrigger key={f.studentId} value={f.studentId} className="text-xs font-semibold">
                {f.studentName}
              </TabsTrigger>
            ))}
          </TabsList>
          {feeSummaries.map((f) => (
            <TabsContent key={f.studentId} value={f.studentId} className="mt-0">
              <StudentFeeCard feeSummary={f.summary} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
