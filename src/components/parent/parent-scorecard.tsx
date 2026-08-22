"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  GraduationCap,
  Layers,
  MessageSquare,
  Sparkles,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";
import { ScoreProgressionChart } from "@/components/charts/score-progression-chart";
import { StudentTestHistoryTable } from "@/components/student/student-test-history-table";
import { type ParentChildSummary } from "@/actions/performance";
import Link from "next/link";

interface ParentScorecardProps {
  childrenData: ParentChildSummary[];
}

export function ParentScorecard({ childrenData }: ParentScorecardProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (childrenData.length === 0) {
    return (
      <div className="p-8 text-center bg-card rounded-2xl border shadow-xs space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600">
          <User className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold">No Linked Student Profiles Found</h2>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Your parent account is not currently linked to any enrolled students. Please contact the coaching academy administration to link your ward's profile.
        </p>
      </div>
    );
  }

  const currentChild = childrenData[selectedIndex] ?? childrenData[0];
  const perf = currentChild.performance;
  const overall = perf.overallStats;
  const att = perf.attendance;

  const initials = currentChild.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Multi-Child Selector (if more than 1 child) */}
      {childrenData.length > 1 && (
        <div className="flex items-center gap-2 bg-card p-2 rounded-xl border shadow-xs w-fit">
          <span className="text-xs font-semibold text-muted-foreground px-2">
            Select Student:
          </span>
          <div className="flex items-center gap-1.5">
            {childrenData.map((child, idx) => (
              <button
                key={child.studentUserId}
                onClick={() => setSelectedIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  selectedIndex === idx
                    ? "bg-indigo-600 text-white font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {child.fullName} ({child.targetExam})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Child Overview Hero Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 bg-indigo-600 text-white text-lg font-bold border-2 border-white/20">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  {currentChild.fullName}
                </h1>
                <Badge className="bg-white/20 text-white border-0 text-[10px]">
                  {currentChild.relationship}
                </Badge>
              </div>
              <p className="text-indigo-200 text-xs mt-1 flex items-center gap-3">
                <span className="font-mono">Roll No: {currentChild.rollNumber}</span>
                <span>•</span>
                <span>Batch: {currentChild.batchName}</span>
                <span>•</span>
                <span className="font-semibold text-white">Target: {currentChild.targetExam}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <a
              href={`/api/export/report-card/${currentChild.studentUserId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="sm"
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs gap-1.5 h-8"
              >
                <Download className="h-3.5 w-3.5" /> Official Scorecard (PDF)
              </Button>
            </a>
            <Badge
              variant="outline"
              className={
                currentChild.isAttendanceWarning
                  ? "bg-rose-500/20 text-rose-200 border-rose-400 text-xs px-2.5 py-1.5"
                  : "bg-emerald-500/20 text-emerald-200 border-emerald-400 text-xs px-2.5 py-1.5"
              }
            >
              <CalendarCheck className="h-3.5 w-3.5 mr-1" />
              Attendance: {currentChild.attendancePercentage}%
            </Badge>
          </div>
        </div>

        {/* Visual Risk Alerts (Prompt 4.2 constraint) */}
        {(currentChild.isAttendanceWarning || currentChild.hasFailedLatestTest) && (
          <div className="space-y-2 pt-2">
            {currentChild.isAttendanceWarning && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-100 flex items-center gap-3 text-xs">
                <AlertTriangle className="h-5 w-5 text-rose-300 shrink-0" />
                <div>
                  <strong className="font-semibold">Low Attendance Notice:</strong> Attendance is currently {currentChild.attendancePercentage}% (below the required 75% minimum). Please ensure regular classroom attendance for optimal exam preparation.
                </div>
              </div>
            )}

            {currentChild.hasFailedLatestTest && (
              <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-100 flex items-center gap-3 text-xs">
                <AlertTriangle className="h-5 w-5 text-amber-300 shrink-0" />
                <div>
                  <strong className="font-semibold">Academic Improvement Alert:</strong> {currentChild.fullName} did not pass the latest offline test ({currentChild.latestTest?.title}). Please review the teacher remarks and solution key below.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Latest Test Score */}
        <Card className="shadow-xs p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground">Latest Test Score</span>
          <div className="my-2">
            {currentChild.latestTest && currentChild.latestTest.marksObtained !== null ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-foreground">
                  {currentChild.latestTest.marksObtained}
                </span>
                <span className="text-xs text-muted-foreground">
                  / {currentChild.latestTest.totalMarks} ({currentChild.latestTest.percentage}%)
                </span>
              </div>
            ) : (
              <span className="text-base text-muted-foreground italic">No tests yet</span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center justify-between">
            <span>{currentChild.latestTest?.subjectName ?? "N/A"}</span>
            {currentChild.latestTest && (
              <Badge
                variant={currentChild.latestTest.isPass ? "default" : "destructive"}
                className="text-[9px] px-1 py-0"
              >
                {currentChild.latestTest.isPass ? "PASS" : "FAIL"}
              </Badge>
            )}
          </div>
        </Card>

        {/* Latest Class Rank */}
        <Card className="shadow-xs p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground">Class Standing</span>
          <div className="my-2">
            {overall.latestRank ? (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-amber-600 font-mono">
                  #{overall.latestRank}
                </span>
                <span className="text-xs text-muted-foreground">
                  out of {overall.totalStudentsInBatch}
                </span>
              </div>
            ) : (
              <span className="text-base text-muted-foreground italic">—</span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">
            Standard Competition Rank
          </span>
        </Card>

        {/* Overall Average */}
        <Card className="shadow-xs p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground">Overall Average</span>
          <div className="my-2">
            <span className="text-2xl font-bold text-indigo-600">
              {overall.overallAveragePercentage !== null
                ? `${overall.overallAveragePercentage}%`
                : "—"}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Across {overall.totalTestsAttempted} offline tests
          </span>
        </Card>

        {/* Attendance Percentage */}
        <Card className="shadow-xs p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground">Classroom Attendance</span>
          <div className="my-2">
            <span
              className={`text-2xl font-bold ${
                att.isWarning ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {att.attendancePercentage}%
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {att.presentDays} Present / {att.totalClasses} Total Days
          </span>
        </Card>
      </div>

      {/* Score Progression Line Chart */}
      <ScoreProgressionChart
        testHistory={perf.testHistory}
        title={`${currentChild.fullName.split(" ")[0]}'s Score Progression`}
        description="Exam marks progression vs batch benchmarks across the academic term"
      />

      {/* Latest Test Results with Remarks (Prompt 4.2 constraint) */}
      <div className="space-y-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-indigo-600" />
          Recent Offline Test Reports & Teacher Remarks
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {currentChild.recentTests.slice(0, 3).map((t) => (
            <Card key={t.testId} className="shadow-xs border hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                    {t.subjectName}
                  </Badge>
                  {t.isAbsent ? (
                    <Badge variant="outline" className="text-rose-600 border-rose-300 text-[10px]">
                      Absent
                    </Badge>
                  ) : t.isPass ? (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 text-[10px]">
                      Pass
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px]">
                      Fail
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-sm font-bold mt-1 leading-snug">
                  {t.testTitle}
                </CardTitle>
                <CardDescription className="text-[11px]">
                  {new Date(t.testDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 pt-0">
                <div className="p-2.5 rounded-lg bg-muted/40 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Score</span>
                    <strong className="text-sm font-bold">
                      {t.isAbsent ? "ABSENT" : `${t.marksObtained} / ${t.totalMarks}`}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Class Rank</span>
                    <strong className="text-sm font-mono text-indigo-600">
                      {t.calculatedRank ? `#${t.calculatedRank}` : "—"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Class Avg</span>
                    <strong className="text-xs">
                      {t.batchAverage !== null ? `${t.batchAverage}` : "—"}
                    </strong>
                  </div>
                </div>

                {t.remarks && (
                  <div className="p-2 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-[11px] text-indigo-950 dark:text-indigo-200">
                    <strong>Teacher Feedback:</strong> {t.remarks}
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                {t.solutionPdfUrl && (
                  <a
                    href={t.solutionPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button variant="outline" size="sm" className="w-full text-xs h-7 gap-1 text-indigo-600">
                      <Download className="h-3 w-3" /> Download Solution Key
                    </Button>
                  </a>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Complete Test History */}
      <div className="space-y-3 pt-2">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Calendar className="h-4 w-4 text-purple-600" />
          Complete Offline Test History
        </h2>
        <StudentTestHistoryTable testHistory={perf.testHistory} />
      </div>
    </div>
  );
}
