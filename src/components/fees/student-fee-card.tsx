"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  IndianRupee,
  Receipt,
  Download,
} from "lucide-react";
import { type StudentFeeSummary } from "@/actions/fees";

interface StudentFeeCardProps {
  feeSummary: StudentFeeSummary;
}

export function StudentFeeCard({ feeSummary }: StudentFeeCardProps) {
  const { student, totalCourseFee, totalPaid, remainingBalance, paymentStatus, payments } =
    feeSummary;

  const paidPercentage =
    totalCourseFee > 0 ? Math.min(100, Math.round((totalPaid / totalCourseFee) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Fee Progress Header Card */}
      <Card className="shadow-xs p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">
              {student.batchName} ({student.targetExam})
            </span>
            <h1 className="text-2xl font-bold mt-0.5">{student.fullName}</h1>
            <p className="text-xs text-indigo-200 font-mono mt-0.5">
              Roll No: {student.rollNumber}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <Badge
              className={
                paymentStatus === "FULLY_PAID"
                  ? "bg-emerald-500 text-white font-bold"
                  : paymentStatus === "PARTIALLY_PAID"
                  ? "bg-amber-500 text-white font-bold"
                  : "bg-rose-500 text-white font-bold"
              }
            >
              {paymentStatus === "FULLY_PAID"
                ? "FEES FULLY PAID"
                : paymentStatus === "PARTIALLY_PAID"
                ? "PARTIAL PAYMENT"
                : "PAYMENT PENDING"}
            </Badge>
            <div className="text-xs text-indigo-200 mt-1">
              Course Fee: <strong>₹{totalCourseFee.toLocaleString("en-IN")}</strong>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-xs text-indigo-200">
            <span>Amount Paid: ₹{totalPaid.toLocaleString("en-IN")}</span>
            <span>Balance Dues: ₹{remainingBalance.toLocaleString("en-IN")}</span>
          </div>
          <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full transition-all duration-500 rounded-full"
              style={{ width: `${paidPercentage}%` }}
            />
          </div>
          <div className="text-right text-[11px] text-indigo-300 font-medium">
            {paidPercentage}% of total fee settled
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="shadow-xs p-4">
          <span className="text-xs font-semibold text-muted-foreground">Total Course Fee</span>
          <div className="text-2xl font-bold text-foreground mt-1">
            ₹{totalCourseFee.toLocaleString("en-IN")}
          </div>
          <span className="text-[11px] text-muted-foreground">Standard Academy Tuition</span>
        </Card>

        <Card className="shadow-xs p-4">
          <span className="text-xs font-semibold text-muted-foreground">Amount Paid</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            ₹{totalPaid.toLocaleString("en-IN")}
          </div>
          <span className="text-[11px] text-muted-foreground">In {payments.length} installments</span>
        </Card>

        <Card className="shadow-xs p-4">
          <span className="text-xs font-semibold text-muted-foreground">Remaining Dues</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            ₹{remainingBalance.toLocaleString("en-IN")}
          </div>
          <span className="text-[11px] text-muted-foreground">Pending balance</span>
        </Card>
      </div>

      {/* Payment Vouchers Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-600" />
            Official Payment Receipts & Vouchers
          </h2>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No fee payments recorded yet.
          </div>
        ) : (
          <div className="divide-y">
            {payments.map((p) => {
              const dateStr = new Date(p.paymentDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <div
                  key={p.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {p.receiptNumber}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {p.paymentMode}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Installment #{p.installmentNo}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Paid on: {dateStr} {p.transactionRef && `• Ref: ${p.transactionRef}`}
                    </div>
                    {p.remarks && (
                      <div className="text-[11px] text-muted-foreground italic">
                        Note: {p.remarks}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{p.amountPaid.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <a
                      href={`/api/export/receipt/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5 text-indigo-600 hover:text-indigo-700"
                      >
                        <Printer className="h-3.5 w-3.5" /> Print Receipt
                      </Button>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
