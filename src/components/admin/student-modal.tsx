"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  createStudentAction,
  updateStudentAction,
  type StudentListItem,
} from "@/actions/students";
import { type BatchItem } from "@/actions/batches";
import {
  UserPlus,
  Loader2,
  Users,
  ShieldAlert,
  Calendar,
  Phone,
  Mail,
  HeartHandshake,
} from "lucide-react";

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: StudentListItem | null;
  batches: BatchItem[];
  onSuccess?: () => void;
}

export function StudentModal({
  isOpen,
  onClose,
  student,
  batches,
  onSuccess,
}: StudentModalProps) {
  const [isPending, startTransition] = useTransition();

  // Student details
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [batchId, setBatchId] = useState("");
  const [targetExam, setTargetExam] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");

  // Parent details
  const [hasParent, setHasParent] = useState(false);
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentRelationship, setParentRelationship] = useState("Father");

  const isEditing = !!student;

  React.useEffect(() => {
    if (student) {
      setFullName(student.fullName);
      setEmail(student.email ?? "");
      setPhone(student.phone ?? "");
      setRollNumber(student.studentProfile?.rollNumber ?? "");
      setBatchId(student.studentProfile?.batch?.id ?? "");
      setTargetExam(student.studentProfile?.targetExam ?? "");
      setAdmissionDate(
        student.studentProfile?.admissionDate
          ? new Date(student.studentProfile.admissionDate)
              .toISOString()
              .split("T")[0]
          : ""
      );

      const parentLink = student.childLinks?.[0];
      if (parentLink) {
        setHasParent(true);
        setParentName(parentLink.parent.fullName);
        setParentPhone(parentLink.parent.phone ?? "");
        setParentEmail(parentLink.parent.email ?? "");
        setParentRelationship(parentLink.relationship);
      } else {
        setHasParent(false);
        setParentName("");
        setParentPhone("");
        setParentEmail("");
        setParentRelationship("Father");
      }
    } else {
      setFullName("");
      setEmail("");
      setPhone("");
      setRollNumber(`ROL-${Date.now().toString().slice(-4)}`);
      const defaultBatch = batches[0];
      setBatchId(defaultBatch?.id ?? "");
      setTargetExam(defaultBatch?.targetExam ?? "PSI");
      setAdmissionDate(new Date().toISOString().split("T")[0]);
      setHasParent(false);
      setParentName("");
      setParentPhone("");
      setParentEmail("");
      setParentRelationship("Father");
    }
  }, [student, batches, isOpen]);

  const handleBatchChange = (selectedBatchId: string) => {
    setBatchId(selectedBatchId);
    const selected = batches.find((b) => b.id === selectedBatchId);
    if (selected && (!targetExam || targetExam === "PSI")) {
      setTargetExam(selected.targetExam);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Student full name is required");
      return;
    }

    if (!rollNumber.trim()) {
      toast.error("Roll number is required");
      return;
    }

    startTransition(async () => {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        rollNumber: rollNumber.trim(),
        batchId: batchId || undefined,
        targetExam: targetExam.trim() || undefined,
        admissionDate: admissionDate || undefined,
        parentName: hasParent && parentName.trim() ? parentName.trim() : undefined,
        parentPhone: hasParent && parentPhone.trim() ? parentPhone.trim() : undefined,
        parentEmail: hasParent && parentEmail.trim() ? parentEmail.trim() : undefined,
        parentRelationship: hasParent ? parentRelationship : undefined,
      };

      const res = isEditing
        ? await updateStudentAction(student.id, payload)
        : await createStudentAction(payload);

      if (res.success) {
        toast.success(
          isEditing ? "Student updated successfully!" : "Student enrolled successfully!"
        );
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.error || "Failed to save student");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserPlus className="h-5 w-5" />
            </div>
            {isEditing ? "Edit Student Details" : "Enroll New Student"}
          </DialogTitle>
          <DialogDescription>
            Add student information, assign batch and roll number, and optionally link parent account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-5 py-3 pr-1">
          {/* SECTION 1: Student Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>Student Personal Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sName" className="text-xs font-semibold">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sName"
                  placeholder="e.g., Jay Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sRoll" className="text-xs font-semibold">
                  Roll Number / Registration ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sRoll"
                  placeholder="e.g., PSI-2026-001"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sEmail" className="text-xs font-semibold flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Email Address (Optional)
                </Label>
                <Input
                  id="sEmail"
                  type="email"
                  placeholder="student@instituteops.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sPhone" className="text-xs font-semibold flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  Phone / Mobile Number (Optional)
                </Label>
                <Input
                  id="sPhone"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Academic & Batch Assignment */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Batch & Academic Enrollment</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="sBatch" className="text-xs font-semibold">
                  Assigned Batch
                </Label>
                <select
                  id="sBatch"
                  value={batchId}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  disabled={isPending}
                  className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  <option value="">-- No Batch --</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.targetExam})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sExam" className="text-xs font-semibold">
                  Target Exam
                </Label>
                <Input
                  id="sExam"
                  placeholder="PSI, Constable, etc."
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sAdmDate" className="text-xs font-semibold">
                  Admission Date
                </Label>
                <Input
                  id="sAdmDate"
                  type="date"
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Parent / Guardian Link */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <HeartHandshake className="h-3.5 w-3.5 text-amber-500" />
                <span>Parent / Guardian Link</span>
              </div>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer font-medium select-none">
                <input
                  type="checkbox"
                  checked={hasParent}
                  onChange={(e) => setHasParent(e.target.checked)}
                  className="rounded border-input text-indigo-600 focus:ring-indigo-500"
                />
                <span>Link Parent Account</span>
              </label>
            </div>

            {hasParent && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in-50 duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="pName" className="text-xs font-semibold">
                      Parent / Guardian Name
                    </Label>
                    <Input
                      id="pName"
                      placeholder="e.g., Kiran Sharma"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      disabled={isPending}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pRel" className="text-xs font-semibold">
                      Relationship
                    </Label>
                    <select
                      id="pRel"
                      value={parentRelationship}
                      onChange={(e) => setParentRelationship(e.target.value)}
                      disabled={isPending}
                      className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pPhone" className="text-xs font-semibold flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      Parent Phone Number
                    </Label>
                    <Input
                      id="pPhone"
                      placeholder="e.g., 9876500006"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      disabled={isPending}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pEmail" className="text-xs font-semibold flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      Parent Email (Optional)
                    </Label>
                    <Input
                      id="pEmail"
                      type="email"
                      placeholder="parent@example.com"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      disabled={isPending}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? "Update Student" : "Enroll Student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
