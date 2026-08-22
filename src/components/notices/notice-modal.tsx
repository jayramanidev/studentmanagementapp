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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createNoticeAction } from "@/actions/notices";
import { type BatchItem } from "@/actions/batches";
import {
  Megaphone,
  Pin,
  AlertCircle,
  Users,
  Layers,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface NoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: BatchItem[];
  onSuccess?: () => void;
}

const PRIORITIES = [
  { id: "INFO", label: "General Info", color: "border-blue-500 text-blue-700 bg-blue-50/50" },
  { id: "IMPORTANT", label: "Important", color: "border-amber-500 text-amber-700 bg-amber-50/50" },
  { id: "URGENT", label: "Urgent Alert", color: "border-rose-500 text-rose-700 bg-rose-50/50" },
];

const AUDIENCES = [
  { id: "ALL", label: "Entire Academy (Everyone)" },
  { id: "STUDENTS_ONLY", label: "Students Only" },
  { id: "PARENTS_ONLY", label: "Parents Only" },
  { id: "FACULTY_ONLY", label: "Faculty Only" },
];

export function NoticeModal({
  isOpen,
  onClose,
  batches,
  onSuccess,
}: NoticeModalProps) {
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"INFO" | "IMPORTANT" | "URGENT">("INFO");
  const [audience, setAudience] = useState<"ALL" | "STUDENTS_ONLY" | "PARENTS_ONLY" | "FACULTY_ONLY">("ALL");
  const [batchId, setBatchId] = useState<string>("");
  const [isPinned, setIsPinned] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Notice title is required");
      return;
    }
    if (!content.trim()) {
      toast.error("Notice content is required");
      return;
    }

    startTransition(async () => {
      const res = await createNoticeAction({
        title: title.trim(),
        content: content.trim(),
        priority,
        audience,
        batchId: batchId || undefined,
        isPinned,
      });

      if (res.success) {
        toast.success("Announcement broadcasted successfully!");
        setTitle("");
        setContent("");
        setIsPinned(false);
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.error || "Failed to post announcement");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Megaphone className="h-5 w-5" />
            </div>
            Broadcast Announcement
          </DialogTitle>
          <DialogDescription>
            Post official academy notices to students, parents, or faculty.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="nTitle" className="text-xs font-semibold">
              Announcement Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nTitle"
              placeholder="e.g. Physical Ground Practice Session & Mock Drill Timetable"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          {/* Priority Row */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Urgency Level</Label>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id as any)}
                  className={`p-2 rounded-lg border text-center text-xs font-semibold transition cursor-pointer ${
                    priority === p.id
                      ? `${p.color} ring-2 ring-indigo-500/40`
                      : "border-input bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target Audience & Batch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nAud" className="text-xs font-semibold flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                Target Audience
              </Label>
              <select
                id="nAud"
                value={audience}
                onChange={(e) => setAudience(e.target.value as any)}
                className="w-full h-8 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
              >
                {AUDIENCES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nBatch" className="text-xs font-semibold flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                Batch Specific (Optional)
              </Label>
              <select
                id="nBatch"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="w-full h-8 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
              >
                <option value="">-- All Batches --</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Message Content */}
          <div className="space-y-1.5">
            <Label htmlFor="nContent" className="text-xs font-semibold">
              Notice Details / Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="nContent"
              placeholder="Enter the complete text of the notice, including dates, venues, instructions, or items to bring..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
              disabled={isPending}
            />
          </div>

          {/* Pin Toggle */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/20">
            <input
              type="checkbox"
              id="isPinned"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <Label htmlFor="isPinned" className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
              <Pin className="h-3.5 w-3.5 text-indigo-600" />
              Pin to top of notice board for maximum visibility
            </Label>
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
              Publish Notice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
