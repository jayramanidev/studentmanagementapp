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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { deleteStudentAction, type StudentListItem } from "@/actions/students";
import { type BatchItem } from "@/actions/batches";
import {
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Phone,
  Mail,
  UserCheck,
  GraduationCap,
  Calendar,
  Layers,
  HeartHandshake,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";

interface StudentTableProps {
  students: StudentListItem[];
  batches: BatchItem[];
  onEditStudent: (student: StudentListItem) => void;
  onRefresh?: () => void;
}

export function StudentTable({
  students,
  batches,
  onEditStudent,
  onRefresh,
}: StudentTableProps) {
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  // Filter students based on search query and batch selection
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesBatch =
        selectedBatch === "ALL" || s.studentProfile?.batch?.id === selectedBatch;

      if (!matchesBatch) return false;

      if (!search.trim()) return true;

      const q = search.toLowerCase().trim();
      const rollMatch = s.studentProfile?.rollNumber?.toLowerCase().includes(q);
      const nameMatch = s.fullName?.toLowerCase().includes(q);
      const emailMatch = s.email?.toLowerCase().includes(q);
      const phoneMatch = s.phone?.toLowerCase().includes(q);
      const examMatch = s.studentProfile?.targetExam?.toLowerCase().includes(q);
      const parentMatch = s.childLinks.some((p) =>
        p.parent.fullName.toLowerCase().includes(q)
      );

      return (
        rollMatch ||
        nameMatch ||
        emailMatch ||
        phoneMatch ||
        examMatch ||
        parentMatch
      );
    });
  }, [students, search, selectedBatch]);

  const handleDelete = (student: StudentListItem) => {
    if (
      !confirm(
        `Are you sure you want to delete student "${student.fullName}" (${student.studentProfile?.rollNumber})? This will permanently delete all linked marks and profile data.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await deleteStudentAction(student.id);
      if (res.success) {
        toast.success("Student deleted successfully");
        onRefresh?.();
      } else {
        toast.error(res.error || "Failed to delete student");
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
            placeholder="Search by Name, Roll No, Phone, Parent..."
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
            <option value="ALL">All Batches ({students.length})</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.targetExam})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[120px] text-xs font-semibold">Roll No</TableHead>
              <TableHead className="text-xs font-semibold">Student Name & Contact</TableHead>
              <TableHead className="text-xs font-semibold">Batch & Target Exam</TableHead>
              <TableHead className="text-xs font-semibold">Parent / Guardian</TableHead>
              <TableHead className="text-xs font-semibold">Admission Date</TableHead>
              <TableHead className="w-[70px] text-right text-xs font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-36 text-center text-muted-foreground text-sm">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <GraduationCap className="h-8 w-8 text-muted-foreground/50 mb-1" />
                    <span className="font-semibold">No students found</span>
                    <span className="text-xs text-muted-foreground">
                      {search || selectedBatch !== "ALL"
                        ? "Try clearing your filters or search query."
                        : "Enroll students using the Add Student button or CSV Bulk Import."}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((s) => {
                const profile = s.studentProfile;
                const parentLink = s.childLinks?.[0];
                const initials = s.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <TableRow key={s.id} className="transition hover:bg-muted/30">
                    {/* Roll No */}
                    <TableCell className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {profile?.rollNumber ?? "—"}
                    </TableCell>

                    {/* Student Name & Contact */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-sm leading-tight flex items-center gap-1.5">
                            {s.fullName}
                            {!s.isActive && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            {s.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {s.phone}
                              </span>
                            )}
                            {s.email && !s.email.includes("@instituteops.local") && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span className="truncate max-w-36">{s.email}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Batch & Exam */}
                    <TableCell>
                      {profile?.batch ? (
                        <div className="space-y-1">
                          <div className="font-medium text-xs text-foreground">
                            {profile.batch.name}
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-semibold"
                          >
                            {profile.targetExam || profile.batch.targetExam}
                          </Badge>
                        </div>
                      ) : (
                        <span className="italic text-xs text-muted-foreground">
                          Unassigned
                        </span>
                      )}
                    </TableCell>

                    {/* Linked Parent */}
                    <TableCell>
                      {parentLink ? (
                        <div className="space-y-0.5">
                          <div className="text-xs font-medium flex items-center gap-1">
                            <HeartHandshake className="h-3.5 w-3.5 text-amber-500" />
                            <span>{parentLink.parent.fullName}</span>
                            <span className="text-[10px] text-muted-foreground font-normal">
                              ({parentLink.relationship})
                            </span>
                          </div>
                          {parentLink.parent.phone && (
                            <div className="text-[11px] text-muted-foreground">
                              {parentLink.parent.phone}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">—</span>
                      )}
                    </TableCell>

                    {/* Admission Date */}
                    <TableCell className="text-xs text-muted-foreground">
                      {profile?.admissionDate
                        ? new Date(profile.admissionDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={isPending}
                              className="h-8 w-8 p-0"
                            />
                          }
                        >
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => onEditStudent(s)}
                            className="cursor-pointer text-xs flex items-center gap-2"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-indigo-500" />
                            <span>Edit Details</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => window.open(`/api/export/report-card/${s.id}`, "_blank")}
                            className="cursor-pointer text-xs flex items-center gap-2 text-indigo-600 dark:text-indigo-400"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                            <span>Official Scorecard (PDF)</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(s)}
                            className="cursor-pointer text-xs text-destructive flex items-center gap-2 focus:bg-destructive/10 focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete Student</span>
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

        {/* Footer info */}
        <div className="p-3 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing <strong>{filteredStudents.length}</strong> of{" "}
            <strong>{students.length}</strong> students
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
