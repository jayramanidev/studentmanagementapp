"use client";

import * as React from "react";
import { useState, useRef, useTransition, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CSVMarkImport } from "@/components/tests/csv-mark-import";
import { toast } from "sonner";
import { saveDraftMarksAction, publishMarksAction, bulkImportMarksFromCSVAction } from "@/actions/marks";
import { type StudentMarkEntry, type TestDetailResponse } from "@/actions/tests";
import {
  Save,
  Send,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Award,
  Users,
  TrendingUp,
  Clock,
  Sparkles,
  Loader2,
  Calendar,
  Layers,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MarkEntryGridProps {
  testData: TestDetailResponse;
  backUrl: string;
}

interface EditableStudentRow {
  studentUserId: string;
  studentName: string;
  rollNumber: string;
  marksObtained: string; // string for smooth editing
  isAbsent: boolean;
  remarks: string;
  calculatedRank: number | null;
}

export function MarkEntryGrid({ testData, backUrl }: MarkEntryGridProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { test, studentEntries } = testData;
  const totalMarks = test.totalMarks;
  const passingMarks = test.passingMarks;

  // Initialize editable rows state
  const [rows, setRows] = useState<EditableStudentRow[]>(() =>
    studentEntries.map((s) => ({
      studentUserId: s.studentUserId,
      studentName: s.studentName,
      rollNumber: s.rollNumber,
      marksObtained: s.marksObtained !== null && !s.isAbsent ? String(s.marksObtained) : "",
      isAbsent: s.isAbsent,
      remarks: s.remarks ?? "",
      calculatedRank: s.calculatedRank,
    }))
  );

  const [isPublished, setIsPublished] = useState(test.isPublished);

  // References to input elements for Enter/Arrow key navigation
  const markInputsRef = useRef<Map<number, HTMLInputElement | null>>(new Map());

  // Handle Mark Change
  const handleMarkChange = (index: number, val: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        marksObtained: val,
        // if user types a mark, ensure isAbsent is false
        isAbsent: val.trim() !== "" ? false : next[index].isAbsent,
      };
      return next;
    });
  };

  // Handle Absent Toggle
  const handleAbsentToggle = (index: number, checked: boolean) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        isAbsent: checked,
        marksObtained: checked ? "" : next[index].marksObtained,
      };
      return next;
    });
  };

  // Handle Remarks Change
  const handleRemarksChange = (index: number, val: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        remarks: val,
      };
      return next;
    });
  };

  // Keyboard navigation: Enter or Down moves to next student's score input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = index + 1;
      if (nextIndex < rows.length) {
        const nextInput = markInputsRef.current.get(nextIndex);
        nextInput?.focus();
        nextInput?.select();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = index - 1;
      if (prevIndex >= 0) {
        const prevInput = markInputsRef.current.get(prevIndex);
        prevInput?.focus();
        prevInput?.select();
      }
    }
  };

  // Instant client-side performance analytics
  const liveStats = useMemo(() => {
    let appeared = 0;
    let absent = 0;
    let passCount = 0;
    let sum = 0;
    let highest: number | null = null;
    let lowest: number | null = null;

    for (const r of rows) {
      if (r.isAbsent || r.marksObtained.trim() === "") {
        absent++;
      } else {
        const score = parseFloat(r.marksObtained);
        if (!isNaN(score)) {
          appeared++;
          sum += score;
          if (highest === null || score > highest) highest = score;
          if (lowest === null || score < lowest) lowest = score;
          if (score >= passingMarks) passCount++;
        }
      }
    }

    const avg = appeared > 0 ? (sum / appeared).toFixed(1) : "—";
    const passRate = appeared > 0 ? ((passCount / appeared) * 100).toFixed(0) : "0";

    return {
      total: rows.length,
      appeared,
      absent,
      avg,
      highest: highest !== null ? highest : "—",
      lowest: lowest !== null ? lowest : "—",
      passRate,
    };
  }, [rows, passingMarks]);

  // Quick Action: Mark All Present
  const handleMarkAllPresent = () => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        isAbsent: false,
      }))
    );
    toast.info("All students set to Present");
  };

  // Format Payload for Server Action
  const preparePayload = () => {
    return rows.map((r) => ({
      studentId: r.studentUserId,
      marksObtained:
        !r.isAbsent && r.marksObtained.trim() !== ""
          ? parseFloat(r.marksObtained)
          : null,
      isAbsent: r.isAbsent,
      remarks: r.remarks.trim() || undefined,
    }));
  };

  // Action: Save Draft
  const handleSaveDraft = () => {
    startTransition(async () => {
      const payload = preparePayload();
      const res = await saveDraftMarksAction(test.id, payload);

      if (res.success) {
        toast.success("Draft marks saved successfully!");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to save draft");
      }
    });
  };

  // Action: Publish Marks
  const handlePublishMarks = () => {
    // Check if any mark exceeds totalMarks
    for (const r of rows) {
      if (!r.isAbsent && r.marksObtained.trim() !== "") {
        const val = parseFloat(r.marksObtained);
        if (val > totalMarks) {
          toast.error(
            `Score for ${r.studentName} (${val}) exceeds Maximum Marks (${totalMarks})`
          );
          return;
        }
      }
    }

    if (
      !confirm(
        `Publish marks for "${test.title}"? This will compute competition ranks and make results visible to students and parents.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const payload = preparePayload();
      const res = await publishMarksAction(test.id, payload);

      if (res.success) {
        setIsPublished(true);
        toast.success(
          `Marks published! Class Average: ${res.data.stats.batchAverage ?? "N/A"} | Top Score: ${res.data.stats.highestScore ?? "N/A"}`
        );
        router.refresh();
      } else {
        toast.error(res.error || "Failed to publish marks");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Test Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={backUrl}>
            <Button variant="outline" size="icon-sm" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{test.title}</h1>
              {isPublished ? (
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Published
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950 text-[10px]">
                  <Clock className="h-3 w-3 mr-1" /> Draft Mode
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3 text-indigo-500" />
                {test.batch.name} ({test.batch.targetExam})
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3 text-purple-500" />
                {test.subject.name}
              </span>
              <span>•</span>
              <span className="font-semibold text-foreground">
                Max Marks: {totalMarks} (Pass: {passingMarks})
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={isPending}
            className="text-xs gap-1.5"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save Draft
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handlePublishMarks}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-xs"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Publish & Calculate Ranks
          </Button>
        </div>
      </div>

      {/* Real-time KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="shadow-xs p-3 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">Total Enrolled</span>
          <div className="text-xl font-bold text-foreground">{liveStats.total}</div>
        </Card>
        <Card className="shadow-xs p-3 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">Present</span>
          <div className="text-xl font-bold text-blue-600">{liveStats.appeared}</div>
        </Card>
        <Card className="shadow-xs p-3 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">Absent</span>
          <div className="text-xl font-bold text-rose-600">{liveStats.absent}</div>
        </Card>
        <Card className="shadow-xs p-3 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">Class Average</span>
          <div className="text-xl font-bold text-purple-600">
            {liveStats.avg} <span className="text-xs font-normal text-muted-foreground">/ {totalMarks}</span>
          </div>
        </Card>
        <Card className="shadow-xs p-3 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">Highest Score</span>
          <div className="text-xl font-bold text-emerald-600">
            {liveStats.highest} <span className="text-xs font-normal text-muted-foreground">/ {totalMarks}</span>
          </div>
        </Card>
        <Card className="shadow-xs p-3 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">Pass Rate</span>
          <div className="text-xl font-bold text-indigo-600">{liveStats.passRate}%</div>
        </Card>
      </div>

      {/* Tabs / Entry Views */}
      <Tabs defaultValue="manual" className="w-full">
        {!isPublished && (
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="manual" className="text-xs">Manual Entry</TabsTrigger>
              <TabsTrigger value="csv" className="text-xs">CSV Import</TabsTrigger>
            </TabsList>
          </div>
        )}
        
        <TabsContent value="manual" className="mt-0 outline-none">
          {/* Rapid Mark Entry Grid */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
            <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Rapid Mark Entry Grid — Press <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono text-[10px]">Enter</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono text-[10px]">↓</kbd> to jump to the next student
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleMarkAllPresent}
            className="text-xs h-7 text-indigo-600 hover:text-indigo-700"
          >
            Mark All Present
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[80px] text-xs font-semibold">#</TableHead>
              <TableHead className="w-[140px] text-xs font-semibold">Roll No</TableHead>
              <TableHead className="text-xs font-semibold">Student Name</TableHead>
              <TableHead className="w-[100px] text-center text-xs font-semibold">Absent?</TableHead>
              <TableHead className="w-[180px] text-xs font-semibold">
                Marks Obtained (Max {totalMarks})
              </TableHead>
              {isPublished && (
                <TableHead className="w-[100px] text-center text-xs font-semibold">
                  Rank
                </TableHead>
              )}
              <TableHead className="text-xs font-semibold">Teacher Remarks (Optional)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isPublished ? 7 : 6} className="h-32 text-center text-muted-foreground text-sm">
                  No students enrolled in this batch. Go to Student Directory to add students first.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => {
                const initials = row.studentName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                const parsedScore = parseFloat(row.marksObtained);
                const isValidScore = !isNaN(parsedScore);
                const isOverLimit = isValidScore && parsedScore > totalMarks;
                const isPassing = isValidScore && parsedScore >= passingMarks;

                return (
                  <TableRow
                    key={row.studentUserId}
                    className={`transition ${
                      row.isAbsent
                        ? "bg-slate-50/70 dark:bg-slate-900/50 opacity-60"
                        : isOverLimit
                        ? "bg-rose-50/80 dark:bg-rose-950/40"
                        : "hover:bg-muted/20"
                    }`}
                  >
                    {/* Index */}
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {idx + 1}
                    </TableCell>

                    {/* Roll Number */}
                    <TableCell className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {row.rollNumber}
                    </TableCell>

                    {/* Student Name */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7 text-[10px] font-bold bg-slate-200 dark:bg-slate-800">
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-sm">{row.studentName}</span>
                      </div>
                    </TableCell>

                    {/* Absent Toggle */}
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={row.isAbsent}
                        onChange={(e) => handleAbsentToggle(idx, e.target.checked)}
                        disabled={isPending}
                        className="h-4 w-4 rounded border-input text-rose-600 focus:ring-rose-500 cursor-pointer"
                        title="Mark student absent"
                      />
                    </TableCell>

                    {/* Marks Input */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          ref={(el) => {
                            markInputsRef.current.set(idx, el);
                          }}
                          type="number"
                          step="0.5"
                          min={0}
                          max={totalMarks}
                          placeholder={row.isAbsent ? "ABSENT" : `0 - ${totalMarks}`}
                          value={row.isAbsent ? "" : row.marksObtained}
                          onChange={(e) => handleMarkChange(idx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx)}
                          disabled={row.isAbsent || isPending}
                          className={`h-8 font-mono text-sm font-semibold ${
                            isOverLimit
                              ? "border-destructive text-destructive"
                              : isValidScore && isPassing
                              ? "border-emerald-500 text-emerald-700 dark:text-emerald-400"
                              : ""
                          }`}
                        />
                        {isValidScore && !row.isAbsent && (
                          <Badge
                            variant={isPassing ? "default" : "destructive"}
                            className="text-[10px] px-1.5 h-6 shrink-0"
                          >
                            {isPassing ? "PASS" : "FAIL"}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Calculated Rank (if published) */}
                    {isPublished && (
                      <TableCell className="text-center">
                        {row.calculatedRank ? (
                          <Badge
                            variant="secondary"
                            className={`font-mono text-xs font-bold ${
                              row.calculatedRank === 1
                                ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300"
                                : row.calculatedRank <= 3
                                ? "bg-slate-200 text-slate-900 dark:bg-slate-800"
                                : ""
                            }`}
                          >
                            #{row.calculatedRank}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        )}
                      </TableCell>
                    )}

                    {/* Remarks */}
                    <TableCell>
                      <Input
                        placeholder="e.g. Good performance"
                        value={row.remarks}
                        onChange={(e) => handleRemarksChange(idx, e.target.value)}
                        disabled={isPending}
                        className="h-8 text-xs text-muted-foreground"
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Footer save prompt */}
        <div className="p-4 border-t bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Make sure to click <strong className="text-foreground">Publish & Calculate Ranks</strong> once all scores are entered to generate student ranks.
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={isPending}
              className="text-xs gap-1"
            >
              <Save className="h-3.5 w-3.5" /> Save Draft
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePublishMarks}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1 shadow-xs"
            >
              <Send className="h-3.5 w-3.5" /> Publish & Calculate Ranks
            </Button>
          </div>
        </div>
        </div>
      </TabsContent>

        {!isPublished && (
          <TabsContent value="csv" className="mt-0 outline-none">
            <CSVMarkImport
              testId={test.id}
              students={studentEntries.map((s) => ({
                rollNumber: s.rollNumber,
                fullName: s.studentName,
                userId: s.studentUserId,
              }))}
              onImport={async (rows) => {
                const res = await bulkImportMarksFromCSVAction(test.id, rows);
                if (res.success) {
                  router.refresh(); // Refresh page to reload rows
                  return { success: true, count: res.data?.savedCount };
                } else {
                  return { success: false, error: res.error };
                }
              }}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
