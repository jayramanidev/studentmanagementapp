"use client";

import * as React from "react";
import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Search,
  Calendar,
  BookOpen,
  Award,
  Download,
  ExternalLink,
  CheckCircle2,
  XCircle,
  FileText,
  MessageSquare,
} from "lucide-react";
import { type StudentTestPerformanceItem } from "@/actions/performance";

interface StudentTestHistoryTableProps {
  testHistory: StudentTestPerformanceItem[];
}

export function StudentTestHistoryTable({
  testHistory,
}: StudentTestHistoryTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = useMemo(() => {
    return testHistory.filter((t) => {
      if (statusFilter === "PASS" && (!t.isPass || t.isAbsent)) return false;
      if (statusFilter === "FAIL" && (t.isPass || t.isAbsent)) return false;
      if (statusFilter === "ABSENT" && !t.isAbsent) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        t.testTitle.toLowerCase().includes(q) ||
        t.subjectName.toLowerCase().includes(q) ||
        (t.remarks && t.remarks.toLowerCase().includes(q))
      );
    });
  }, [testHistory, search, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3.5 rounded-xl border shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search test name, subject, remarks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
          >
            <option value="ALL">All Results ({testHistory.length})</option>
            <option value="PASS">Passed Only</option>
            <option value="FAIL">Failed Only</option>
            <option value="ABSENT">Absent Only</option>
          </select>
        </div>
      </div>

      {/* Test History Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold">Test Details</TableHead>
              <TableHead className="text-xs font-semibold">Subject</TableHead>
              <TableHead className="text-xs font-semibold">Date</TableHead>
              <TableHead className="text-xs font-semibold">Score / Max</TableHead>
              <TableHead className="text-center text-xs font-semibold">Result</TableHead>
              <TableHead className="text-center text-xs font-semibold">Class Rank</TableHead>
              <TableHead className="text-xs font-semibold">Teacher Remarks</TableHead>
              <TableHead className="text-right text-xs font-semibold">Answer Key</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-sm">
                  No test records found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => {
                const dateStr = new Date(t.testDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <TableRow key={t.testId} className="hover:bg-muted/30 transition">
                    {/* Test Title */}
                    <TableCell>
                      <div className="font-semibold text-sm leading-snug">{t.testTitle}</div>
                      <div className="text-[11px] text-muted-foreground capitalize">
                        {t.testType.replace(/_/g, " ").toLowerCase()}
                      </div>
                    </TableCell>

                    {/* Subject */}
                    <TableCell>
                      <div className="font-medium text-xs flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                        {t.subjectName}
                      </div>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {dateStr}
                      </div>
                    </TableCell>

                    {/* Score */}
                    <TableCell>
                      {t.isAbsent ? (
                        <span className="text-xs text-rose-600 font-semibold">ABSENT</span>
                      ) : (
                        <div className="text-xs">
                          <span className="font-bold text-foreground">
                            {t.marksObtained}
                          </span>{" "}
                          <span className="text-muted-foreground">/ {t.totalMarks}</span>
                          <span className="text-[10px] text-muted-foreground block">
                            ({t.percentage}%) • Class Avg: {t.batchAverage ?? "N/A"}
                          </span>
                        </div>
                      )}
                    </TableCell>

                    {/* Result */}
                    <TableCell className="text-center">
                      {t.isAbsent ? (
                        <Badge variant="outline" className="text-rose-600 border-rose-300 text-[10px]">
                          Absent
                        </Badge>
                      ) : t.isPass ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] gap-0.5">
                          <CheckCircle2 className="h-3 w-3 mr-0.5" /> Pass
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px] gap-0.5">
                          <XCircle className="h-3 w-3 mr-0.5" /> Fail
                        </Badge>
                      )}
                    </TableCell>

                    {/* Rank */}
                    <TableCell className="text-center">
                      {t.calculatedRank ? (
                        <Badge
                          variant="secondary"
                          className={`font-mono text-xs font-bold ${
                            t.calculatedRank === 1
                              ? "bg-amber-100 text-amber-900 border-amber-300"
                              : t.calculatedRank <= 3
                              ? "bg-slate-200 text-slate-900"
                              : ""
                          }`}
                        >
                          #{t.calculatedRank} <span className="font-normal text-[10px] text-muted-foreground">/ {t.batchTotalStudents}</span>
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">—</span>
                      )}
                    </TableCell>

                    {/* Teacher Remarks */}
                    <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                      {t.remarks ? (
                        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300" title={t.remarks}>
                          <MessageSquare className="h-3 w-3 text-indigo-500 shrink-0" />
                          {t.remarks}
                        </span>
                      ) : (
                        <span className="italic text-muted-foreground/60">—</span>
                      )}
                    </TableCell>

                    {/* Solution Download Button */}
                    <TableCell className="text-right">
                      {t.solutionPdfUrl ? (
                        <a
                          href={t.solutionPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 text-indigo-600 hover:text-indigo-700"
                          >
                            <Download className="h-3 w-3" /> Key
                          </Button>
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">N/A</span>
                      )}
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
