"use client";

import * as React from "react";
import { useState } from "react";
import { FeeTable } from "@/components/fees/fee-table";
import { FeePaymentModal } from "@/components/fees/fee-payment-modal";
import { Button } from "@/components/ui/button";
import { type FeePaymentListItem } from "@/actions/fees";
import { type BatchItem } from "@/actions/batches";
import { type StudentListItem } from "@/actions/students";
import { IndianRupee, Plus, Receipt } from "lucide-react";
import { useRouter } from "next/navigation";

interface AdminFeesClientProps {
  records: FeePaymentListItem[];
  batches: BatchItem[];
  students: StudentListItem[];
}

export function AdminFeesClient({
  records,
  batches,
  students,
}: AdminFeesClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Receipt className="h-6 w-6" />
            </div>
            Student Fee & Installment Ledger
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Record coaching fee installments, track pending balances, and generate printable receipts.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs h-9 shadow-xs"
        >
          <Plus className="h-4 w-4" /> Record Fee Payment
        </Button>
      </div>

      {/* Table */}
      <FeeTable records={records} batches={batches} />

      {/* Payment Modal */}
      <FeePaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        batches={batches}
        students={students}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
