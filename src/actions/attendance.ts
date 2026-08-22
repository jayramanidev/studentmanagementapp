"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import type { ActionResponse } from "@/types/auth";
import { AttendanceStatus } from "@prisma/client";

// ─── Types ───────────────────────────────────────────────

export interface AttendanceSheetStudentEntry {
  studentUserId: string;
  studentName: string;
  rollNumber: string;
  phone: string | null;
  status: AttendanceStatus;
}

export interface AttendanceSheetResponse {
  batchId: string;
  batchName: string;
  targetExam: string;
  date: string;
  students: AttendanceSheetStudentEntry[];
  summary: {
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    attendancePercentage: number;
  };
}

export interface StudentMonthlyAttendance {
  studentUserId: string;
  studentName: string;
  rollNumber: string;
  totalClasses: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendancePercentage: number;
  statusLevel: "EXCELLENT" | "SATISFACTORY" | "RISK"; // >85% | 75-85% | <75%
}

export interface MonthlyAttendanceSummaryResponse {
  batchId: string;
  batchName: string;
  month: number;
  year: number;
  totalClassDays: number;
  students: StudentMonthlyAttendance[];
}

export interface SaveAttendanceEntryPayload {
  studentId: string;
  status: AttendanceStatus;
}

// ─── Server Actions ─────────────────────────────────────

/**
 * Fetch daily attendance register for a specific batch and date.
 */
export async function getAttendanceSheetAction(
  batchId: string,
  dateString: string
): Promise<ActionResponse<AttendanceSheetResponse>> {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "COORDINATOR", "TEACHER"].includes(user.role)) {
      return { success: false, error: "Unauthorized." };
    }

    const batch = await db.batch.findUnique({
      where: { id: batchId },
      include: {
        studentProfiles: {
          include: {
            user: { select: { fullName: true, phone: true, isActive: true } },
          },
          orderBy: { rollNumber: "asc" },
        },
      },
    });

    if (!batch) {
      return { success: false, error: "Batch not found." };
    }

    const targetDate = new Date(dateString);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    // Fetch existing attendance for this batch on this date
    const existingRecords = await db.attendance.findMany({
      where: {
        batchId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const recordMap = new Map<string, (typeof existingRecords)[0]>();
    for (const r of existingRecords) {
      recordMap.set(r.studentId, r);
    }

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;

    const students: AttendanceSheetStudentEntry[] = batch.studentProfiles.map((p) => {
      const rec = recordMap.get(p.userId);
      const status = rec ? rec.status : AttendanceStatus.PRESENT; // default to PRESENT for fast marking

      if (status === AttendanceStatus.PRESENT) presentCount++;
      else if (status === AttendanceStatus.ABSENT) absentCount++;
      else if (status === AttendanceStatus.LATE) lateCount++;

      return {
        studentUserId: p.userId,
        studentName: p.user.fullName,
        rollNumber: p.rollNumber,
        phone: p.user.phone,
        status,
      };
    });

    const totalStudents = students.length;
    const effectivePresent = presentCount + lateCount * 0.5;
    const attendancePercentage =
      totalStudents > 0 ? Number(((effectivePresent / totalStudents) * 100).toFixed(1)) : 100;

    return {
      success: true,
      data: {
        batchId: batch.id,
        batchName: batch.name,
        targetExam: batch.targetExam,
        date: dateString,
        students,
        summary: {
          totalStudents,
          presentCount,
          absentCount,
          lateCount,
          attendancePercentage,
        },
      },
    };
  } catch (error) {
    console.error("[getAttendanceSheetAction Error]:", error);
    return { success: false, error: "Failed to load attendance register." };
  }
}

/**
 * Batch save/upsert attendance register for a specific batch and date.
 */
export async function saveAttendanceSheetAction(
  batchId: string,
  dateString: string,
  entries: SaveAttendanceEntryPayload[]
): Promise<ActionResponse<{ savedCount: number }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "COORDINATOR", "TEACHER"].includes(user.role)) {
      return { success: false, error: "Forbidden. Instructor or staff role required." };
    }

    const targetDate = new Date(dateString);

    await db.$transaction(async (tx) => {
      for (const entry of entries) {
        // Upsert by compound unique [batchId, studentId, date]
        await tx.attendance.upsert({
          where: {
            batchId_studentId_date: {
              batchId,
              studentId: entry.studentId,
              date: targetDate,
            },
          },
          update: {
            status: entry.status,
            markedBy: user.id,
          },
          create: {
            batchId,
            studentId: entry.studentId,
            date: targetDate,
            status: entry.status,
            markedBy: user.id,
          },
        });
      }
    });

    revalidatePath("/faculty");
    revalidatePath("/faculty/attendance");
    revalidatePath("/admin");
    revalidatePath("/admin/attendance");
    revalidatePath("/student");
    revalidatePath("/parent");

    return { success: true, data: { savedCount: entries.length } };
  } catch (error) {
    console.error("[saveAttendanceSheetAction Error]:", error);
    return { success: false, error: "Failed to save attendance register." };
  }
}

/**
 * Fetch monthly attendance aggregate for all students in a batch.
 */
export async function getBatchAttendanceMonthlySummaryAction(
  batchId: string,
  month: number, // 1-12
  year: number
): Promise<ActionResponse<MonthlyAttendanceSummaryResponse>> {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "COORDINATOR", "TEACHER"].includes(user.role)) {
      return { success: false, error: "Unauthorized." };
    }

    const batch = await db.batch.findUnique({
      where: { id: batchId },
      include: {
        studentProfiles: {
          include: {
            user: { select: { fullName: true } },
          },
          orderBy: { rollNumber: "asc" },
        },
      },
    });

    if (!batch) {
      return { success: false, error: "Batch not found." };
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const records = await db.attendance.findMany({
      where: {
        batchId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Count distinct dates marked
    const uniqueDates = new Set(records.map((r) => r.date.toISOString().split("T")[0]));
    const totalClassDays = uniqueDates.size;

    const studentMap = new Map<string, { present: number; absent: number; late: number }>();
    for (const r of records) {
      const cur = studentMap.get(r.studentId) ?? { present: 0, absent: 0, late: 0 };
      if (r.status === AttendanceStatus.PRESENT) cur.present++;
      else if (r.status === AttendanceStatus.ABSENT) cur.absent++;
      else if (r.status === AttendanceStatus.LATE) cur.late++;
      studentMap.set(r.studentId, cur);
    }

    const students: StudentMonthlyAttendance[] = batch.studentProfiles.map((p) => {
      const counts = studentMap.get(p.userId) ?? { present: 0, absent: 0, late: 0 };
      const effectivePresent = counts.present + counts.late * 0.5;
      const pct =
        totalClassDays > 0
          ? Number(((effectivePresent / totalClassDays) * 100).toFixed(1))
          : 100;

      let statusLevel: "EXCELLENT" | "SATISFACTORY" | "RISK" = "EXCELLENT";
      if (pct < 75) statusLevel = "RISK";
      else if (pct <= 85) statusLevel = "SATISFACTORY";

      return {
        studentUserId: p.userId,
        studentName: p.user.fullName,
        rollNumber: p.rollNumber,
        totalClasses: totalClassDays,
        presentDays: counts.present,
        absentDays: counts.absent,
        lateDays: counts.late,
        attendancePercentage: pct,
        statusLevel,
      };
    });

    return {
      success: true,
      data: {
        batchId: batch.id,
        batchName: batch.name,
        month,
        year,
        totalClassDays,
        students,
      },
    };
  } catch (error) {
    console.error("[getBatchAttendanceMonthlySummaryAction Error]:", error);
    return { success: false, error: "Failed to load monthly attendance summary." };
  }
}
