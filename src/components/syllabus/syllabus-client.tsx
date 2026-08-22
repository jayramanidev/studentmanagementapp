"use client";

import * as React from "react";
import { useState } from "react";
import { SyllabusChapterAccordion } from "@/components/syllabus/syllabus-chapter-accordion";
import { SyllabusAddModal } from "@/components/syllabus/syllabus-add-modal";
import { Button } from "@/components/ui/button";
import { type SubjectSyllabusOverview } from "@/actions/syllabus";
import { type BatchItem } from "@/actions/batches";
import { ListChecks, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface SubjectOption {
  id: string;
  name: string;
}

interface FacultySyllabusClientProps {
  syllabusData: SubjectSyllabusOverview[];
  batches: BatchItem[];
  subjects: SubjectOption[];
  batchId: string;
  mode: "student" | "faculty" | "admin";
}

export function FacultySyllabusClient({
  syllabusData,
  batches,
  subjects,
  batchId,
  mode,
}: FacultySyllabusClientProps) {
  const router = useRouter();
  const [addModalOpen, setAddModalOpen] = useState(false);

  const canAddTopics = mode === "faculty" || mode === "admin";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <ListChecks className="h-6 w-6" />
            </div>
            {mode === "student"
              ? "My Syllabus Self-Study Checklist"
              : mode === "faculty"
              ? "Batch Syllabus Progress Tracker"
              : "Institute Syllabus Coverage"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === "student"
              ? "Track your topic-by-topic study progress across all competitive exam subjects."
              : "Monitor chapter-wise syllabus coverage and mark topics as taught for the batch."}
          </p>
        </div>

        {canAddTopics && (
          <Button
            onClick={() => setAddModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs h-9 shadow-xs"
          >
            <Plus className="h-4 w-4" /> Add Syllabus Topics
          </Button>
        )}
      </div>

      {/* Syllabus Accordion */}
      <SyllabusChapterAccordion
        subjects={syllabusData}
        mode={mode}
        batchId={batchId}
      />

      {/* Add Modal */}
      {canAddTopics && (
        <SyllabusAddModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          batches={batches}
          subjects={subjects}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
