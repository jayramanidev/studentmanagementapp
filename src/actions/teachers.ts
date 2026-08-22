"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import type { ActionResponse } from "@/types/auth";
import { UserRole } from "@prisma/client";

// ─── Zod Validation Schemas ──────────────────────────────

const TeacherSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Valid email is required").max(255),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(20).optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  role: z.enum(["TEACHER", "COORDINATOR"]).default("TEACHER"),
});

export type TeacherInput = z.infer<typeof TeacherSchema>;

export interface TeacherItem {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  taughtSubjects: Array<{
    id: string;
    name: string;
    batch: {
      id: string;
      name: string;
      targetExam: string;
    };
  }>;
}

// ─── Server Actions ─────────────────────────────────────

/**
 * Fetch all teachers and coordinators.
 */
export async function getTeachersAction(): Promise<ActionResponse<TeacherItem[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized." };
    }

    const teachers = await db.user.findMany({
      where: {
        role: { in: [UserRole.TEACHER, UserRole.COORDINATOR] },
      },
      include: {
        taughtSubjects: {
          include: {
            batch: {
              select: { id: true, name: true, targetExam: true },
            },
          },
        },
      },
      orderBy: { fullName: "asc" },
    });

    return { success: true, data: teachers };
  } catch (error) {
    console.error("[getTeachersAction Error]:", error);
    return { success: false, error: "Failed to fetch teachers." };
  }
}

/**
 * Register a new faculty/coordinator user.
 */
export async function createTeacherAction(
  data: TeacherInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Only Admins can register faculty members." };
    }

    const parsed = TeacherSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    // Check if email already exists
    const existing = await db.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existing) {
      return { success: false, error: "A user with this email already exists." };
    }

    const passwordRaw = parsed.data.password || "password123";
    const passwordHash = await hash(passwordRaw, 12);

    const newTeacher = await db.user.create({
      data: {
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        passwordHash,
        role: parsed.data.role as UserRole,
        isActive: true,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/teachers");
    revalidatePath("/admin/batches");

    return { success: true, data: { id: newTeacher.id } };
  } catch (error) {
    console.error("[createTeacherAction Error]:", error);
    return { success: false, error: "Failed to create teacher." };
  }
}

/**
 * Update teacher details.
 */
export async function updateTeacherAction(
  id: string,
  data: { fullName: string; phone?: string; isActive?: boolean }
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Forbidden." };
    }

    const updated = await db.user.update({
      where: { id },
      data: {
        fullName: data.fullName,
        phone: data.phone || null,
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });

    revalidatePath("/admin/teachers");
    revalidatePath("/admin/batches");

    return { success: true, data: { id: updated.id } };
  } catch (error) {
    console.error("[updateTeacherAction Error]:", error);
    return { success: false, error: "Failed to update teacher." };
  }
}

/**
 * Delete teacher.
 */
export async function deleteTeacherAction(
  id: string
): Promise<ActionResponse<boolean>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Forbidden." };
    }

    await db.user.delete({
      where: { id },
    });

    revalidatePath("/admin/teachers");
    revalidatePath("/admin/batches");

    return { success: true, data: true };
  } catch (error) {
    console.error("[deleteTeacherAction Error]:", error);
    return { success: false, error: "Failed to delete teacher." };
  }
}
