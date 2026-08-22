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
import { createMaterialAction } from "@/actions/materials";
import { type BatchItem } from "@/actions/batches";
import { type SubjectItem } from "@/actions/subjects";
import {
  BookOpen,
  Layers,
  FileText,
  Link2,
  Loader2,
  Bookmark,
} from "lucide-react";

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: BatchItem[];
  subjects: SubjectItem[];
  onSuccess?: () => void;
}

const CATEGORIES = [
  { id: "CLASS_NOTES", label: "Classroom Notes", badge: "Notes" },
  { id: "PYQ_PAPER", label: "Previous Year Paper (PYQ)", badge: "PYQ" },
  { id: "REFERENCE_BOOK", label: "Reference Material", badge: "Ref" },
  { id: "SYLLABUS_COPY", label: "Official Syllabus Copy", badge: "Syllabus" },
];

export function MaterialModal({
  isOpen,
  onClose,
  batches,
  subjects,
  onSuccess,
}: MaterialModalProps) {
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"CLASS_NOTES" | "PYQ_PAPER" | "REFERENCE_BOOK" | "SYLLABUS_COPY">("CLASS_NOTES");
  const [batchId, setBatchId] = useState(batches[0]?.id || "");
  const [subjectId, setSubjectId] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  const filteredSubjects = useMemo(() => {
    if (!batchId) return subjects;
    return subjects.filter((s) => s.batchId === batchId);
  }, [batchId, subjects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Material title is required");
      return;
    }
    if (!batchId) {
      toast.error("Please select a batch");
      return;
    }
    if (!fileUrl.trim()) {
      toast.error("Please enter a valid resource or document URL");
      return;
    }

    startTransition(async () => {
      const res = await createMaterialAction({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        batchId,
        subjectId: subjectId || undefined,
        fileUrl: fileUrl.trim(),
      });

      if (res.success) {
        toast.success("Study material published successfully!");
        setTitle("");
        setDescription("");
        setFileUrl("");
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.error || "Failed to upload material");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="h-5 w-5" />
            </div>
            Publish Study Resource
          </DialogTitle>
          <DialogDescription>
            Share lecture notes, PYQs, and syllabus documents with students.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="mTitle" className="text-xs font-semibold">
              Resource Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="mTitle"
              placeholder="e.g. Indian Constitution Articles 1-51A Complete PDF"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          {/* Category Chips */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Category</Label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id as any)}
                  className={`p-2 rounded-lg border text-left text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                    category === c.id
                      ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 dark:bg-indigo-950 font-semibold"
                      : "border-input bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{c.label}</span>
                  <Badge variant="outline" className="text-[9px] py-0 px-1">
                    {c.badge}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Batch & Subject Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mBatch" className="text-xs font-semibold flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                Batch <span className="text-destructive">*</span>
              </Label>
              <select
                id="mBatch"
                value={batchId}
                onChange={(e) => {
                  setBatchId(e.target.value);
                  const matching = subjects.filter((s) => s.batchId === e.target.value);
                  setSubjectId(matching[0]?.id || "");
                }}
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
              <Label htmlFor="mSub" className="text-xs font-semibold flex items-center gap-1">
                <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
                Subject (Optional)
              </Label>
              <select
                id="mSub"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full h-8 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
              >
                <option value="">-- General Batch Material --</option>
                {filteredSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* File URL */}
          <div className="space-y-1.5">
            <Label htmlFor="mUrl" className="text-xs font-semibold flex items-center gap-1">
              <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
              Document / Download URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="mUrl"
              placeholder="https://storage.instituteops.com/materials/polity-notes.pdf"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="mDesc" className="text-xs font-semibold">
              Description / Notes (Optional)
            </Label>
            <Textarea
              id="mDesc"
              placeholder="Brief summary of key concepts covered in this document..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
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
              Publish Material
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
