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
import { createSyllabusTopicsAction } from "@/actions/syllabus";
import { type BatchItem } from "@/actions/batches";
import {
  Plus,
  Trash2,
  Layers,
  BookOpen,
  ListChecks,
  Loader2,
} from "lucide-react";

interface SubjectOption {
  id: string;
  name: string;
}

interface SyllabusAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: BatchItem[];
  subjects: SubjectOption[];
  onSuccess?: () => void;
}

export function SyllabusAddModal({
  isOpen,
  onClose,
  batches,
  subjects,
  onSuccess,
}: SyllabusAddModalProps) {
  const [isPending, startTransition] = useTransition();

  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || "");
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || "");
  const [chapterName, setChapterName] = useState("");
  const [topicInputs, setTopicInputs] = useState<string[]>(["", "", ""]);

  const addTopicSlot = () => {
    setTopicInputs((prev) => [...prev, ""]);
  };

  const removeTopicSlot = (idx: number) => {
    setTopicInputs((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateTopic = (idx: number, value: string) => {
    setTopicInputs((prev) => prev.map((t, i) => (i === idx ? value : t)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validTopics = topicInputs.map((t) => t.trim()).filter((t) => t.length > 0);
    if (!chapterName.trim()) {
      toast.error("Chapter name is required.");
      return;
    }
    if (validTopics.length === 0) {
      toast.error("At least one topic is required.");
      return;
    }

    startTransition(async () => {
      const res = await createSyllabusTopicsAction({
        batchId: selectedBatchId,
        subjectId: selectedSubjectId || undefined,
        chapterName: chapterName.trim(),
        topics: validTopics,
      });

      if (res.success) {
        toast.success(`Added ${res.data.count} topics to "${chapterName.trim()}"!`);
        setChapterName("");
        setTopicInputs(["", "", ""]);
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.error || "Failed to create topics.");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[88vh] flex flex-col">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <ListChecks className="h-5 w-5" />
            </div>
            Add Syllabus Chapter & Topics
          </DialogTitle>
          <DialogDescription>
            Define chapter-wise topics for a batch's competitive exam syllabus.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
          {/* Batch & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sBatch" className="text-xs font-semibold flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                Batch <span className="text-destructive">*</span>
              </Label>
              <select
                id="sBatch"
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.targetExam})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sSub" className="text-xs font-semibold flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                Subject <span className="text-destructive">*</span>
              </Label>
              <select
                id="sSub"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chapter Name */}
          <div className="space-y-1.5">
            <Label htmlFor="chName" className="text-xs font-semibold">
              Chapter Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="chName"
              placeholder='e.g. "Fundamental Rights & Duties" or "Gujarati Vyakaran – Chhand"'
              value={chapterName}
              onChange={(e) => setChapterName(e.target.value)}
              required
            />
          </div>

          {/* Dynamic Topic Slots */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">
                Topics in this Chapter <span className="text-destructive">*</span>
              </Label>
              <Badge variant="outline" className="text-[10px]">
                {topicInputs.filter((t) => t.trim()).length} topics
              </Badge>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {topicInputs.map((val, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground font-mono w-5 text-right shrink-0">
                    {idx + 1}.
                  </span>
                  <Input
                    placeholder={`Topic ${idx + 1}`}
                    value={val}
                    onChange={(e) => updateTopic(idx, e.target.value)}
                    className="h-8 text-xs"
                  />
                  {topicInputs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTopicSlot(idx)}
                      className="text-muted-foreground hover:text-rose-600 transition cursor-pointer shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTopicSlot}
              className="w-full h-7 text-xs gap-1"
            >
              <Plus className="h-3 w-3" /> Add Another Topic
            </Button>
          </div>

          <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Chapter & Topics
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
