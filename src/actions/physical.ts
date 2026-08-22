"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import type { ActionResponse } from "@/types/auth";
import { Gender, Prisma } from "@prisma/client";
import {
  calculateMale5000mMarks,
  calculateFemale1600mMarks,
} from "@/lib/physical-calculator";

const Decimal = Prisma.Decimal;

// ─── Zod Schema ──────────────────────────────────────────

const PhysicalEntrySchema = z.object({
  studentId: z.string().uuid("Please select a student"),
  batchId: z.string().uuid("Please select a batch"),
  testDate: z.string().min(1, "Trial date is required"),
  gender: z.enum(["MALE", "FEMALE"]).default("MALE"),
  minutes: z.number().int().min(0).max(60),
  seconds: z.number().int().min(0).max(59),
  pullUpsCount: z.number().int().min(0).max(30).optional(),
  longJumpMeters: z.number().min(0).max(10).optional(),
  remarks: z.string().max(300).optional(),
});

export type PhysicalEntryInput = z.infer<typeof PhysicalEntrySchema>;

export interface PhysicalRecordItem {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  batchName: string;
  testDate: Date;
  gender: Gender;
  runningDistanceMeters: number;
  runningTimeSeconds: number;
  runningTimeFormatted: string;
  runningMarks: number;
  pullUpsCount: number | null;
  longJumpMeters: number | null;
  isQualified: boolean;
  remarks: string | null;
  recordedByName: string | null;
}

// ─── Server Actions ─────────────────────────────────────

/**
 * Record a ground trial / physical test entry.
 */
export async function recordPhysicalTrialAction(
  data: PhysicalEntryInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "COORDINATOR", "TEACHER"].includes(user.role)) {
      return { success: false, error: "Forbidden." };
    }

    const parsed = PhysicalEntrySchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid physical trial input",
      };
    }

    const totalSeconds = parsed.data.minutes * 60 + parsed.data.seconds;
    const distanceMeters = parsed.data.gender === "MALE" ? 5000 : 1600;

    const calcResult =
      parsed.data.gender === "MALE"
        ? calculateMale5000mMarks(totalSeconds)
        : calculateFemale1600mMarks(totalSeconds);

    const created = await db.physicalFitnessRecord.create({
      data: {
        studentId: parsed.data.studentId,
        batchId: parsed.data.batchId,
        testDate: new Date(parsed.data.testDate),
        gender: parsed.data.gender as Gender,
        runningDistanceMeters: distanceMeters,
        runningTimeSeconds: totalSeconds,
        runningMarks: new Decimal(calcResult.runningMarks),
        pullUpsCount: parsed.data.pullUpsCount ?? null,
        longJumpMeters: parsed.data.longJumpMeters
          ? new Decimal(parsed.data.longJumpMeters)
          : null,
        isQualified: calcResult.isQualified,
        remarks: parsed.data.remarks || null,
        recordedBy: user.id,
      },
    });

    revalidatePath("/faculty/physical");
    revalidatePath("/student/physical");
    revalidatePath("/admin/physical");
    revalidatePath("/student");

    return { success: true, data: { id: created.id } };
  } catch (error) {
    console.error("[recordPhysicalTrialAction Error]:", error);
    return { success: false, error: "Failed to record physical test." };
  }
}

/**
 * Fetch physical test trial history.
 */
export async function getPhysicalRecordsAction(filters?: {
  batchId?: string;
  studentId?: string;
}): Promise<ActionResponse<PhysicalRecordItem[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized." };
    }

    const whereClause: any = {};
    if (filters?.batchId && filters.batchId !== "ALL") {
      whereClause.batchId = filters.batchId;
    }
    if (filters?.studentId) {
      whereClause.studentId = filters.studentId;
    }

    if (user.role === "STUDENT") {
      whereClause.studentId = user.id;
    } else if (user.role === "PARENT") {
      const links = await db.parentStudentLink.findMany({
        where: { parentUserId: user.id },
      });
      const studentIds = links.map((l) => l.studentUserId);
      whereClause.studentId = { in: studentIds };
    }

    const records = await db.physicalFitnessRecord.findMany({
      where: whereClause,
      include: {
        student: {
          include: { studentProfile: true },
        },
        batch: true,
        recorder: { select: { fullName: true } },
      },
      orderBy: { testDate: "desc" },
    });

    const formatted: PhysicalRecordItem[] = records.map((r) => {
      const mins = Math.floor(r.runningTimeSeconds / 60);
      const secs = r.runningTimeSeconds % 60;
      const runningTimeFormatted = `${mins}:${secs.toString().padStart(2, "0")}`;

      return {
        id: r.id,
        studentId: r.studentId,
        studentName: r.student.fullName,
        rollNumber: r.student.studentProfile?.rollNumber ?? "N/A",
        batchName: r.batch.name,
        testDate: r.testDate,
        gender: r.gender,
        runningDistanceMeters: r.runningDistanceMeters,
        runningTimeSeconds: r.runningTimeSeconds,
        runningTimeFormatted,
        runningMarks: Number(r.runningMarks),
        pullUpsCount: r.pullUpsCount,
        longJumpMeters: r.longJumpMeters ? Number(r.longJumpMeters) : null,
        isQualified: r.isQualified,
        remarks: r.remarks,
        recordedByName: r.recorder?.fullName ?? "Ground Instructor",
      };
    });

    return { success: true, data: formatted };
  } catch (error) {
    console.error("[getPhysicalRecordsAction Error]:", error);
    return { success: false, error: "Failed to load physical records." };
  }
}
