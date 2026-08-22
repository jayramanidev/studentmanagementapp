"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type StudentDiagnosticReport } from "@/lib/readiness-calculator";
import {
  Sparkles,
  Award,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  CalendarCheck,
  BrainCircuit,
  Zap,
} from "lucide-react";

interface ReadinessGaugeProps {
  report: StudentDiagnosticReport;
}

export function ReadinessGauge({ report }: ReadinessGaugeProps) {
  const {
    readinessIndex,
    readinessTier,
    testMasteryScore,
    attendanceScore,
    momentumScore,
    subjectProficiencies,
    strengths,
    weaknesses,
    recommendedAction,
  } = report;

  const tierConfig = {
    EXAM_READY: {
      label: "EXAM READY — TOP TIER",
      color: "from-emerald-600 to-teal-500",
      badge: "bg-emerald-500 text-white font-bold",
      desc: "High probability of clearing prelims & qualifying for physicals.",
    },
    ON_TRACK: {
      label: "ON TRACK — CONSISTENT",
      color: "from-indigo-600 to-blue-500",
      badge: "bg-indigo-500 text-white font-bold",
      desc: "Solid performance. Regular mock testing will secure higher rank.",
    },
    AT_RISK_NEEDS_INTERVENTION: {
      label: "NEEDS URGENT INTERVENTION",
      color: "from-rose-600 to-amber-600",
      badge: "bg-rose-500 text-white font-bold",
      desc: "Scoring or attendance below target threshold. Faculty attention advised.",
    },
  }[readinessTier];

  return (
    <div className="space-y-6">
      {/* Hero Readiness Gauge Banner */}
      <Card className="shadow-md bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white border-0 overflow-hidden relative p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <Badge className={tierConfig.badge}>{tierConfig.label}</Badge>
              <Badge variant="outline" className="text-indigo-200 border-indigo-400/40 text-xs">
                {report.targetExam} Aspirant
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
              {report.studentName}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/90 max-w-xl">
              {tierConfig.desc}
            </p>
            <div className="pt-2 text-xs text-indigo-300 flex items-center justify-center md:justify-start gap-4">
              <span>Roll: <strong>{report.rollNumber}</strong></span>
              <span>Batch: <strong>{report.batchName}</strong></span>
            </div>
          </div>

          {/* Big Circular Metric */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 min-w-[180px]">
            <span className="text-[11px] font-semibold text-indigo-200 uppercase tracking-widest flex items-center gap-1">
              <BrainCircuit className="h-3.5 w-3.5 text-indigo-300" /> Readiness Index
            </span>
            <div className="text-5xl font-black tracking-tight text-white mt-1">
              {readinessIndex}%
            </div>
            <div className="w-full bg-white/20 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${readinessIndex}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3 Weighted Components */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[11px] text-indigo-200 font-medium flex items-center justify-between">
              <span>Test Score Mastery (50%)</span>
              <Award className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1">{testMasteryScore}%</div>
            <span className="text-[10px] text-indigo-300">Average exam percentage</span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[11px] text-indigo-200 font-medium flex items-center justify-between">
              <span>Attendance Consistency (30%)</span>
              <CalendarCheck className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1">{attendanceScore}%</div>
            <span className="text-[10px] text-indigo-300">Classroom regularity</span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[11px] text-indigo-200 font-medium flex items-center justify-between">
              <span>Score Momentum (20%)</span>
              <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1">{momentumScore}%</div>
            <span className="text-[10px] text-indigo-300">Trajectory vs earlier mocks</span>
          </div>
        </div>
      </Card>

      {/* AI Strengths, Weaknesses & Recommended Action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths & Subject Proficiency */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Strongest Subject Areas
            </CardTitle>
            <CardDescription className="text-xs">
              Consistently high test scores and solid conceptual mastery.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {strengths.length === 0 ? (
              <p className="text-muted-foreground italic">Keep practicing to build subject strengths.</p>
            ) : (
              strengths.map((s, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-950 dark:text-emerald-200 flex items-start gap-2"
                >
                  <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{s}</span>
                </div>
              ))
            )}

            {/* Subject Proficiencies Breakdown */}
            <div className="pt-2 space-y-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">
                Subject Accuracy Ratings
              </span>
              <div className="space-y-2">
                {subjectProficiencies.map((sp) => (
                  <div key={sp.subjectName} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>{sp.subjectName}</span>
                      <span
                        className={
                          sp.status === "STRONG"
                            ? "text-emerald-600"
                            : sp.status === "CRITICAL_WEAKNESS"
                            ? "text-rose-600"
                            : "text-amber-600"
                        }
                      >
                        {sp.averagePercentage}% ({sp.totalTests} tests)
                      </span>
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          sp.status === "STRONG"
                            ? "bg-emerald-500"
                            : sp.status === "CRITICAL_WEAKNESS"
                            ? "bg-rose-500"
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${sp.averagePercentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weaknesses & Action Items */}
        <Card className="shadow-xs flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-4 w-4" /> Focus Areas & Vulnerabilities
              </CardTitle>
              <CardDescription className="text-xs">
                Low-scoring subjects or irregular attendance requiring targeted study.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {weaknesses.length === 0 ? (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 text-emerald-900 dark:text-emerald-200">
                  🎉 No critical weaknesses detected! Candidate is balanced across all tested subjects.
                </div>
              ) : (
                weaknesses.map((w, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-950 dark:text-rose-200 flex items-start gap-2"
                  >
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))
              )}
            </CardContent>
          </div>

          <div className="p-4 m-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900 space-y-1">
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" /> AI Diagnostic Prescription
            </span>
            <p className="text-xs text-foreground/90 leading-relaxed font-medium">
              {recommendedAction}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
