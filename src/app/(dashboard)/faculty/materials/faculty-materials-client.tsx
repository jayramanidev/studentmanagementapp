"use client";

import * as React from "react";
import { useState } from "react";
import { MaterialGrid } from "@/components/materials/material-grid";
import { MaterialModal } from "@/components/materials/material-modal";
import { Button } from "@/components/ui/button";
import { type MaterialListItem } from "@/actions/materials";
import { type BatchItem } from "@/actions/batches";
import { type SubjectItem } from "@/actions/subjects";
import { BookOpen, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface FacultyMaterialsClientProps {
  initialMaterials: MaterialListItem[];
  batches: BatchItem[];
  subjects: SubjectItem[];
}

export function FacultyMaterialsClient({
  initialMaterials,
  batches,
  subjects,
}: FacultyMaterialsClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <BookOpen className="h-6 w-6" />
            </div>
            Class Study Materials & PYQs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Upload lecture notes, previous year question papers, and syllabus reference files for your classes.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs h-9 shadow-xs"
        >
          <Plus className="h-4 w-4" /> Share New Material
        </Button>
      </div>

      {/* Grid View */}
      <MaterialGrid
        materials={initialMaterials}
        canDelete={true}
        onRefresh={() => router.refresh()}
      />

      {/* Upload Modal */}
      <MaterialModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        batches={batches}
        subjects={subjects}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
