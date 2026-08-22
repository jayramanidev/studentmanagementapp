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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createTestAction, updateTestAction, type TestListItem } from "@/actions/tests";
import { type BatchItem } from "@/actions/batches";
import { type SubjectItem } from "@/actions/subjects";
import {
  ClipboardList,
  Calendar,
  Layers,
  BookOpen,
  FileText,
  CheckCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

interface TestModalProps {
  isOpen: boolean;
  onClose: () => void;
  test?: TestListItem | null;
  batches: BatchItem[];
  subjects: SubjectItem[];
  onSuccess?: () => void;
}

const TEST_TYPES = [
  { id: "WEEKLY_UNIT", label: "Weekly Unit Test", badge: "Unit" },
  { id: "MONTHLY_MOCK", label: "Monthly Mock Exam", badge: "Mock" },
  { id: "SURPRISE_QUIZ", label: "Surprise Quiz", badge: "Quiz" },
  { id: "FULL_LENGTH", label: "Full Length Paper", badge: "Grand" },
];

export function TestModal({
  isOpen,
  onClose,
  test,
  batches,
  subjects,
  onSuccess,
}: TestModalProps) {
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [batchId, setBatchId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [testType, setTestType] = useState<"WEEKLY_UNIT" | "MONTHLY_MOCK" | "SURPRISE_QUIZ" | "FULL_LENGTH">("WEEKLY_UNIT");
  const [totalMarks, setTotalMarks] = useState<number>(50);
  const [passingMarks, setPassingMarks] = useState<number>(20);
  const [testDate, setTestDate] = useState("");
  const [solutionPdfUrl, setSolutionPdfUrl] = useState("");

  const isEditing = !!test;

  // Filter subjects based on selected batch
  const filteredSubjects = useMemo(() => {
    if (!batchId) return subjects;
    return subjects.filter((s) => s.batchId === batchId);
  }, [batchId, subjects]);

  React.useEffect(() => {
    if (test) {
      setTitle(test.title);
      setBatchId(test.batch.id);
      setSubjectId(test.subject.id);
      setTestType(test.type as any);
      setTotalMarks(test.totalMarks);
      setPassingMarks(test.passingMarks);
      setTestDate(new Date(test.testDate).toISOString().split("T")[0]);
      setSolutionPdfUrl(test.solutionPdfUrl ?? "");
    } else {
      const defaultBatch = batches[0];
      const initialBatchId = defaultBatch?.id ?? "";
      setBatchId(initialBatchId);

      const matchingSubs = subjects.filter((s) => s.batchId === initialBatchId);
      setSubjectId(matchingSubs[0]?.id ?? "");

      setTitle("Unit Test 1");
      setTestType("WEEKLY_UNIT");
      setTotalMarks(50);
      setPassingMarks(20);
      setTestDate(new Date().toISOString().split("T")[0]);
      setSolutionPdfUrl("");
    }
  }, [test, batches, subjects, isOpen]);

  const handleBatchChange = (newBatchId: string) => {
    setBatchId(newBatchId);
    const matching = subjects.filter((s) => s.batchId === newBatchId);
    setSubjectId(matching[0]?.id ?? "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Test title is required");
      return;
    }

    if (!batchId) {
      toast.error("Please select a batch");
      return;
    }

    if (!subjectId) {
      toast.error("Please select a subject");
      return;
    }

    if (passingMarks > totalMarks) {
      toast.error("Passing marks cannot exceed Total marks");
      return;
    }

    startTransition(async () => {
      const payload = {
        title: title.trim(),
        batchId,
        subjectId,
        type: testType,
        totalMarks: Number(totalMarks),
        passingMarks: Number(passingMarks),
        testDate,
        solutionPdfUrl: solutionPdfUrl.trim() || undefined,
      };

      const res = isEditing
        ? await updateTestAction(test.id, payload)
        : await createTestAction(payload);

      if (res.success) {
        toast.success(
          isEditing ? "Offline test updated!" : "Offline test scheduled successfully!"
        );
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.error || "Failed to schedule test");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[88vh] flex flex-col">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <ClipboardList className="h-5 w-5" />
            </div>
            {isEditing ? "Edit Offline Test" : "Schedule Offline Test"}
          </DialogTitle>
          <DialogDescription>
            Schedule a physical classroom test, configure marks criteria, and upload solution keys.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
          {/* Test Title */}
          <div className="space-y-1.5">
            <Label htmlFor="testTitle" className="text-xs font-semibold">
              Test Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="testTitle"
              placeholder="e.g., Polity Unit Test 1 — Fundamental Rights"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          {/* Batch & Subject Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tBatch" className="text-xs font-semibold flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                Target Batch <span className="text-destructive">*</span>
              </Label>
              <select
                id="tBatch"
                value={batchId}
                onChange={(e) => handleBatchChange(e.target.value)}
                disabled={isPending}
                required
                className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
              >
                <option value="">-- Select Batch --</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.targetExam})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tSubject" className="text-xs font-semibold flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                Subject <span className="text-destructive">*</span>
              </Label>
              <select
                id="tSubject"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                disabled={isPending || filteredSubjects.length === 0}
                required
                className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
              >
                <option value="">-- Select Subject --</option>
                {filteredSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Test Type selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Test Format</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEST_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setTestType(type.id as any)}
                  className={`p-2.5 rounded-lg border text-left text-xs font-medium transition cursor-pointer flex flex-col justify-between gap-1 ${
                    testType === type.id
                      ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 dark:bg-indigo-950/70 dark:text-indigo-200 dark:border-indigo-500 font-semibold"
                      : "border-input bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{type.label}</span>
                  <Badge variant="outline" className="text-[9px] w-fit py-0 px-1">
                    {type.badge}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Total Marks, Passing Marks & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="totalMarks" className="text-xs font-semibold">
                Total Marks <span className="text-destructive">*</span>
              </Label>
              <Input
                id="totalMarks"
                type="number"
                min={1}
                max={500}
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="passingMarks" className="text-xs font-semibold">
                Passing Marks <span className="text-destructive">*</span>
              </Label>
              <Input
                id="passingMarks"
                type="number"
                min={0}
                max={totalMarks}
                value={passingMarks}
                onChange={(e) => setPassingMarks(Number(e.target.value))}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="testDate" className="text-xs font-semibold flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Test Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="testDate"
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
          </div>

          {/* Solution PDF / Answer Key URL */}
          <div className="space-y-1.5 pt-1">
            <Label htmlFor="solUrl" className="text-xs font-semibold flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Solution PDF / Answer Key URL (Optional)
            </Label>
            <Input
              id="solUrl"
              placeholder="https://storage.instituteops.com/solutions/polity-test-1.pdf"
              value={solutionPdfUrl}
              onChange={(e) => setSolutionPdfUrl(e.target.value)}
              disabled={isPending}
            />
            <p className="text-[10px] text-muted-foreground">
              Students and parents can download this answer key once marks are published.
            </p>
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
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? "Update Test" : "Schedule Test"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
