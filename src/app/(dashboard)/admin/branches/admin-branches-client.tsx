"use client";

import * as React from "react";
import { useState } from "react";
import { BranchTable } from "@/components/branches/branch-table";
import { BranchComposerModal } from "@/components/branches/branch-composer-modal";
import { Button } from "@/components/ui/button";
import { type BranchListItem } from "@/actions/branches";
import { Building2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface AdminBranchesClientProps {
  branches: BranchListItem[];
}

export function AdminBranchesClient({ branches }: AdminBranchesClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Building2 className="h-6 w-6" />
            </div>
            Branch Operations Center
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage multiple academy locations and map batches to specific branches.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs h-9 shadow-xs"
        >
          <Plus className="h-4 w-4" /> Add Branch
        </Button>
      </div>

      {/* Table */}
      <BranchTable branches={branches} />

      {/* Composer Modal */}
      <BranchComposerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
