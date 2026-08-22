"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StudentTable } from "@/components/admin/student-table";
import { StudentModal } from "@/components/admin/student-modal";
import { BulkImportModal } from "@/components/admin/bulk-import-modal";
import { type StudentListItem } from "@/actions/students";
import { type BatchItem } from "@/actions/batches";
import { UserPlus, FileSpreadsheet, Users, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";

interface StudentsClientProps {
  initialStudents: StudentListItem[];
  batches: BatchItem[];
}

export function StudentsClient({
  initialStudents,
  batches,
}: StudentsClientProps) {
  const router = useRouter();

  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<StudentListItem | null>(null);

  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  const handleEnrollNew = () => {
    setSelectedStudentForEdit(null);
    setStudentModalOpen(true);
  };

  const handleEditStudent = (student: StudentListItem) => {
    setSelectedStudentForEdit(student);
    setStudentModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Users className="h-6 w-6" />
            </div>
            Student Directory
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage student registrations, batch assignments, roll numbers, and parent guardians.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => setBulkImportOpen(true)}
            className="gap-2 text-xs h-9"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Bulk CSV Import
          </Button>

          <Button
            onClick={handleEnrollNew}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs h-9 shadow-xs"
          >
            <UserPlus className="h-4 w-4" />
            Enroll Student
          </Button>
        </div>
      </div>

      {/* Main Student Data Table */}
      <StudentTable
        students={initialStudents}
        batches={batches}
        onEditStudent={handleEditStudent}
        onRefresh={() => router.refresh()}
      />

      {/* Modals */}
      <StudentModal
        isOpen={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
        student={selectedStudentForEdit}
        batches={batches}
        onSuccess={() => router.refresh()}
      />

      <BulkImportModal
        isOpen={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        batches={batches}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
