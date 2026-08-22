"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TestList } from "@/components/tests/test-list";
import { TestModal } from "@/components/tests/test-modal";
import { type TestListItem } from "@/actions/tests";
import { type BatchItem } from "@/actions/batches";
import { type SubjectItem } from "@/actions/subjects";
import { ClipboardList, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface FacultyTestsClientProps {
  initialTests: TestListItem[];
  batches: BatchItem[];
  subjects: SubjectItem[];
}

export function FacultyTestsClient({
  initialTests,
  batches,
  subjects,
}: FacultyTestsClientProps) {
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
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ClipboardList className="h-6 w-6" />
            </div>
            Class Tests & Marks Entry
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create physical tests for your assigned classes and log student marks rapidly.
          </p>
        </div>

        <Button
          onClick={handleScheduleNew}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs h-9 shadow-xs"
        >
          <Plus className="h-4 w-4" /> Schedule New Test
        </Button>
      </div>

      {/* Tests Table */}
      <TestList
        tests={initialTests}
        batches={batches}
        basePath="/faculty"
        onEditTest={handleEditTest}
        onRefresh={() => router.refresh()}
      />

      {/* Schedule Modal */}
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
