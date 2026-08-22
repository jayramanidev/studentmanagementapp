"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBranchAction, updateBranchAction, type BranchInput } from "@/actions/branches";
import { toast } from "sonner";

interface BranchComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    id: string;
    name: string;
    city: string;
  };
}

export function BranchComposerModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: BranchComposerModalProps) {
  const [formData, setFormData] = useState<BranchInput>({
    name: "",
    city: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({ name: initialData.name, city: initialData.city });
      } else {
        setFormData({ name: "", city: "" });
      }
    }
  }, [isOpen, initialData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let res;
      if (initialData) {
        res = await updateBranchAction(initialData.id, formData);
      } else {
        res = await createBranchAction(formData);
      }

      if (!res.success) {
        toast.error(res.error);
      } else {
        toast.success(initialData ? "Branch updated successfully" : "Branch created successfully");
        onSuccess();
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Branch" : "Add New Branch"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Branch Name <span className="text-rose-500">*</span></Label>
            <Input
              id="name"
              placeholder="e.g., Main Campus, Vastrapur Center"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City / Region <span className="text-rose-500">*</span></Label>
            <Input
              id="city"
              placeholder="e.g., Ahmedabad, Surat"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
              {isSubmitting ? "Saving..." : "Save Branch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
