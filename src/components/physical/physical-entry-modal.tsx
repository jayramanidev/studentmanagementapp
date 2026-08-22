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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { recordPhysicalTrialAction } from "@/actions/physical";
import { type BatchItem } from "@/actions/batches";
import { type StudentListItem } from "@/actions/students";
import {
  calculateMale5000mMarks,
  calculateFemale1600mMarks,
} from "@/lib/physical-calculator";
import {
  Timer,
  Layers,
  User,
  Activity,
  Award,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface PhysicalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: BatchItem[];
  students: StudentListItem[];
  onSuccess?: () => void;
}

export function PhysicalEntryModal({
  isOpen,
  onClose,
  batches,
  students,
  onSuccess,
}: PhysicalEntryModalProps) {
  const [isPending, startTransition] = useTransition();

  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || "");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [testDate, setTestDate] = useState(new Date().toISOString().split("T")[0]);
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [minutes, setMinutes] = useState<number>(19);
  const [seconds, setSeconds] = useState<number>(45);
  const [pullUpsCount, setPullUpsCount] = useState<number>(8);
  const [longJumpMeters, setLongJumpMeters] = useState<number>(4.2);
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

  // Live Score Preview
  const totalSeconds = (minutes || 0) * 60 + (seconds || 0);
  const scorePreview = useMemo(() => {
    return gender === "MALE"
      ? calculateMale5000mMarks(totalSeconds)
      : calculateFemale1600mMarks(totalSeconds);
  }, [gender, totalSeconds]);

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

    startTransition(async () => {
      const res = await recordPhysicalTrialAction({
        studentId: selectedStudentId,
        batchId: selectedBatchId,
        testDate,
        gender,
        minutes: Number(minutes),
        seconds: Number(seconds),
        pullUpsCount: pullUpsCount !== undefined ? Number(pullUpsCount) : undefined,
        longJumpMeters: longJumpMeters !== undefined ? Number(longJumpMeters) : undefined,
        remarks: remarks.trim() || undefined,
      });

      if (res.success) {
        toast.success(
          `Physical trial recorded! Score: ${scorePreview.runningMarks}/25 (${
            scorePreview.isQualified ? "QUALIFIED" : "DISQUALIFIED"
          })`
        );
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.error || "Failed to record physical trial");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[88vh] flex flex-col">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Activity className="h-5 w-5" />
            </div>
            Record Ground Fitness Trial
          </DialogTitle>
          <DialogDescription>
            Log 5000m/1600m running times and compute Gujarat Police physical scores.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
          {/* Batch & Student */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pBatch" className="text-xs font-semibold flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                Batch <span className="text-destructive">*</span>
              </Label>
              <select
                id="pBatch"
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
              <Label htmlFor="pStudent" className="text-xs font-semibold flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Student Candidate <span className="text-destructive">*</span>
              </Label>
              <select
                id="pStudent"
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

          {/* Date & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pDate" className="text-xs font-semibold">
                Trial Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pDate"
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Gender & Distance</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender("MALE")}
                  className={`p-2 rounded-lg border text-center text-xs font-medium transition cursor-pointer ${
                    gender === "MALE"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950 font-semibold"
                      : "border-input bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Male (5000m)
                </button>
                <button
                  type="button"
                  onClick={() => setGender("FEMALE")}
                  className={`p-2 rounded-lg border text-center text-xs font-medium transition cursor-pointer ${
                    gender === "FEMALE"
                      ? "border-pink-600 bg-pink-50 text-pink-900 dark:bg-pink-950 font-semibold"
                      : "border-input bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Female (1600m)
                </button>
              </div>
            </div>
          </div>

          {/* Running Stopwatch Time (Minutes : Seconds) */}
          <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <Timer className="h-4 w-4 text-indigo-600" />
                Stopwatch Running Timing <span className="text-destructive">*</span>
              </Label>
              <Badge
                className={
                  scorePreview.isQualified
                    ? "bg-emerald-600 text-white font-bold"
                    : "bg-rose-600 text-white font-bold"
                }
              >
                {scorePreview.isQualified ? "QUALIFIED" : "DISQUALIFIED (>25m)"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="rMin" className="text-[11px] text-muted-foreground">
                  Minutes (mm)
                </Label>
                <Input
                  id="rMin"
                  type="number"
                  min={0}
                  max={60}
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="rSec" className="text-[11px] text-muted-foreground">
                  Seconds (ss)
                </Label>
                <Input
                  id="rSec"
                  type="number"
                  min={0}
                  max={59}
                  value={seconds}
                  onChange={(e) => setSeconds(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            {/* Live Score Output */}
            <div className="pt-2 flex items-center justify-between border-t text-xs">
              <span className="text-muted-foreground">
                Time: <strong>{scorePreview.runningTimeFormatted}</strong>
              </span>
              <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                Official Marks: {scorePreview.runningMarks} / 25
              </span>
            </div>
          </div>

          {/* Pull-Ups & Long Jump */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pPull" className="text-xs font-semibold">
                Pull-Ups / Beam Count
              </Label>
              <Input
                id="pPull"
                type="number"
                min={0}
                max={30}
                value={pullUpsCount}
                onChange={(e) => setPullUpsCount(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pJump" className="text-xs font-semibold">
                Long Jump (Meters)
              </Label>
              <Input
                id="pJump"
                type="number"
                step="0.1"
                min={0}
                max={10}
                value={longJumpMeters}
                onChange={(e) => setLongJumpMeters(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <Label htmlFor="pRemarks" className="text-xs font-semibold">
              Ground Instructor Remarks
            </Label>
            <Textarea
              id="pRemarks"
              placeholder="e.g. Good endurance pace. Advised to improve first 2km split time."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
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
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Ground Trial Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
