"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getSubjectsAction,
  createSubjectAction,
  deleteSubjectAction,
  updateSubjectAction,
  type SubjectItem,
} from "@/actions/subjects";
import { type TeacherItem } from "@/actions/teachers";
import { type BatchItem } from "@/actions/batches";
import {
  BookOpen,
  Plus,
  Trash2,
  UserCheck,
  Loader2,
  GraduationCap,
  Sparkles,
  Layers,
} from "lucide-react";

interface SubjectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  batch: BatchItem | null;
  teachers: TeacherItem[];
  onUpdated?: () => void;
}

const COMMON_SUBJECT_SUGGESTIONS = [
  "Indian Polity & Constitution",
  "Gujarati Grammar & Literature",
  "History & Culture of Gujarat",
  "General Science & Tech",
  "Reasoning & Quantitative Aptitude",
  "Current Affairs & GK",
  "Indian Economy",
  "Geography & Environment",
  "English Comprehension",
  "IPC & CrPC (Law for Police/PSI)",
];

export function SubjectDrawer({
  isOpen,
  onClose,
  batch,
  teachers,
  onUpdated,
}: SubjectDrawerProps) {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [newSubjectName, setNewSubjectName] = useState("");
  const [newTeacherId, setNewTeacherId] = useState("");

  const loadSubjects = React.useCallback(async () => {
    if (!batch) return;
    setLoading(true);
    const res = await getSubjectsAction(batch.id);
    if (res.success) {
      setSubjects(res.data);
    } else {
      toast.error(res.error || "Failed to load subjects");
    }
    setLoading(false);
  }, [batch]);

  React.useEffect(() => {
    if (isOpen && batch) {
      loadSubjects();
      setNewSubjectName("");
      setNewTeacherId("");
    }
  }, [isOpen, batch, loadSubjects]);

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch) return;

    if (!newSubjectName.trim()) {
      toast.error("Subject name is required");
      return;
    }

    startTransition(async () => {
      const res = await createSubjectAction({
        name: newSubjectName.trim(),
        batchId: batch.id,
        teacherId: newTeacherId || undefined,
      });

      if (res.success) {
        toast.success(`Subject "${newSubjectName.trim()}" added!`);
        setNewSubjectName("");
        setNewTeacherId("");
        await loadSubjects();
        onUpdated?.();
      } else {
        toast.error(res.error || "Failed to add subject");
      }
    });
  };

  const handleDeleteSubject = (subjectId: string, subjectName: string) => {
    if (!confirm(`Are you sure you want to delete "${subjectName}"?`)) return;

    startTransition(async () => {
      const res = await deleteSubjectAction(subjectId);
      if (res.success) {
        toast.success("Subject removed");
        await loadSubjects();
        onUpdated?.();
      } else {
        toast.error(res.error || "Failed to delete subject");
      }
    });
  };

  const handleReassignTeacher = async (
    subject: SubjectItem,
    teacherId: string
  ) => {
    startTransition(async () => {
      const res = await updateSubjectAction(subject.id, {
        name: subject.name,
        teacherId: teacherId || null,
      });

      if (res.success) {
        toast.success("Faculty assignment updated");
        await loadSubjects();
        onUpdated?.();
      } else {
        toast.error(res.error || "Failed to update faculty");
      }
    });
  };

  if (!batch) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <span>Manage Subjects</span>
                <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                  {batch.name} • Target:{" "}
                  <Badge variant="outline" className="font-semibold ml-1">
                    {batch.targetExam}
                  </Badge>
                </span>
              </div>
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Add and assign faculty to subjects in this batch
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-3 pr-1">
          {/* Add Subject Form Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Plus className="h-3.5 w-3.5" />
              <span>Add Subject to Batch</span>
            </div>

            <form onSubmit={handleAddSubject} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="subName" className="text-xs font-semibold">
                    Subject Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="subName"
                    placeholder="e.g. Indian Polity"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    disabled={isPending}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="faculty" className="text-xs font-semibold flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                    Assign Faculty / Teacher
                  </Label>
                  <select
                    id="faculty"
                    value={newTeacherId}
                    onChange={(e) => setNewTeacherId(e.target.value)}
                    disabled={isPending}
                    className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  >
                    <option value="" className="bg-popover text-popover-foreground">
                      -- Unassigned / Assign Later --
                    </option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id} className="bg-popover text-popover-foreground">
                        {t.fullName} ({t.email ?? t.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick suggestion badges */}
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" /> Quick Add Suggestions:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {COMMON_SUBJECT_SUGGESTIONS.map((subj) => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => setNewSubjectName(subj)}
                      className="inline-flex"
                    >
                      <Badge
                        variant="secondary"
                        className="text-[10px] cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition"
                      >
                        + {subj}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending || !newSubjectName.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <Plus className="h-4 w-4" /> Add Subject
                </Button>
              </div>
            </form>
          </div>

          {/* Current Subjects List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <span>Current Subjects ({subjects.length})</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading subjects...
              </div>
            ) : subjects.length === 0 ? (
              <div className="text-center py-8 rounded-xl border border-dashed text-muted-foreground text-sm">
                No subjects added to this batch yet. Use the form above to add your first subject.
              </div>
            ) : (
              <div className="space-y-2.5">
                {subjects.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl border bg-card text-card-foreground shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mt-0.5">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{s.name}</div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>
                            {s._count.offlineTests}{" "}
                            {s._count.offlineTests === 1 ? "test" : "tests"}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                            {s.teacher ? (
                              <span className="font-medium text-foreground">
                                {s.teacher.fullName}
                              </span>
                            ) : (
                              <span className="italic text-amber-600 dark:text-amber-400">
                                Unassigned
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {/* Teacher selector inline */}
                      <select
                        value={s.teacherId ?? ""}
                        onChange={(e) =>
                          handleReassignTeacher(s, e.target.value)
                        }
                        disabled={isPending}
                        className="h-7 text-xs rounded-md border border-input bg-transparent px-2 outline-none focus-visible:border-ring dark:bg-input/30"
                        title="Reassign Teacher"
                      >
                        <option value="">-- No Faculty --</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.fullName}
                          </option>
                        ))}
                      </select>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDeleteSubject(s.id, s.name)}
                        disabled={isPending}
                        className="text-muted-foreground hover:text-destructive transition"
                        title="Delete Subject"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
