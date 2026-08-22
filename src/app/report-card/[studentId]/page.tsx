import { requireAuth } from "@/lib/auth-utils";
import { getStudentPerformanceAction } from "@/actions/performance";
import { notFound } from "next/navigation";
import {
  GraduationCap,
  Printer,
  ArrowLeft,
  Award,
  CheckCircle2,
  CalendarCheck,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ReportCardPageProps {
  params: Promise<{ studentId: string }>;
}

export default async function StudentReportCardPage({ params }: ReportCardPageProps) {
  const { studentId } = await params;
  const user = await requireAuth(["STUDENT", "PARENT", "ADMIN", "COORDINATOR", "TEACHER"]);

  const res = await getStudentPerformanceAction(studentId);
  if (!res.success || !res.data) {
    notFound();
  }

  const { student, overallStats, attendance, testHistory, subjectBreakdown } = res.data;

  const generatedDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-8 px-4 print:p-0 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
      {/* Print Control Header (hidden on print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link href="/student/performance">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <a href={`/api/export/report-card/${studentId}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs shadow-xs">
              <Printer className="h-4 w-4" /> Print / Save as PDF
            </Button>
          </a>
        </div>
      </div>

      {/* Official A4 Scorecard Document */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 print:bg-white rounded-2xl print:rounded-none shadow-xl print:shadow-none border print:border-0 p-8 sm:p-12 space-y-8">
        {/* Institute Header */}
        <div className="border-b pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-900 text-white flex items-center justify-center font-bold shadow-md print:border">
              <GraduationCap className="h-9 w-9 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 print:text-black uppercase">
                InstituteOps Coaching Academy
              </h1>
              <p className="text-xs text-slate-600 print:text-slate-700 font-medium">
                Center for Police & Competitive Exam Excellence (PSI • Constable • GPSC)
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Main Campus: Ahmedabad Center • Reg No: IO-ACAD-2026-GJ
              </p>
            </div>
          </div>

          <div className="text-right self-start sm:self-center">
            <Badge className="bg-indigo-100 text-indigo-900 print:border print:border-black font-bold uppercase text-[10px] tracking-wider px-3 py-1">
              Official Performance Scorecard
            </Badge>
            <div className="text-[11px] text-slate-500 mt-1">
              Date: <strong className="text-slate-800 print:text-black">{generatedDate}</strong>
            </div>
          </div>
        </div>

        {/* Student Particulars Grid */}
        <div className="bg-slate-50 dark:bg-slate-800/50 print:bg-slate-50 rounded-xl p-4 border grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Candidate Name</span>
            <strong className="text-sm text-slate-900 print:text-black">{student.fullName}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Roll Number</span>
            <strong className="text-sm font-mono text-indigo-600 print:text-black">{student.rollNumber}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Target Examination</span>
            <strong className="text-sm text-slate-900 print:text-black">{student.targetExam}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Enrolled Cohort</span>
            <strong className="text-sm text-slate-900 print:text-black">{student.batchName}</strong>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl border bg-card">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Cumulative Score</span>
            <div className="text-2xl font-black text-indigo-600 print:text-black mt-1">
              {overallStats.overallAveragePercentage !== null
                ? `${overallStats.overallAveragePercentage}%`
                : "N/A"}
            </div>
            <span className="text-[10px] text-slate-500">Across {overallStats.totalTestsAttempted} Tests</span>
          </div>

          <div className="p-3 rounded-xl border bg-card">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Best Competition Rank</span>
            <div className="text-2xl font-black text-amber-600 print:text-black mt-1 font-mono">
              {overallStats.latestRank ? `#${overallStats.latestRank}` : "—"}
            </div>
            <span className="text-[10px] text-slate-500">Out of {overallStats.totalStudentsInBatch} in Batch</span>
          </div>

          <div className="p-3 rounded-xl border bg-card">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Classroom Attendance</span>
            <div className="text-2xl font-black text-emerald-600 print:text-black mt-1">
              {attendance.attendancePercentage}%
            </div>
            <span className="text-[10px] text-slate-500">{attendance.presentDays} / {attendance.totalClasses} Days</span>
          </div>

          <div className="p-3 rounded-xl border bg-card">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Performance Status</span>
            <div className="text-base font-bold text-slate-900 print:text-black mt-2">
              {attendance.attendancePercentage >= 75 && (overallStats.overallAveragePercentage ?? 0) >= 40
                ? "GOOD STANDING"
                : "ACADEMIC REVIEW"}
            </div>
            <span className="text-[10px] text-slate-500">Academy Benchmark</span>
          </div>
        </div>

        {/* Offline Test History Table */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 print:text-black">
            Offline Examination Record
          </h2>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 print:bg-slate-100 border-b">
                <tr>
                  <th className="p-2.5 font-bold">Date</th>
                  <th className="p-2.5 font-bold">Examination Title</th>
                  <th className="p-2.5 font-bold">Subject</th>
                  <th className="p-2.5 font-bold text-center">Score / Max</th>
                  <th className="p-2.5 font-bold text-center">Percentage</th>
                  <th className="p-2.5 font-bold text-center">Rank</th>
                  <th className="p-2.5 font-bold text-center">Batch Avg</th>
                  <th className="p-2.5 font-bold">Teacher Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {testHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-slate-500">
                      No published offline tests found.
                    </td>
                  </tr>
                ) : (
                  testHistory.map((t) => (
                    <tr key={t.testId} className="hover:bg-slate-50/50">
                      <td className="p-2.5 whitespace-nowrap text-slate-600 print:text-black">
                        {new Date(t.testDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-2.5 font-semibold text-slate-900 print:text-black">
                        {t.testTitle}
                      </td>
                      <td className="p-2.5 text-slate-700 print:text-black">
                        {t.subjectName}
                      </td>
                      <td className="p-2.5 text-center font-bold">
                        {t.isAbsent ? "ABSENT" : `${t.marksObtained} / ${t.totalMarks}`}
                      </td>
                      <td className="p-2.5 text-center">
                        {t.percentage !== null ? `${t.percentage}%` : "—"}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-indigo-600 print:text-black">
                        {t.calculatedRank ? `#${t.calculatedRank}` : "—"}
                      </td>
                      <td className="p-2.5 text-center text-slate-600 print:text-black">
                        {t.batchAverage !== null ? `${t.batchAverage}` : "—"}
                      </td>
                      <td className="p-2.5 text-slate-600 print:text-black italic">
                        {t.remarks || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Authentication & Signature Blocks (Prompt 5.2 requirement) */}
        <div className="pt-8 border-t grid grid-cols-3 gap-6 text-center text-xs">
          <div className="space-y-12">
            <div className="h-10 border-b border-dashed border-slate-400"></div>
            <div>
              <strong className="block text-slate-900 print:text-black">Class Instructor</strong>
              <span className="text-[11px] text-slate-500">Teacher Signature</span>
            </div>
          </div>

          <div className="space-y-12">
            <div className="h-10 border-b border-dashed border-slate-400"></div>
            <div>
              <strong className="block text-slate-900 print:text-black">Director of Academics</strong>
              <span className="text-[11px] text-slate-500">Institute Seal & Signature</span>
            </div>
          </div>

          <div className="space-y-12">
            <div className="h-10 border-b border-dashed border-slate-400"></div>
            <div>
              <strong className="block text-slate-900 print:text-black">Parent / Guardian</strong>
              <span className="text-[11px] text-slate-500">Acknowledgement Signature</span>
            </div>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="pt-4 border-t text-center text-[10px] text-slate-500 print:text-black">
          This document is generated by InstituteOps Coaching Academy Management System. Verification ID: IO-{student.rollNumber}-{new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
