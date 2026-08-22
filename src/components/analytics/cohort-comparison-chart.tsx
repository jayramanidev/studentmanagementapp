"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { type CohortAnalyticsSummary } from "@/actions/analytics";
import { BarChart3 } from "lucide-react";

interface CohortComparisonChartProps {
  cohorts: CohortAnalyticsSummary[];
}

export function CohortComparisonChart({ cohorts }: CohortComparisonChartProps) {
  const chartData = cohorts.map((c) => ({
    name: c.batchName.replace("Morning Batch", "Morning").replace("Evening Batch", "Evening"),
    readiness: c.averageReadinessIndex,
    attendance: c.averageAttendancePct,
    testScores: c.averageTestScorePct,
    students: c.totalStudents,
  }));

  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-indigo-600" />
          Batch vs. Batch Performance Comparison
        </CardTitle>
        <CardDescription className="text-xs">
          Cross-cohort benchmark across Readiness Index, Attendance %, and Average Exam Scores.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
            No batch data available.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-10}
                  textAnchor="end"
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    `${val}%`,
                    name === "readiness"
                      ? "Readiness Index"
                      : name === "attendance"
                      ? "Attendance %"
                      : "Exam Average %",
                  ]}
                  contentStyle={{
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Bar
                  dataKey="readiness"
                  name="Readiness Index"
                  fill="#4f46e5"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="attendance"
                  name="Attendance %"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="testScores"
                  name="Exam Average %"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
