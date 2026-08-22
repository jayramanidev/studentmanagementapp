"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import type { ActionResponse } from "@/types/auth";

// ─── Zod Validation Schemas ──────────────────────────────

const BatchSchema = z.object({
  name: z.string().min(2, "Batch name must be at least 2 characters").max(100),
  targetExam: z.string().min(2, "Target exam is required").max(50),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  branchId: z.string().uuid().optional().nullable(),
});

export type BatchInput = z.infer<typeof BatchSchema>;

export interface BatchItem {
  id: string;
  name: string;
  targetExam: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  branch: {
    id: string;
    name: string;
    city: string;
  };
  _count: {
    studentProfiles: number;
    subjects: number;
    offlineTests: number;
  };
}

// ─── Server Actions ─────────────────────────────────────

/**
 * Fetch all batches with counts for students, subjects, and offline tests.
 */
export async function getBatchesAction(): Promise<ActionResponse<BatchItem[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    const batches = await db.batch.findMany({
      include: {
        branch: {
          select: { id: true, name: true, city: true },
        },
        _count: {
          select: {
            studentProfiles: true,
            subjects: true,
            offlineTests: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: batches };
  } catch (error) {
    console.error("[getBatchesAction Error]:", error);
    return { success: false, error: "Failed to fetch batches." };
  }
}

/**
 * Fetch branches list (or ensure a default branch exists).
 */
export async function getBranchesAction(): Promise<
  ActionResponse<Array<{ id: string; name: string; city: string }>>
> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized." };
    }

    let branches = await db.branch.findMany({
      orderBy: { name: "asc" },
    });

    if (branches.length === 0) {
      const defaultBranch = await db.branch.create({
        data: {
          name: "Main Campus",
          city: "Headquarters",
        },
      });
      branches = [defaultBranch];
    }

    return { success: true, data: branches };
  } catch (error) {
    console.error("[getBranchesAction Error]:", error);
    return { success: false, error: "Failed to fetch branches." };
  }
}

/**
 * Create a new batch.
 */
export async function createBatchAction(
  data: BatchInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "COORDINATOR")) {
      return {
        success: false,
        error: "Forbidden. Admin or Coordinator access required.",
      };
    }

    const parsed = BatchSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    let branchId = parsed.data.branchId;
    if (!branchId) {
      // Find or create default branch
      let branch = await db.branch.findFirst();
      if (!branch) {
        branch = await db.branch.create({
          data: { name: "Main Campus", city: "Headquarters" },
        });
      }
      branchId = branch.id;
    }

    const newBatch = await db.batch.create({
      data: {
        name: parsed.data.name,
        targetExam: parsed.data.targetExam,
        branchId,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/batches");
    revalidatePath("/admin/students");

    return { success: true, data: { id: newBatch.id } };
  } catch (error) {
    console.error("[createBatchAction Error]:", error);
    return { success: false, error: "Failed to create batch." };
  }
}

/**
 * Update an existing batch.
 */
export async function updateBatchAction(
  id: string,
  data: BatchInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "COORDINATOR")) {
      return { success: false, error: "Forbidden." };
    }

    const parsed = BatchSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const updated = await db.batch.update({
      where: { id },
      data: {
        name: parsed.data.name,
        targetExam: parsed.data.targetExam,
        ...(parsed.data.branchId ? { branchId: parsed.data.branchId } : {}),
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/batches");
    revalidatePath("/admin/students");

    return { success: true, data: { id: updated.id } };
  } catch (error) {
    console.error("[updateBatchAction Error]:", error);
    return { success: false, error: "Failed to update batch." };
  }
}

/**
 * Delete a batch.
 */
export async function deleteBatchAction(
  id: string
): Promise<ActionResponse<boolean>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "Only Administrators can delete batches.",
      };
    }

    await db.batch.delete({
      where: { id },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/batches");
    revalidatePath("/admin/students");

    return { success: true, data: true };
  } catch (error) {
    console.error("[deleteBatchAction Error]:", error);
    return {
      success: false,
      error: "Failed to delete batch. Make sure all linked data is cleared.",
    };
  }
}
