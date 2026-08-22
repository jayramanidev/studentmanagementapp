"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { type SubjectPerformanceSummary } from "@/actions/performance";

interface SubjectBarChartProps {
  subjectBreakdown: SubjectPerformanceSummary[];
}

export function SubjectBarChart({ subjectBreakdown }: SubjectBarChartProps) {
  const chartData = React.useMemo(() => {
    return subjectBreakdown.map((s) => ({
      name: s.subjectName.length > 15 ? s.subjectName.slice(0, 12) + "..." : s.subjectName,
      fullName: s.subjectName,
      avgScore: s.averageScorePercentage,
      passRate: s.passRate,
      testsCount: s.testsCount,
    }));
  }, [subjectBreakdown]);

  if (chartData.length === 0) {
    return (
      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-purple-600" />
            Subject-Wise Performance
          </CardTitle>
          <CardDescription>Accuracy and pass rate across different subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-sm border border-dashed rounded-xl">
            <span>No subject data available yet.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-600">
            <BookOpen className="h-4 w-4" />
          </div>
          Subject Accuracy & Proficiency
        </CardTitle>
        <CardDescription className="text-xs">
          Average percentage score vs. pass percentage by subject
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted/50"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-xl border bg-popover/95 p-3 text-popover-foreground shadow-lg backdrop-blur-md text-xs space-y-1.5">
                        <div className="font-bold text-foreground text-sm">{d.fullName}</div>
                        <div className="text-muted-foreground text-[11px]">
                          {d.testsCount} tests recorded
                        </div>
                        <div className="pt-1.5 border-t space-y-1">
                          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-semibold">
                            <span>Average Score:</span>
                            <span>{d.avgScore}%</span>
                          </div>
                          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                            <span>Pass Rate:</span>
                            <span>{d.passRate}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
              />
              <Bar
                name="Average Score %"
                dataKey="avgScore"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                name="Pass Rate %"
                dataKey="passRate"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
