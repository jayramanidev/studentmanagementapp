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
import { toast } from "sonner";
import {
  createTeacherAction,
  updateTeacherAction,
  type TeacherItem,
} from "@/actions/teachers";
import { Loader2, GraduationCap, Mail, Phone, Lock, ShieldCheck } from "lucide-react";

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher?: TeacherItem | null;
  onSuccess?: () => void;
}

export function TeacherModal({
  isOpen,
  onClose,
  teacher,
  onSuccess,
}: TeacherModalProps) {
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"TEACHER" | "COORDINATOR">("TEACHER");

  const isEditing = !!teacher;

  React.useEffect(() => {
    if (teacher) {
      setFullName(teacher.fullName);
      setEmail(teacher.email ?? "");
      setPhone(teacher.phone ?? "");
      setPassword("");
      setRole(teacher.role as "TEACHER" | "COORDINATOR");
    } else {
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("password123");
      setRole("TEACHER");
    }
  }, [teacher, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    if (!isEditing && !email.trim()) {
      toast.error("Email is required");
      return;
    }

    startTransition(async () => {
      const res = isEditing
        ? await updateTeacherAction(teacher.id, {
            fullName: fullName.trim(),
            phone: phone.trim() || undefined,
          })
        : await createTeacherAction({
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone.trim() || undefined,
            password: password.trim() || undefined,
            role,
          });

      if (res.success) {
        toast.success(
          isEditing ? "Teacher updated successfully!" : "Faculty registered successfully!"
        );
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.error || "Failed to save teacher");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            {isEditing ? "Edit Faculty Member" : "Register New Faculty"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update profile details for this faculty member."
              : "Create an instructor or coordinator login account."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="tName" className="text-xs font-semibold">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tName"
              placeholder="e.g., Prof. Amit Desai"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="tEmail" className="text-xs font-semibold flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tEmail"
              type="email"
              placeholder="faculty@instituteops.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={!isEditing}
              disabled={isPending || isEditing}
            />
          </div>

          {/* Phone & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tPhone" className="text-xs font-semibold flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                Phone Number
              </Label>
              <Input
                id="tPhone"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tRole" className="text-xs font-semibold flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                Role
              </Label>
              <select
                id="tRole"
                value={role}
                onChange={(e) => setRole(e.target.value as "TEACHER" | "COORDINATOR")}
                disabled={isPending || isEditing}
                className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="TEACHER" className="bg-popover text-popover-foreground">
                  Faculty / Teacher
                </option>
                <option value="COORDINATOR" className="bg-popover text-popover-foreground">
                  Exam Coordinator
                </option>
              </select>
            </div>
          </div>

          {/* Password (for new teachers) */}
          {!isEditing && (
            <div className="space-y-1.5">
              <Label htmlFor="tPass" className="text-xs font-semibold flex items-center gap-1">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                Initial Password
              </Label>
              <Input
                id="tPass"
                type="text"
                placeholder="password123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
              />
              <p className="text-[10px] text-muted-foreground">
                Default is password123. The faculty member can change this later.
              </p>
            </div>
          )}

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
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? "Update Profile" : "Register Faculty"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
