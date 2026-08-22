"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import type { ActionResponse } from "@/types/auth";
import {
  calculateStudentReadiness,
  type StudentDiagnosticReport,
} from "@/lib/readiness-calculator";

export interface CohortAnalyticsSummary {
  batchId: string;
  batchName: string;
  targetExam: string;
  totalStudents: number;
  averageReadinessIndex: number;
  averageAttendancePct: number;
  averageTestScorePct: number;
  examReadyCount: number;
  onTrackCount: number;
  atRiskCount: number;
  topPerformers: Array<{
    name: string;
    rollNumber: string;
    readinessIndex: number;
  }>;
  interventionWatchlist: StudentDiagnosticReport[];
}

export interface InstituteAnalyticsResponse {
  totalBatches: number;
  totalStudents: number;
  overallAcademyReadiness: number;
  cohorts: CohortAnalyticsSummary[];
  topBottomInterventionList: StudentDiagnosticReport[];
}

/**
 * Fetch complete AI readiness and diagnostic report for a single student.
 */
export async function getStudentReadinessAction(
  targetStudentUserId?: string
): Promise<ActionResponse<StudentDiagnosticReport>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized." };
    }

    let studentUserId = targetStudentUserId;
    if (user.role === "STUDENT") {
      studentUserId = user.id;
    } else if (!studentUserId) {
      return { success: false, error: "Student ID required." };
    }

    // If PARENT, verify link
    if (user.role === "PARENT") {
      const link = await db.parentStudentLink.findFirst({
        where: { parentUserId: user.id, studentUserId },
      });
      if (!link) {
        return { success: false, error: "Access denied." };
      }
    }

    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: studentUserId },
      include: {
        user: {
          include: {
            childLinks: { include: { parent: true } },
          },
        },
        batch: true,
      },
    });

    if (!studentProfile) {
      return { success: false, error: "Student profile not found." };
    }

    // Fetch student's marks and attendance
    const marks = await db.testMark.findMany({
      where: {
        studentId: studentUserId,
        test: { isPublished: true },
      },
      include: {
        test: {
          include: { subject: true },
        },
      },
    });

    const attendanceRecords = await db.attendance.findMany({
      where: { studentId: studentUserId },
    });

    const parent = studentProfile.user.childLinks[0]?.parent;

    const report = calculateStudentReadiness({
      studentId: studentUserId,
      studentName: studentProfile.user.fullName,
      rollNumber: studentProfile.rollNumber,
      targetExam: studentProfile.targetExam ?? studentProfile.batch?.targetExam ?? "PSI",
      batchName: studentProfile.batch?.name ?? "Main Batch",
      phone: studentProfile.user.phone,
      parentPhone: parent?.phone ?? null,
      tests: marks.map((m) => ({
        title: m.test.title,
        subjectName: m.test.subject.name,
        marksObtained: m.marksObtained ? Number(m.marksObtained) : null,
        totalMarks: Number(m.test.totalMarks),
        isAbsent: m.isAbsent,
        testDate: m.test.testDate,
      })),
      attendanceRecords: attendanceRecords.map((a) => ({
        status: a.status,
        date: a.date,
      })),
    });

    return { success: true, data: report };
  } catch (error) {
    console.error("[getStudentReadinessAction Error]:", error);
    return { success: false, error: "Failed to load diagnostic readiness report." };
  }
}

/**
 * Fetch academy-wide cohort comparison and bottom 20% intervention watchlist.
 */
export async function getAcademyAnalyticsAction(
  batchIdFilter?: string
): Promise<ActionResponse<InstituteAnalyticsResponse>> {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "COORDINATOR"].includes(user.role)) {
      return { success: false, error: "Forbidden. Admin or Coordinator role required." };
    }

    const whereBatch: any = {};
    if (batchIdFilter && batchIdFilter !== "ALL") {
      whereBatch.id = batchIdFilter;
    }

    const batches = await db.batch.findMany({
      where: whereBatch,
      include: {
        studentProfiles: {
          include: {
            user: {
              include: {
                childLinks: { include: { parent: true } },
              },
            },
          },
        },
        offlineTests: {
          where: { isPublished: true },
          include: {
            subject: true,
            testMarks: true,
          },
        },
        attendances: true,
      },
    });

    const cohorts: CohortAnalyticsSummary[] = [];
    const allStudentReports: StudentDiagnosticReport[] = [];

    for (const batch of batches) {
      const studentReports: StudentDiagnosticReport[] = [];

      for (const sp of batch.studentProfiles) {
        const studentMarks = batch.offlineTests.flatMap((t) =>
          t.testMarks
            .filter((m) => m.studentId === sp.userId)
            .map((m) => ({
              title: t.title,
              subjectName: t.subject.name,
              marksObtained: m.marksObtained ? Number(m.marksObtained) : null,
              totalMarks: Number(t.totalMarks),
              isAbsent: m.isAbsent,
              testDate: t.testDate,
            }))
        );

        const studentAtt = batch.attendances.filter((a) => a.studentId === sp.userId);
        const parent = sp.user.childLinks[0]?.parent;

        const report = calculateStudentReadiness({
          studentId: sp.userId,
          studentName: sp.user.fullName,
          rollNumber: sp.rollNumber,
          targetExam: sp.targetExam ?? batch.targetExam,
          batchName: batch.name,
          phone: sp.user.phone,
          parentPhone: parent?.phone ?? null,
          tests: studentMarks,
          attendanceRecords: studentAtt.map((a) => ({ status: a.status, date: a.date })),
        });

        studentReports.push(report);
        allStudentReports.push(report);
      }

      // Aggregate metrics
      const totalStudents = studentReports.length;
      const avgReadiness =
        totalStudents > 0
          ? Number(
              (
                studentReports.reduce((sum, r) => sum + r.readinessIndex, 0) / totalStudents
              ).toFixed(1)
            )
          : 0;

      const avgAtt =
        totalStudents > 0
          ? Number(
              (
                studentReports.reduce((sum, r) => sum + r.attendanceScore, 0) / totalStudents
              ).toFixed(1)
            )
          : 0;

      const avgTest =
        totalStudents > 0
          ? Number(
              (
                studentReports.reduce((sum, r) => sum + r.testMasteryScore, 0) / totalStudents
              ).toFixed(1)
            )
          : 0;

      const examReadyCount = studentReports.filter((r) => r.readinessTier === "EXAM_READY").length;
      const onTrackCount = studentReports.filter((r) => r.readinessTier === "ON_TRACK").length;
      const atRiskCount = studentReports.filter(
        (r) => r.readinessTier === "AT_RISK_NEEDS_INTERVENTION"
      ).length;

      const sortedByReadiness = [...studentReports].sort(
        (a, b) => b.readinessIndex - a.readinessIndex
      );

      const topPerformers = sortedByReadiness.slice(0, 3).map((r) => ({
        name: r.studentName,
        rollNumber: r.rollNumber,
        readinessIndex: r.readinessIndex,
      }));

      const interventionWatchlist = studentReports.filter(
        (r) => r.readinessTier === "AT_RISK_NEEDS_INTERVENTION" || r.readinessIndex < 65
      );

      cohorts.push({
        batchId: batch.id,
        batchName: batch.name,
        targetExam: batch.targetExam,
        totalStudents,
        averageReadinessIndex: avgReadiness,
        averageAttendancePct: avgAtt,
        averageTestScorePct: avgTest,
        examReadyCount,
        onTrackCount,
        atRiskCount,
        topPerformers,
        interventionWatchlist,
      });
    }

    const totalStudents = allStudentReports.length;
    const overallAcademyReadiness =
      totalStudents > 0
        ? Number(
            (
              allStudentReports.reduce((sum, r) => sum + r.readinessIndex, 0) / totalStudents
            ).toFixed(1)
          )
        : 0;

    // Bottom 20% Intervention List
    const bottomIntervention = [...allStudentReports]
      .sort((a, b) => a.readinessIndex - b.readinessIndex)
      .slice(0, Math.max(3, Math.ceil(totalStudents * 0.2)));

    return {
      success: true,
      data: {
        totalBatches: batches.length,
        totalStudents,
        overallAcademyReadiness,
        cohorts,
        topBottomInterventionList: bottomIntervention,
      },
    };
  } catch (error) {
    console.error("[getAcademyAnalyticsAction Error]:", error);
    return { success: false, error: "Failed to generate cohort analytics." };
  }
}
