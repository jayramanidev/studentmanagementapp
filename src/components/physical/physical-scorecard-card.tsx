"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { type PhysicalRecordItem } from "@/actions/physical";
import {
  Activity,
  Timer,
  Award,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Calendar,
} from "lucide-react";

interface PhysicalScorecardCardProps {
  records: PhysicalRecordItem[];
}

export function PhysicalScorecardCard({ records }: PhysicalScorecardCardProps) {
  // Best score calculation
  const bestRecord = React.useMemo(() => {
    if (records.length === 0) return null;
    return [...records].sort((a, b) => b.runningMarks - a.runningMarks || a.runningTimeSeconds - b.runningTimeSeconds)[0];
  }, [records]);

  return (
    <div className="space-y-6">
      {/* Best Performance Header Banner */}
      <Card className="shadow-xs p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">
              Gujarat Police Physical Efficiency Test (PET)
            </span>
            <h2 className="text-2xl font-bold mt-0.5">Ground Readiness & PET Scorecard</h2>
            <p className="text-xs text-indigo-200 mt-1">
              Official physical fitness benchmarks for PSI & Police Constable selection.
            </p>
          </div>

          {bestRecord && (
            <div className="p-4 rounded-xl bg-white/10 border border-white/15 text-right">
              <span className="text-[10px] uppercase tracking-wider text-indigo-200 block">
                Personal Best (PB)
              </span>
              <div className="text-3xl font-black text-white mt-0.5">
                {bestRecord.runningTimeFormatted}
              </div>
              <div className="text-xs font-bold text-emerald-400 mt-0.5">
                {bestRecord.runningMarks} / 25 Marks
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Gujarat Police Scoring Criteria Reference */}
      <Card className="shadow-xs bg-muted/20 border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Official Gujarat Police 5000m (Male) Marks Criteria
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-card border">
              <span className="text-[10px] text-muted-foreground block">&le; 20:00 min</span>
              <strong className="text-emerald-600">25 Marks</strong>
            </div>
            <div className="p-2 rounded-lg bg-card border">
              <span className="text-[10px] text-muted-foreground block">20:01 - 21:00</span>
              <strong className="text-emerald-600">23 Marks</strong>
            </div>
            <div className="p-2 rounded-lg bg-card border">
              <span className="text-[10px] text-muted-foreground block">21:01 - 22:00</span>
              <strong className="text-indigo-600">21 Marks</strong>
            </div>
            <div className="p-2 rounded-lg bg-card border">
              <span className="text-[10px] text-muted-foreground block">22:01 - 23:00</span>
              <strong className="text-indigo-600">19 Marks</strong>
            </div>
            <div className="p-2 rounded-lg bg-card border">
              <span className="text-[10px] text-muted-foreground block">23:01 - 24:00</span>
              <strong className="text-amber-600">17 Marks</strong>
            </div>
            <div className="p-2 rounded-lg bg-card border">
              <span className="text-[10px] text-muted-foreground block">24:01 - 25:00</span>
              <strong className="text-amber-600">15 Marks</strong>
            </div>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
              <span className="text-[10px] text-rose-600 block">&gt; 25:00 min</span>
              <strong className="text-rose-600">Disqualified</strong>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trial History Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Timer className="h-4 w-4 text-indigo-600" />
            Ground Practice Trial History ({records.length} Recorded)
          </h3>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="text-xs font-semibold">Date</TableHead>
              <TableHead className="text-xs font-semibold">Candidate & Batch</TableHead>
              <TableHead className="text-xs font-semibold">Distance & Timing</TableHead>
              <TableHead className="text-xs font-semibold">Official Marks</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-xs font-semibold">Pull-Ups / Jump</TableHead>
              <TableHead className="text-xs font-semibold">Instructor Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground">
                  No physical fitness trial records logged yet.
                </TableCell>
              </TableRow>
            ) : (
              records.map((r) => {
                const dateStr = new Date(r.testDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <TableRow key={r.id} className="hover:bg-muted/20 transition">
                    <TableCell className="text-xs font-medium whitespace-nowrap">
                      {dateStr}
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-semibold">{r.studentName}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {r.batchName} ({r.rollNumber})
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-mono text-sm font-bold text-foreground">
                        {r.runningTimeFormatted}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {r.runningDistanceMeters}m ({r.gender})
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                        {r.runningMarks} / 25
                      </div>
                    </TableCell>

                    <TableCell>
                      {r.isQualified ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] gap-1 font-semibold">
                          <CheckCircle2 className="h-3 w-3" /> QUALIFIED
                        </Badge>
                      ) : (
                        <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px] gap-1 font-semibold">
                          <XCircle className="h-3 w-3" /> DISQUALIFIED
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {r.pullUpsCount !== null && (
                        <div>Beam: <strong>{r.pullUpsCount}</strong></div>
                      )}
                      {r.longJumpMeters !== null && (
                        <div>Jump: <strong>{r.longJumpMeters}m</strong></div>
                      )}
                      {r.pullUpsCount === null && r.longJumpMeters === null && "—"}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {r.remarks || "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
