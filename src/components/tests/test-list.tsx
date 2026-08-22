"use client";

import * as React from "react";
import { useState, useMemo, useTransition } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { deleteTestAction, type TestListItem } from "@/actions/tests";
import { type BatchItem } from "@/actions/batches";
import Link from "next/link";
import {
  Search,
  ClipboardList,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  BookOpen,
  FileCheck,
  FileSpreadsheet,
  ExternalLink,
  MoreVertical,
  Award,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";

interface TestListProps {
  tests: TestListItem[];
  batches: BatchItem[];
  basePath: "/admin" | "/faculty";
  onEditTest: (test: TestListItem) => void;
  onRefresh?: () => void;
}

export function TestList({
  tests,
  batches,
  basePath,
  onEditTest,
  onRefresh,
}: TestListProps) {
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const matchBatch =
        selectedBatch === "ALL" || t.batch.id === selectedBatch;
      if (!matchBatch) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        t.title.toLowerCase().includes(q) ||
        t.subject.name.toLowerCase().includes(q) ||
        t.batch.name.toLowerCase().includes(q)
      );
    });
  }, [tests, search, selectedBatch]);

  const handleDelete = (test: TestListItem) => {
    if (
      !confirm(
        `Are you sure you want to delete test "${test.title}"? All entered student marks for this test will also be deleted.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await deleteTestAction(test.id);
      if (res.success) {
        toast.success("Offline test deleted successfully");
        onRefresh?.();
      } else {
        toast.error(res.error || "Failed to delete test");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Batch Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3.5 rounded-xl border shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search test title, subject, or batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Layers className="h-3.5 w-3.5" />
            <span className="font-medium">Batch:</span>
          </div>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-xs outline-none focus-visible:border-ring dark:bg-input/30"
          >
            <option value="ALL">All Batches ({tests.length})</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.targetExam})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tests Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold">Test Details</TableHead>
              <TableHead className="text-xs font-semibold">Batch & Subject</TableHead>
              <TableHead className="text-xs font-semibold">Date</TableHead>
              <TableHead className="text-xs font-semibold">Marks Criteria</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-right text-xs font-semibold">Quick Action</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-36 text-center text-muted-foreground text-sm">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <ClipboardList className="h-8 w-8 text-muted-foreground/50 mb-1" />
                    <span className="font-semibold">No offline tests found</span>
                    <span className="text-xs text-muted-foreground">
                      {search || selectedBatch !== "ALL"
                        ? "Try adjusting your filters or search query."
                        : "Schedule a physical test using the button above."}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTests.map((test) => {
                const dateStr = new Date(test.testDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <TableRow key={test.id} className="hover:bg-muted/30 transition">
                    {/* Test Details */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-semibold text-sm leading-snug flex items-center gap-1.5">
                          {test.title}
                          {test.solutionPdfUrl && (
                            <a
                              href={test.solutionPdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                              title="View Solution Key"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{test.type.replace(/_/g, " ").toLowerCase()}</span>
                          {test.creator && (
                            <>
                              <span>•</span>
                              <span>By {test.creator.fullName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Batch & Subject */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-medium text-xs text-foreground flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                          {test.subject.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {test.batch.name} ({test.batch.targetExam})
                        </div>
                      </div>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {dateStr}
                      </div>
                    </TableCell>

                    {/* Marks Criteria */}
                    <TableCell>
                      <div className="text-xs">
                        <span className="font-bold text-foreground">
                          {test.totalMarks} Marks
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          Passing: {test.passingMarks}
                        </span>
                      </div>
                    </TableCell>

                    {/* Published Status */}
                    <TableCell>
                      {test.isPublished ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 gap-1 text-[10px] font-semibold">
                          <CheckCircle2 className="h-3 w-3" /> Published
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 gap-1 text-[10px] font-semibold">
                          <Clock className="h-3 w-3" /> Draft Marks
                        </Badge>
                      )}
                    </TableCell>

                    {/* Quick Action Button */}
                    <TableCell className="text-right">
                      <Link href={`${basePath}/tests/${test.id}/mark-entry`}>
                        <Button
                          size="sm"
                          className={
                            test.isPublished
                              ? "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 text-xs h-7 gap-1"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-7 gap-1 shadow-xs"
                          }
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                          {test.isPublished ? "Edit Marks" : "Enter Marks"}
                        </Button>
                      </Link>
                    </TableCell>

                    {/* Dropdown Menu */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={isPending}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            />
                          }
                        >
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => onEditTest(test)}
                            className="cursor-pointer text-xs flex items-center gap-2"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-indigo-500" />
                            <span>Edit Test Info</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(test)}
                            className="cursor-pointer text-xs text-destructive flex items-center gap-2 focus:bg-destructive/10 focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete Test</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <div className="p-3 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Total: <strong>{filteredTests.length}</strong> offline tests
          </span>
          {isPending && (
            <span className="flex items-center gap-1.5 text-indigo-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
