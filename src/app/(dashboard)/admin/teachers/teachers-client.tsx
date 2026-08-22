"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TeacherModal } from "@/components/admin/teacher-modal";
import { toast } from "sonner";
import { deleteTeacherAction, type TeacherItem } from "@/actions/teachers";
import {
  GraduationCap,
  Plus,
  Mail,
  Phone,
  BookOpen,
  Edit2,
  Trash2,
  ShieldCheck,
  Calendar,
  Layers,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface TeachersClientProps {
  initialTeachers: TeacherItem[];
}

export function TeachersClient({ initialTeachers }: TeachersClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [teacherModalOpen, setTeacherModalOpen] = useState(false);
  const [selectedTeacherForEdit, setSelectedTeacherForEdit] = useState<TeacherItem | null>(null);

  const handleCreateNew = () => {
    setSelectedTeacherForEdit(null);
    setTeacherModalOpen(true);
  };

  const handleEdit = (teacher: TeacherItem) => {
    setSelectedTeacherForEdit(teacher);
    setTeacherModalOpen(true);
  };

  const handleDelete = (teacher: TeacherItem) => {
    if (
      !confirm(
        `Are you sure you want to delete instructor "${teacher.fullName}"?`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await deleteTeacherAction(teacher.id);
      if (res.success) {
        toast.success("Instructor removed successfully");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete teacher");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <GraduationCap className="h-6 w-6" />
            </div>
            Faculty & Instructors
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage instructors, exam coordinators, and their assigned subject portfolios.
          </p>
        </div>

        <Button
          onClick={handleCreateNew}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs h-9 shadow-xs"
        >
          <Plus className="h-4 w-4" /> Add Faculty Member
        </Button>
      </div>

      {/* Teachers Cards Grid */}
      {initialTeachers.length === 0 ? (
        <Card className="p-12 text-center shadow-xs border-dashed">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg">No faculty registered yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                Add teaching staff and coordinators to assign them to subjects and offline tests.
              </p>
            </div>
            <Button
              onClick={handleCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white mt-2"
            >
              <Plus className="h-4 w-4 mr-2" /> Add First Faculty Member
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialTeachers.map((teacher) => {
            const initials = teacher.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <Card
                key={teacher.id}
                className="shadow-xs hover:border-blue-500/50 transition flex flex-col justify-between"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 text-sm font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base font-bold leading-tight">
                          {teacher.fullName}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold mt-1"
                        >
                          {teacher.role === "COORDINATOR" ? "Coordinator" : "Faculty"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEdit(teacher)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(teacher)}
                        disabled={isPending}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-3">
                  {/* Contact Info */}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {teacher.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{teacher.email}</span>
                      </div>
                    )}
                    {teacher.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{teacher.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Assigned Subjects */}
                  <div className="pt-2 border-t space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" /> Assigned Subjects:
                      </span>
                      <span>{teacher.taughtSubjects.length}</span>
                    </div>

                    {teacher.taughtSubjects.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">
                        No subjects assigned yet
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {teacher.taughtSubjects.map((sub) => (
                          <Badge
                            key={sub.id}
                            variant="secondary"
                            className="text-[10px] bg-slate-100 dark:bg-slate-800"
                          >
                            {sub.name} ({sub.batch.name.split(" ")[0]})
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Teacher Modal */}
      <TeacherModal
        isOpen={teacherModalOpen}
        onClose={() => setTeacherModalOpen(false)}
        teacher={selectedTeacherForEdit}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
