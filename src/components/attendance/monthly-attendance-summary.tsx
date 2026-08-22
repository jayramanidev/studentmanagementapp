"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  getBatchAttendanceMonthlySummaryAction,
  type MonthlyAttendanceSummaryResponse,
} from "@/actions/attendance";
import { type BatchItem } from "@/actions/batches";
import {
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Users,
  Loader2,
} from "lucide-react";

interface MonthlyAttendanceSummaryProps {
  batches: BatchItem[];
  initialBatchId?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function MonthlyAttendanceSummary({
  batches,
  initialBatchId,
}: MonthlyAttendanceSummaryProps) {
  const [selectedBatchId, setSelectedBatchId] = useState(
    initialBatchId || batches[0]?.id || ""
  );

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [data, setData] = useState<MonthlyAttendanceSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadSummary = React.useCallback(
    async (batchId: string, month: number, year: number) => {
      if (!batchId) return;
      setIsLoading(true);
      const res = await getBatchAttendanceMonthlySummaryAction(batchId, month, year);
      setIsLoading(false);

      if (res.success) {
        setData(res.data);
      } else {
        toast.error(res.error || "Failed to load monthly summary");
      }
    },
    []
  );

  React.useEffect(() => {
    if (selectedBatchId) {
      loadSummary(selectedBatchId, selectedMonth, selectedYear);
    }
  }, [selectedBatchId, selectedMonth, selectedYear, loadSummary]);

  return (
    <div className="space-y-6">
      {/* Month & Batch Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-card p-4 rounded-xl border shadow-xs">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <Layers className="h-3 w-3" /> Select Batch
          </label>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-xs outline-none focus-visible:border-ring dark:bg-input/30 font-medium"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.targetExam})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Month
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
          >
            {MONTH_NAMES.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
          >
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Roster Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <div className="p-3 border-b bg-muted/20 flex items-center justify-between text-xs">
          <span className="font-semibold text-muted-foreground">
            {MONTH_NAMES[selectedMonth - 1]} {selectedYear} Attendance Summary —{" "}
            <strong>{data?.totalClassDays ?? 0} Class Days Recorded</strong>
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[60px] text-xs font-semibold">#</TableHead>
              <TableHead className="w-[130px] text-xs font-semibold">Roll No</TableHead>
              <TableHead className="text-xs font-semibold">Student Name</TableHead>
              <TableHead className="text-center text-xs font-semibold">Total Classes</TableHead>
              <TableHead className="text-center text-xs font-semibold">Present</TableHead>
              <TableHead className="text-center text-xs font-semibold">Late</TableHead>
              <TableHead className="text-center text-xs font-semibold">Absent</TableHead>
              <TableHead className="text-right text-xs font-semibold">Monthly %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                    <span>Loading monthly report...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : !data || data.students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-sm">
                  No attendance records found for this period.
                </TableCell>
              </TableRow>
            ) : (
              data.students.map((s, idx) => (
                <TableRow key={s.studentUserId} className="hover:bg-muted/20 transition">
                  <TableCell className="font-mono text-xs text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {s.rollNumber}
                  </TableCell>
                  <TableCell className="font-semibold text-sm">{s.studentName}</TableCell>
                  <TableCell className="text-center text-xs">{s.totalClasses}</TableCell>
                  <TableCell className="text-center text-xs text-emerald-600 font-semibold">
                    {s.presentDays}
                  </TableCell>
                  <TableCell className="text-center text-xs text-amber-600 font-semibold">
                    {s.lateDays}
                  </TableCell>
                  <TableCell className="text-center text-xs text-rose-600 font-semibold">
                    {s.absentDays}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      className={
                        s.statusLevel === "EXCELLENT"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono text-xs"
                          : s.statusLevel === "SATISFACTORY"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-mono text-xs"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-mono text-xs"
                      }
                    >
                      {s.attendancePercentage}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
