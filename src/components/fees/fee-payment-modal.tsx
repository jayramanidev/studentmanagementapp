"use client";

import * as React from "react";
import { useState, useTransition, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { recordFeePaymentAction } from "@/actions/fees";
import { type BatchItem } from "@/actions/batches";
import { type StudentListItem } from "@/actions/students";
import {
  CreditCard,
  Layers,
  User,
  IndianRupee,
  Calendar,
  CheckCircle,
  Loader2,
  Receipt,
} from "lucide-react";

interface FeePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: BatchItem[];
  students: StudentListItem[];
  onSuccess?: () => void;
}

const PAYMENT_MODES = [
  { id: "UPI", label: "UPI / GPay / PhonePe" },
  { id: "CASH", label: "Cash Payment" },
  { id: "NET_BANKING", label: "Net Banking / NEFT" },
  { id: "CHEQUE", label: "Bank Cheque" },
];

export function FeePaymentModal({
  isOpen,
  onClose,
  batches,
  students,
  onSuccess,
}: FeePaymentModalProps) {
  const [isPending, startTransition] = useTransition();

  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || "");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [amountPaid, setAmountPaid] = useState<number>(15000);
  const [totalCourseFee, setTotalCourseFee] = useState<number>(35000);
  const [paymentMode, setPaymentMode] = useState<"UPI" | "CASH" | "NET_BANKING" | "CHEQUE">("UPI");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [installmentNo, setInstallmentNo] = useState<number>(1);
  const [transactionRef, setTransactionRef] = useState("");
  const [remarks, setRemarks] = useState("");

  const filteredStudents = useMemo(() => {
    if (!selectedBatchId) return students;
    return students.filter((s) => s.studentProfile?.batch?.id === selectedBatchId);
  }, [selectedBatchId, students]);

  React.useEffect(() => {
    if (filteredStudents.length > 0) {
      setSelectedStudentId(filteredStudents[0].id);
    } else {
      setSelectedStudentId("");
    }
  }, [filteredStudents]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudentId) {
      toast.error("Please select a student");
      return;
    }
    if (!selectedBatchId) {
      toast.error("Please select a batch");
      return;
    }
    if (amountPaid <= 0) {
      toast.error("Amount paid must be greater than zero");
      return;
    }

    startTransition(async () => {
      const res = await recordFeePaymentAction({
        studentId: selectedStudentId,
        batchId: selectedBatchId,
        amountPaid: Number(amountPaid),
        totalCourseFee: Number(totalCourseFee),
        paymentMode,
        paymentDate,
        transactionRef: transactionRef.trim() || undefined,
        installmentNo: Number(installmentNo),
        remarks: remarks.trim() || undefined,
      });

      if (res.success) {
        toast.success(`Fee payment recorded! Receipt No: ${res.data.receiptNumber}`);
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.error || "Failed to record fee payment");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[88vh] flex flex-col">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="h-5 w-5" />
            </div>
            Record Student Fee Payment
          </DialogTitle>
          <DialogDescription>
            Record tuition fee installments and generate official receipt vouchers.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
          {/* Batch & Student Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fBatch" className="text-xs font-semibold flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                Batch <span className="text-destructive">*</span>
              </Label>
              <select
                id="fBatch"
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full h-8 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.targetExam})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fStudent" className="text-xs font-semibold flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Student <span className="text-destructive">*</span>
              </Label>
              <select
                id="fStudent"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                disabled={filteredStudents.length === 0}
                required
                className="w-full h-8 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
              >
                {filteredStudents.length === 0 ? (
                  <option value="">No students in batch</option>
                ) : (
                  filteredStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.studentProfile?.rollNumber})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Amount Paid & Total Course Fee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amtPaid" className="text-xs font-semibold">
                Amount Paid (₹) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amtPaid"
                type="number"
                min={1}
                step="500"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="totalFee" className="text-xs font-semibold">
                Total Course Fee (₹) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="totalFee"
                type="number"
                min={1}
                step="1000"
                value={totalCourseFee}
                onChange={(e) => setTotalCourseFee(Number(e.target.value))}
                required
                disabled={isPending}
              />
            </div>
          </div>

          {/* Payment Mode */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Payment Mode</Label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMode(m.id as any)}
                  className={`p-2 rounded-lg border text-left text-xs font-medium transition cursor-pointer ${
                    paymentMode === m.id
                      ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 dark:bg-emerald-950 font-semibold"
                      : "border-input bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Date, Installment Number & Transaction Ref */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="payDate" className="text-xs font-semibold">
                Payment Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="payDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="instNo" className="text-xs font-semibold">
                Installment # <span className="text-destructive">*</span>
              </Label>
              <Input
                id="instNo"
                type="number"
                min={1}
                max={10}
                value={installmentNo}
                onChange={(e) => setInstallmentNo(Number(e.target.value))}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="txRef" className="text-xs font-semibold">
                Txn Ref / Cheque #
              </Label>
              <Input
                id="txRef"
                placeholder="e.g. UPI-987214"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <Label htmlFor="fRemarks" className="text-xs font-semibold">
              Payment Remarks (Optional)
            </Label>
            <Textarea
              id="fRemarks"
              placeholder="e.g. 1st installment paid via PhonePe"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              disabled={isPending}
            />
          </div>

          <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !selectedStudentId}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Record Payment & Issue Receipt
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
