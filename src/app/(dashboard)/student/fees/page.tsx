import { requireAuth } from "@/lib/auth-utils";
import { getStudentFeeLedgerAction } from "@/actions/fees";
import { StudentFeeCard } from "@/components/fees/student-fee-card";
import { Receipt } from "lucide-react";

export default async function StudentFeesPage() {
  await requireAuth(["STUDENT", "ADMIN", "COORDINATOR"]);

  const res = await getStudentFeeLedgerAction();
  if (!res.success || !res.data) {
    return (
      <div className="p-8 text-center bg-card rounded-2xl border shadow-xs space-y-2">
        <Receipt className="h-10 w-10 text-muted-foreground/40 mx-auto" />
        <h2 className="text-base font-bold">No Fee Records Found</h2>
        <p className="text-xs text-muted-foreground">
          Your fee ledger is not yet configured. Please check with academy administration.
        </p>
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
          My Course Fee & Receipts
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review your tuition payment history, installment schedules, and download official payment vouchers.
        </p>
      </div>

      <StudentFeeCard feeSummary={res.data} />
    </div>
  );
}
