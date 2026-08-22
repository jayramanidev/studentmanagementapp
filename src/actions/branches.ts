"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import type { ActionResponse } from "@/types/auth";

const BranchSchema = z.object({
  name: z.string().min(2, "Branch name must be at least 2 characters").max(100),
  city: z.string().min(2, "City name is required").max(100),
});

export type BranchInput = z.infer<typeof BranchSchema>;

export interface BranchListItem {
  id: string;
  name: string;
  city: string;
  createdAt: Date;
  _count: {
    batches: number;
  };
}

/**
 * Fetch all branches with count of batches
 */
export async function getBranchListAction(): Promise<ActionResponse<BranchListItem[]>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Only administrators can view branch details." };
    }

    const branches = await db.branch.findMany({
      include: {
        _count: {
          select: { batches: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return { success: true, data: branches };
  } catch (error) {
    console.error("[getBranchListAction Error]:", error);
    return { success: false, error: "Failed to load branches." };
  }
}

/**
 * Create a new branch
 */
export async function createBranchAction(data: BranchInput): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Forbidden. Admin access required." };
    }

    const parsed = BranchSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const newBranch = await db.branch.create({
      data: {
        name: parsed.data.name,
        city: parsed.data.city,
      },
    });

    revalidatePath("/admin/branches");
    revalidatePath("/admin/batches"); // Batches use branch dropdown

    return { success: true, data: { id: newBranch.id } };
  } catch (error) {
    console.error("[createBranchAction Error]:", error);
    return { success: false, error: "Failed to create branch." };
  }
}

/**
 * Update a branch
 */
export async function updateBranchAction(id: string, data: BranchInput): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Forbidden." };
    }

    const parsed = BranchSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const updated = await db.branch.update({
      where: { id },
      data: {
        name: parsed.data.name,
        city: parsed.data.city,
      },
    });

    revalidatePath("/admin/branches");
    revalidatePath("/admin/batches");
    revalidatePath("/admin");

    return { success: true, data: { id: updated.id } };
  } catch (error) {
    console.error("[updateBranchAction Error]:", error);
    return { success: false, error: "Failed to update branch." };
  }
}

/**
 * Delete a branch
 */
export async function deleteBranchAction(id: string): Promise<ActionResponse<boolean>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Forbidden." };
    }

    // Check if it's the last branch
    const branchCount = await db.branch.count();
    if (branchCount <= 1) {
      return { success: false, error: "Cannot delete the last remaining branch." };
    }

    await db.branch.delete({ where: { id } });

    revalidatePath("/admin/branches");
    revalidatePath("/admin/batches");

    return { success: true, data: true };
  } catch (error) {
    console.error("[deleteBranchAction Error]:", error);
    return { success: false, error: "Cannot delete branch. It may contain existing batches." };
  }
}
