"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { BatchModal } from "@/components/admin/batch-modal";
import { SubjectDrawer } from "@/components/admin/subject-drawer";
import { toast } from "sonner";
import { deleteBatchAction, type BatchItem } from "@/actions/batches";
import { type TeacherItem } from "@/actions/teachers";
import {
  Layers,
  Plus,
  BookOpen,
  Users,
  Calendar,
  Building,
  Edit2,
  Trash2,
  GraduationCap,
  ClipboardList,
  Target,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface BatchesClientProps {
  initialBatches: BatchItem[];
  branches: Array<{ id: string; name: string; city: string }>;
  teachers: TeacherItem[];
}

export function BatchesClient({
  initialBatches,
  branches,
  teachers,
}: BatchesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [batchesModalOpen, setBatchesModalOpen] = useState(false);
  const [selectedBatchForEdit, setSelectedBatchForEdit] = useState<BatchItem | null>(null);

  const [subjectDrawerOpen, setSubjectDrawerOpen] = useState(false);
  const [selectedBatchForSubjects, setSelectedBatchForSubjects] = useState<BatchItem | null>(null);

  const handleCreateNew = () => {
    setSelectedBatchForEdit(null);
    setBatchesModalOpen(true);
  };

  const handleEdit = (batch: BatchItem) => {
    setSelectedBatchForEdit(batch);
    setBatchesModalOpen(true);
  };

  const handleManageSubjects = (batch: BatchItem) => {
    setSelectedBatchForSubjects(batch);
    setSubjectDrawerOpen(true);
  };

  const handleDelete = (batch: BatchItem) => {
    if (
      !confirm(
        `Are you sure you want to delete batch "${batch.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await deleteBatchAction(batch.id);
      if (res.success) {
        toast.success("Batch deleted successfully");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete batch");
      }
    });
  };

  // Compute aggregate stats
  const totalStudents = initialBatches.reduce(
    (acc, b) => acc + (b._count?.studentProfiles ?? 0),
    0
  );
  const totalSubjects = initialBatches.reduce(
    (acc, b) => acc + (b._count?.subjects ?? 0),
    0
  );
  const uniqueExams = Array.from(
    new Set(initialBatches.map((b) => b.targetExam))
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Layers className="h-6 w-6" />
            </div>
            Batches & Academics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage exam cohorts, target syllabus, subjects, and assigned instructors.
          </p>
        </div>

        <Button
          onClick={handleCreateNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-xs"
        >
          <Plus className="h-4 w-4" /> Create New Batch
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Batches
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 flex items-baseline justify-between">
            <div className="text-2xl font-bold">{initialBatches.length}</div>
            <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
              <Layers className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Enrolled Students
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 flex items-baseline justify-between">
            <div className="text-2xl font-bold">{totalStudents}</div>
            <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600">
              <Users className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Active Subjects
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 flex items-baseline justify-between">
            <div className="text-2xl font-bold">{totalSubjects}</div>
            <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-600">
              <BookOpen className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Target Exams
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 flex items-baseline justify-between">
            <div className="text-2xl font-bold">{uniqueExams.length}</div>
            <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <Target className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batches Grid */}
      {initialBatches.length === 0 ? (
        <Card className="p-12 text-center shadow-xs border-dashed">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="p-4 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
              <Layers className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg">No batches created yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                Create your first coaching batch to start enrolling students and scheduling physical tests.
              </p>
            </div>
            <Button
              onClick={handleCreateNew}
              className="bg-indigo-600 hover:bg-indigo-700 text-white mt-2"
            >
              <Plus className="h-4 w-4 mr-2" /> Create First Batch
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialBatches.map((batch) => {
            const startDateStr = batch.startDate
              ? new Date(batch.startDate).toLocaleDateString("en-IN", {
                  month: "short",
                  year: "numeric",
                })
              : "No date";
            const endDateStr = batch.endDate
              ? new Date(batch.endDate).toLocaleDateString("en-IN", {
                  month: "short",
                  year: "numeric",
                })
              : "Ongoing";

            return (
              <Card
                key={batch.id}
                className="shadow-xs hover:border-indigo-500/50 transition-all flex flex-col justify-between"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge
                        variant="secondary"
                        className="text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 mb-1.5"
                      >
                        {batch.targetExam}
                      </Badge>
                      <CardTitle className="text-base font-bold leading-snug">
                        {batch.name}
                      </CardTitle>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEdit(batch)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Edit Batch"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(batch)}
                        disabled={isPending}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title="Delete Batch"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                    <Building className="h-3.5 w-3.5" />
                    <span>
                      {batch.branch.name} ({batch.branch.city})
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-0 pb-3 space-y-3">
                  {/* Timeline */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border">
                    <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                    <span>
                      {startDateStr} → {endDateStr}
                    </span>
                  </div>

                  {/* Metrics Pill Row */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-muted/40">
                      <div className="font-bold text-foreground">
                        {batch._count.studentProfiles}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Students</div>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/40">
                      <div className="font-bold text-foreground">
                        {batch._count.subjects}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Subjects</div>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/40">
                      <div className="font-bold text-foreground">
                        {batch._count.offlineTests}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Tests</div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-5 pt-0 border-t flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManageSubjects(batch)}
                    className="flex-1 text-xs gap-1.5 hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-950/50"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Subjects & Faculty ({batch._count.subjects})
                  </Button>

                  <Link href={`/admin/students`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      title="View enrolled students"
                    >
                      <Users className="h-3.5 w-3.5 mr-1" />
                      Students
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals & Drawers */}
      <BatchModal
        isOpen={batchesModalOpen}
        onClose={() => setBatchesModalOpen(false)}
        batch={selectedBatchForEdit}
        branches={branches}
        onSuccess={() => router.refresh()}
      />

      <SubjectDrawer
        isOpen={subjectDrawerOpen}
        onClose={() => setSubjectDrawerOpen(false)}
        batch={selectedBatchForSubjects}
        teachers={teachers}
        onUpdated={() => router.refresh()}
      />
    </div>
  );
}
