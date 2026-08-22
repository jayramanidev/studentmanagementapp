"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import type { ActionResponse } from "@/types/auth";
import { computeCompetitionRanks, type BatchTestStats } from "@/lib/rank-calculator";
import { Decimal } from "@prisma/client/runtime/library";

// ─── Input Types ─────────────────────────────────────────

export interface MarkEntryPayload {
  studentId: string;
  marksObtained: number | null;
  isAbsent: boolean;
  remarks?: string | null;
}

export interface PublishMarksResponse {
  testId: string;
  isPublished: boolean;
  stats: BatchTestStats;
}

// ─── Server Actions ─────────────────────────────────────

/**
 * Save draft marks for a test without publishing or computing official ranks.
 */
export async function saveDraftMarksAction(
  testId: string,
  entries: MarkEntryPayload[]
): Promise<ActionResponse<{ savedCount: number }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "COORDINATOR", "TEACHER"].includes(user.role)) {
      return { success: false, error: "Forbidden. Instructor or Staff role required." };
    }

    const test = await db.offlineTest.findUnique({
      where: { id: testId },
    });

    if (!test) {
      return { success: false, error: "Test not found." };
    }

    const totalMarks = Number(test.totalMarks);

    // Validate marks limits
    for (const entry of entries) {
      if (!entry.isAbsent && entry.marksObtained !== null) {
        if (entry.marksObtained > totalMarks) {
          return {
            success: false,
            error: `Mark (${entry.marksObtained}) exceeds total marks (${totalMarks})`,
          };
        }
      }
    }

    // Save marks within transaction
    await db.$transaction(async (tx) => {
      for (const entry of entries) {
        const marksDec =
          !entry.isAbsent && entry.marksObtained !== null
            ? new Decimal(entry.marksObtained)
            : null;

        await tx.testMark.upsert({
          where: {
            testId_studentId: {
              testId,
              studentId: entry.studentId,
            },
          },
          update: {
            marksObtained: marksDec,
            isAbsent: entry.isAbsent,
            remarks: entry.remarks || null,
            enteredBy: user.id,
          },
          create: {
            testId,
            studentId: entry.studentId,
            marksObtained: marksDec,
            isAbsent: entry.isAbsent,
            remarks: entry.remarks || null,
            enteredBy: user.id,
          },
        });
      }
    });

    revalidatePath(`/admin/tests/${testId}/mark-entry`);
    revalidatePath(`/faculty/tests/${testId}/mark-entry`);

    return { success: true, data: { savedCount: entries.length } };
  } catch (error) {
    console.error("[saveDraftMarksAction Error]:", error);
    return { success: false, error: "Failed to save draft marks." };
  }
}

/**
 * Validate all marks, calculate standard competition ranks, write to database, and set test to published.
 */
export async function publishMarksAction(
  testId: string,
  entries: MarkEntryPayload[]
): Promise<ActionResponse<PublishMarksResponse>> {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "COORDINATOR", "TEACHER"].includes(user.role)) {
      return { success: false, error: "Forbidden. Instructor or Staff role required." };
    }

    const test = await db.offlineTest.findUnique({
      where: { id: testId },
    });

    if (!test) {
      return { success: false, error: "Test not found." };
    }

    const totalMarks = Number(test.totalMarks);
    const passingMarks = Number(test.passingMarks);

    // Validate marks limits
    for (const entry of entries) {
      if (!entry.isAbsent && entry.marksObtained !== null) {
        if (entry.marksObtained > totalMarks) {
          return {
            success: false,
            error: `Mark (${entry.marksObtained}) exceeds total marks (${totalMarks})`,
          };
        }
        if (entry.marksObtained < 0) {
          return {
            success: false,
            error: `Mark (${entry.marksObtained}) cannot be negative`,
          };
        }
      }
    }

    // Run Deterministic Ranking Engine
    const { rankedItems, stats } = computeCompetitionRanks(
      entries.map((e) => ({
        studentId: e.studentId,
        marksObtained: e.isAbsent ? null : e.marksObtained,
        isAbsent: e.isAbsent,
      })),
      passingMarks,
      totalMarks
    );

    const rankMap = new Map<string, number | null>();
    for (const item of rankedItems) {
      rankMap.set(item.studentId, item.calculatedRank);
    }

    // Atomic transaction: write calculated ranks and mark test published
    await db.$transaction(async (tx) => {
      for (const entry of entries) {
        const marksDec =
          !entry.isAbsent && entry.marksObtained !== null
            ? new Decimal(entry.marksObtained)
            : null;

        const calculatedRank = rankMap.get(entry.studentId) ?? null;

        await tx.testMark.upsert({
          where: {
            testId_studentId: {
              testId,
              studentId: entry.studentId,
            },
          },
          update: {
            marksObtained: marksDec,
            isAbsent: entry.isAbsent,
            calculatedRank,
            remarks: entry.remarks || null,
            enteredBy: user.id,
          },
          create: {
            testId,
            studentId: entry.studentId,
            marksObtained: marksDec,
            isAbsent: entry.isAbsent,
            calculatedRank,
            remarks: entry.remarks || null,
            enteredBy: user.id,
          },
        });
      }

      // Mark test as published
      await tx.offlineTest.update({
        where: { id: testId },
        data: {
          isPublished: true,
        },
      });
    });

    // Invalidate caches
    revalidatePath("/admin");
    revalidatePath("/admin/tests");
    revalidatePath(`/admin/tests/${testId}/mark-entry`);
    revalidatePath("/faculty");
    revalidatePath("/faculty/tests");
    revalidatePath(`/faculty/tests/${testId}/mark-entry`);
    revalidatePath("/student");
    revalidatePath("/student/performance");
    revalidatePath("/parent/dashboard");

    return {
      success: true,
      data: {
        testId,
        isPublished: true,
        stats,
      },
    };
  } catch (error) {
    console.error("[publishMarksAction Error]:", error);
    return { success: false, error: "Failed to publish marks and calculate ranks." };
  }
}

/**
 * Bulk import marks from CSV. Maps roll numbers to student IDs and saves draft marks.
 */
export async function bulkImportMarksFromCSVAction(
  testId: string,
  rows: Array<{ rollNumber: string; marksObtained: number | null; isAbsent: boolean }>
): Promise<ActionResponse<{ savedCount: number }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "COORDINATOR", "TEACHER"].includes(user.role)) {
      return { success: false, error: "Forbidden." };
    }

    const test = await db.offlineTest.findUnique({
      where: { id: testId },
      include: { batch: { select: { id: true } } },
    });

    if (!test) {
      return { success: false, error: "Test not found." };
    }
    if (test.isPublished) {
      return { success: false, error: "Cannot import marks for a published test." };
    }

    // Fetch students in this batch to map roll numbers to IDs
    const students = await db.studentProfile.findMany({
      where: { batchId: test.batchId },
      select: { userId: true, rollNumber: true },
    });

    const rollMap = new Map<string, string>();
    for (const s of students) {
      rollMap.set(s.rollNumber.toLowerCase().trim(), s.userId);
    }

    const entries: MarkEntryPayload[] = [];
    const totalMarks = Number(test.totalMarks);

    for (const row of rows) {
      const studentId = rollMap.get(row.rollNumber.toLowerCase().trim());
      if (!studentId) continue; // Skip invalid roll numbers silently (already validated in UI)

      if (!row.isAbsent && row.marksObtained !== null) {
        if (row.marksObtained > totalMarks || row.marksObtained < 0) {
          continue; // Skip invalid marks
        }
      }

      entries.push({
        studentId,
        marksObtained: row.marksObtained,
        isAbsent: row.isAbsent,
        remarks: "Imported from CSV",
      });
    }

    if (entries.length === 0) {
      return { success: false, error: "No valid rows found to import." };
    }

    // Reuse save draft logic
    return await saveDraftMarksAction(testId, entries);

  } catch (error) {
    console.error("[bulkImportMarksFromCSVAction Error]:", error);
    return { success: false, error: "Failed to bulk import marks." };
  }
}
