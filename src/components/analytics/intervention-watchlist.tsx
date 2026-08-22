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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { type StudentDiagnosticReport } from "@/lib/readiness-calculator";
import { sendCustomBroadcastAction } from "@/actions/alerts";
import { toast } from "sonner";
import {
  AlertTriangle,
  MessageSquare,
  Sparkles,
  Zap,
  Phone,
  CheckCircle2,
  Loader2,
  TrendingDown,
} from "lucide-react";

interface InterventionWatchlistProps {
  students: StudentDiagnosticReport[];
  onRefresh?: () => void;
}

export function InterventionWatchlist({
  students,
  onRefresh,
}: InterventionWatchlistProps) {
  const [isPending, startTransition] = useTransition();
  const [sendingId, setSendingId] = useState<string | null>(null);

  const handleSendParentAlert = (student: StudentDiagnosticReport) => {
    const targetPhone = student.parentPhone ?? student.phone;
    if (!targetPhone) {
      toast.error("No phone number registered for this student/parent.");
      return;
    }

    setSendingId(student.studentId);
    startTransition(async () => {
      const msg = `⚠️ *Academic Attention Notice — InstituteOps*\n\nDear Parent/Guardian,\nWe are reviewing *${student.studentName}*'s recent performance in ${student.batchName} (${student.targetExam}).\nCurrent Exam Readiness Index: *${student.readinessIndex}%* (Attendance: ${student.attendanceScore}%, Test Avg: ${student.testMasteryScore}%).\n\nWe request you to encourage regular daily attendance and contact faculty for remedial revision sessions.`;

      const res = await sendCustomBroadcastAction({
        recipientPhone: targetPhone,
        recipientName: `Parent of ${student.studentName}`,
        message: msg,
        channel: "WHATSAPP",
        alertType: "CUSTOM_BROADCAST",
      });

      setSendingId(null);
      if (res.success) {
        toast.success(`WhatsApp intervention alert sent to parent (${targetPhone})!`);
        onRefresh?.();
      } else {
        toast.error(res.error || "Failed to send alert");
      }
    });
  };

  return (
    <Card className="shadow-xs border-amber-300/40 dark:border-amber-900/40">
      <CardHeader className="pb-3 bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-200/50 dark:border-amber-900/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Bottom 20% Intervention Watchlist
            </CardTitle>
            <CardDescription className="text-xs text-amber-700/80 dark:text-amber-400/80">
              Students identified by the AI diagnostic engine with low readiness or irregular attendance.
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-200 border-amber-300 text-xs w-fit">
            {students.length} Candidates Flagged
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="text-xs font-semibold">Student & Roll No</TableHead>
              <TableHead className="text-xs font-semibold">Batch & Exam</TableHead>
              <TableHead className="text-xs font-semibold">Readiness Index</TableHead>
              <TableHead className="text-xs font-semibold">Test / Attendance</TableHead>
              <TableHead className="text-xs font-semibold">Primary Vulnerability</TableHead>
              <TableHead className="text-right text-xs font-semibold">Parent Intervention</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground">
                  🎉 No candidates require immediate intervention. All students meet baseline readiness.
                </TableCell>
              </TableRow>
            ) : (
              students.map((s) => (
                <TableRow key={s.studentId} className="hover:bg-muted/20 transition">
                  <TableCell>
                    <div className="font-semibold text-xs">{s.studentName}</div>
                    <div className="text-[11px] font-mono text-muted-foreground">
                      {s.rollNumber}
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {s.batchName} ({s.targetExam})
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-rose-600 dark:text-rose-400">
                        {s.readinessIndex}%
                      </span>
                      <Badge
                        className={
                          s.readinessTier === "AT_RISK_NEEDS_INTERVENTION"
                            ? "bg-rose-500 text-white text-[9px]"
                            : "bg-amber-500 text-white text-[9px]"
                        }
                      >
                        {s.readinessTier === "AT_RISK_NEEDS_INTERVENTION" ? "AT RISK" : "WATCH"}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-[11px] space-y-0.5">
                      <div>Tests: <strong className={s.testMasteryScore < 50 ? "text-rose-600" : ""}>{s.testMasteryScore}%</strong></div>
                      <div>Att: <strong className={s.attendanceScore < 75 ? "text-rose-600" : ""}>{s.attendanceScore}%</strong></div>
                    </div>
                  </TableCell>

                  <TableCell className="max-w-xs text-xs text-muted-foreground">
                    <span className="line-clamp-2">
                      {s.weaknesses[0] ?? s.recommendedAction}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendParentAlert(s)}
                      disabled={isPending && sendingId === s.studentId}
                      className="h-7 text-[11px] gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 border-emerald-300"
                    >
                      {isPending && sendingId === s.studentId ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <MessageSquare className="h-3.5 w-3.5" />
                      )}
                      WhatsApp Parent
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
