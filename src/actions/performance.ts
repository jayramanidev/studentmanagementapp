"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import type { ActionResponse } from "@/types/auth";
import { AttendanceStatus, TestType } from "@prisma/client";

// ─── Types ───────────────────────────────────────────────

export interface StudentTestPerformanceItem {
  testId: string;
  testTitle: string;
  testType: TestType;
  testDate: Date;
  subjectId: string;
  subjectName: string;
  totalMarks: number;
  passingMarks: number;
  marksObtained: number | null;
  percentage: number | null;
  isAbsent: boolean;
  isPass: boolean;
  calculatedRank: number | null;
  batchTotalStudents: number;
  batchAverage: number | null;
  highestScore: number | null;
  remarks: string | null;
  solutionPdfUrl: string | null;
}

export interface SubjectPerformanceSummary {
  subjectId: string;
  subjectName: string;
  testsCount: number;
  averageScorePercentage: number;
  highestScorePercentage: number;
  passRate: number;
}

export interface AttendanceSummary {
  totalClasses: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendancePercentage: number;
  isWarning: boolean; // < 75%
}

export interface StudentPerformanceDashboardData {
  student: {
    userId: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    rollNumber: string;
    targetExam: string;
    batchId: string;
    batchName: string;
    branchName: string;
  };
  overallStats: {
    totalTestsAttempted: number;
    overallAveragePercentage: number | null;
    latestRank: number | null;
    totalStudentsInBatch: number;
    latestScore: {
      obtained: number | null;
      total: number;
      testTitle: string;
      isPass: boolean;
    } | null;
    attendancePercentage: number;
    hasFailedLatestTest: boolean;
  };
  attendance: AttendanceSummary;
  subjectBreakdown: SubjectPerformanceSummary[];
  testHistory: StudentTestPerformanceItem[];
}

export interface ParentChildSummary {
  studentUserId: string;
  fullName: string;
  rollNumber: string;
  targetExam: string;
  batchName: string;
  relationship: string;
  attendancePercentage: number;
  isAttendanceWarning: boolean; // < 75%
  hasFailedLatestTest: boolean;
  latestTest: {
    title: string;
    subjectName: string;
    marksObtained: number | null;
    totalMarks: number;
    percentage: number | null;
    isPass: boolean;
    calculatedRank: number | null;
    batchAverage: number | null;
    testDate: Date;
    remarks: string | null;
  } | null;
  recentTests: StudentTestPerformanceItem[];
  performance: StudentPerformanceDashboardData;
}

// ─── Server Actions ─────────────────────────────────────

/**
 * Fetch complete performance metrics and test history for a student.
 */
export async function getStudentPerformanceAction(
  targetStudentUserId?: string
): Promise<ActionResponse<StudentPerformanceDashboardData>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized." };
    }

    let studentUserId = targetStudentUserId;

    // If role is STUDENT, they can only view their own performance
    if (user.role === "STUDENT") {
      studentUserId = user.id;
    } else if (!studentUserId) {
      return { success: false, error: "Student ID is required." };
    }

    // If role is PARENT, ensure this student is linked to the parent
    if (user.role === "PARENT") {
      const link = await db.parentStudentLink.findFirst({
        where: {
          parentUserId: user.id,
          studentUserId: studentUserId,
        },
      });

      if (!link) {
        return { success: false, error: "Access denied. Student is not linked to your account." };
      }
    }

    // 1. Fetch Student Profile
    const profile = await db.studentProfile.findUnique({
      where: { userId: studentUserId },
      include: {
        user: {
          select: { fullName: true, email: true, phone: true },
        },
        batch: {
          select: {
            id: true,
            name: true,
            targetExam: true,
            branch: { select: { name: true } },
            _count: { select: { studentProfiles: true } },
          },
        },
      },
    });

    if (!profile) {
      return { success: false, error: "Student profile not found." };
    }

    const batchId = profile.batchId;
    const batchTotalStudents = profile.batch ? profile.batch._count.studentProfiles : 0;
    const batchName = profile.batch?.name ?? "Assigned Batch";
    const branchName = profile.batch?.branch?.name ?? "Main Center";
    const targetExam = profile.targetExam ?? profile.batch?.targetExam ?? "Competitive Exam";

    // 2. Fetch all published tests in the student's batch
    const publishedTests = batchId
      ? await db.offlineTest.findMany({
          where: {
            batchId: batchId,
            isPublished: true,
          },
          include: {
            subject: { select: { id: true, name: true } },
            testMarks: true,
          },
          orderBy: { testDate: "desc" },
        })
      : [];

    // 3. Process test history & benchmarks
    const testHistory: StudentTestPerformanceItem[] = [];
    let totalScoreSumPct = 0;
    let attemptedCount = 0;

    for (const test of publishedTests) {
      const totalMarks = Number(test.totalMarks);
      const passingMarks = Number(test.passingMarks);

      // Find this student's mark
      const studentMark = test.testMarks.find((m: any) => m.studentId === studentUserId);

      // Calculate batch benchmarks (average and highest)
      let appearedInBatch = 0;
      let batchSum = 0;
      let highestScore: number | null = null;

      for (const m of test.testMarks) {
        if (!m.isAbsent && m.marksObtained !== null) {
          const score = Number(m.marksObtained);
          appearedInBatch++;
          batchSum += score;
          if (highestScore === null || score > highestScore) {
            highestScore = score;
          }
        }
      }

      const batchAverage =
        appearedInBatch > 0 ? Number((batchSum / appearedInBatch).toFixed(2)) : null;

      const marksObtained =
        studentMark && studentMark.marksObtained !== null
          ? Number(studentMark.marksObtained)
          : null;

      const isAbsent = studentMark ? studentMark.isAbsent : true;
      const percentage =
        marksObtained !== null && totalMarks > 0
          ? Number(((marksObtained / totalMarks) * 100).toFixed(1))
          : null;

      const isPass = marksObtained !== null ? marksObtained >= passingMarks : false;

      if (!isAbsent && marksObtained !== null) {
        attemptedCount++;
        totalScoreSumPct += percentage ?? 0;
      }

      testHistory.push({
        testId: test.id,
        testTitle: test.title,
        testType: test.type,
        testDate: test.testDate,
        subjectId: test.subject.id,
        subjectName: test.subject.name,
        totalMarks,
        passingMarks,
        marksObtained,
        percentage,
        isAbsent,
        isPass,
        calculatedRank: studentMark?.calculatedRank ?? null,
        batchTotalStudents,
        batchAverage,
        highestScore,
        remarks: studentMark?.remarks ?? null,
        solutionPdfUrl: test.solutionPdfUrl,
      });
    }

    // 4. Subject-wise performance summary
    const subjectMap = new Map<string, {
      name: string;
      testsCount: number;
      pctSum: number;
      highestPct: number;
      passCount: number;
    }>();

    for (const item of testHistory) {
      if (item.isAbsent || item.percentage === null) continue;

      const existing = subjectMap.get(item.subjectId) ?? {
        name: item.subjectName,
        testsCount: 0,
        pctSum: 0,
        highestPct: 0,
        passCount: 0,
      };

      existing.testsCount++;
      existing.pctSum += item.percentage;
      if (item.percentage > existing.highestPct) {
        existing.highestPct = item.percentage;
      }
      if (item.isPass) {
        existing.passCount++;
      }

      subjectMap.set(item.subjectId, existing);
    }

    const subjectBreakdown: SubjectPerformanceSummary[] = Array.from(subjectMap.entries()).map(
      ([subId, data]) => ({
        subjectId: subId,
        subjectName: data.name,
        testsCount: data.testsCount,
        averageScorePercentage:
          data.testsCount > 0 ? Number((data.pctSum / data.testsCount).toFixed(1)) : 0,
        highestScorePercentage: data.highestPct,
        passRate:
          data.testsCount > 0 ? Number(((data.passCount / data.testsCount) * 100).toFixed(0)) : 0,
      })
    );

    // 5. Attendance Calculation
    const attendanceRecords = await db.attendance.findMany({
      where: { studentId: studentUserId },
    });

    const totalClasses = attendanceRecords.length;
    let presentDays = 0;
    let absentDays = 0;
    let lateDays = 0;

    for (const a of attendanceRecords) {
      if (a.status === AttendanceStatus.PRESENT) presentDays++;
      else if (a.status === AttendanceStatus.ABSENT) absentDays++;
      else if (a.status === AttendanceStatus.LATE) {
        lateDays++;
        presentDays += 0.5; // Count half day for late
      }
    }

    const attendancePercentage =
      totalClasses > 0 ? Number(((presentDays / totalClasses) * 100).toFixed(1)) : 100; // default 100% if no records yet

    const attendance: AttendanceSummary = {
      totalClasses,
      presentDays: Math.floor(presentDays),
      absentDays,
      lateDays,
      attendancePercentage,
      isWarning: attendancePercentage < 75,
    };

    // 6. Overall Summary Metrics
    const latestTest = testHistory[0] ?? null;
    const hasFailedLatestTest = latestTest ? !latestTest.isPass && !latestTest.isAbsent : false;

    const overallAveragePercentage =
      attemptedCount > 0 ? Number((totalScoreSumPct / attemptedCount).toFixed(1)) : null;

    return {
      success: true,
      data: {
        student: {
          userId: profile.userId,
          fullName: profile.user.fullName,
          email: profile.user.email,
          phone: profile.user.phone,
          rollNumber: profile.rollNumber,
          targetExam,
          batchId: batchId ?? "",
          batchName,
          branchName,
        },
        overallStats: {
          totalTestsAttempted: attemptedCount,
          overallAveragePercentage,
          latestRank: latestTest?.calculatedRank ?? null,
          totalStudentsInBatch: batchTotalStudents,
          latestScore: latestTest
            ? {
                obtained: latestTest.marksObtained,
                total: latestTest.totalMarks,
                testTitle: latestTest.testTitle,
                isPass: latestTest.isPass,
              }
            : null,
          attendancePercentage,
          hasFailedLatestTest,
        },
        attendance,
        subjectBreakdown,
        testHistory,
      },
    };
  } catch (error) {
    console.error("[getStudentPerformanceAction Error]:", error);
    return { success: false, error: "Failed to fetch student performance." };
  }
}

/**
 * Fetch all children and their performance summaries for the logged-in parent.
 */
export async function getParentDashboardAction(): Promise<ActionResponse<ParentChildSummary[]>> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "PARENT") {
      return { success: false, error: "Forbidden. Parent account required." };
    }

    const links = await db.parentStudentLink.findMany({
      where: { parentUserId: user.id },
      include: {
        student: {
          include: {
            studentProfile: {
              include: {
                batch: true,
              },
            },
          },
        },
      },
    });

    if (links.length === 0) {
      return { success: true, data: [] };
    }

    const childrenSummaries: ParentChildSummary[] = [];

    for (const link of links) {
      const student = link.student;
      const profile = student.studentProfile;

      if (!profile) continue;

      const perfRes = await getStudentPerformanceAction(student.id);
      if (!perfRes.success || !perfRes.data) continue;

      const perf = perfRes.data;
      const latest = perf.testHistory[0] ?? null;

      childrenSummaries.push({
        studentUserId: student.id,
        fullName: student.fullName,
        rollNumber: profile.rollNumber,
        targetExam: profile.targetExam ?? profile.batch?.targetExam ?? "PSI",
        batchName: profile.batch?.name ?? "Main Batch",
        relationship: link.relationship ?? "Guardian",
        attendancePercentage: perf.attendance.attendancePercentage,
        isAttendanceWarning: perf.attendance.isWarning,
        hasFailedLatestTest: perf.overallStats.hasFailedLatestTest,
        latestTest: latest
          ? {
              title: latest.testTitle,
              subjectName: latest.subjectName,
              marksObtained: latest.marksObtained,
              totalMarks: latest.totalMarks,
              percentage: latest.percentage,
              isPass: latest.isPass,
              calculatedRank: latest.calculatedRank,
              batchAverage: latest.batchAverage,
              testDate: latest.testDate,
              remarks: latest.remarks,
            }
          : null,
        recentTests: perf.testHistory.slice(0, 5),
        performance: perf,
      });
    }

    return { success: true, data: childrenSummaries };
  } catch (error) {
    console.error("[getParentDashboardAction Error]:", error);
    return { success: false, error: "Failed to load parent dashboard data." };
  }
}
