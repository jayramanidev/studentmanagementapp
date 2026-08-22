"use client";

import * as React from "react";
import { useState, useTransition } from "react";
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
import { createBatchAction, updateBatchAction, type BatchItem } from "@/actions/batches";
import { Loader2, Plus, Calendar, Layers, Building } from "lucide-react";

interface BatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch?: BatchItem | null;
  branches: Array<{ id: string; name: string; city: string }>;
  onSuccess?: () => void;
}

const COMMON_EXAMS = [
  "PSI (Police Sub-Inspector)",
  "Police Constable",
  "GPSC Class 1-2",
  "DySO / Mamlatdar",
  "Talati / Clerk",
  "UPSC CSAT",
];

export function BatchModal({
  isOpen,
  onClose,
  batch,
  branches,
  onSuccess,
}: BatchModalProps) {
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [targetExam, setTargetExam] = useState("");
  const [branchId, setBranchId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const isEditing = !!batch;

  React.useEffect(() => {
    if (batch) {
      setName(batch.name);
      setTargetExam(batch.targetExam);
      setBranchId(batch.branch.id);
      setStartDate(
        batch.startDate ? new Date(batch.startDate).toISOString().split("T")[0] : ""
      );
      setEndDate(
        batch.endDate ? new Date(batch.endDate).toISOString().split("T")[0] : ""
      );
    } else {
      setName("");
      setTargetExam("PSI");
      setBranchId(branches[0]?.id ?? "");
      setStartDate(new Date().toISOString().split("T")[0]);
      setEndDate("");
    }
  }, [batch, branches, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Batch name is required");
      return;
    }

    if (!targetExam.trim()) {
      toast.error("Target exam is required");
      return;
    }

    startTransition(async () => {
      const payload = {
        name: name.trim(),
        targetExam: targetExam.trim(),
        branchId: branchId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const res = isEditing
        ? await updateBatchAction(batch.id, payload)
        : await createBatchAction(payload);

      if (res.success) {
        toast.success(
          isEditing ? "Batch updated successfully!" : "Batch created successfully!"
        );
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.error || "Failed to save batch");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Layers className="h-5 w-5" />
            </div>
            {isEditing ? "Edit Batch" : "Create New Batch"}
          </DialogTitle>
          <DialogDescription>
            Configure batch details, target competitive exam, and date schedule.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Batch Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold">
              Batch Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., PSI 2026 Morning Batch"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          {/* Target Exam */}
          <div className="space-y-2">
            <Label htmlFor="targetExam" className="text-xs font-semibold">
              Target Competitive Exam <span className="text-destructive">*</span>
            </Label>
            <Input
              id="targetExam"
              placeholder="e.g., PSI, Constable, GPSC"
              value={targetExam}
              onChange={(e) => setTargetExam(e.target.value)}
              required
              disabled={isPending}
            />
            {/* Quick exam tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {COMMON_EXAMS.map((exam) => (
                <button
                  key={exam}
                  type="button"
                  onClick={() => setTargetExam(exam.split(" ")[0])}
                  className="inline-flex"
                >
                  <Badge
                    variant={targetExam.includes(exam.split(" ")[0]) ? "default" : "outline"}
                    className="text-[11px] cursor-pointer hover:opacity-80 transition"
                  >
                    {exam}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Branch & Dates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Branch */}
            <div className="space-y-1.5">
              <Label htmlFor="branch" className="text-xs font-semibold flex items-center gap-1">
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                Branch / Center
              </Label>
              <select
                id="branch"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                disabled={isPending}
                className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-popover text-popover-foreground">
                    {b.name} ({b.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <Label htmlFor="startDate" className="text-xs font-semibold flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <Label htmlFor="endDate" className="text-xs font-semibold flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              Target Completion / End Date (Optional)
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
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
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? "Update Batch" : "Create Batch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
