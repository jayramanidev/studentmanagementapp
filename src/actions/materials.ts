"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import type { ActionResponse } from "@/types/auth";
import { MaterialCategory } from "@prisma/client";

// ─── Zod Schema ──────────────────────────────────────────

const MaterialSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(150),
  description: z.string().max(500).optional(),
  category: z.enum(["CLASS_NOTES", "PYQ_PAPER", "REFERENCE_BOOK", "SYLLABUS_COPY"]).default("CLASS_NOTES"),
  batchId: z.string().uuid("Please select a batch"),
  subjectId: z.string().uuid("Please select a subject").optional().or(z.literal("")),
  fileUrl: z.string().url("Must be a valid URL (e.g. storage or cloud link)"),
});

export type MaterialInput = z.infer<typeof MaterialSchema>;

export interface MaterialListItem {
  id: string;
  title: string;
  description: string | null;
  category: MaterialCategory;
  fileUrl: string;
  createdAt: Date;
  batch: {
    id: string;
    name: string;
    targetExam: string;
  };
  subject: {
    id: string;
    name: string;
  } | null;
  uploader: {
    fullName: string;
  } | null;
}

// ─── Server Actions ─────────────────────────────────────

/**
 * Fetch study materials filtered by batch, subject, or category.
 */
export async function getMaterialsAction(filters?: {
  batchId?: string;
  subjectId?: string;
  category?: MaterialCategory;
}): Promise<ActionResponse<MaterialListItem[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized." };
    }

    const { batchId, subjectId, category } = filters ?? {};

    const whereClause: any = {};
    if (batchId && batchId !== "ALL") {
      whereClause.batchId = batchId;
    }
    if (subjectId && subjectId !== "ALL") {
      whereClause.subjectId = subjectId;
    }
    if (category) {
      whereClause.category = category;
    }

    // If user is STUDENT, restrict to their enrolled batch
    if (user.role === "STUDENT") {
      const profile = await db.studentProfile.findUnique({
        where: { userId: user.id },
      });
      if (profile?.batchId) {
        whereClause.batchId = profile.batchId;
      }
    }

    const materials = await db.studyMaterial.findMany({
      where: whereClause,
      include: {
        batch: { select: { id: true, name: true, targetExam: true } },
        subject: { select: { id: true, name: true } },
        uploader: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: materials };
  } catch (error) {
    console.error("[getMaterialsAction Error]:", error);
    return { success: false, error: "Failed to load study materials." };
  }
}

/**
 * Upload / Register a new study material or PYQ.
 */
export async function createMaterialAction(
  data: MaterialInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "COORDINATOR", "TEACHER"].includes(user.role)) {
      return { success: false, error: "Forbidden. Instructor or Staff role required." };
    }

    const parsed = MaterialSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid material input",
      };
    }

    const created = await db.studyMaterial.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        category: parsed.data.category as MaterialCategory,
        batchId: parsed.data.batchId,
        subjectId: parsed.data.subjectId || null,
        fileUrl: parsed.data.fileUrl,
        uploadedBy: user.id,
      },
    });

    revalidatePath("/admin/materials");
    revalidatePath("/faculty/materials");
    revalidatePath("/student/materials");
    revalidatePath("/student");
    revalidatePath("/faculty");

    return { success: true, data: { id: created.id } };
  } catch (error) {
    console.error("[createMaterialAction Error]:", error);
    return { success: false, error: "Failed to upload study material." };
  }
}

/**
 * Delete a study material.
 */
export async function deleteMaterialAction(
  materialId: string
): Promise<ActionResponse<boolean>> {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "COORDINATOR", "TEACHER"].includes(user.role)) {
      return { success: false, error: "Forbidden." };
    }

    await db.studyMaterial.delete({
      where: { id: materialId },
    });

    revalidatePath("/admin/materials");
    revalidatePath("/faculty/materials");
    revalidatePath("/student/materials");

    return { success: true, data: true };
  } catch (error) {
    console.error("[deleteMaterialAction Error]:", error);
    return { success: false, error: "Failed to delete study material." };
  }
}
