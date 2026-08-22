/**
 * InstituteOps — AI Exam-Readiness & Diagnostic Engine
 * 
 * Computes a weighted 0-100% Exam-Readiness Index for competitive exam candidates
 * (PSI, Constable, GPSC) combining:
 * 1. Offline Test Mastery (50%)
 * 2. Attendance Regularity (30%)
 * 3. Performance Momentum / Trajectory (20%)
 */

export interface StudentDiagnosticReport {
  studentId: string;
  studentName: string;
  rollNumber: string;
  targetExam: string;
  batchName: string;
  phone: string | null;
  parentPhone: string | null;
  
  // High-Level Indicators
  readinessIndex: number; // 0 - 100
  readinessTier: "EXAM_READY" | "ON_TRACK" | "AT_RISK_NEEDS_INTERVENTION";
  
  // Component Breakdown
  testMasteryScore: number; // %
  attendanceScore: number; // %
  momentumScore: number; // %
  
  // Subject Diagnostics
  subjectProficiencies: Array<{
    subjectName: string;
    averagePercentage: number;
    totalTests: number;
    status: "STRONG" | "MODERATE" | "CRITICAL_WEAKNESS";
  }>;

  // AI Diagnostic Highlights
  strengths: string[];
  weaknesses: string[];
  recommendedAction: string;
}

export function calculateStudentReadiness(params: {
  studentId: string;
  studentName: string;
  rollNumber: string;
  targetExam: string;
  batchName: string;
  phone: string | null;
  parentPhone: string | null;
  tests: Array<{
    title: string;
    subjectName: string;
    marksObtained: number | null;
    totalMarks: number;
    isAbsent: boolean;
    testDate: Date;
  }>;
  attendanceRecords: Array<{
    status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
    date: Date;
  }>;
}): StudentDiagnosticReport {
  const {
    studentId,
    studentName,
    rollNumber,
    targetExam,
    batchName,
    phone,
    parentPhone,
    tests,
    attendanceRecords,
  } = params;

  // 1. Calculate Test Mastery
  let totalPercentSum = 0;
  let validTestCount = 0;
  const subjectMap = new Map<string, { totalPct: number; count: number }>();

  // Sort tests chronologically
  const sortedTests = [...tests].sort(
    (a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime()
  );

  for (const t of sortedTests) {
    const sub = t.subjectName || "General";
    const subEntry = subjectMap.get(sub) ?? { totalPct: 0, count: 0 };

    if (t.isAbsent || t.marksObtained === null) {
      subEntry.count++;
      subjectMap.set(sub, subEntry);
      continue;
    }

    const pct = (t.marksObtained / t.totalMarks) * 100;
    totalPercentSum += pct;
    validTestCount++;

    subEntry.totalPct += pct;
    subEntry.count++;
    subjectMap.set(sub, subEntry);
  }

  const testMasteryScore =
    validTestCount > 0 ? Number((totalPercentSum / validTestCount).toFixed(1)) : 50.0;

  // 2. Calculate Attendance Score
  let presentDays = 0;
  for (const att of attendanceRecords) {
    if (att.status === "PRESENT") presentDays += 1;
    else if (att.status === "LATE") presentDays += 0.5;
  }
  const attendanceScore =
    attendanceRecords.length > 0
      ? Number(((presentDays / attendanceRecords.length) * 100).toFixed(1))
      : 85.0;

  // 3. Calculate Performance Momentum (Recent vs Earlier scores)
  let momentumScore = 50.0;
  if (sortedTests.length >= 2) {
    const mid = Math.floor(sortedTests.length / 2);
    const earlierTests = sortedTests.slice(0, mid).filter((t) => !t.isAbsent && t.marksObtained !== null);
    const recentTests = sortedTests.slice(mid).filter((t) => !t.isAbsent && t.marksObtained !== null);

    const earlierAvg =
      earlierTests.length > 0
        ? earlierTests.reduce((s, t) => s + (t.marksObtained! / t.totalMarks) * 100, 0) /
          earlierTests.length
        : testMasteryScore;

    const recentAvg =
      recentTests.length > 0
        ? recentTests.reduce((s, t) => s + (t.marksObtained! / t.totalMarks) * 100, 0) /
          recentTests.length
        : testMasteryScore;

    const diff = recentAvg - earlierAvg;
    // Map diff (-30 to +30) to momentum score (0 to 100)
    momentumScore = Math.min(100, Math.max(0, Number((50 + diff * 1.5).toFixed(1))));
  } else {
    momentumScore = testMasteryScore;
  }

  // Weighted Index: 50% Mastery + 30% Attendance + 20% Momentum
  const readinessIndex = Number(
    (testMasteryScore * 0.5 + attendanceScore * 0.3 + momentumScore * 0.2).toFixed(1)
  );

  let readinessTier: "EXAM_READY" | "ON_TRACK" | "AT_RISK_NEEDS_INTERVENTION" = "ON_TRACK";
  if (readinessIndex >= 80) readinessTier = "EXAM_READY";
  else if (readinessIndex < 60) readinessTier = "AT_RISK_NEEDS_INTERVENTION";

  // Subject Proficiencies
  const subjectProficiencies = Array.from(subjectMap.entries()).map(([subName, val]) => {
    const avg = val.count > 0 ? Number((val.totalPct / val.count).toFixed(1)) : 0;
    let status: "STRONG" | "MODERATE" | "CRITICAL_WEAKNESS" = "MODERATE";
    if (avg >= 75) status = "STRONG";
    else if (avg < 50) status = "CRITICAL_WEAKNESS";

    return {
      subjectName: subName,
      averagePercentage: avg,
      totalTests: val.count,
      status,
    };
  });

  // AI Diagnostic Recommendations
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  for (const sp of subjectProficiencies) {
    if (sp.status === "STRONG") {
      strengths.push(`High proficiency in ${sp.subjectName} (${sp.averagePercentage}% average).`);
    } else if (sp.status === "CRITICAL_WEAKNESS") {
      weaknesses.push(`Low scoring in ${sp.subjectName} (${sp.averagePercentage}% average) needs immediate revision.`);
    }
  }

  if (attendanceScore < 75) {
    weaknesses.push(`Irregular classroom attendance (${attendanceScore}%). Regularity is vital for retention.`);
  } else if (attendanceScore >= 90) {
    strengths.push(`Exceptional attendance discipline (${attendanceScore}%).`);
  }

  let recommendedAction = "Maintain standard mock test revision schedule.";
  if (readinessTier === "AT_RISK_NEEDS_INTERVENTION") {
    recommendedAction =
      "Assign one-on-one faculty mentoring session. Focus on foundational subjects and enforce minimum 80% daily attendance.";
  } else if (readinessTier === "EXAM_READY") {
    recommendedAction =
      "Candidate is primed for prelims exam. Focus on high-speed OMR time management and full-length surprise mocks.";
  }

  return {
    studentId,
    studentName,
    rollNumber,
    targetExam,
    batchName,
    phone,
    parentPhone,
    readinessIndex,
    readinessTier,
    testMasteryScore,
    attendanceScore,
    momentumScore,
    subjectProficiencies,
    strengths,
    weaknesses,
    recommendedAction,
  };
}
