"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import type { ActionResponse } from "@/types/auth";
import { UserRole } from "@prisma/client";

// ─── Zod Validation Schemas ──────────────────────────────

const StudentSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone must be at least 10 digits").max(20).optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  batchId: z.string().uuid("Please select a valid batch").optional().nullable(),
  rollNumber: z.string().min(1, "Roll number is required").max(50),
  targetExam: z.string().max(50).optional().or(z.literal("")),
  admissionDate: z.string().optional().or(z.literal("")),

  // Parent linking fields (optional)
  parentName: z.string().max(100).optional().or(z.literal("")),
  parentPhone: z.string().max(20).optional().or(z.literal("")),
  parentEmail: z.string().email("Invalid parent email").optional().or(z.literal("")),
  parentRelationship: z.string().max(50).optional(),
});

export type StudentInput = z.infer<typeof StudentSchema>;

export interface StudentListItem {
  id: string; // user id
  fullName: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  studentProfile: {
    id: string;
    rollNumber: string;
    targetExam: string | null;
    admissionDate: Date;
    batch: {
      id: string;
      name: string;
      targetExam: string;
    } | null;
  } | null;
  childLinks: Array<{
    id: string;
    relationship: string;
    parent: {
      id: string;
      fullName: string;
      email: string | null;
      phone: string | null;
    };
  }>;
}

export interface BulkStudentRow {
  fullName: string;
  rollNumber: string;
  email?: string;
  phone?: string;
  batchId?: string;
  batchName?: string;
  targetExam?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  parentRelationship?: string;
}

export interface BulkImportResult {
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  errors: Array<{ rowNumber: number; rollNumber: string; error: string }>;
}

// ─── Server Actions ─────────────────────────────────────

/**
 * Fetch students list with batch, profile, and linked parent details.
 */
export async function getStudentsAction(filters?: {
  batchId?: string;
  search?: string;
}): Promise<ActionResponse<StudentListItem[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized." };
    }

    const { batchId, search } = filters ?? {};

    const whereClause: any = {
      role: UserRole.STUDENT,
    };

    if (batchId && batchId !== "ALL") {
      whereClause.studentProfile = {
        batchId,
      };
    }

    if (search && search.trim() !== "") {
      const q = search.trim();
      whereClause.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        {
          studentProfile: {
            rollNumber: { contains: q, mode: "insensitive" },
          },
        },
      ];
    }

    const students = await db.user.findMany({
      where: whereClause,
      include: {
        studentProfile: {
          include: {
            batch: {
              select: { id: true, name: true, targetExam: true },
            },
          },
        },
        childLinks: {
          include: {
            parent: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { fullName: "asc" },
    });

    return { success: true, data: students as unknown as StudentListItem[] };
  } catch (error) {
    console.error("[getStudentsAction Error]:", error);
    return { success: false, error: "Failed to fetch students." };
  }
}

/**
 * Create a new student with profile and optional parent account link.
 */
export async function createStudentAction(
  data: StudentInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "COORDINATOR")) {
      return { success: false, error: "Forbidden. Admin/Coordinator access required." };
    }

    const parsed = StudentSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const {
      fullName,
      email,
      phone,
      password,
      batchId,
      rollNumber,
      targetExam,
      admissionDate,
      parentName,
      parentPhone,
      parentEmail,
      parentRelationship,
    } = parsed.data;

    // Check if email already exists
    if (email && email.trim() !== "") {
      const existing = await db.user.findUnique({
        where: { email: email.trim() },
      });
      if (existing) {
        return { success: false, error: "A user with this student email already exists." };
      }
    }

    // Default student password is 'password123' if not given
    const rawPass = password && password.trim() !== "" ? password.trim() : "password123";
    const passwordHash = await hash(rawPass, 12);

    // Auto-generate email if student has no email
    const studentEmail =
      email && email.trim() !== ""
        ? email.trim()
        : `student.${rollNumber.toLowerCase().replace(/[^a-z0-9]/g, "")}.${Date.now().toString().slice(-4)}@instituteops.local`;

    // Execute in transaction
    const studentUser = await db.$transaction(async (tx) => {
      // 1. Create Student User
      const newStudent = await tx.user.create({
        data: {
          fullName,
          email: studentEmail,
          phone: phone && phone.trim() !== "" ? phone.trim() : null,
          passwordHash,
          role: UserRole.STUDENT,
          isActive: true,
        },
      });

      // 2. Create Student Profile
      await tx.studentProfile.create({
        data: {
          userId: newStudent.id,
          batchId: batchId || null,
          rollNumber,
          targetExam: targetExam || null,
          admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
        },
      });

      // 3. Create or Link Parent if parent details provided
      if (parentName && parentName.trim() !== "") {
        const pEmail =
          parentEmail && parentEmail.trim() !== ""
            ? parentEmail.trim()
            : `parent.${newStudent.id.slice(0, 8)}@instituteops.local`;

        let parentUser = await tx.user.findFirst({
          where: {
            OR: [
              ...(parentEmail ? [{ email: parentEmail.trim() }] : []),
              ...(parentPhone ? [{ phone: parentPhone.trim() }] : []),
            ],
          },
        });

        if (!parentUser) {
          const parentPassHash = await hash("password123", 12);
          parentUser = await tx.user.create({
            data: {
              fullName: parentName.trim(),
              email: pEmail,
              phone: parentPhone && parentPhone.trim() !== "" ? parentPhone.trim() : null,
              passwordHash: parentPassHash,
              role: UserRole.PARENT,
              isActive: true,
            },
          });
        }

        // Link parent to student
        await tx.parentStudentLink.upsert({
          where: {
            parentUserId_studentUserId: {
              parentUserId: parentUser.id,
              studentUserId: newStudent.id,
            },
          },
          update: {
            relationship: parentRelationship || "Guardian",
          },
          create: {
            parentUserId: parentUser.id,
            studentUserId: newStudent.id,
            relationship: parentRelationship || "Guardian",
          },
        });
      }

      return newStudent;
    });

    revalidatePath("/admin");
    revalidatePath("/admin/students");
    revalidatePath("/admin/batches");

    return { success: true, data: { id: studentUser.id } };
  } catch (error) {
    console.error("[createStudentAction Error]:", error);
    return { success: false, error: "Failed to create student." };
  }
}

/**
 * Update an existing student and student profile.
 */
export async function updateStudentAction(
  studentUserId: string,
  data: Partial<StudentInput>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "COORDINATOR")) {
      return { success: false, error: "Forbidden." };
    }

    await db.$transaction(async (tx) => {
      // Update User
      await tx.user.update({
        where: { id: studentUserId },
        data: {
          fullName: data.fullName,
          ...(data.email !== undefined ? { email: data.email || null } : {}),
          ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
        },
      });

      // Update StudentProfile
      await tx.studentProfile.upsert({
        where: { userId: studentUserId },
        update: {
          ...(data.rollNumber ? { rollNumber: data.rollNumber } : {}),
          ...(data.batchId !== undefined ? { batchId: data.batchId } : {}),
          ...(data.targetExam !== undefined ? { targetExam: data.targetExam || null } : {}),
        },
        create: {
          userId: studentUserId,
          rollNumber: data.rollNumber || `ROLL-${Date.now().toString().slice(-4)}`,
          batchId: data.batchId || null,
          targetExam: data.targetExam || null,
        },
      });

      // Update / Link Parent if parent details provided
      if (data.parentName && data.parentName.trim() !== "") {
        let parentUser = await tx.user.findFirst({
          where: {
            OR: [
              ...(data.parentEmail ? [{ email: data.parentEmail.trim() }] : []),
              ...(data.parentPhone ? [{ phone: data.parentPhone.trim() }] : []),
            ],
          },
        });

        if (!parentUser) {
          const parentPassHash = await hash("password123", 12);
          parentUser = await tx.user.create({
            data: {
              fullName: data.parentName.trim(),
              email:
                data.parentEmail && data.parentEmail.trim() !== ""
                  ? data.parentEmail.trim()
                  : `parent.${studentUserId.slice(0, 8)}@instituteops.local`,
              phone: data.parentPhone && data.parentPhone.trim() !== "" ? data.parentPhone.trim() : null,
              passwordHash: parentPassHash,
              role: UserRole.PARENT,
            },
          });
        }

        await tx.parentStudentLink.upsert({
          where: {
            parentUserId_studentUserId: {
              parentUserId: parentUser.id,
              studentUserId: studentUserId,
            },
          },
          update: {
            relationship: data.parentRelationship || "Guardian",
          },
          create: {
            parentUserId: parentUser.id,
            studentUserId: studentUserId,
            relationship: data.parentRelationship || "Guardian",
          },
        });
      }
    });

    revalidatePath("/admin/students");
    revalidatePath("/admin/batches");

    return { success: true, data: { id: studentUserId } };
  } catch (error) {
    console.error("[updateStudentAction Error]:", error);
    return { success: false, error: "Failed to update student." };
  }
}

/**
 * Delete student and cascade profile/marks.
 */
export async function deleteStudentAction(
  studentUserId: string
): Promise<ActionResponse<boolean>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Only Admins can delete students." };
    }

    await db.user.delete({
      where: { id: studentUserId },
    });

    revalidatePath("/admin/students");
    revalidatePath("/admin/batches");
    revalidatePath("/admin");

    return { success: true, data: true };
  } catch (error) {
    console.error("[deleteStudentAction Error]:", error);
    return { success: false, error: "Failed to delete student." };
  }
}

/**
 * Bulk import students from parsed CSV data.
 */
export async function bulkImportStudentsAction(
  rows: BulkStudentRow[],
  targetBatchId?: string
): Promise<ActionResponse<BulkImportResult>> {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "COORDINATOR")) {
      return { success: false, error: "Forbidden. Admin or Coordinator role required." };
    }

    if (!rows || rows.length === 0) {
      return { success: false, error: "No student records provided for import." };
    }

    const defaultPasswordHash = await hash("password123", 12);
    const result: BulkImportResult = {
      totalProcessed: rows.length,
      successCount: 0,
      failedCount: 0,
      errors: [],
    };

    // Cache batches to resolve batch names if provided
    const batches = await db.batch.findMany({
      select: { id: true, name: true, targetExam: true },
    });
    const batchMap = new Map<string, { id: string; targetExam: string }>();
    for (const b of batches) {
      batchMap.set(b.name.toLowerCase().trim(), { id: b.id, targetExam: b.targetExam });
      batchMap.set(b.id, { id: b.id, targetExam: b.targetExam });
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      try {
        if (!row.fullName || row.fullName.trim() === "") {
          throw new Error("Student full name is required.");
        }
        if (!row.rollNumber || row.rollNumber.trim() === "") {
          throw new Error("Roll number is required.");
        }

        // Determine batch ID
        let assignedBatchId = targetBatchId || null;
        let inferredExam = row.targetExam || null;

        if (row.batchId && batchMap.has(row.batchId)) {
          assignedBatchId = row.batchId;
          inferredExam = inferredExam || batchMap.get(row.batchId)?.targetExam || null;
        } else if (row.batchName && batchMap.has(row.batchName.toLowerCase().trim())) {
          const match = batchMap.get(row.batchName.toLowerCase().trim());
          assignedBatchId = match?.id || null;
          inferredExam = inferredExam || match?.targetExam || null;
        }

        // Student email
        const cleanRoll = row.rollNumber.trim().replace(/[^a-zA-Z0-9]/g, "");
        const studentEmail =
          row.email && row.email.trim() !== ""
            ? row.email.trim()
            : `student.${cleanRoll.toLowerCase()}.${Date.now().toString().slice(-4)}@instituteops.local`;

        // Check if user already exists
        let studentUser = await db.user.findFirst({
          where: {
            OR: [
              { email: studentEmail },
              ...(row.phone ? [{ phone: row.phone.trim() }] : []),
              {
                studentProfile: {
                  rollNumber: row.rollNumber.trim(),
                },
              },
            ],
          },
        });

        if (!studentUser) {
          studentUser = await db.user.create({
            data: {
              fullName: row.fullName.trim(),
              email: studentEmail,
              phone: row.phone && row.phone.trim() !== "" ? row.phone.trim() : null,
              passwordHash: defaultPasswordHash,
              role: UserRole.STUDENT,
              isActive: true,
            },
          });
        }

        // Upsert student profile
        await db.studentProfile.upsert({
          where: { userId: studentUser.id },
          update: {
            rollNumber: row.rollNumber.trim(),
            ...(assignedBatchId ? { batchId: assignedBatchId } : {}),
            ...(inferredExam ? { targetExam: inferredExam } : {}),
          },
          create: {
            userId: studentUser.id,
            rollNumber: row.rollNumber.trim(),
            batchId: assignedBatchId,
            targetExam: inferredExam,
            admissionDate: new Date(),
          },
        });

        // Handle Parent linking if parent name exists
        if (row.parentName && row.parentName.trim() !== "") {
          const pEmail =
            row.parentEmail && row.parentEmail.trim() !== ""
              ? row.parentEmail.trim()
              : `parent.${studentUser.id.slice(0, 8)}@instituteops.local`;

          let parentUser = await db.user.findFirst({
            where: {
              OR: [
                { email: pEmail },
                ...(row.parentPhone ? [{ phone: row.parentPhone.trim() }] : []),
              ],
            },
          });

          if (!parentUser) {
            parentUser = await db.user.create({
              data: {
                fullName: row.parentName.trim(),
                email: pEmail,
                phone: row.parentPhone && row.parentPhone.trim() !== "" ? row.parentPhone.trim() : null,
                passwordHash: defaultPasswordHash,
                role: UserRole.PARENT,
                isActive: true,
              },
            });
          }

          await db.parentStudentLink.upsert({
            where: {
              parentUserId_studentUserId: {
                parentUserId: parentUser.id,
                studentUserId: studentUser.id,
              },
            },
            update: {
              relationship: row.parentRelationship?.trim() || "Guardian",
            },
            create: {
              parentUserId: parentUser.id,
              studentUserId: studentUser.id,
              relationship: row.parentRelationship?.trim() || "Guardian",
            },
          });
        }

        result.successCount++;
      } catch (err: any) {
        result.failedCount++;
        result.errors.push({
          rowNumber: rowNum,
          rollNumber: row.rollNumber || "N/A",
          error: err.message || "Unknown error occurred",
        });
      }
    }

    revalidatePath("/admin/students");
    revalidatePath("/admin/batches");
    revalidatePath("/admin");

    return { success: true, data: result };
  } catch (error) {
    console.error("[bulkImportStudentsAction Error]:", error);
    return { success: false, error: "Bulk import execution failed." };
  }
}
