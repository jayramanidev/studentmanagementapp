"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import type { ActionResponse } from "@/types/auth";

// ─── Zod Validation Schemas ──────────────────────────────

const SubjectSchema = z.object({
  name: z.string().min(2, "Subject name must be at least 2 characters").max(100),
  batchId: z.string().uuid("Please select a valid batch"),
  teacherId: z.string().uuid().optional().nullable(),
});

export type SubjectInput = z.infer<typeof SubjectSchema>;

export interface SubjectItem {
  id: string;
  name: string;
  batchId: string;
  teacherId: string | null;
  batch: {
    id: string;
    name: string;
    targetExam: string;
  };
  teacher: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
  } | null;
  _count: {
    offlineTests: number;
  };
}

// ─── Server Actions ─────────────────────────────────────

/**
 * Fetch subjects, optionally filtered by batch ID.
 */
export async function getSubjectsAction(
  batchId?: string
): Promise<ActionResponse<SubjectItem[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized." };
    }

    const subjects = await db.subject.findMany({
      where: batchId ? { batchId } : undefined,
      include: {
        batch: {
          select: { id: true, name: true, targetExam: true },
        },
        teacher: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        _count: {
          select: { offlineTests: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: subjects };
  } catch (error) {
    console.error("[getSubjectsAction Error]:", error);
    return { success: false, error: "Failed to fetch subjects." };
  }
}

/**
 * Create a new subject for a batch and optionally assign a teacher.
 */
export async function createSubjectAction(
  data: SubjectInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "COORDINATOR")) {
      return { success: false, error: "Forbidden. Admin/Coordinator role required." };
    }

    const parsed = SubjectSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const newSubject = await db.subject.create({
      data: {
        name: parsed.data.name,
        batchId: parsed.data.batchId,
        teacherId: parsed.data.teacherId || null,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/batches");
    revalidatePath("/admin/teachers");

    return { success: true, data: { id: newSubject.id } };
  } catch (error) {
    console.error("[createSubjectAction Error]:", error);
    return { success: false, error: "Failed to create subject." };
  }
}

/**
 * Update an existing subject.
 */
export async function updateSubjectAction(
  id: string,
  data: { name: string; teacherId?: string | null }
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "COORDINATOR")) {
      return { success: false, error: "Forbidden." };
    }

    const updated = await db.subject.update({
      where: { id },
      data: {
        name: data.name,
        teacherId: data.teacherId || null,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/batches");
    revalidatePath("/admin/teachers");

    return { success: true, data: { id: updated.id } };
  } catch (error) {
    console.error("[updateSubjectAction Error]:", error);
    return { success: false, error: "Failed to update subject." };
  }
}

/**
 * Delete a subject.
 */
export async function deleteSubjectAction(
  id: string
): Promise<ActionResponse<boolean>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Only Admins can delete subjects." };
    }

    await db.subject.delete({
      where: { id },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/batches");
    revalidatePath("/admin/teachers");

    return { success: true, data: true };
  } catch (error) {
    console.error("[deleteSubjectAction Error]:", error);
    return { success: false, error: "Failed to delete subject." };
  }
}
