"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import type { ActionResponse } from "@/types/auth";
import { TestType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// ─── Zod Validation Schemas ──────────────────────────────

const TestSchema = z.object({
  title: z.string().min(3, "Test title must be at least 3 characters").max(150),
  batchId: z.string().uuid("Please select a valid batch"),
  subjectId: z.string().uuid("Please select a valid subject"),
  type: z.enum(["WEEKLY_UNIT", "MONTHLY_MOCK", "SURPRISE_QUIZ", "FULL_LENGTH"]).default("WEEKLY_UNIT"),
  totalMarks: z.number().min(1, "Total marks must be greater than 0").max(500),
  passingMarks: z.number().min(0, "Passing marks cannot be negative").max(500),
  testDate: z.string().min(1, "Test date is required"),
  solutionPdfUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export type TestInput = z.infer<typeof TestSchema>;

export interface TestListItem {
  id: string;
  title: string;
  type: TestType;
  totalMarks: number;
  passingMarks: number;
  testDate: Date;
  solutionPdfUrl: string | null;
  isPublished: boolean;
  createdAt: Date;
  batch: {
    id: string;
    name: string;
    targetExam: string;
    branch: {
      name: string;
    };
  };
  subject: {
    id: string;
    name: string;
    teacher: {
      fullName: string;
    } | null;
  };
  creator: {
    fullName: string;
  } | null;
  _count: {
    testMarks: number;
  };
  stats?: {
    highestScore: number | null;
    batchAverage: number | null;
    totalAppeared: number;
    totalAbsent: number;
  };
}

export interface StudentMarkEntry {
  studentUserId: string;
  studentName: string;
  rollNumber: string;
  email: string | null;
  phone: string | null;
  marksObtained: number | null;
  isAbsent: boolean;
  calculatedRank: number | null;
  remarks: string | null;
  isPublished: boolean;
}

export interface TestDetailResponse {
  test: {
    id: string;
    title: string;
    type: TestType;
    totalMarks: number;
    passingMarks: number;
    testDate: Date;
    solutionPdfUrl: string | null;
    isPublished: boolean;
    batchId: string;
    subjectId: string;
    batch: {
      id: string;
      name: string;
      targetExam: string;
    };
    subject: {
      id: string;
      name: string;
    };
  };
  studentEntries: StudentMarkEntry[];
}

// ─── Server Actions ─────────────────────────────────────

/**
 * Fetch all offline tests, optionally filtered by batch or teacher.
 */
export async function getTestsAction(filters?: {
  batchId?: string;
}): Promise<ActionResponse<TestListItem[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized." };
    }

    const { batchId } = filters ?? {};

    // If role is TEACHER, show tests for their batches/subjects or all if coordinator/admin
    const whereClause: any = {};
    if (batchId && batchId !== "ALL") {
      whereClause.batchId = batchId;
    }

    if (user.role === "TEACHER") {
      // Find subjects taught by this teacher
      whereClause.OR = [
        { subject: { teacherId: user.id } },
        { createdBy: user.id },
      ];
    }

    const tests = await db.offlineTest.findMany({
      where: whereClause,
      include: {
        batch: {
          select: {
            id: true,
            name: true,
            targetExam: true,
            branch: { select: { name: true } },
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            teacher: { select: { fullName: true } },
          },
        },
        creator: {
          select: { fullName: true },
        },
        _count: {
          select: { testMarks: true },
        },
      },
      orderBy: { testDate: "desc" },
    });

    const formattedTests: TestListItem[] = tests.map((t) => ({
      id: t.id,
      title: t.title,
      type: t.type,
      totalMarks: Number(t.totalMarks),
      passingMarks: Number(t.passingMarks),
      testDate: t.testDate,
      solutionPdfUrl: t.solutionPdfUrl,
      isPublished: t.isPublished,
      createdAt: t.createdAt,
      batch: t.batch,
      subject: t.subject,
      creator: t.creator,
      _count: t._count,
    }));

    return { success: true, data: formattedTests };
  } catch (error) {
    console.error("[getTestsAction Error]:", error);
    return { success: false, error: "Failed to fetch tests." };
  }
}

/**
 * Fetch detailed test metadata and all enrolled students in the batch mapped with their mark entries.
 */
export async function getTestByIdAction(
  testId: string
): Promise<ActionResponse<TestDetailResponse>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized." };
    }

    const test = await db.offlineTest.findUnique({
      where: { id: testId },
      include: {
        batch: {
          select: { id: true, name: true, targetExam: true },
        },
        subject: {
          select: { id: true, name: true },
        },
      },
    });

    if (!test) {
      return { success: false, error: "Test not found." };
    }

    // 1. Fetch all students enrolled in this batch
    const enrolledStudents = await db.studentProfile.findMany({
      where: { batchId: test.batchId },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, phone: true, isActive: true },
        },
      },
      orderBy: { rollNumber: "asc" },
    });

    // 2. Fetch existing test marks for this test
    const existingMarks = await db.testMark.findMany({
      where: { testId },
    });

    const marksMap = new Map<string, (typeof existingMarks)[0]>();
    for (const m of existingMarks) {
      marksMap.set(m.studentId, m);
    }

    // 3. Map enrolled students with marks (or default empty entry)
    const studentEntries: StudentMarkEntry[] = enrolledStudents.map((profile) => {
      const mark = marksMap.get(profile.userId);
      return {
        studentUserId: profile.userId,
        studentName: profile.user.fullName,
        rollNumber: profile.rollNumber,
        email: profile.user.email,
        phone: profile.user.phone,
        marksObtained: mark && mark.marksObtained !== null ? Number(mark.marksObtained) : null,
        isAbsent: mark ? mark.isAbsent : false,
        calculatedRank: mark?.calculatedRank ?? null,
        remarks: mark?.remarks ?? null,
        isPublished: test.isPublished,
      };
    });

    return {
      success: true,
      data: {
        test: {
          id: test.id,
          title: test.title,
          type: test.type,
          totalMarks: Number(test.totalMarks),
          passingMarks: Number(test.passingMarks),
          testDate: test.testDate,
          solutionPdfUrl: test.solutionPdfUrl,
          isPublished: test.isPublished,
          batchId: test.batchId,
          subjectId: test.subjectId,
          batch: test.batch,
          subject: test.subject,
        },
        studentEntries,
      },
    };
  } catch (error) {
    console.error("[getTestByIdAction Error]:", error);
    return { success: false, error: "Failed to fetch test details." };
  }
}

/**
 * Schedule a new offline test.
 */
export async function createTestAction(
  data: TestInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "COORDINATOR", "TEACHER"].includes(user.role)) {
      return { success: false, error: "Forbidden. Instructor or Staff role required." };
    }

    const parsed = TestSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    if (parsed.data.passingMarks > parsed.data.totalMarks) {
      return {
        success: false,
        error: "Passing marks cannot be greater than Total marks",
      };
    }

    const newTest = await db.offlineTest.create({
      data: {
        title: parsed.data.title,
        batchId: parsed.data.batchId,
        subjectId: parsed.data.subjectId,
        type: parsed.data.type as TestType,
        totalMarks: new Decimal(parsed.data.totalMarks),
        passingMarks: new Decimal(parsed.data.passingMarks),
        testDate: new Date(parsed.data.testDate),
        solutionPdfUrl: parsed.data.solutionPdfUrl || null,
        isPublished: false,
        createdBy: user.id,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/tests");
    revalidatePath("/faculty");
    revalidatePath("/faculty/tests");

    return { success: true, data: { id: newTest.id } };
  } catch (error) {
    console.error("[createTestAction Error]:", error);
    return { success: false, error: "Failed to schedule test." };
  }
}

/**
 * Update an existing offline test.
 */
export async function updateTestAction(
  testId: string,
  data: Partial<TestInput>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "COORDINATOR", "TEACHER"].includes(user.role)) {
      return { success: false, error: "Forbidden." };
    }

    const updated = await db.offlineTest.update({
      where: { id: testId },
      data: {
        ...(data.title ? { title: data.title } : {}),
        ...(data.type ? { type: data.type as TestType } : {}),
        ...(data.totalMarks !== undefined ? { totalMarks: new Decimal(data.totalMarks) } : {}),
        ...(data.passingMarks !== undefined ? { passingMarks: new Decimal(data.passingMarks) } : {}),
        ...(data.testDate ? { testDate: new Date(data.testDate) } : {}),
        ...(data.solutionPdfUrl !== undefined ? { solutionPdfUrl: data.solutionPdfUrl || null } : {}),
      },
    });

    revalidatePath("/admin/tests");
    revalidatePath("/faculty/tests");

    return { success: true, data: { id: updated.id } };
  } catch (error) {
    console.error("[updateTestAction Error]:", error);
    return { success: false, error: "Failed to update test." };
  }
}

/**
 * Delete an offline test.
 */
export async function deleteTestAction(
  testId: string
): Promise<ActionResponse<boolean>> {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "COORDINATOR"].includes(user.role)) {
      return { success: false, error: "Only Admins and Coordinators can delete tests." };
    }

    await db.offlineTest.delete({
      where: { id: testId },
    });

    revalidatePath("/admin/tests");
    revalidatePath("/faculty/tests");

    return { success: true, data: true };
  } catch (error) {
    console.error("[deleteTestAction Error]:", error);
    return { success: false, error: "Failed to delete test." };
  }
}
