"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TestList } from "@/components/tests/test-list";
import { TestModal } from "@/components/tests/test-modal";
import { type TestListItem } from "@/actions/tests";
import { type BatchItem } from "@/actions/batches";
import { type SubjectItem } from "@/actions/subjects";
import { ClipboardList, Plus, FileSpreadsheet, Layers } from "lucide-react";
import { useRouter } from "next/navigation";

interface TestsClientProps {
  initialTests: TestListItem[];
  batches: BatchItem[];
  subjects: SubjectItem[];
}

export function TestsClient({
  initialTests,
  batches,
  subjects,
}: TestsClientProps) {
  const router = useRouter();

  const [testModalOpen, setTestModalOpen] = useState(false);
  const [selectedTestForEdit, setSelectedTestForEdit] = useState<TestListItem | null>(null);

  const handleScheduleNew = () => {
    setSelectedTestForEdit(null);
    setTestModalOpen(true);
  };

  const handleEditTest = (test: TestListItem) => {
    setSelectedTestForEdit(test);
    setTestModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <ClipboardList className="h-6 w-6" />
            </div>
            Offline Tests & Exam Ranks
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Schedule physical exams, log classroom test scores, and publish competition rank lists.
          </p>
        </div>

        <Button
          onClick={handleScheduleNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs h-9 shadow-xs"
        >
          <Plus className="h-4 w-4" /> Schedule Offline Test
        </Button>
      </div>

      {/* Tests Table */}
      <TestList
        tests={initialTests}
        batches={batches}
        basePath="/admin"
        onEditTest={handleEditTest}
        onRefresh={() => router.refresh()}
      />

      {/* Schedule/Edit Modal */}
      <TestModal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        test={selectedTestForEdit}
        batches={batches}
        subjects={subjects}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
