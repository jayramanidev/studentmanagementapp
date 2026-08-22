"use client";

import * as React from "react";
import { useState } from "react";
import { PhysicalScorecardCard } from "@/components/physical/physical-scorecard-card";
import { PhysicalEntryModal } from "@/components/physical/physical-entry-modal";
import { Button } from "@/components/ui/button";
import { type PhysicalRecordItem } from "@/actions/physical";
import { type BatchItem } from "@/actions/batches";
import { type StudentListItem } from "@/actions/students";
import { Activity, Plus, Timer } from "lucide-react";
import { useRouter } from "next/navigation";

interface FacultyPhysicalClientProps {
  records: PhysicalRecordItem[];
  batches: BatchItem[];
  students: StudentListItem[];
}

export function FacultyPhysicalClient({
  records,
  batches,
  students,
}: FacultyPhysicalClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Activity className="h-6 w-6" />
            </div>
            Physical Fitness & Ground Practice Tracker
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Record stopwatch running timings (5000m / 1600m), pull-ups, and calculate official Gujarat Police PET scores.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs h-9 shadow-xs"
        >
          <Plus className="h-4 w-4" /> Record Ground Trial
        </Button>
      </div>

      {/* Scorecard Table & PET Criteria */}
      <PhysicalScorecardCard records={records} />

      {/* Entry Modal */}
      <PhysicalEntryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        batches={batches}
        students={students}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
