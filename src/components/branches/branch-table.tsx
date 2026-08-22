"use client";

import * as React from "react";
import { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { type BranchListItem } from "@/actions/branches";
import { Edit, MapPin, Building2, Trash2 } from "lucide-react";
import { BranchComposerModal } from "./branch-composer-modal";
import { deleteBranchAction } from "@/actions/branches";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BranchTableProps {
  branches: BranchListItem[];
}

export function BranchTable({ branches }: BranchTableProps) {
  const router = useRouter();
  const [editingBranch, setEditingBranch] = useState<BranchListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this branch?")) return;
    setIsDeleting(id);
    const res = await deleteBranchAction(id);
    setIsDeleting(null);
    if (!res.success) {
      toast.error(res.error);
    } else {
      toast.success("Branch deleted successfully");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold">Branch Name</TableHead>
              <TableHead className="text-xs font-semibold">City / Location</TableHead>
              <TableHead className="text-xs font-semibold">Active Batches</TableHead>
              <TableHead className="text-right text-xs font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground text-sm">
                  No branches found.
                </TableCell>
              </TableRow>
            ) : (
              branches.map((b) => (
                <TableRow key={b.id} className="hover:bg-muted/20 transition">
                  {/* Name */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-sm">{b.name}</span>
                    </div>
                  </TableCell>

                  {/* City */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {b.city}
                    </div>
                  </TableCell>

                  {/* Active Batches */}
                  <TableCell>
                    <div className="text-sm font-medium">
                      {b._count.batches}
                      <span className="text-xs font-normal text-muted-foreground ml-1">batches</span>
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setEditingBranch(b)}
                    >
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => handleDelete(b.id)}
                      disabled={isDeleting === b.id}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <BranchComposerModal
        isOpen={!!editingBranch}
        onClose={() => setEditingBranch(null)}
        initialData={editingBranch || undefined}
        onSuccess={() => {
          setEditingBranch(null);
          router.refresh();
        }}
      />
    </div>
  );
}
